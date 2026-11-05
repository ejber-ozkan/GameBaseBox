# Exports every table of a GameBase .mdb to CSV (one file per table).
# Used by the app's MDB import on Windows (embedded via include_str! in
# src-tauri/src/database.rs) and by `npm run db:import` (scripts/db_pipeline.js).
# Any table that fails to export fails the whole run, so an import never proceeds
# with a partial set of tables.
param (
    [Parameter(Mandatory=$true)]
    [string]$DbPath,
    [Parameter(Mandatory=$true)]
    [string]$OutputDir
)

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
}

$connString = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=$DbPath;"
$conn = New-Object System.Data.OleDb.OleDbConnection($connString)

try {
    Write-Host "Opening MDB database..."
    $conn.Open()
    $schema = $conn.GetSchema("Tables")
    $tables = $schema | Where-Object { $_.TABLE_TYPE -eq "TABLE" } | Select-Object -ExpandProperty TABLE_NAME
    Write-Host "Found $($tables.Count) tables to export."

    foreach ($table in $tables) {
        Write-Host "Exporting $table..."
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT * FROM [$table]"
        $da = New-Object System.Data.OleDb.OleDbDataAdapter($cmd)
        $dt = New-Object System.Data.DataTable
        $da.Fill($dt) | Out-Null

        $outFile = Join-Path -Path $OutputDir -ChildPath "$table.csv"
        $dt | Export-Csv -Path $outFile -NoTypeInformation -Encoding UTF8
    }
    Write-Host "Export complete."
} catch {
    Write-Error "Failed to export MDB tables. Install the Microsoft Access Database Engine (32-bit PowerShell is needed for Jet 4.0) if needed.`n$($_.Exception.Message)"
    exit 1
} finally {
    if ($conn.State -eq "Open") {
        $conn.Close()
    }
}
