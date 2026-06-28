use crate::database::get_db_path;
use crate::models::GameFilters;
use rusqlite::{params_from_iter, Connection};

const FILTERED_IDS_QUERY_PREFIX: &str = "
        SELECT
            g.GA_Id as id,
            MIN(g.Name) as sort_name
        FROM Games g
        JOIN GameView gv ON gv.id = g.GA_Id AND gv.platformId = g.platform_id
        LEFT JOIN Programmers pr ON g.PR_Id = pr.PR_Id
        LEFT JOIN Artists ar ON g.AR_Id = ar.AR_Id
        WHERE 1=1";

const FILTERED_IDS_GROUP_BY: &str = "
            GROUP BY g.platform_id, g.GA_Id";

const FILTERED_IDS_QUERY_SUFFIX: &str = "
            ORDER BY sort_name COLLATE NOCASE ASC
            LIMIT ? OFFSET ?";

const LEGACY_SEARCH_FILTER_COLUMNS: [&str; 6] = [
    "LOWER(gv.name) LIKE ?",
    "LOWER(gv.developer_name) LIKE ?",
    "LOWER(gv.publisher_name) LIKE ?",
    "LOWER(gv.musician_name) LIKE ?",
    "LOWER(COALESCE(pr.Programmer, '')) LIKE ?",
    "LOWER(COALESCE(ar.Artist, '')) LIKE ?",
];

pub(crate) fn build_fts_match_query(search_query: &str) -> Option<String> {
    let terms = search_query
        .split(|character: char| !character.is_alphanumeric())
        .filter(|term| !term.is_empty())
        .map(|term| format!("{term}*"))
        .collect::<Vec<_>>();

    if terms.is_empty() {
        None
    } else {
        Some(terms.join(" AND "))
    }
}

#[derive(Clone, Copy)]
pub(crate) enum SearchMode {
    Fts,
    Like,
}

struct GameQueryBuilder {
    filter_query: String,
    params: Vec<String>,
    search_mode: SearchMode,
}

impl GameQueryBuilder {
    fn new(platform_id: &str, search_mode: SearchMode) -> Self {
        Self {
            filter_query: FILTERED_IDS_QUERY_PREFIX.to_string(),
            params: vec![platform_id.to_string()],
            search_mode,
        }
    }

    fn push_platform_filter(&mut self) {
        self.filter_query.push_str(" AND gv.platformId = ?");
    }

    fn push_search_filter(&mut self, search_query: Option<&str>) {
        let Some(search_query) = search_query.filter(|value| !value.is_empty()) else {
            return;
        };

        match self.search_mode {
            SearchMode::Fts => {
                let Some(match_query) = build_fts_match_query(search_query) else {
                    self.filter_query.push_str(" AND 1=0");
                    return;
                };

                self.filter_query.push_str(
                    " AND gv.id IN (
                        SELECT id
                        FROM GameSearchIndex
                        WHERE platform_id = ?
                          AND GameSearchIndex MATCH ?
                    )",
                );
                self.params.push(self.params[0].clone());
                self.params.push(match_query);
            }
            SearchMode::Like => {
                self.filter_query.push_str(" AND (");
                self.filter_query
                    .push_str(&LEGACY_SEARCH_FILTER_COLUMNS.join(" OR "));
                self.filter_query.push(')');

                let pattern = format!("%{}%", search_query.to_lowercase());
                for _ in 0..LEGACY_SEARCH_FILTER_COLUMNS.len() {
                    self.params.push(pattern.clone());
                }
            }
        }
    }

    fn push_letter_filter(&mut self, letter: Option<&str>) {
        let Some(letter) = letter.filter(|value| !value.is_empty()) else {
            return;
        };

        if letter == "#" {
            self.filter_query
                .push_str(" AND SUBSTR(gv.name, 1, 1) NOT GLOB '[A-Za-z]*'");
        } else {
            self.filter_query.push_str(" AND g.Name LIKE ?");
            self.params.push(format!("{letter}%"));
        }
    }

    fn push_exact_filter(&mut self, clause: &str, value: Option<&str>) {
        let Some(value) = value.filter(|candidate| !candidate.is_empty()) else {
            return;
        };

        self.filter_query.push_str(clause);
        self.params.push(value.to_string());
    }

    fn push_hide_adult_filter(&mut self, hide_adult: bool) {
        if hide_adult {
            self.filter_query.push_str(" AND g.Adult = 'False'");
        }
    }

    fn push_classic_filter(&mut self, is_classic: Option<bool>) {
        match is_classic {
            Some(true) => self.filter_query.push_str(" AND gv.isClassic = 1"),
            Some(false) => self.filter_query.push_str(" AND gv.isClassic = 0"),
            None => {}
        }
    }

    fn push_favorite_filter(&mut self, favorite_ids: Option<&[String]>) -> bool {
        let Some(favorite_ids) = favorite_ids else {
            return true;
        };

        if favorite_ids.is_empty() {
            return false;
        }

        let placeholders = favorite_ids
            .iter()
            .map(|_| "?")
            .collect::<Vec<_>>()
            .join(",");
        self.filter_query
            .push_str(&format!(" AND gv.id IN ({placeholders})"));
        self.params.extend(favorite_ids.iter().cloned());
        true
    }

    fn finish(mut self, limit: usize, offset: usize) -> (String, Vec<String>) {
        self.filter_query.push_str(FILTERED_IDS_GROUP_BY);
        self.filter_query.push_str(FILTERED_IDS_QUERY_SUFFIX);
        self.params.push(limit.to_string());
        self.params.push(offset.to_string());
        (self.filter_query, self.params)
    }

    fn finish_count(mut self) -> (String, Vec<String>) {
        self.filter_query.push_str(FILTERED_IDS_GROUP_BY);
        (
            format!("SELECT COUNT(*) FROM ({})", self.filter_query),
            self.params,
        )
    }
}

fn apply_game_filters(builder: &mut GameQueryBuilder, filters: GameFilters) -> bool {
    builder.push_search_filter(filters.search_query.as_deref());
    builder.push_letter_filter(filters.letter.as_deref());
    builder.push_exact_filter(" AND gv.parentGenre = ?", filters.genre.as_deref());
    builder.push_exact_filter(" AND gv.subGenre = ?", filters.sub_genre.as_deref());
    builder.push_hide_adult_filter(filters.hide_adult.unwrap_or(false));
    builder.push_classic_filter(filters.is_classic);
    builder.push_favorite_filter(filters.favorite_ids.as_deref())
}

pub(crate) fn build_game_query(
    platform_id: &str,
    limit: usize,
    offset: usize,
    filters: Option<GameFilters>,
    search_mode: SearchMode,
) -> Option<(String, Vec<String>)> {
    let mut builder = GameQueryBuilder::new(platform_id, search_mode);
    builder.push_platform_filter();

    if let Some(filters) = filters {
        if !apply_game_filters(&mut builder, filters) {
            return None;
        }
    }

    Some(builder.finish(limit, offset))
}

fn build_game_count_query(
    platform_id: &str,
    filters: Option<GameFilters>,
    search_mode: SearchMode,
) -> Option<(String, Vec<String>)> {
    let mut builder = GameQueryBuilder::new(platform_id, search_mode);
    builder.push_platform_filter();

    if let Some(filters) = filters {
        if !apply_game_filters(&mut builder, filters) {
            return Some(("SELECT 0".to_string(), Vec::new()));
        }
    }

    Some(builder.finish_count())
}

pub(crate) fn load_ordered_game_ids_with_fallback(
    conn: &Connection,
    platform_id: &str,
    limit: usize,
    offset: usize,
    filters: Option<GameFilters>,
) -> Result<Vec<String>, String> {
    let filters_for_retry = filters.clone();

    let load_ids =
        |search_mode: SearchMode, filters: Option<GameFilters>| -> Result<Vec<String>, String> {
            let Some((query, params)) =
                build_game_query(platform_id, limit, offset, filters, search_mode)
            else {
                return Ok(Vec::new());
            };

            let mut stmt = conn
                .prepare(&query)
                .map_err(|e| format!("Prepare error: {e}"))?;
            let id_iter = stmt
                .query_map(params_from_iter(params), |row| row.get::<_, String>(0))
                .map_err(|e| e.to_string())?;
            id_iter
                .collect::<Result<Vec<_>, _>>()
                .map_err(|e| e.to_string())
        };

    match load_ids(SearchMode::Fts, filters) {
        Ok(ids) => Ok(ids),
        Err(error) if error.contains("no such table: GameSearchIndex") => {
            load_ids(SearchMode::Like, filters_for_retry)
        }
        Err(error) => Err(error),
    }
}

pub(crate) fn load_game_count_with_fallback(
    conn: &Connection,
    platform_id: &str,
    filters: Option<GameFilters>,
) -> Result<usize, String> {
    let filters_for_retry = filters.clone();

    let load_count =
        |search_mode: SearchMode, filters: Option<GameFilters>| -> Result<usize, String> {
            let Some((query, params)) = build_game_count_query(platform_id, filters, search_mode)
            else {
                return Ok(0);
            };

            let mut stmt = conn
                .prepare(&query)
                .map_err(|e| format!("Prepare error: {e}"))?;

            stmt.query_row(params_from_iter(params), |row| row.get::<_, usize>(0))
                .map_err(|e| e.to_string())
        };

    match load_count(SearchMode::Fts, filters) {
        Ok(count) => Ok(count),
        Err(error) if error.contains("no such table: GameSearchIndex") => {
            load_count(SearchMode::Like, filters_for_retry)
        }
        Err(error) => Err(error),
    }
}

pub(crate) fn open_db_connection(context: &str) -> Result<Connection, String> {
    Connection::open(get_db_path()).map_err(|error| format!("{context}: {error}"))
}

pub(crate) fn sqlite_table_exists(conn: &Connection, table_name: &str) -> Result<bool, String> {
    conn.query_row(
        "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?1)",
        [table_name],
        |row| row.get(0),
    )
    .map_err(|error| error.to_string())
}
