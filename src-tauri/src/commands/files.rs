use crate::models::{ResolvedPath, ScannedRom};
use std::path::{Component, Path, PathBuf};

fn clean_unc_prefix(path_str: String) -> String {
    #[cfg(windows)]
    {
        if path_str.starts_with(r"\\?\UNC\") {
            format!(r"\\{}", &path_str[8..])
        } else if path_str.starts_with(r"\\?\") {
            path_str[4..].to_string()
        } else {
            path_str
        }
    }
    #[cfg(not(windows))]
    {
        path_str
    }
}


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

fn find_case_insensitive_file(dir: &Path, filename: &str) -> Option<PathBuf> {
    if !dir.is_dir() {
        return None;
    }
    let target = filename.to_lowercase();
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            if let Some(name) = entry.file_name().to_str() {
                if name.to_lowercase() == target {
                    return Some(entry.path());
                }
            }
        }
    }
    None
}

fn resolve_path_case_insensitive(base: &Path, relative: &Path) -> Option<PathBuf> {
    let mut current = base.to_path_buf();
    for component in relative.components() {
        let comp_str = component.as_os_str().to_str()?;
        if let Some(matched) = find_case_insensitive_file(&current, comp_str) {
            current = matched;
        } else {
            return None;
        }
    }
    Some(current)
}

fn get_candidate_paths(base_dir: &Path, filename: &str) -> Vec<PathBuf> {
    let mut candidates = Vec::new();

    // Sanitize filename to block traversal attempts (e.g. "../escape.png")
    let Some(sanitized) = sanitize_relative_media_path(filename) else {
        return candidates;
    };
    let sanitized_str = sanitized.to_string_lossy();

    // 1. Direct path
    candidates.push(base_dir.join(&sanitized));

    // 2. Partitioned path based on first character of the filename component
    let first_char = sanitized_str.chars().next().unwrap_or('\0');
    if first_char.is_ascii_alphabetic() {
        let letter = first_char.to_ascii_uppercase().to_string();
        candidates.push(base_dir.join(&letter).join(&sanitized));
        let letter_lower = first_char.to_ascii_lowercase().to_string();
        candidates.push(base_dir.join(&letter_lower).join(&sanitized));
    } else if first_char.is_ascii_digit() {
        candidates.push(base_dir.join("0").join(&sanitized));
        candidates.push(base_dir.join(first_char.to_string()).join(&sanitized));
    }

    candidates
}

#[tauri::command]
pub async fn resolve_media_path(base_dir: String, filename: String) -> ResolvedPath {
    let base = Path::new(&base_dir);
    let candidates = get_candidate_paths(base, &filename);

    // Fast-path: Check if any candidate path exists directly on disk
    for candidate in &candidates {
        if candidate.exists() && candidate.is_file() {
            // Canonicalize to obtain the actual on-disk path with real casing
            let resolved = candidate.canonicalize().unwrap_or_else(|_| candidate.clone());
            let path_str = clean_unc_prefix(resolved.to_string_lossy().to_string());
            if crate::is_debug_mode() {
                println!(
                    "[DEBUG] Media resolved via fast-path: {:?} -> {:?}",
                    filename,
                    path_str
                );
            }
            return ResolvedPath {
                exists: true,
                absolute_path: path_str,
            };
        }
    }

    // Slow-path: Fallback to case-insensitive matching
    for candidate in &candidates {
        if let Ok(rel) = candidate.strip_prefix(base) {
            if let Some(resolved) = resolve_path_case_insensitive(base, rel) {
                let path_str = clean_unc_prefix(resolved.to_string_lossy().to_string());
                if crate::is_debug_mode() {
                    println!(
                        "[DEBUG] Media resolved via case-insensitive slow-path: {:?} -> {:?}",
                        filename,
                        path_str
                    );
                }
                return ResolvedPath {
                    exists: true,
                    absolute_path: path_str,
                };
            }
        }
    }

    if crate::is_debug_mode() {
        eprintln!(
            "[DEBUG WARNING] Failed to resolve media file {:?} under base directory {:?}. Tried candidates: {:?}",
            filename,
            base_dir,
            candidates.iter().map(|c| clean_unc_prefix(c.display().to_string())).collect::<Vec<_>>()
        );
    }

    ResolvedPath {
        exists: false,
        absolute_path: String::new(),
    }
}

#[tauri::command]
pub async fn find_all_media_variants(base_dir: String, filename: String) -> Vec<String> {
    let mut results = Vec::new();
    let base = Path::new(&base_dir);
    
    let path = Path::new(&filename);
    let Some(stem) = path.file_stem().and_then(|s| s.to_str()) else {
        return results;
    };
    let ext_str = path.extension().and_then(|e| e.to_str()).unwrap_or("");
    let (variant_base, detected_suffix) = split_variant_stem(stem);

    let candidates = get_candidate_paths(base, &filename);
    let mut checked_dirs = Vec::new();

    for candidate in candidates {
        let Some(parent) = candidate.parent() else {
            continue;
        };

        // Fast-path: Check if the parent folder exists directly
        let resolved_parent = if parent.is_dir() {
            // Canonicalize to resolve any case differences on case-insensitive filesystems
            parent.canonicalize().ok().or_else(|| Some(parent.to_path_buf()))
        } else {
            // Slow-path: Try resolving the parent folder case-insensitively
            parent.strip_prefix(base)
                .ok()
                .and_then(|rel| resolve_path_case_insensitive(base, rel))
                .and_then(|p| p.canonicalize().ok().or(Some(p)))
        };

        let Some(resolved_parent) = resolved_parent else {
            continue;
        };

        // De-duplicate parent directories to avoid double scans on case-insensitive filesystems
        // (e.g. base/A and base/a both resolve to the same physical directory on Windows)
        if checked_dirs.contains(&resolved_parent) {
            continue;
        }
        checked_dirs.push(resolved_parent.clone());

        // 1. Check for the base file
        let base_name = path.file_name().and_then(|f| f.to_str()).unwrap_or("");
        // Fast-path direct check
        let base_direct = resolved_parent.join(base_name);
        if base_direct.exists() && base_direct.is_file() {
            let path_str = clean_unc_prefix(base_direct.to_string_lossy().to_string());
            if !results.contains(&path_str) {
                results.push(path_str);
            }
        } else {
            // Case-insensitive fallback
            if let Some(matched_base) = find_case_insensitive_file(&resolved_parent, base_name) {
                let path_str = clean_unc_prefix(matched_base.to_string_lossy().to_string());
                if !results.contains(&path_str) {
                    results.push(path_str);
                }
            }
        }

        // Helper closures to check variants using fast-path first, then case-insensitive fallback
        let check_variant = |res_list: &mut Vec<String>, var_name: &str| {
            let direct = resolved_parent.join(var_name);
            if direct.exists() && direct.is_file() {
                res_list.push(clean_unc_prefix(direct.to_string_lossy().to_string()));
                true
            } else if let Some(matched) = find_case_insensitive_file(&resolved_parent, var_name) {
                res_list.push(clean_unc_prefix(matched.to_string_lossy().to_string()));
                true
            } else {
                false
            }
        };

        // 2. Numbered variants _1 to _9
        let mut numbered_results = Vec::new();
        let mut numbered_gap_seen = false;
        for i in 1..=9 {
            let variant_name = if ext_str.is_empty() {
                format!("{}_{}", variant_base, i)
            } else {
                format!("{}_{}.{}", variant_base, i, ext_str)
            };

            let found = check_variant(&mut numbered_results, &variant_name);
            if !found && (detected_suffix.is_none() || !numbered_results.is_empty()) {
                numbered_gap_seen = true;
            }

            if numbered_gap_seen && !numbered_results.is_empty() {
                break;
            }
        }

        // 3. Alpha variants _a to _i
        let mut alpha_results = Vec::new();
        let mut alpha_gap_seen = false;
        for alpha_char in 'a'..='i' {
            let variant_name = if ext_str.is_empty() {
                format!("{}_{}", variant_base, alpha_char)
            } else {
                format!("{}_{}.{}", variant_base, alpha_char, ext_str)
            };

            let found = check_variant(&mut alpha_results, &variant_name);
            if !found && (detected_suffix.is_none() || !alpha_results.is_empty()) {
                alpha_gap_seen = true;
            }

            if alpha_gap_seen && !alpha_results.is_empty() {
                break;
            }
        }

        for variant in numbered_results.into_iter().chain(alpha_results) {
            if !results.contains(&variant) {
                results.push(variant);
            }
        }
    }

    if crate::is_debug_mode() {
        if results.is_empty() {
            eprintln!(
                "[DEBUG WARNING] No media variants found for {:?} under base directory {:?}",
                filename,
                base_dir
            );
        } else {
            println!(
                "[DEBUG] Found {} media variants for {:?}: {:?}",
                results.len(),
                filename,
                results
            );
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

    #[tokio::test]
    async fn test_resolve_media_path_partitioned_and_case_insensitive() {
        let dir = tempdir().unwrap();
        let base = dir.path().to_string_lossy().to_string();

        // Create partitioned directories: 'A' and '0'
        let dir_a = dir.path().join("A");
        std::fs::create_dir(&dir_a).unwrap();
        let dir_0 = dir.path().join("0");
        std::fs::create_dir(&dir_0).unwrap();

        // Create target files with mixed casing
        let file_a = dir_a.join("akualabeth_1.PNG");
        std::fs::write(&file_a, b"test image contents").unwrap();

        let file_0 = dir_0.join("1942_title.png");
        std::fs::write(&file_0, b"test numeric contents").unwrap();

        // Test 1: Resolving a filename starting with 'A' that exists in 'A/' subdirectory with mixed casing
        // Use case-insensitive check because on case-insensitive filesystems (Windows), canonicalize
        // returns the actual on-disk casing but the path may also have a UNC prefix.
        let res_a = resolve_media_path(base.clone(), "Akualabeth_1.png".to_string()).await;
        assert!(res_a.exists);
        assert!(res_a.absolute_path.to_lowercase().contains("akualabeth_1.png"));

        // Test 2: Resolving a filename starting with a number that exists in '0/' subdirectory
        let res_0 = resolve_media_path(base.clone(), "1942_title.png".to_string()).await;
        assert!(res_0.exists);
        assert!(res_0.absolute_path.to_lowercase().contains("1942_title.png"));

        // Test 3: find_all_media_variants should find them in partitioned directories
        let variants = find_all_media_variants(base.clone(), "Akualabeth_1.png".to_string()).await;
        assert_eq!(variants.len(), 1);
        assert!(variants[0].to_lowercase().contains("akualabeth_1.png"));
    }
}
