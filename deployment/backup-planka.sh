#!/bin/bash
set -eu
ts=$(date +%Y%m%d-%H%M%S)
out="/var/backups/planka-${ts}.sql.gz"
sudo -u postgres pg_dump planka | gzip > "$out"
chmod 600 "$out"
find /var/backups -name 'planka-*.sql.gz' -mtime +14 -delete
