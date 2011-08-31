#!/sw/bin/gawk -f

# generate_fake_data.awk
# generate fake departure data from the full list of route names
#
# usage: generate_fake_data.awk routes.txt

{
	gsub(/[\r\n]+$/, "");
	printf "\t\t{'route': '%s', 'ending': 'IT:1', 'time_millis': 1000*60*3, 'time': 3},\n", $0
}
