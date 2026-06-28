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
    Write-Host "Opening MDB Database..."
    $conn.Open()
    
    # Get all tables from schema
    $schema = $conn.GetSchema("Tables")
    $tables = $schema | Where-Object { $_.TABLE_TYPE -eq "TABLE" } | Select-Object -ExpandProperty TABLE_NAME
    
    Write-Host "Found $($tables.Count) tables to export."

    foreach ($table in $tables) {
        Write-Host "Exporting $table..."
        try {
            $cmd = $conn.CreateCommand()
            $cmd.CommandText = "SELECT * FROM [$table]"
            $da = New-Object System.Data.OleDb.OleDbDataAdapter($cmd)
            $dt = New-Object System.Data.DataTable
            $da.Fill($dt) | Out-Null
            
            $outFile = Join-Path -Path $OutputDir -ChildPath "$table.csv"
            $dt | Export-Csv -Path $outFile -NoTypeInformation -Encoding UTF8
        } catch {
            Write-Warning "Failed to export table $($table): $($_.Exception.Message)"
        }
    }
} catch {
    Write-Error "Failed to open database. Ensure you are running 32-bit PowerShell if using Jet 4.0.`n$($_.Exception.Message)"
    exit 1
} finally {
    if ($conn.State -eq "Open") {
        $conn.Close()
    }
}

Write-Host "Export Complete!"

