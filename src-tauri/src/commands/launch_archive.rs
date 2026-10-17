use std::collections::HashSet;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Clone, Copy)]
pub(super) struct ExtractionLimits {
    pub max_members: usize,
    pub max_file_bytes: u64,
    pub max_total_bytes: u64,
}

pub(super) const DEFAULT_EXTRACTION_LIMITS: ExtractionLimits = ExtractionLimits {
    // Permit large hard-drive/WHDLoad sets while bounding a complete launch attempt.
    max_members: 65_536,
    max_file_bytes: 8 * 1024 * 1024 * 1024,
    max_total_bytes: 16 * 1024 * 1024 * 1024,
};

pub(super) struct ExtractionSession {
    path: PathBuf,
    parent: PathBuf,
    limits: ExtractionLimits,
    members: usize,
    total_bytes: u64,
    file_names: HashSet<String>,
}

impl ExtractionSession {
    fn create(parent: &Path, limits: ExtractionLimits) -> Result<Self, String> {
        let canonical_parent = parent.canonicalize().map_err(|error| error.to_string())?;
        for attempt in 0..10 {
            let timestamp = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map_err(|error| error.to_string())?
                .as_nanos();
            let path = parent.join(format!(
                "GBBoxTemp-{}-{timestamp}-{attempt}",
                std::process::id()
            ));
            match std::fs::create_dir(&path) {
                Ok(()) => {
                    return Ok(Self {
                        path,
                        parent: canonical_parent,
                        limits,
                        members: 0,
                        total_bytes: 0,
                        file_names: HashSet::new(),
                    })
                }
                Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => continue,
                Err(error) => return Err(error.to_string()),
            }
        }
        Err("Failed to create a unique extraction directory".to_string())
    }

    #[cfg(test)]
    fn path(&self) -> &Path {
        &self.path
    }

    pub(super) fn extract_archive(
        &mut self,
        archive_path: &Path,
        extensions: &[&str],
    ) -> Result<Vec<PathBuf>, String> {
        let source = std::fs::File::open(archive_path).map_err(|error| error.to_string())?;
        let mut archive = zip::ZipArchive::new(source)
            .map_err(|error| format!("Invalid ZIP '{}': {error}", archive_path.display()))?;
        self.members = self
            .members
            .checked_add(archive.len())
            .ok_or("ZIP member limit exceeded")?;
        if self.members > self.limits.max_members {
            return Err("ZIP member limit exceeded".to_string());
        }
        let stem = archive_path
            .file_stem()
            .and_then(|stem| stem.to_str())
            .unwrap_or("archive");
        let directory = self.path.join(stem);
        let mut paths = Vec::new();
        for index in 0..archive.len() {
            let mut member = archive.by_index(index).map_err(|error| error.to_string())?;
            let path = directory.join(member.mangled_name());
            if member.name().ends_with('/') {
                std::fs::create_dir_all(&path).map_err(|error| error.to_string())?;
            } else {
                let normalized = path
                    .strip_prefix(&self.path)
                    .map_err(|error| error.to_string())?
                    .to_string_lossy()
                    .replace('\\', "/")
                    .to_lowercase();
                if !self.file_names.insert(normalized) {
                    return Err(format!("Duplicate ZIP output path: {}", path.display()));
                }
                if member.size() > self.limits.max_file_bytes {
                    return Err(format!("ZIP file byte limit exceeded: {}", member.name()));
                }
                if member.size() > self.limits.max_total_bytes.saturating_sub(self.total_bytes) {
                    return Err("ZIP total byte limit exceeded".to_string());
                }
                if let Some(parent) = path.parent() {
                    std::fs::create_dir_all(parent).map_err(|error| error.to_string())?;
                }
                let mut target = std::fs::OpenOptions::new()
                    .write(true)
                    .create_new(true)
                    .open(&path)
                    .map_err(|error| {
                        format!("Failed to create ZIP output '{}': {error}", path.display())
                    })?;
                copy_bounded(
                    &mut member,
                    &mut target,
                    self.limits.max_file_bytes,
                    &mut self.total_bytes,
                    self.limits.max_total_bytes,
                )
                .map_err(|error| {
                    format!("Failed to extract ZIP member '{}': {error}", path.display())
                })?;
                if path
                    .extension()
                    .and_then(|ext| ext.to_str())
                    .is_some_and(|ext| extensions.contains(&ext.to_lowercase().as_str()))
                {
                    paths.push(path);
                }
            }
        }
        Ok(paths)
    }
}

fn copy_bounded(
    reader: &mut impl Read,
    writer: &mut impl Write,
    file_limit: u64,
    total: &mut u64,
    total_limit: u64,
) -> Result<u64, String> {
    let mut buffer = [0_u8; 64 * 1024];
    let mut copied = 0_u64;
    loop {
        let remaining = file_limit
            .saturating_sub(copied)
            .min(total_limit.saturating_sub(*total));
        let read_limit = remaining.saturating_add(1).min(buffer.len() as u64) as usize;
        let count = reader
            .read(&mut buffer[..read_limit])
            .map_err(|error| error.to_string())?;
        if count == 0 {
            break;
        }
        if count as u64 > file_limit.saturating_sub(copied) {
            return Err("ZIP file byte limit exceeded".to_string());
        }
        if count as u64 > total_limit.saturating_sub(*total) {
            return Err("ZIP total byte limit exceeded".to_string());
        }
        writer
            .write_all(&buffer[..count])
            .map_err(|error| error.to_string())?;
        copied += count as u64;
        *total += count as u64;
    }
    writer.flush().map_err(|error| error.to_string())?;
    Ok(copied)
}

fn cleanup_owned_directory(
    path: &Path,
    parent: &Path,
    remove: impl FnOnce(&Path) -> std::io::Result<()>,
) -> Result<(), String> {
    let target = path.canonicalize().map_err(|error| error.to_string())?;
    let parent = parent.canonicalize().map_err(|error| error.to_string())?;
    if target.parent() != Some(parent.as_path())
        || std::fs::symlink_metadata(path)
            .map_err(|error| error.to_string())?
            .file_type()
            .is_symlink()
    {
        return Err(format!(
            "Refusing to clean an unowned extraction path: {}",
            path.display()
        ));
    }
    remove(path).map_err(|error| {
        format!(
            "Failed to clean extraction directory '{}': {error}",
            path.display()
        )
    })
}

fn finish_extraction<T>(
    session: ExtractionSession,
    result: Result<T, String>,
    remove: impl FnOnce(&Path) -> std::io::Result<()>,
) -> Result<(PathBuf, T), String> {
    match result {
        Ok(value) => Ok((session.path, value)),
        Err(error) => match cleanup_owned_directory(&session.path, &session.parent, remove) {
            Ok(()) => Err(error),
            Err(cleanup_error) => Err(format!("{error}; {cleanup_error}")),
        },
    }
}

pub(super) fn with_extraction_session<T>(
    parent: &Path,
    limits: ExtractionLimits,
    extract: impl FnOnce(&mut ExtractionSession) -> Result<T, String>,
) -> Result<(PathBuf, T), String> {
    let mut session = ExtractionSession::create(parent, limits)?;
    let result = extract(&mut session);
    finish_extraction(session, result, |path| std::fs::remove_dir_all(path))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{Cursor, Write};
    use std::path::{Path, PathBuf};
    use tempfile::tempdir;
    use zip::write::FileOptions;

    fn write_zip(path: &Path, files: &[(&str, &[u8])]) {
        let mut writer = zip::ZipWriter::new(std::fs::File::create(path).unwrap());
        for (name, bytes) in files {
            writer.start_file(*name, FileOptions::default()).unwrap();
            writer.write_all(bytes).unwrap();
        }
        writer.finish().unwrap();
    }

    fn small_limits() -> ExtractionLimits {
        ExtractionLimits {
            max_members: 2,
            max_file_bytes: 4,
            max_total_bytes: 6,
        }
    }

    fn session_directories(parent: &Path) -> Vec<PathBuf> {
        std::fs::read_dir(parent)
            .unwrap()
            .map(|entry| entry.unwrap().path())
            .filter(|path| {
                path.file_name()
                    .unwrap()
                    .to_string_lossy()
                    .starts_with("GBBoxTemp-")
            })
            .collect()
    }

    #[test]
    fn extraction_accepts_exact_limits_and_preserves_successful_writable_files() {
        let parent = tempdir().unwrap();
        let zip = parent.path().join("game.zip");
        write_zip(&zip, &[("nested/disk1.d64", b"1234"), ("disk2.d64", b"56")]);
        let (root, paths) = with_extraction_session(parent.path(), small_limits(), |session| {
            session.extract_archive(&zip, &["d64"])
        })
        .unwrap();
        assert_eq!(paths.len(), 2);
        assert!(paths.iter().all(|path| path.starts_with(&root)));
        assert_eq!(std::fs::read(&paths[0]).unwrap(), b"1234");
        std::fs::write(&paths[1], b"saved game").unwrap();
        assert_eq!(std::fs::read(&paths[1]).unwrap(), b"saved game");
        assert!(root.exists());
    }

    #[test]
    fn extraction_rejects_excess_members_without_touching_preexisting_directories() {
        let parent = tempdir().unwrap();
        let existing = parent.path().join("GBBoxTemp-preexisting");
        std::fs::create_dir(&existing).unwrap();
        std::fs::write(existing.join("save"), b"keep").unwrap();
        let zip = parent.path().join("game.zip");
        write_zip(
            &zip,
            &[("one.d64", b"1"), ("two.d64", b"2"), ("three.d64", b"3")],
        );
        let error = with_extraction_session(parent.path(), small_limits(), |session| {
            session.extract_archive(&zip, &["d64"])
        })
        .unwrap_err();
        assert!(error.contains("member limit"), "{error}");
        assert_eq!(session_directories(parent.path()), vec![existing.clone()]);
        assert_eq!(std::fs::read(existing.join("save")).unwrap(), b"keep");
    }

    #[test]
    fn extraction_rejects_per_file_bytes_and_cleans_only_its_attempt() {
        let parent = tempdir().unwrap();
        let zip = parent.path().join("game.zip");
        write_zip(&zip, &[("disk.d64", b"12345")]);
        let error = with_extraction_session(parent.path(), small_limits(), |session| {
            session.extract_archive(&zip, &["d64"])
        })
        .unwrap_err();
        assert!(error.contains("file byte limit"), "{error}");
        assert!(session_directories(parent.path()).is_empty());
        assert!(zip.exists());
    }

    #[test]
    fn extraction_shares_total_bytes_and_member_budget_with_companion_archives() {
        for (disk, expected) in [
            (b"56".as_slice(), None),
            (b"567".as_slice(), Some("total byte limit")),
        ] {
            let parent = tempdir().unwrap();
            let tape = parent.path().join("tape.zip");
            let companion = parent.path().join("companion.zip");
            write_zip(&tape, &[("tape.uef", b"1234")]);
            write_zip(&companion, &[("disk.ssd", disk)]);
            let result = with_extraction_session(parent.path(), small_limits(), |session| {
                let mut paths = session.extract_archive(&tape, &["uef"])?;
                paths.extend(session.extract_archive(&companion, &["ssd"])?);
                Ok(paths)
            });
            match expected {
                Some(message) => {
                    assert!(result.unwrap_err().contains(message));
                    assert!(session_directories(parent.path()).is_empty());
                }
                None => assert_eq!(result.unwrap().1.len(), 2),
            }
        }
    }

    #[test]
    fn extraction_cleans_partial_primary_files_when_a_companion_is_malformed() {
        let parent = tempdir().unwrap();
        let primary = parent.path().join("primary.zip");
        let companion = parent.path().join("bad.zip");
        write_zip(&primary, &[("disk.d64", b"1234")]);
        std::fs::write(&companion, b"invalid zip").unwrap();
        let result = with_extraction_session(parent.path(), small_limits(), |session| {
            session.extract_archive(&primary, &["d64"])?;
            session.extract_archive(&companion, &["d64"])
        });
        assert!(result.unwrap_err().contains("ZIP"));
        assert!(session_directories(parent.path()).is_empty());
        assert!(primary.exists() && companion.exists());
    }

    #[test]
    fn extraction_rejects_duplicate_normalized_file_names() {
        for (first, second) in [
            ("disk.d64", "disk.d64"),
            ("../disk.d64", "disk.d64"),
            ("Disk.d64", "disk.d64"),
        ] {
            let parent = tempdir().unwrap();
            let zip = parent.path().join("duplicate.zip");
            write_zip(&zip, &[(first, b"1"), (second, b"2")]);
            let error = with_extraction_session(parent.path(), small_limits(), |session| {
                session.extract_archive(&zip, &["d64"])
            })
            .unwrap_err();
            assert!(error.contains("Duplicate"), "{error}");
            assert!(session_directories(parent.path()).is_empty());
        }
    }

    #[test]
    fn extraction_keeps_mangled_traversal_names_inside_the_owned_tree() {
        let parent = tempdir().unwrap();
        let zip = parent.path().join("paths.zip");
        let outside = parent.path().join("disk.d64");
        std::fs::write(&outside, b"keep").unwrap();
        write_zip(&zip, &[("../../disk.d64", b"1234")]);
        let (root, paths) = with_extraction_session(parent.path(), small_limits(), |session| {
            session.extract_archive(&zip, &["d64"])
        })
        .unwrap();
        assert!(paths[0]
            .canonicalize()
            .unwrap()
            .starts_with(root.canonicalize().unwrap()));
        assert_eq!(std::fs::read(outside).unwrap(), b"keep");
    }

    #[test]
    fn streamed_copy_enforces_real_bytes_including_boundary_equality() {
        let mut total = 0;
        let mut output = Vec::new();
        assert_eq!(
            copy_bounded(&mut Cursor::new(b"1234"), &mut output, 4, &mut total, 6).unwrap(),
            4
        );
        assert_eq!(total, 4);
        let error =
            copy_bounded(&mut Cursor::new(b"567"), &mut Vec::new(), 4, &mut total, 6).unwrap_err();
        assert!(error.contains("total byte limit"));
        let error =
            copy_bounded(&mut Cursor::new(b"12345"), &mut Vec::new(), 4, &mut 0, 100).unwrap_err();
        assert!(error.contains("file byte limit"));
    }

    #[test]
    fn cleanup_errors_preserve_the_extraction_error_and_owned_path() {
        let parent = tempdir().unwrap();
        let session = ExtractionSession::create(parent.path(), small_limits()).unwrap();
        let root = session.path().to_path_buf();
        let error = finish_extraction(session, Err::<(), _>("malformed ZIP".to_string()), |_| {
            Err(std::io::Error::new(
                std::io::ErrorKind::PermissionDenied,
                "cleanup denied",
            ))
        })
        .unwrap_err();
        assert!(error.contains("malformed ZIP") && error.contains("cleanup denied"));
        assert!(error.contains(&root.display().to_string()));
        assert!(root.exists());
    }

    #[test]
    fn cleanup_refuses_a_parent_or_unrelated_directory_before_removing_anything() {
        let parent = tempdir().unwrap();
        let outside = tempdir().unwrap();
        for path in [parent.path(), outside.path()] {
            assert!(
                cleanup_owned_directory(path, parent.path(), |_| panic!("must not delete"))
                    .is_err()
            );
            assert!(path.exists());
        }
    }

    #[test]
    fn extraction_member_limit_is_shared_across_archives() {
        let parent = tempdir().unwrap();
        let archives: Vec<_> = (0..3)
            .map(|index| {
                let path = parent.path().join(format!("disk{index}.zip"));
                write_zip(&path, &[("disk.d64", b"1")]);
                path
            })
            .collect();
        let result = with_extraction_session(parent.path(), small_limits(), |session| {
            for archive in &archives {
                session.extract_archive(archive, &["d64"])?;
            }
            Ok(())
        });
        assert!(result.unwrap_err().contains("member limit"));
        assert!(session_directories(parent.path()).is_empty());
    }

    #[test]
    fn extraction_cleans_a_corrupt_member_with_a_valid_zip_directory() {
        let parent = tempdir().unwrap();
        let zip = parent.path().join("corrupt.zip");
        write_zip(&zip, &[("disk.d64", b"1234")]);
        let mut bytes = std::fs::read(&zip).unwrap();
        let central = bytes
            .windows(4)
            .position(|window| window == b"PK\x01\x02")
            .unwrap();
        bytes[central + 16] ^= 0xff;
        std::fs::write(&zip, bytes).unwrap();
        let error = with_extraction_session(parent.path(), small_limits(), |session| {
            session.extract_archive(&zip, &["d64"])
        })
        .unwrap_err();
        assert!(error.contains("ZIP"));
        assert!(session_directories(parent.path()).is_empty());
    }

    #[test]
    fn failed_directory_creation_preserves_preexisting_files() {
        let parent = tempdir().unwrap();
        let existing = parent.path().join("not-a-directory");
        std::fs::write(&existing, b"keep").unwrap();
        let result =
            with_extraction_session(&existing, small_limits(), |_| -> Result<(), String> {
                panic!("must not extract")
            });
        assert!(result.is_err());
        assert_eq!(std::fs::read(existing).unwrap(), b"keep");
    }

    #[test]
    fn default_limits_accept_generated_multidisk_and_nested_supported_media() {
        let parent = tempdir().unwrap();
        let zip = parent.path().join("supported.zip");
        let c64 = vec![0_u8; 174_848];
        let apple = vec![0_u8; 819_200];
        let atari = vec![0_u8; 737_280];
        write_zip(
            &zip,
            &[
                ("Disk 1.d64", &c64),
                ("Disk 2.d64", &c64),
                ("Apple.2mg", &apple),
                ("Atari.st", &atari),
                ("WHDLoad/Game.slave", b"fixture"),
                ("WHDLoad/data/file", b"fixture"),
            ],
        );
        let (root, files) =
            with_extraction_session(parent.path(), DEFAULT_EXTRACTION_LIMITS, |session| {
                session.extract_archive(&zip, &["d64", "2mg", "st", "slave"])
            })
            .unwrap();
        assert_eq!(files.len(), 5);
        assert_eq!(
            std::fs::metadata(root.join("supported/WHDLoad/data/file"))
                .unwrap()
                .len(),
            7
        );
    }
}
