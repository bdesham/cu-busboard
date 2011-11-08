#!/bin/sh

# bump_version.sh
#
# Update the project's metadata for a new version
#
# Usage: bump_version.sh <major> <minor>
#
# e.g. bump_version.sh 2 0

echo "{\"latest_version_major\": $1, \"latest_version_minor\": $2}" > version.js
