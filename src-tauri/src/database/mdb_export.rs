use std::collections::HashSet;
use std::ffi::OsString;
use std::fs::{self, File, OpenOptions};
use std::io::{BufReader, BufWriter, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

#[derive(Debug)]
struct MdbTools {
    tables: PathBuf,
    export: PathBuf,
}

impl MdbTools {
    fn discover_in(
        explicit: Option<&Path>,
        path: &[PathBuf],
        fallback: &[PathBuf],
    ) -> Result<Self, String> {
        let directories = match explicit {
            Some(directory) => vec![directory.to_path_buf()],
            None => path.iter().chain(fallback).cloned().collect(),
        };
        let find = |name: &str| {
            directories
                .iter()
                .map(|directory| directory.join(name))
                .find(|candidate| {
                    if !candidate.is_file() {
                        return false;
                    }
                    #[cfg(unix)]
                    {
                        use std::os::unix::fs::PermissionsExt;
                        candidate
                            .metadata()
                            .is_ok_and(|metadata| metadata.permissions().mode() & 0o111 != 0)
                    }
                    #[cfg(not(unix))]
                    {
                        true
                    }
                })
        };
        match (find("mdb-tables"), find("mdb-export")) {
            (Some(tables), Some(export)) => Ok(Self { tables, export }),
            _ => Err("MDB import requires mdbtools (mdb-tables and mdb-export). Install mdbtools with your package manager, or set GAMEBASEBOX_MDBTOOLS_DIR to the folder containing both tools, then restart GameBaseBox. Common Homebrew and MacPorts locations are checked automatically.".to_string()),
        }
    }

    fn discover() -> Result<Self, String> {
        let explicit = std::env::var_os("GAMEBASEBOX_MDBTOOLS_DIR")
            .filter(|value| !value.is_empty())
            .map(PathBuf::from);
        let path = std::env::var_os("PATH")
            .map(|value| std::env::split_paths(&value).collect::<Vec<_>>())
            .unwrap_or_default();
        let fallback: Vec<_> = [
            "/opt/homebrew/bin",
            "/usr/local/bin",
            "/opt/local/bin",
            "/usr/bin",
            "/bin",
        ]
        .into_iter()
        .map(PathBuf::from)
        .collect();
        Self::discover_in(explicit.as_deref(), &path, &fallback)
    }
}

struct CommandOutput {
    success: bool,
    stdout: Vec<u8>,
    stderr: Vec<u8>,
}

trait CommandRunner {
    fn run(
        &mut self,
        program: &Path,
        args: &[OsString],
        destination: Option<&Path>,
    ) -> Result<CommandOutput, String>;
}

struct ProcessRunner;
impl CommandRunner for ProcessRunner {
    fn run(
        &mut self,
        program: &Path,
        args: &[OsString],
        destination: Option<&Path>,
    ) -> Result<CommandOutput, String> {
        let mut command = Command::new(program);
        command.args(args).env("MDBICONV", "UTF-8");
        if let Some(destination) = destination {
            let file = OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(destination)
                .map_err(|error| error.to_string())?;
            command.stdout(Stdio::from(file));
        }
        let output = command.output().map_err(|error| {
            format!(
                "Could not run '{}': {error}. Check that mdbtools is installed and executable.",
                program.display()
            )
        })?;
        Ok(CommandOutput {
            success: output.status.success(),
            stdout: output.stdout,
            stderr: output.stderr,
        })
    }
}

fn check_output(program: &Path, output: &CommandOutput) -> Result<(), String> {
    let stderr = String::from_utf8_lossy(&output.stderr);
    if !output.success || stderr.to_ascii_lowercase().contains("truncat") {
        return Err(format!(
            "MDB export failed using '{}': {}. Check the MDB file and your mdbtools installation.",
            program.display(),
            stderr.trim()
        ));
    }
    Ok(())
}

fn write_csv_record(writer: &mut impl Write, values: &[String]) -> Result<(), String> {
    for (index, value) in values.iter().enumerate() {
        if index > 0 {
            writer.write_all(b",").map_err(|error| error.to_string())?;
        }
        write!(writer, "\"{}\"", value.replace('"', "\"\"")).map_err(|error| error.to_string())?;
    }
    writer.write_all(b"\n").map_err(|error| error.to_string())
}

fn normalize_game_value(table: &str, header: &str, value: String) -> String {
    if !table.eq_ignore_ascii_case("Games") {
        return value;
    }
    let lower = value.to_ascii_lowercase();
    let boolean = match lower.as_str() {
        "true" | "1" => Some(true),
        "false" | "0" => Some(false),
        _ => None,
    };
    let Some(boolean) = boolean else {
        return value;
    };
    if header.eq_ignore_ascii_case("Classic") || header.eq_ignore_ascii_case("Adult") {
        return if boolean { "True" } else { "False" }.to_string();
    }
    if [
        "V_TrueDriveEmu",
        "V_LoadingScreen",
        "V_HighScoreSaver",
        "V_IncludedDocs",
    ]
    .iter()
    .any(|column| header.eq_ignore_ascii_case(column))
    {
        return if boolean { "1" } else { "0" }.to_string();
    }
    value
}

fn normalize_csv(
    table: &str,
    source: &Path,
    destination: &Path,
    cancelled: &mut impl FnMut() -> Result<(), String>,
) -> Result<(), String> {
    let mut reader = BufReader::new(File::open(source).map_err(|error| error.to_string())?);
    let header =
        super::read_csv_record(&mut reader, source)?.ok_or("MDB export produced no CSV header")?;
    let headers: Vec<_> = super::parse_csv_line(&header)
        .into_iter()
        .map(|header| header.trim().trim_start_matches('\u{feff}').to_string())
        .collect();
    for header in &headers {
        super::validate_identifier(header)?;
    }
    let mut writer = BufWriter::new(
        OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(destination)
            .map_err(|error| error.to_string())?,
    );
    write_csv_record(&mut writer, &headers)?;
    loop {
        cancelled()?;
        let Some(record) = super::read_csv_record(&mut reader, source)? else {
            break;
        };
        let values = super::parse_csv_line(&record);
        if values.len() != headers.len() {
            return Err(format!("Malformed CSV exported from MDB table '{table}': column count does not match the header"));
        }
        let values: Vec<_> = headers
            .iter()
            .zip(values)
            .map(|(header, value)| normalize_game_value(table, header, value))
            .collect();
        write_csv_record(&mut writer, &values)?;
    }
    writer.flush().map_err(|error| error.to_string())
}

fn export_with_runner(
    mdb: &Path,
    directory: &Path,
    tools: &MdbTools,
    runner: &mut impl CommandRunner,
    cancelled: &mut impl FnMut() -> Result<(), String>,
) -> Result<usize, String> {
    cancelled()?;
    let mdb = if mdb.is_absolute() {
        mdb.to_path_buf()
    } else {
        std::env::current_dir()
            .map_err(|error| error.to_string())?
            .join(mdb)
    };
    let listed = runner.run(
        &tools.tables,
        &[
            OsString::from("-1"),
            OsString::from("--"),
            mdb.as_os_str().to_os_string(),
        ],
        None,
    )?;
    check_output(&tools.tables, &listed)?;
    let tables = String::from_utf8(listed.stdout)
        .map_err(|_| "mdb-tables did not return UTF-8 table names".to_string())?;
    let mut names = HashSet::new();
    let mut exports = Vec::new();
    for table in tables.lines().filter(|table| !table.is_empty()) {
        if table.chars().any(char::is_control) {
            return Err(
                "MDB contains an unsupported control character in a table name".to_string(),
            );
        }
        let file_name = super::sanitize_identifier(table);
        super::validate_identifier(&file_name)?;
        if !names.insert(file_name.to_ascii_lowercase()) {
            return Err(format!(
                "MDB table names collide after filename normalization: {table}"
            ));
        }
        exports.push((table.to_string(), file_name));
    }
    if exports.is_empty() {
        return Err("No tables were found in the MDB".to_string());
    }
    for (table, file_name) in &exports {
        cancelled()?;
        let raw = directory.join(format!("{file_name}.csv.raw"));
        let args = vec![
            OsString::from("--boolean-words"),
            OsString::from("--bin=hex"),
            OsString::from("--"),
            mdb.as_os_str().to_os_string(),
            OsString::from(table),
        ];
        let output = runner.run(&tools.export, &args, Some(&raw))?;
        check_output(&tools.export, &output)?;
        normalize_csv(
            table,
            &raw,
            &directory.join(format!("{file_name}.csv")),
            cancelled,
        )?;
        fs::remove_file(raw).map_err(|error| error.to_string())?;
    }
    Ok(exports.len())
}

pub(super) fn export_mdb_to_csv(
    mdb: &Path,
    directory: &Path,
    cancelled: &mut impl FnMut() -> Result<(), String>,
) -> Result<usize, String> {
    let tools = MdbTools::discover()?;
    export_with_runner(mdb, directory, &tools, &mut ProcessRunner, cancelled)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::VecDeque;
    use tempfile::tempdir;

    fn make_tools(directory: &Path) {
        std::fs::create_dir_all(directory).unwrap();
        for name in ["mdb-tables", "mdb-export"] {
            let path = directory.join(name);
            std::fs::write(&path, b"fixture").unwrap();
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o755)).unwrap();
            }
        }
    }

    #[test]
    fn discovery_uses_explicit_directory_and_finder_fallback_without_a_shell_path() {
        let parent = tempdir().unwrap();
        let bin = parent.path().join("tools with spaces");
        make_tools(&bin);
        let explicit = MdbTools::discover_in(Some(&bin), &[], &[]).unwrap();
        assert_eq!(explicit.tables, bin.join("mdb-tables"));
        let finder = MdbTools::discover_in(None, &[], &[bin.clone()]).unwrap();
        assert_eq!(finder.export, bin.join("mdb-export"));
    }

    #[test]
    fn discovery_reports_both_prerequisites_and_does_not_ignore_a_bad_override() {
        let parent = tempdir().unwrap();
        let fallback = parent.path().join("fallback");
        make_tools(&fallback);
        let error = MdbTools::discover_in(Some(&parent.path().join("missing")), &[], &[fallback])
            .unwrap_err();
        assert!(error.contains("mdb-tables") && error.contains("mdb-export"));
        assert!(error.contains("GAMEBASEBOX_MDBTOOLS_DIR"));
    }

    struct FakeRunner {
        outputs: VecDeque<CommandOutput>,
        calls: Vec<(PathBuf, Vec<OsString>, Option<PathBuf>)>,
    }

    impl CommandRunner for FakeRunner {
        fn run(
            &mut self,
            program: &Path,
            args: &[OsString],
            destination: Option<&Path>,
        ) -> Result<CommandOutput, String> {
            self.calls.push((
                program.to_path_buf(),
                args.to_vec(),
                destination.map(Path::to_path_buf),
            ));
            let mut output = self.outputs.pop_front().expect("unexpected command");
            if let Some(destination) = destination {
                std::fs::write(destination, &output.stdout).unwrap();
                output.stdout.clear();
            }
            Ok(output)
        }
    }

    fn output(bytes: &[u8]) -> CommandOutput {
        CommandOutput {
            success: true,
            stdout: bytes.to_vec(),
            stderr: Vec::new(),
        }
    }

    fn fixture_tools() -> MdbTools {
        MdbTools {
            tables: PathBuf::from("/tools/mdb-tables"),
            export: PathBuf::from("/tools/mdb-export"),
        }
    }

    #[test]
    fn export_passes_separate_arguments_and_preserves_unicode_quotes_multiline_and_boolean_values()
    {
        let parent = tempdir().unwrap();
        let source = parent.path().join("Śródło ; $(name).mdb");
        std::fs::write(&source, b"fixture").unwrap();
        let csv = parent.path().join("csv");
        std::fs::create_dir(&csv).unwrap();
        let mut runner = FakeRunner {
            outputs: VecDeque::from([
                output(b"Games\nPublisher's Notes\n"),
                output("GA_Id,Name,Classic,Adult,V_TrueDriveEmu,MemoText\n1,\"Świat, \"\"Hello\"\"\",TRUE,FALSE,TRUE,\"first line\nsecond line\"\n".as_bytes()),
                output("Name\n\"Éditeur\"\n".as_bytes()),
            ]), calls: Vec::new(),
        };
        assert_eq!(
            export_with_runner(&source, &csv, &fixture_tools(), &mut runner, &mut || Ok(()))
                .unwrap(),
            2
        );
        assert_eq!(
            runner.calls[0].1,
            vec![
                OsString::from("-1"),
                OsString::from("--"),
                source.as_os_str().to_os_string()
            ]
        );
        let export_args = &runner.calls[2].1;
        assert_eq!(export_args[export_args.len() - 2], source.as_os_str());
        assert_eq!(export_args.last().unwrap(), "Publisher's Notes");
        assert!(export_args.iter().any(|arg| arg == "--boolean-words"));
        assert_eq!(std::fs::read_to_string(csv.join("Games.csv")).unwrap(), "\"GA_Id\",\"Name\",\"Classic\",\"Adult\",\"V_TrueDriveEmu\",\"MemoText\"\n\"1\",\"Świat, \"\"Hello\"\"\",\"True\",\"False\",\"1\",\"first line\nsecond line\"\n");
        assert!(std::fs::read_to_string(csv.join("Publisher_s_Notes.csv"))
            .unwrap()
            .contains("Éditeur"));
    }

    #[test]
    fn export_rejects_colliding_or_control_character_table_names_before_exporting() {
        let parent = tempdir().unwrap();
        for tables in [b"A B\nA-B\n".as_slice(), b"Bad\0Table\n".as_slice()] {
            let mut runner = FakeRunner {
                outputs: VecDeque::from([output(tables)]),
                calls: Vec::new(),
            };
            assert!(export_with_runner(
                Path::new("fixture.mdb"),
                parent.path(),
                &fixture_tools(),
                &mut runner,
                &mut || Ok(())
            )
            .is_err());
            assert_eq!(runner.calls.len(), 1);
            assert_eq!(std::fs::read_dir(parent.path()).unwrap().count(), 0);
        }
    }

    #[test]
    fn export_cancellation_stops_before_the_next_table() {
        let parent = tempdir().unwrap();
        let mut runner = FakeRunner {
            outputs: VecDeque::from([output(b"Games\nNotes\n"), output(b"GA_Id\n1\n")]),
            calls: Vec::new(),
        };
        // The checker is independent of the runner, like the application's job token.
        let checks = std::cell::Cell::new(0);
        let mut cancelled = || {
            checks.set(checks.get() + 1);
            if checks.get() >= 3 {
                Err("cancelled".to_string())
            } else {
                Ok(())
            }
        };
        let error = export_with_runner(
            Path::new("fixture.mdb"),
            parent.path(),
            &fixture_tools(),
            &mut runner,
            &mut cancelled,
        )
        .unwrap_err();
        assert!(error.contains("cancelled"));
        assert!(runner.calls.len() <= 2);
    }

    #[test]
    fn export_reports_tool_failure_and_rejects_truncated_output() {
        let parent = tempdir().unwrap();
        for failure in [
            CommandOutput {
                success: false,
                stdout: Vec::new(),
                stderr: b"invalid MDB".to_vec(),
            },
            CommandOutput {
                success: true,
                stdout: Vec::new(),
                stderr: b"Warning: value was truncated".to_vec(),
            },
        ] {
            let mut runner = FakeRunner {
                outputs: VecDeque::from([failure]),
                calls: Vec::new(),
            };
            let error = export_with_runner(
                Path::new("fixture.mdb"),
                parent.path(),
                &fixture_tools(),
                &mut runner,
                &mut || Ok(()),
            )
            .unwrap_err();
            assert!(error.contains("invalid MDB") || error.contains("truncated"));
        }
    }

    #[test]
    fn export_rejects_malformed_csv_and_non_utf8_table_names() {
        let parent = tempdir().unwrap();
        let mut invalid_names = FakeRunner {
            outputs: VecDeque::from([output(&[0xff])]),
            calls: Vec::new(),
        };
        assert!(export_with_runner(
            Path::new("fixture.mdb"),
            parent.path(),
            &fixture_tools(),
            &mut invalid_names,
            &mut || Ok(())
        )
        .unwrap_err()
        .contains("UTF-8"));
        let mut malformed_csv = FakeRunner {
            outputs: VecDeque::from([
                output(b"Games\n"),
                output(b"GA_Id,Name\n1,Name,unexpected\n"),
            ]),
            calls: Vec::new(),
        };
        assert!(export_with_runner(
            Path::new("fixture.mdb"),
            parent.path(),
            &fixture_tools(),
            &mut malformed_csv,
            &mut || Ok(())
        )
        .unwrap_err()
        .contains("column count"));
    }

    #[test]
    fn boolean_normalization_does_not_change_text_or_other_tables() {
        assert_eq!(
            normalize_game_value("Games", "Name", "TRUE".to_string()),
            "TRUE"
        );
        assert_eq!(
            normalize_game_value("Notes", "Classic", "TRUE".to_string()),
            "TRUE"
        );
        assert_eq!(
            normalize_game_value("Games", "Classic", "1".to_string()),
            "True"
        );
        assert_eq!(
            normalize_game_value("Games", "Adult", "0".to_string()),
            "False"
        );
    }
}
