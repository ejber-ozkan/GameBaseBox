use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::{Component, Path, PathBuf};
use std::process::Command;

const ARCHIVE_CREATOR: &str = "The C64-Gamevideoarchive";
const MAX_ARCHIVE_VIDEO_BYTES: u64 = 2 * 1024 * 1024 * 1024;

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ExtraVideoResolution {
    pub original_path: String,
    pub playback_path: Option<String>,
    pub original_exists: bool,
    pub compatible_sidecar: bool,
    pub archive_candidate: bool,
}

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
pub struct ArchiveFile {
    pub name: String,
    pub format: Option<String>,
    pub source: Option<String>,
    pub size: Option<String>,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ExtraVideoActionResult {
    pub path: String,
    pub message: String,
    pub source_url: Option<String>,
    pub license_url: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct ConversionPlan {
    output: PathBuf,
    temporary: PathBuf,
    arguments: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct ArchiveSearchEnvelope {
    response: ArchiveSearchResponse,
}

#[derive(Debug, Deserialize)]
struct ArchiveSearchResponse {
    docs: Vec<ArchiveItem>,
}

#[derive(Debug, Deserialize)]
struct ArchiveItem {
    identifier: String,
    licenseurl: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ArchiveMetadata {
    files: Vec<ArchiveFile>,
}

fn sanitize_relative_video_path(relative_path: &str) -> Result<PathBuf, String> {
    let mut sanitized = PathBuf::new();
    for component in Path::new(relative_path).components() {
        match component {
            Component::Normal(value) => sanitized.push(value),
            Component::CurDir => {}
            Component::ParentDir | Component::RootDir | Component::Prefix(_) => {
                return Err(format!("Invalid Extras video path: {relative_path}"));
            }
        }
    }
    if sanitized.as_os_str().is_empty() {
        return Err(format!("Invalid Extras video path: {relative_path}"));
    }
    Ok(sanitized)
}

fn find_case_insensitive_sibling(path: &Path) -> Option<PathBuf> {
    if path.is_file() {
        return Some(path.to_path_buf());
    }
    let parent = path.parent()?;
    let target = path.file_name()?.to_string_lossy().to_lowercase();
    std::fs::read_dir(parent)
        .ok()?
        .flatten()
        .find(|entry| entry.file_name().to_string_lossy().to_lowercase() == target)
        .map(|entry| entry.path())
}

fn resolve_extra_video_paths(
    base_dir: &Path,
    relative_path: &str,
) -> Result<ExtraVideoResolution, String> {
    let relative = sanitize_relative_video_path(relative_path)?;
    let archive_candidate = relative
        .file_stem()
        .and_then(|value| value.to_str())
        .is_some_and(is_c64_archive_candidate);
    let original_candidate = base_dir.join(relative);
    let original = find_case_insensitive_sibling(&original_candidate).unwrap_or(original_candidate);
    let original_exists = original.is_file();

    let sidecar = ["mp4", "webm"]
        .into_iter()
        .map(|extension| original.with_extension(extension))
        .find_map(|candidate| find_case_insensitive_sibling(&candidate));

    let compatible_sidecar = sidecar.is_some();
    let playback = sidecar.or_else(|| original_exists.then(|| original.clone()));

    Ok(ExtraVideoResolution {
        original_path: original.to_string_lossy().to_string(),
        playback_path: playback.map(|path| path.to_string_lossy().to_string()),
        original_exists,
        compatible_sidecar,
        archive_candidate,
    })
}

fn select_archive_mp4(files: &[ArchiveFile]) -> Option<&ArchiveFile> {
    files
        .iter()
        .filter(|file| file.name.to_lowercase().ends_with(".mp4"))
        .min_by_key(|file| {
            let source_rank = match file.source.as_deref() {
                Some("derivative") => 0,
                _ => 1,
            };
            let format = file
                .format
                .as_deref()
                .unwrap_or_default()
                .to_ascii_lowercase();
            let codec_rank = if format.contains("h.264") || format.contains("h264") {
                0
            } else {
                1
            };
            (source_rank, codec_rank)
        })
}

fn archive_search_token(stem: &str) -> &str {
    stem.rsplit_once('-')
        .map(|(_, token)| token)
        .unwrap_or(stem)
}

fn archive_search_pattern(stem: &str) -> String {
    let capture_number_reversed: String = stem
        .split_once('-')
        .map(|(prefix, _)| prefix)
        .unwrap_or(stem)
        .chars()
        .rev()
        .take_while(|character| character.is_ascii_digit())
        .collect();
    let capture_number: String = capture_number_reversed.chars().rev().collect();
    let token: String = archive_search_token(stem)
        .chars()
        .filter(|character| character.is_ascii_alphanumeric())
        .collect();
    if capture_number.is_empty() {
        token
    } else {
        format!("{capture_number}*{token}")
    }
}

fn is_c64_archive_candidate(stem: &str) -> bool {
    let normalized = stem.to_ascii_lowercase();
    normalized.starts_with("c64gva")
        || normalized.starts_with("c64videoarchive")
        || normalized.starts_with("c64gamevideoarchive")
}

fn build_conversion_plan(source: &Path) -> Result<ConversionPlan, String> {
    let stem = source
        .file_stem()
        .and_then(|value| value.to_str())
        .ok_or_else(|| format!("Invalid Extras video filename: {}", source.display()))?;
    let output = source.with_extension("mp4");
    if output == source {
        return Err(
            "The selected video is already an MP4; no non-destructive sidecar name is available."
                .to_string(),
        );
    }
    let temporary = source.with_file_name(format!("{stem}.gbbox-converting.mp4"));
    let arguments = vec![
        "-hide_banner".to_string(),
        "-loglevel".to_string(),
        "error".to_string(),
        "-y".to_string(),
        "-i".to_string(),
        source.to_string_lossy().to_string(),
        "-c:v".to_string(),
        "libx264".to_string(),
        "-preset".to_string(),
        "medium".to_string(),
        "-crf".to_string(),
        "23".to_string(),
        "-pix_fmt".to_string(),
        "yuv420p".to_string(),
        "-c:a".to_string(),
        "aac".to_string(),
        "-b:a".to_string(),
        "128k".to_string(),
        "-movflags".to_string(),
        "+faststart".to_string(),
        temporary.to_string_lossy().to_string(),
    ];
    Ok(ConversionPlan {
        output,
        temporary,
        arguments,
    })
}

fn archive_download_url(identifier: &str, filename: &str) -> Result<reqwest::Url, String> {
    let mut url =
        reqwest::Url::parse("https://archive.org/download/").map_err(|error| error.to_string())?;
    let mut segments = url
        .path_segments_mut()
        .map_err(|_| "Could not construct Archive.org download URL.".to_string())?;
    segments.pop_if_empty().push(identifier).push(filename);
    drop(segments);
    Ok(url)
}

#[tauri::command]
pub async fn resolve_extra_video(
    base_dir: String,
    relative_path: String,
) -> Result<ExtraVideoResolution, String> {
    resolve_extra_video_paths(Path::new(&base_dir), &relative_path)
}

#[tauri::command]
pub async fn convert_extra_video(
    base_dir: String,
    relative_path: String,
) -> Result<ExtraVideoActionResult, String> {
    let resolved = resolve_extra_video_paths(Path::new(&base_dir), &relative_path)?;
    if !resolved.original_exists {
        return Err("The original Extras video does not exist locally.".to_string());
    }
    let source = PathBuf::from(&resolved.original_path);
    let plan = build_conversion_plan(&source)?;
    if plan.output.is_file() {
        return Ok(ExtraVideoActionResult {
            path: plan.output.to_string_lossy().to_string(),
            message: "A compatible MP4 sidecar already exists.".to_string(),
            source_url: None,
            license_url: None,
        });
    }

    tauri::async_runtime::spawn_blocking(move || {
        if plan.temporary.exists() {
            std::fs::remove_file(&plan.temporary)
                .map_err(|error| format!("Could not remove an incomplete conversion: {error}"))?;
        }
        let output = Command::new("ffmpeg")
            .args(&plan.arguments)
            .output()
            .map_err(|error| {
                if error.kind() == std::io::ErrorKind::NotFound {
                    "FFmpeg was not found. Install FFmpeg and ensure the ffmpeg command is available on PATH.".to_string()
                } else {
                    format!("Could not start FFmpeg: {error}")
                }
            })?;
        if !output.status.success() {
            let _ = std::fs::remove_file(&plan.temporary);
            let details = String::from_utf8_lossy(&output.stderr).trim().to_string();
            return Err(if details.is_empty() {
                "FFmpeg could not create a compatible MP4.".to_string()
            } else {
                format!("FFmpeg could not create a compatible MP4: {details}")
            });
        }
        let size = std::fs::metadata(&plan.temporary).map(|metadata| metadata.len()).unwrap_or(0);
        if size == 0 {
            let _ = std::fs::remove_file(&plan.temporary);
            return Err("FFmpeg completed without creating a valid MP4 file.".to_string());
        }
        std::fs::rename(&plan.temporary, &plan.output)
            .map_err(|error| format!("Could not finalize the compatible MP4: {error}"))?;
        Ok(ExtraVideoActionResult {
            path: plan.output.to_string_lossy().to_string(),
            message: "Compatible MP4 created; the original video was preserved.".to_string(),
            source_url: None,
            license_url: None,
        })
    })
    .await
    .map_err(|error| format!("Video conversion worker failed: {error}"))?
}

#[tauri::command]
pub async fn download_archive_extra_video(
    base_dir: String,
    relative_path: String,
) -> Result<ExtraVideoActionResult, String> {
    let relative = sanitize_relative_video_path(&relative_path)?;
    let original = Path::new(&base_dir).join(&relative);
    let output = original.with_extension("mp4");
    if output.is_file() {
        return Ok(ExtraVideoActionResult {
            path: output.to_string_lossy().to_string(),
            message: "A compatible MP4 sidecar already exists.".to_string(),
            source_url: None,
            license_url: None,
        });
    }

    let stem = relative
        .file_stem()
        .and_then(|value| value.to_str())
        .ok_or_else(|| format!("Invalid Extras video path: {relative_path}"))?;
    if !is_c64_archive_candidate(stem) {
        return Err("This filename is not a C64 Gamevideoarchive item, so GBBox will not search the C64 Archive.org collection for it.".to_string());
    }
    let token: String = archive_search_token(stem)
        .chars()
        .filter(|character| character.is_ascii_alphanumeric())
        .collect();
    if token.is_empty() {
        return Err(
            "Could not derive an Archive.org search term from this video filename.".to_string(),
        );
    }
    let search_pattern = archive_search_pattern(stem);

    let client = reqwest::Client::builder()
        .user_agent("GBBox/0.5.3 (https://github.com/ejber-ozkan/GameBaseBox)")
        .build()
        .map_err(|error| error.to_string())?;
    let query = format!("creator:\"{ARCHIVE_CREATOR}\" AND identifier:*{search_pattern}*");
    let search: ArchiveSearchEnvelope = client
        .get("https://archive.org/advancedsearch.php")
        .query(&[
            ("q", query.as_str()),
            ("fl[]", "identifier,licenseurl"),
            ("rows", "10"),
            ("output", "json"),
        ])
        .send()
        .await
        .map_err(|error| format!("Archive.org search failed: {error}"))?
        .error_for_status()
        .map_err(|error| format!("Archive.org search failed: {error}"))?
        .json()
        .await
        .map_err(|error| format!("Archive.org returned invalid search metadata: {error}"))?;
    let item = search
        .response
        .docs
        .into_iter()
        .next()
        .ok_or_else(|| format!("No C64 Gamevideoarchive item was found for {token}."))?;
    let metadata: ArchiveMetadata = client
        .get(format!("https://archive.org/metadata/{}", item.identifier))
        .send()
        .await
        .map_err(|error| format!("Archive.org metadata lookup failed: {error}"))?
        .error_for_status()
        .map_err(|error| format!("Archive.org metadata lookup failed: {error}"))?
        .json()
        .await
        .map_err(|error| format!("Archive.org returned invalid item metadata: {error}"))?;
    let archive_file = select_archive_mp4(&metadata.files).ok_or_else(|| {
        "Archive.org does not provide an MP4 derivative for this video.".to_string()
    })?;
    let expected_size = archive_file
        .size
        .as_deref()
        .and_then(|value| value.parse::<u64>().ok());
    if expected_size.is_some_and(|size| size > MAX_ARCHIVE_VIDEO_BYTES) {
        return Err("The Archive.org MP4 exceeds GBBox's 2 GiB safety limit.".to_string());
    }
    let download_url = archive_download_url(&item.identifier, &archive_file.name)?;
    let mut response = client
        .get(download_url.clone())
        .send()
        .await
        .map_err(|error| format!("Archive.org video download failed: {error}"))?
        .error_for_status()
        .map_err(|error| format!("Archive.org video download failed: {error}"))?;
    if response
        .content_length()
        .is_some_and(|size| size > MAX_ARCHIVE_VIDEO_BYTES)
    {
        return Err("The Archive.org MP4 exceeds GBBox's 2 GiB safety limit.".to_string());
    }

    if let Some(parent) = output.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|error| format!("Could not create the Extras video folder: {error}"))?;
    }
    let temporary = original.with_file_name(format!("{stem}.gbbox-downloading.mp4"));
    if temporary.exists() {
        std::fs::remove_file(&temporary)
            .map_err(|error| format!("Could not remove an incomplete download: {error}"))?;
    }
    let mut file = std::fs::File::create(&temporary)
        .map_err(|error| format!("Could not create the MP4 download: {error}"))?;
    let mut downloaded = 0u64;
    while let Some(chunk) = response
        .chunk()
        .await
        .map_err(|error| format!("Archive.org video download failed: {error}"))?
    {
        downloaded += chunk.len() as u64;
        if downloaded > MAX_ARCHIVE_VIDEO_BYTES {
            drop(file);
            let _ = std::fs::remove_file(&temporary);
            return Err("The Archive.org MP4 exceeds GBBox's 2 GiB safety limit.".to_string());
        }
        file.write_all(&chunk)
            .map_err(|error| format!("Could not write the Archive.org MP4: {error}"))?;
    }
    drop(file);
    if downloaded == 0 || expected_size.is_some_and(|size| size != downloaded) {
        let _ = std::fs::remove_file(&temporary);
        return Err("The Archive.org MP4 download was incomplete.".to_string());
    }
    std::fs::rename(&temporary, &output)
        .map_err(|error| format!("Could not finalize the Archive.org MP4: {error}"))?;

    Ok(ExtraVideoActionResult {
        path: output.to_string_lossy().to_string(),
        message: "Compatible Archive.org MP4 downloaded.".to_string(),
        source_url: Some(download_url.to_string()),
        license_url: item.licenseurl,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use tempfile::tempdir;

    #[test]
    fn prefers_same_stem_mp4_sidecar_over_existing_avi() {
        let dir = tempdir().unwrap();
        let videos = dir.path().join("Videos");
        std::fs::create_dir_all(&videos).unwrap();
        File::create(videos.join("Rambo.avi")).unwrap();
        File::create(videos.join("Rambo.mp4")).unwrap();

        let resolved = resolve_extra_video_paths(dir.path(), "Videos/Rambo.avi").unwrap();

        assert!(resolved.original_exists);
        assert!(resolved.compatible_sidecar);
        assert!(resolved.playback_path.unwrap().ends_with("Rambo.mp4"));
        assert!(resolved.original_path.ends_with("Rambo.avi"));
    }

    #[test]
    fn falls_back_to_existing_original_when_no_sidecar_exists() {
        let dir = tempdir().unwrap();
        let videos = dir.path().join("Videos");
        std::fs::create_dir_all(&videos).unwrap();
        File::create(videos.join("Rambo.avi")).unwrap();

        let resolved = resolve_extra_video_paths(dir.path(), "Videos/Rambo.avi").unwrap();

        assert!(resolved.original_exists);
        assert!(!resolved.compatible_sidecar);
        assert!(resolved.playback_path.unwrap().ends_with("Rambo.avi"));
    }

    #[test]
    fn reports_a_missing_original_without_inventing_a_playback_path() {
        let dir = tempdir().unwrap();

        let resolved = resolve_extra_video_paths(dir.path(), "Videos/Rambo.avi").unwrap();

        assert!(!resolved.original_exists);
        assert!(!resolved.compatible_sidecar);
        assert!(resolved.playback_path.is_none());
    }

    #[test]
    fn rejects_video_paths_that_escape_the_extras_folder() {
        let dir = tempdir().unwrap();

        let error = resolve_extra_video_paths(dir.path(), "../Rambo.avi").unwrap_err();

        assert!(error.contains("Invalid Extras video path"));
    }

    #[test]
    fn selects_an_archive_mp4_derivative_and_ignores_the_original_avi() {
        let files = vec![
            ArchiveFile {
                name: "C64GVA319-Rambo.avi".to_string(),
                format: Some("Cinepack".to_string()),
                source: Some("original".to_string()),
                size: Some("92777452".to_string()),
            },
            ArchiveFile {
                name: "C64GVA319-Rambo.mp4".to_string(),
                format: Some("h.264".to_string()),
                source: Some("derivative".to_string()),
                size: Some("34027721".to_string()),
            },
        ];

        let selected = select_archive_mp4(&files).unwrap();

        assert_eq!(selected.name, "C64GVA319-Rambo.mp4");
    }

    #[test]
    fn prefers_an_h264_archive_derivative_when_multiple_mp4_files_exist() {
        let files = vec![
            ArchiveFile {
                name: "Rambo_legacy.mp4".to_string(),
                format: Some("MPEG4".to_string()),
                source: Some("derivative".to_string()),
                size: Some("200".to_string()),
            },
            ArchiveFile {
                name: "Rambo_h264.mp4".to_string(),
                format: Some("h.264".to_string()),
                source: Some("derivative".to_string()),
                size: Some("300".to_string()),
            },
        ];

        assert_eq!(select_archive_mp4(&files).unwrap().name, "Rambo_h264.mp4");
    }

    #[test]
    fn derives_a_stable_archive_search_token_from_legacy_filenames() {
        assert_eq!(
            archive_search_token("C64Videoarchive108-SpaceTaxi"),
            "SpaceTaxi"
        );
        assert_eq!(archive_search_token("C64GVA319-Rambo"), "Rambo");
    }

    #[test]
    fn archive_search_pattern_keeps_the_capture_number_to_avoid_title_collisions() {
        assert_eq!(
            archive_search_pattern("C64Videoarchive108-SpaceTaxi"),
            "108*SpaceTaxi"
        );
        assert_eq!(archive_search_pattern("C64GVA319-Rambo"), "319*Rambo");
    }

    #[test]
    fn archive_download_is_only_offered_for_c64_gamevideoarchive_names() {
        assert!(is_c64_archive_candidate("C64Videoarchive108-SpaceTaxi"));
        assert!(is_c64_archive_candidate("c64gva319-rambo"));
        assert!(!is_c64_archive_candidate("Atari-Longplay-PacMan"));
    }

    #[test]
    fn conversion_writes_a_same_stem_mp4_without_targeting_the_original() {
        let source = Path::new("E:/Extras/Videos/Rambo.avi");

        let plan = build_conversion_plan(source).unwrap();

        assert!(plan.output.ends_with("Rambo.mp4"));
        assert!(plan.temporary.ends_with("Rambo.gbbox-converting.mp4"));
        assert_ne!(plan.output, source);
        assert!(plan.arguments.iter().any(|argument| argument == "libx264"));
        assert!(plan.arguments.iter().any(|argument| argument == "yuv420p"));
        assert!(plan.arguments.iter().any(|argument| argument == "aac"));
        assert!(plan
            .arguments
            .iter()
            .any(|argument| argument == "+faststart"));
    }

    #[test]
    fn archive_download_urls_percent_encode_identifiers_and_filenames() {
        let url = archive_download_url("C64 Example", "Video File_512kb.mp4").unwrap();

        assert_eq!(
            url.as_str(),
            "https://archive.org/download/C64%20Example/Video%20File_512kb.mp4"
        );
    }
}
