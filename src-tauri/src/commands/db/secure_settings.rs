use crate::database::init_secure_table;
use crate::security::{decrypt_value, encrypt_value};
use rusqlite::{params, OptionalExtension};

use super::querying::open_db_connection;

pub async fn save_secure_setting(key: String, value: String) -> Result<(), String> {
    init_secure_table()?;
    let encrypted = encrypt_value(&value)?;
    let conn = open_db_connection("DB error")?;
    conn.execute(
        "INSERT OR REPLACE INTO SecureSettings (key, value) VALUES (?1, ?2)",
        params![key, encrypted],
    )
    .map_err(|e: rusqlite::Error| e.to_string())?;
    Ok(())
}

pub async fn get_secure_setting(key: String) -> Result<Option<String>, String> {
    init_secure_table()?;
    let conn = open_db_connection("DB error")?;
    let mut stmt = conn
        .prepare("SELECT value FROM SecureSettings WHERE key = ?1")
        .map_err(|e: rusqlite::Error| e.to_string())?;
    let encrypted: Option<String> = stmt
        .query_row([key], |row| row.get(0))
        .optional()
        .map_err(|e: rusqlite::Error| e.to_string())?;

    match encrypted {
        Some(enc) => Ok(Some(decrypt_value(&enc)?)),
        None => Ok(None),
    }
}
