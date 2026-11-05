-- Fills GameCoverIndex with each game's first cover image from Extras.
-- Shared by src-tauri/src/database.rs and scripts/convert_csv_to_sqlite.js; changing it
-- requires bumping SCHEMA_VERSION in database.rs.
INSERT OR REPLACE INTO GameCoverIndex (GA_Id, platform_id, cover_path)
    SELECT
        Extras.GA_Id,
        COALESCE(Extras.platform_id, Games.platform_id, 'c64') as platform_id,
        MIN(Extras.Path) as cover_path
    FROM Extras
    LEFT JOIN Games ON Extras.GA_Id = Games.GA_Id
        AND COALESCE(Extras.platform_id, 'c64') = COALESCE(Games.platform_id, 'c64')
    WHERE (
          LOWER(REPLACE(Path, '\', '/')) LIKE 'cover/%'
          OR LOWER(REPLACE(Path, '\', '/')) LIKE 'covers/%'
      )
      AND (
          LOWER(Path) LIKE '%.jpg'
          OR LOWER(Path) LIKE '%.jpeg'
          OR LOWER(Path) LIKE '%.png'
          OR LOWER(Path) LIKE '%.webp'
          OR LOWER(Path) LIKE '%.gif'
          OR LOWER(Path) LIKE '%.bmp'
      )
    GROUP BY Extras.GA_Id, COALESCE(Extras.platform_id, Games.platform_id, 'c64')
