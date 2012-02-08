#!/bin/sh

# bump_version.sh
#
# Update the project's metadata for a new version
#
# Usage: bump_version.sh <major> <minor>
#
# e.g. bump_version.sh 2 0

new_version="$1.$2"
temp=`mktemp`

gawk "
	BEGIN {
		found = 0
	}

	{
		if (found == 1) {
			print \"\t<string>\" $new_version \"</string>\"
			found = 0
		} else
			print
	}

	/CFBundleShortVersionString/ || /CFBundleVersion/ {
		found = 1
	}
" "CU BusBoard.dcproj/project/widget.wdgt/Info.plist" > $temp \
	&& mv $temp "CU BusBoard.dcproj/project/widget.wdgt/Info.plist"

sed -E -e "s/(widget_version_major = )[0-9]+;/\\1$1;/" \
	-e "s/(widget_version_minor = )[0-9]+;/\\1$2;/" \
	"CU BusBoard.dcproj/project/widget.wdgt/main.js" > $temp \
	&& mv $temp "CU BusBoard.dcproj/project/widget.wdgt/main.js"
