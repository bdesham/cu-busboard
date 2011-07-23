#!/usr/bin/python

# transform_stops.py
#
# Copyright (c) 2011 by Benjamin Esham (www.bdesham.info)
# 
# This project is released under the terms found in the "LICENSE.md" file.
#
# The CUMTD API expects a stop code of the form "IT:1", but these codes are not
# easily available to end users; they will want to use the four-digit
# text-message codes. To translate between the two, we periodically request the
# list /stops.getList and run this script to get a translation matrix that the
# widget can read.
#
# usage: python transform_stops.py input.json output.json

import sys, os, json

args = sys.argv[1:]

try:
	in_file = open(os.path.expanduser(args[0]), 'r')
except IOError, e:
	print >> sys.stderr, "transform_stops.py: error opening the input file."
	print >> sys.stderr, e
	sys.exit(1)

try:
	out_file = open(os.path.expanduser(args[1]), 'w')
except IOError, e:
	print >> sys.stderr, "transform_stops.py: error opening the output file."
	print >> sys.stderr, e
	sys.exit(1)

try:
	stops = json.loads(in_file.read())
except ValueError, e:
	print >> sys.stderr, "transform_stops.py: error parsing JSON. "
	print >> sys.stderr, e
	sys.exit(1)

in_file.close()

result = {}

for stop in stops["stops"]:
	code = stop["code"]
	
	result[code[3:]] = {"id": stop["stop_id"],
			"verbose": stop["stop_name"]}

# Manually add the Transit Plaza. The code 7411 is kind of a meta-code for all
# three platforms of the Plaza, but this code is not included in the output of
# stops.getList. (The same thing should happen with the Illinois Terminal and
# code 3121, but for whatever reason that one *is* included in stops.getList.)
result["7411"] = {"id": "PLAZA", "verbose": "Transit Plaza"}

out_file.write("var stops = ")
json.dump(result, out_file, indent = 0)
out_file.write(";")

out_file.close()

# vim: tw=80 cc=+1
