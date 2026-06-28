const path = require("path");
const fs = require("fs");
const readline = require("readline");
const { spawnSync } = require("child_process");

const { getPlatformImportConfig } = require("./sqlite_support_config");

function hasFlag(flag, argv = process.argv) {
  return argv.includes(flag);
}

function getArgValue(flag, argv = process.argv) {
  const index = argv.indexOf(flag);
  if (index === -1 || index === argv.length - 1) {
    return undefined;
  }

  return argv[index + 1];
}

function resolvePathValue(value, fallbackPath) {
  return path.resolve(value || fallbackPath);
}

function resolvePipelineConfig({
  argv = process.argv,
  env = process.env,
  projectRoot = path.resolve(__dirname, ".."),
} = {}) {
  const platformId = getArgValue("--platform", argv) || env.GAMEBASE_PLATFORM_ID || "c64";
  const platformConfig = getPlatformImportConfig(platformId);
  const exportDirName = platformId === "c64" ? "gb64_export" : `${platformId}_export`;
  const dbFileName = platformId === "c64" ? "gb64.sqlite" : `${platformId}.sqlite`;

  return {
    platformId,
    platformConfig,
    mdbPath: resolvePathValue(
      getArgValue("--mdb", argv) || env.GB64_MDB_PATH || env.GAMEBASE_MDB_PATH,
      platformConfig.referenceMdbPath || path.join(projectRoot, platformConfig.sourceMdbName || "GBC_v19.mdb")
    ),
    exportDir: resolvePathValue(
      getArgValue("--export-dir", argv) || env.GB64_EXPORT_DIR || env.GAMEBASE_EXPORT_DIR,
      path.join(projectRoot, exportDirName)
    ),
    dbPath: resolvePathValue(
      getArgValue("--db", argv) || env.GB64_SQLITE_PATH || env.GAMEBASE_SQLITE_PATH,
      path.join(projectRoot, dbFileName)
    ),
    auditOnly: hasFlag("--audit-only", argv),
    skipExport: hasFlag("--skip-export", argv),
    skipImport: hasFlag("--skip-import", argv),
    yes: hasFlag("--yes", argv),
  };
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === "number" && result.status !== 0) {
    throw new Error(`${command} exited with code ${result.status}`);
  }
}

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function confirmProceed({ platformId, mdbPath, exportDir, dbPath, yes }) {
  if (yes) {
    return true;
  }

  console.log("WARNING: This pipeline re-exports the MDB, rewrites imported GameBase tables, rebuilds GameView, recreates GameCoverIndex, rebuilds GameSearchIndex, and reruns SQLite optimization.");
  console.log(`Platform: ${platformId}`);
  console.log(`MDB source: ${mdbPath}`);
  console.log(`CSV export dir: ${exportDir}`);
  console.log(`SQLite target: ${dbPath}`);
  const answer = await prompt("Proceed with export/import and index optimization? Type YES to continue: ");
  return answer === "YES";
}

function runWindowsExport(mdbPath, exportDir) {
  const powershellPath = path.join(
    process.env.SystemRoot || "C:\\Windows",
    "SysWOW64",
    "WindowsPowerShell",
    "v1.0",
    "powershell.exe"
  );

  if (!fs.existsSync(powershellPath)) {
    throw new Error(`32-bit PowerShell was not found at ${powershellPath}`);
  }

  runCommand(powershellPath, [
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    path.join(__dirname, "exportMdb.ps1"),
    "-DbPath",
    mdbPath,
    "-OutputDir",
    exportDir,
  ]);
}

function runUnixExport(mdbPath, exportDir) {
  runCommand("bash", [path.join(__dirname, "mdb-export-all.sh"), mdbPath, exportDir]);
}

function buildConvertArgs(exportDir, dbPath, platformId) {
  return [
    path.join(__dirname, "convert_csv_to_sqlite.js"),
    "--input-dir",
    exportDir,
    "--db",
    dbPath,
    "--platform",
    platformId,
  ];
}

function runConvert(exportDir, dbPath, platformId) {
  runCommand("node", buildConvertArgs(exportDir, dbPath, platformId));
}

function buildAuditArgs(dbPath, platformId) {
  return [
    path.join(__dirname, "check_sqlite_support.js"),
    "--db",
    dbPath,
    "--platform",
    platformId,
  ];
}

function runAudit(dbPath, platformId) {
  runCommand("node", buildAuditArgs(dbPath, platformId));
}

async function main(argv = process.argv, env = process.env) {
  const config = resolvePipelineConfig({ argv, env });

  if (!(await confirmProceed(config))) {
    console.log("Aborted.");
    process.exit(1);
  }

  if (config.auditOnly) {
    runAudit(config.dbPath, config.platformId);
    return;
  }

  if (!config.skipExport) {
    if (!fs.existsSync(config.mdbPath)) {
      throw new Error(`MDB file not found at ${config.mdbPath}`);
    }

    console.log("[1/3] Exporting MDB to CSV...");
    if (process.platform === "win32") {
      runWindowsExport(config.mdbPath, config.exportDir);
    } else {
      runUnixExport(config.mdbPath, config.exportDir);
    }
  } else {
    console.log("[1/3] Skipping MDB export.");
  }

  if (!config.skipImport) {
    console.log("[2/3] Converting CSV export to optimized SQLite...");
    runConvert(config.exportDir, config.dbPath, config.platformId);
  } else {
    console.log("[2/3] Skipping SQLite import.");
  }

  console.log("[3/3] Auditing expected SQLite indexes and support objects...");
  runAudit(config.dbPath, config.platformId);
  console.log("Database export/import pipeline completed successfully.");
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[ERROR] ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  buildAuditArgs,
  buildConvertArgs,
  getArgValue,
  hasFlag,
  resolvePipelineConfig,
  runAudit,
  runConvert,
};
