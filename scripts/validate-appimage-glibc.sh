#!/usr/bin/env bash
# Check the app AND bundled shared libraries, including weak requirements.
set -euo pipefail
root="${1:?Usage: validate-appimage-glibc.sh APPDIR}"
test -d "$root"
command -v readelf >/dev/null
count=0
while IFS= read -r -d '' binary; do
  if ! readelf -h "$binary" >/dev/null 2>&1; then
    continue
  fi
  count=$((count + 1))
  versions="$(readelf --version-info "$binary")"
  while IFS= read -r version; do
    if [[ "$version" == GLIBC_ABI_* ]]; then
      echo "$binary requires $version, newer than the glibc 2.35 baseline" >&2
      exit 1
    fi
    required="${version#GLIBC_}"
    newest="$(printf '%s\n' 2.35 "$required" | sort -V | tail -n 1)"
    if [[ "$newest" != 2.35 ]]; then
      echo "$binary requires $version, newer than the glibc 2.35 baseline" >&2
      exit 1
    fi
  done < <(printf '%s\n' "$versions" | grep -oE 'Name: GLIBC_([0-9.]+|ABI_[A-Z0-9_]+)' | sed 's/Name: //' | sort -u)
done < <(find "$root" -type f -print0)
if (( count == 0 )); then
  echo 'No ELF binaries found in AppDir' >&2
  exit 1
fi
echo "Validated $count ELF files against glibc 2.35"
