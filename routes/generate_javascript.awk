#!/sw/bin/gawk -f

# generate_javascript.awk
# Convert the list of formatted route names to a JavaScript array
#
# usage: generate_javascript.awk input.txt > output.txt
#
# Syntax for replacements:
#   *foo*: small text
#   _foo_: small, non-bold text
#   @foo@: even smaller non-bold text
#   |foo|: condensed text

BEGIN {
	FS = ","

	print "var formatted_route_names = {"
}

{
	$2 = gensub(/\*([^*]+)\*/,
			  "<span style='font-size: 85%'>\\1</span>",
			  "g", $2)
	$2 = gensub(/_([^_]+)_/,
			  "<span style='font-weight: normal; font-size: 85%'>\\1</span>",
			  "g", $2)
	$2 = gensub(/@([^@]+)@/,
			  "<span style='font-weight: normal; font-size: 80%'>\\1</span>",
			  "g", $2)
	$2 = gensub(/\|([^|]+)\|/,
			  "<span style='font-family: \\\\\"HelveticaNeue-CondensedBold\\\\\"'>\\1</span>",
			  "g", $2)
	printf "\t\"%s\": \"%s\",\n", $1, $2
}

END {
	print "};"
}