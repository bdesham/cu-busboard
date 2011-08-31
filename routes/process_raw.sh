#!/bin/sh

# process_raw
# take a "raw" list of routes, strip the numbers, and run it through `uniq`
#
# usage: process_raw.sh input.txt output.txt

(cut -d " " -f 1 --complement $1 | sed -Ee 's/[[:space:]]+$//' | sort -u) > $2
