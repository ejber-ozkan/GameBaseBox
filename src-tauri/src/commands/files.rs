use crate::models::{ResolvedPath, ScannedRom};
use std::path::{Component, Path, PathBuf};

const MAX_MEDIA_DOWNLOAD_BYTES: u64 = 100 * 1024 * 1024;

fn validate_media_download_url(value: &str) -> Result<reqwest::Url, String> {
    let url = reqwest::Url::parse(value).map_err(|error| format!("Invalid media URL: {error}"))?;
    if url.scheme() != "https" || url.host_str().is_none() || !url.username().is_empty() || url.password().is_some() {
        return Err("Media downloads must use an HTTPS URL with a host and no embedded credentials.".to_string());
    }
    Ok(url)
}

fn sanitize_relative_media_path(path: &str) -> Option<PathBuf> {
    let mut sanitized = PathBuf::new();

    for component in Path::new(path).components() {
        match component {
            Component::Normal(part) => sanitized.push(part),
            Component::CurDir => {}
            Component::ParentDir | Component::RootDir | Component::Prefix(_) => return None,
        }
    }

    if sanitized.as_os_str().is_empty() {
        return None;
    }

    Some(sanitized)
}

fn resolve_media_child_path(base_dir: &Path, relative_path: &str) -> Option<PathBuf> {
    sanitize_relative_media_path(relative_path).map(|sanitized| base_dir.join(sanitized))
}

fn split_variant_stem(stem: &str) -> (&str, Option<&str>) {
    if let Some((base, suffix)) = stem.rsplit_once('_') {
        let is_numeric_variant = !suffix.is_empty() && suffix.chars().all(|character| character.is_ascii_digit());
        let is_alpha_variant = suffix.len() == 1 && suffix.chars().all(|character| character.is_ascii_lowercase());
        if is_numeric_variant || is_alpha_variant {
            return (base, Some(suffix));
        }
    }

    (stem, None)
}

#[tauri::command]
pub async fn scan_rom_directory(directory: String) -> Result<Vec<ScannedRom>, String> {
    use crc32fast::Hasher;
    use std::io::Read;
    use walkdir::WalkDir;

    let dir = Path::new(&directory);
    if !dir.exists() {
        return Err(format!("Directory does not exist: {}", directory));
    }
    if !dir.is_dir() {
        return Err(format!("Path is not a directory: {}", directory));
    }

    let rom_extensions = ["d64", "t64", "tap", "prg", "crt", "g64", "nib"];
    let mut results: Vec<ScannedRom> = Vec::new();

    for entry in WalkDir::new(dir)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }
        let ext = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();

        if !rom_extensions.contains(&ext.as_str()) {
            continue;
        }

        let crc32 = match std::fs::File::open(path) {
            Ok(mut file) => {
                let mut hasher = Hasher::new();
                let mut buf = [0u8; 65536];
                loop {
                    match file.read(&mut buf) {
                        Ok(0) => break,
                        Ok(n) => hasher.update(&buf[..n]),
                        Err(e) => return Err(format!("Read error on {}: {}", path.display(), e)),
                    }
                }
                format!("{:08X}", hasher.finalize())
            }
            Err(e) => return Err(format!("Cannot open {}: {}", path.display(), e)),
        };

        let size_bytes = std::fs::metadata(path).map(|m| m.len()).unwrap_or(0);

        results.push(ScannedRom {
            path: path.to_string_lossy().to_string(),
            filename: path
                .file_name()
                .map(|f| f.to_string_lossy().to_string())
                .unwrap_or_default(),
            extension: ext,
            crc32,
            size_bytes,
        });
    }

    Ok(results)
}

#[tauri::command]
pub async fn download_media_asset(
    url: String,
    dest_dir: String,
    filename: String,
) -> Result<ResolvedPath, String> {
    let url = validate_media_download_url(&url)?;
    let dest = PathBuf::from(&dest_dir);
    if !dest.exists() {
        std::fs::create_dir_all(&dest).map_err(|e| format!("Could not create directory: {}", e))?;
    }

    let full_path = resolve_media_child_path(&dest, &filename)
        .ok_or_else(|| format!("Invalid media path: {}", filename))?;

    if let Some(parent) = full_path.parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Could not create sub-directory: {}", e))?;
        }
    }

    let response = reqwest::get(url.clone())
        .await
        .map_err(|e| format!("Failed to download {}: {}", url, e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Download failed with status: {}",
            response.status()
        ));
    }

    if response.content_length().is_some_and(|length| length > MAX_MEDIA_DOWNLOAD_BYTES) {
        return Err(format!("Media download exceeds the {} MiB limit.", MAX_MEDIA_DOWNLOAD_BYTES / 1024 / 1024));
    }

    let bytes = response.bytes().await.map_err(|e| e.to_string())?;
    if bytes.len() as u64 > MAX_MEDIA_DOWNLOAD_BYTES {
        return Err(format!("Media download exceeds the {} MiB limit.", MAX_MEDIA_DOWNLOAD_BYTES / 1024 / 1024));
    }
    std::fs::write(&full_path, bytes)
        .map_err(|e| format!("Failed to write file {}: {}", full_path.display(), e))?;

    Ok(ResolvedPath {
        exists: true,
        absolute_path: full_path.to_string_lossy().to_string(),
    })
}

#[tauri::command]
pub async fn read_file_bytes(path: String) -> Result<Vec<u8>, String> {
    // read_file_bytes is used by WasmPlayer to stream a ROM into the in-browser emulator.
    // The path is always constructed from the user's own configured romsPath / extrasPath base
    // (see PlayButton.tsx), so no additional trust-root check is needed here.
    // We do reject directory paths to avoid undefined platform behaviour and to
    // keep the contract consistent with how emulator.rs validates its inputs.
    let p = std::path::Path::new(&path);
    if !p.exists() {
        return Err(format!("File not found: {}", path));
    }
    if !p.is_file() {
        return Err(format!("Path is not a file: {}", path));
    }
    std::fs::read(p).map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
pub async fn resolve_media_path(base_dir: String, filename: String) -> ResolvedPath {
    let Some(full) = resolve_media_child_path(Path::new(&base_dir), &filename) else {
        return ResolvedPath {
            exists: false,
            absolute_path: String::new(),
        };
    };

    ResolvedPath {
        exists: full.exists(),
        absolute_path: full.to_string_lossy().to_string(),
    }
}

#[tauri::command]
pub async fn find_all_media_variants(base_dir: String, filename: String) -> Vec<String> {
    let mut results = Vec::new();
    let Some(relative_path) = sanitize_relative_media_path(&filename) else {
        return results;
    };

    let full = PathBuf::from(&base_dir).join(&relative_path);

    if full.exists() {
        results.push(full.to_string_lossy().to_string());
    }

    let path = relative_path.as_path();
    if let (Some(stem), Some(ext), Some(parent)) =
        (path.file_stem(), path.extension(), path.parent())
    {
        let stem_str = stem.to_string_lossy();
        let (variant_base, detected_suffix) = split_variant_stem(&stem_str);
        let ext_str = ext.to_string_lossy();
        let variants_dir = PathBuf::from(&base_dir).join(parent);

        let mut numbered_results = Vec::new();
        let mut numbered_gap_seen = false;
        for i in 1..=9 {
            let variant_name = format!("{}_{}.{}", variant_base, i, ext_str);
            let variant_full = variants_dir.join(&variant_name);
            if variant_full.exists() {
                numbered_results.push(variant_full.to_string_lossy().to_string());
            } else if detected_suffix.is_none() || !numbered_results.is_empty() {
                numbered_gap_seen = true;
            }

            if numbered_gap_seen && !numbered_results.is_empty() {
                break;
            }
        }

        let mut alpha_results = Vec::new();
        let mut alpha_gap_seen = false;
        for alpha_char in 'a'..='i' {
            let variant_name = format!("{}_{}.{}", variant_base, alpha_char, ext_str);
            let variant_full_alpha = variants_dir.join(&variant_name);
            if variant_full_alpha.exists() {
                alpha_results.push(variant_full_alpha.to_string_lossy().to_string());
            } else if detected_suffix.is_none() || !alpha_results.is_empty() {
                alpha_gap_seen = true;
            }

            if alpha_gap_seen && !alpha_results.is_empty() {
                break;
            }
        }

        for variant in numbered_results.into_iter().chain(alpha_results) {
            if !results.iter().any(|existing| existing == &variant) {
                results.push(variant);
            }
        }
    }

    results
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use tempfile::tempdir;

    #[tokio::test]
    async fn test_resolve_media_path() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("test.png");
        File::create(&file_path).unwrap();

        let res = resolve_media_path(
            dir.path().to_string_lossy().to_string(),
            "test.png".to_string(),
        )
        .await;

        assert!(res.exists);
        assert!(res.absolute_path.contains("test.png"));
    }

    #[tokio::test]
    async fn test_find_all_media_variants() {
        let dir = tempdir().unwrap();
        let base = dir.path().to_string_lossy().to_string();

        File::create(dir.path().join("game.png")).unwrap();
        File::create(dir.path().join("game_1.png")).unwrap();
        File::create(dir.path().join("game_a.png")).unwrap();

        let variants = find_all_media_variants(base, "game.png".to_string()).await;

        assert_eq!(variants.len(), 3);
        assert!(variants.iter().any(|v| v.contains("game.png")));
        assert!(variants.iter().any(|v| v.contains("game_1.png")));
        assert!(variants.iter().any(|v| v.contains("game_a.png")));
    }

    #[tokio::test]
    async fn test_find_all_media_variants_from_already_suffixed_filename() {
        let dir = tempdir().unwrap();
        let base = dir.path().to_string_lossy().to_string();

        File::create(dir.path().join("barbarian2_1.png")).unwrap();
        File::create(dir.path().join("barbarian2_2.png")).unwrap();
        File::create(dir.path().join("barbarian2_3.png")).unwrap();

        let variants = find_all_media_variants(base, "barbarian2_1.png".to_string()).await;

        assert_eq!(variants.len(), 3);
        assert!(variants.iter().any(|v| v.contains("barbarian2_1.png")));
        assert!(variants.iter().any(|v| v.contains("barbarian2_2.png")));
        assert!(variants.iter().any(|v| v.contains("barbarian2_3.png")));
    }

    #[tokio::test]
    async fn test_scan_rom_directory() {
        let dir = tempdir().unwrap();
        let base = dir.path().to_string_lossy().to_string();

        // Valid ROM
        File::create(dir.path().join("game.d64")).unwrap();
        // Valid but uppercase
        File::create(dir.path().join("GAME2.T64")).unwrap();
        // Invalid extension
        File::create(dir.path().join("text.txt")).unwrap();
        // Subdirectory
        let sub = dir.path().join("subdir");
        std::fs::create_dir(&sub).unwrap();
        File::create(sub.join("nested.prg")).unwrap();

        let roms = scan_rom_directory(base).await.unwrap();

        // Should find 3 roms (game.d64, GAME2.T64, nested.prg)
        assert_eq!(roms.len(), 3);
        assert!(roms.iter().any(|r| r.filename == "game.d64"));
        assert!(roms.iter().any(|r| r.filename == "GAME2.T64"));
        assert!(roms.iter().any(|r| r.filename == "nested.prg"));
    }

    #[tokio::test]
    async fn test_scan_non_existent_directory() {
        let res = scan_rom_directory("/non/existent/path/gbbox".to_string()).await;
        assert!(res.is_err());
    }

    #[tokio::test]
    async fn test_scan_rom_directory_empty() {
        let dir = tempdir().unwrap();
        let roms = scan_rom_directory(dir.path().to_string_lossy().to_string())
            .await
            .unwrap();
        assert_eq!(roms.len(), 0);
    }

    #[tokio::test]
    async fn test_read_file_bytes() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("test.bin");
        std::fs::write(&file_path, b"hello").unwrap();

        let bytes = read_file_bytes(file_path.to_string_lossy().to_string())
            .await
            .unwrap();
        assert_eq!(bytes, b"hello");
    }

    #[tokio::test]
    async fn test_read_file_bytes_empty_file() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("empty.bin");
        File::create(&file_path).unwrap();

        let bytes = read_file_bytes(file_path.to_string_lossy().to_string())
            .await
            .unwrap();
        assert!(bytes.is_empty());
    }

    #[tokio::test]
    async fn test_read_file_bytes_rejects_non_existent_path() {
        let res = read_file_bytes("/non/existent/gbbox/rom.d64".to_string()).await;
        assert!(res.is_err());
        let msg = res.unwrap_err();
        assert!(msg.contains("not found") || msg.contains("no such file"), "unexpected error: {}", msg);
    }

    #[tokio::test]
    async fn test_read_file_bytes_rejects_directory() {
        // read_file_bytes must reject a directory path so that the contract mirrors
        // emulator.rs require_existing_file and avoids undefined platform behaviour.
        let dir = tempdir().unwrap();
        let res = read_file_bytes(dir.path().to_string_lossy().to_string()).await;
        assert!(res.is_err());
        let msg = res.unwrap_err();
        assert!(msg.contains("not a file"), "expected 'not a file' error, got: {}", msg);
    }

    #[tokio::test]
    async fn test_resolve_media_path_rejects_parent_traversal() {
        let dir = tempdir().unwrap();
        let outside = dir.path().join("outside.png");
        File::create(&outside).unwrap();

        let base_dir = dir.path().join("media");
        std::fs::create_dir(&base_dir).unwrap();

        let res = resolve_media_path(
            base_dir.to_string_lossy().to_string(),
            "../outside.png".to_string(),
        )
        .await;

        assert!(!res.exists);
        assert!(res.absolute_path.is_empty());
    }

    #[tokio::test]
    async fn test_find_all_media_variants_rejects_parent_traversal() {
        let dir = tempdir().unwrap();
        File::create(dir.path().join("outside.png")).unwrap();
        File::create(dir.path().join("outside_1.png")).unwrap();

        let base_dir = dir.path().join("media");
        std::fs::create_dir(&base_dir).unwrap();

        let variants = find_all_media_variants(
            base_dir.to_string_lossy().to_string(),
            "../outside.png".to_string(),
        )
        .await;

        assert!(variants.is_empty());
    }

    #[tokio::test]
    async fn test_download_media_asset_rejects_parent_traversal_filename() {
        let dir = tempdir().unwrap();
        let res = download_media_asset(
            "https://example.invalid/test.png".to_string(),
            dir.path().to_string_lossy().to_string(),
            "../escape.png".to_string(),
        )
        .await;

        assert!(res.is_err());
        assert!(res.unwrap_err().contains("Invalid media path"));
    }

    #[test]
    fn media_download_urls_require_https_hosts() {
        assert!(validate_media_download_url("https://cdn.example.com/art.png").is_ok());
        assert!(validate_media_download_url("http://cdn.example.com/art.png").is_err());
        assert!(validate_media_download_url("file:///C:/Windows/win.ini").is_err());
        assert!(validate_media_download_url("https://").is_err());
    }
}
