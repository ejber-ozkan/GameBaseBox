//! SQLite connections with the app's standard settings, plus a small pool of idle
//! connections so query commands don't reopen the database (and re-read its schema)
//! on every call.

use rusqlite::Connection;
use std::ops::{Deref, DerefMut};
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::Duration;

/// How long a statement waits for a lock held by another connection (for example an
/// import merge) before failing with "database is locked".
const BUSY_TIMEOUT: Duration = Duration::from_secs(5);

/// Idle connections kept for reuse. Tests keep none, so temporary databases are never
/// held open after a test finishes (Windows cannot delete open files).
const IDLE_CAPACITY: usize = if cfg!(test) { 0 } else { 4 };

/// Per-connection settings. `journal_mode = WAL` is persistent in the database file
/// and is set by the schema migration, not here.
const CONNECTION_PRAGMAS: &str = "
    PRAGMA temp_store = MEMORY;
    PRAGMA cache_size = -16000;
    PRAGMA mmap_size = 268435456;
";

static IDLE_CONNECTIONS: Mutex<Vec<(PathBuf, Connection)>> = Mutex::new(Vec::new());

fn configure_connection(conn: &Connection) -> rusqlite::Result<()> {
    conn.busy_timeout(BUSY_TIMEOUT)?;
    conn.execute_batch(CONNECTION_PRAGMAS)
}

/// Opens a new connection with the standard settings. Use this for writers (imports,
/// migrations) that need a connection of their own.
pub fn open_connection(path: impl AsRef<Path>) -> Result<Connection, String> {
    let conn = Connection::open(path.as_ref()).map_err(|error| error.to_string())?;
    configure_connection(&conn).map_err(|error| error.to_string())?;
    Ok(conn)
}

/// A connection borrowed from the pool; it goes back to the pool when dropped.
pub struct PooledConnection {
    path: PathBuf,
    conn: Option<Connection>,
}

impl Deref for PooledConnection {
    type Target = Connection;

    fn deref(&self) -> &Connection {
        self.conn
            .as_ref()
            .expect("pooled connection is present until drop")
    }
}

impl DerefMut for PooledConnection {
    fn deref_mut(&mut self) -> &mut Connection {
        self.conn
            .as_mut()
            .expect("pooled connection is present until drop")
    }
}

impl Drop for PooledConnection {
    fn drop(&mut self) {
        if let Some(conn) = self.conn.take() {
            return_to_pool(&IDLE_CONNECTIONS, self.path.clone(), conn, IDLE_CAPACITY);
        }
    }
}

fn return_to_pool(
    pool: &Mutex<Vec<(PathBuf, Connection)>>,
    path: PathBuf,
    conn: Connection,
    capacity: usize,
) {
    // A connection left inside a transaction is not safe to hand to the next caller.
    if !conn.is_autocommit() {
        return;
    }
    if let Ok(mut idle) = pool.lock() {
        if idle.len() < capacity {
            idle.push((path, conn));
        }
    }
}

fn take_from_pool(pool: &Mutex<Vec<(PathBuf, Connection)>>, path: &Path) -> Option<Connection> {
    let mut idle = pool.lock().ok()?;
    let index = idle.iter().position(|(idle_path, _)| idle_path == path)?;
    Some(idle.swap_remove(index).1)
}

/// Borrows a connection to `path`, reusing an idle one when available.
pub fn checkout(path: impl AsRef<Path>) -> Result<PooledConnection, String> {
    let path = path.as_ref().to_path_buf();
    let conn = match take_from_pool(&IDLE_CONNECTIONS, &path) {
        Some(conn) => conn,
        None => open_connection(&path)?,
    };
    Ok(PooledConnection {
        path,
        conn: Some(conn),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn open_connection_applies_busy_timeout_and_pragmas() {
        let dir = tempdir().unwrap();
        let conn = open_connection(dir.path().join("settings.sqlite")).unwrap();
        let temp_store: i64 = conn
            .query_row("PRAGMA temp_store", [], |row| row.get(0))
            .unwrap();
        let cache_size: i64 = conn
            .query_row("PRAGMA cache_size", [], |row| row.get(0))
            .unwrap();
        assert_eq!(temp_store, 2, "temp_store should be MEMORY");
        assert_eq!(cache_size, -16000);
    }

    #[test]
    fn pool_reuses_connections_per_path_and_respects_capacity() {
        let dir = tempdir().unwrap();
        let first_path = dir.path().join("first.sqlite");
        let second_path = dir.path().join("second.sqlite");
        let pool = Mutex::new(Vec::new());

        let conn = open_connection(&first_path).unwrap();
        conn.execute_batch("CREATE TEMP TABLE marker(id INTEGER)")
            .unwrap();
        return_to_pool(&pool, first_path.clone(), conn, 1);

        assert!(take_from_pool(&pool, &second_path).is_none());
        let reused = take_from_pool(&pool, &first_path).expect("connection is reused");
        // TEMP tables live only on the original connection, so this proves reuse.
        reused.execute("INSERT INTO marker VALUES (1)", []).unwrap();

        return_to_pool(&pool, first_path.clone(), reused, 1);
        return_to_pool(
            &pool,
            second_path,
            open_connection(dir.path().join("x.sqlite")).unwrap(),
            1,
        );
        assert_eq!(pool.lock().unwrap().len(), 1, "capacity is enforced");
    }

    #[test]
    fn pool_drops_connections_left_in_a_transaction() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("tx.sqlite");
        let pool = Mutex::new(Vec::new());
        let conn = open_connection(&path).unwrap();
        conn.execute_batch("BEGIN").unwrap();
        return_to_pool(&pool, path, conn, 4);
        assert!(pool.lock().unwrap().is_empty());
    }
}
