#!/usr/bin/env bash
# Usage: ./scripts/mdb-export-all.sh [full-path-to-db] [output-dir]

command -v mdb-tables >/dev/null 2>&1 || {
    echo >&2 "I require mdb-tables but it's not installed. Aborting.";
    exit 1;
}

command -v mdb-export >/dev/null 2>&1 || {
    echo >&2 "I require mdb-export but it's not installed. Aborting.";
    exit 1;
}

# Use provided path or default to GBC_v19.mdb in root
fullfilename=${1:-"./GBC_v19.mdb"}

if [ ! -f "$fullfilename" ]; then
    echo "Error: Database file not found at $fullfilename"
    exit 1
fi

# Export to gb64_export directory in root unless an explicit dir is passed
export_dir=${2:-"./gb64_export"}
mkdir -p "$export_dir"

echo "Exporting $fullfilename to $export_dir..."

IFS=$'\n'
for table in $(mdb-tables -1 "$fullfilename"); do
    echo "Exporting table: $table"
    mdb-export "$fullfilename" "$table" > "$export_dir/$table.csv"
done

echo "Done! CSVs are in $export_dir"
