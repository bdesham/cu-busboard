#!/usr/bin/python

# stop_name_lengths
# 
# Copyright (c) 2011 by Benjamin Esham (https://esham.io)
#
# This project is released under the terms found in the "LICENSE.md" file.
#
# Loop through the list of stops and print each stop name along with its length
# (i.e. number of characters).

def uniquify(seq):  
	# from http://www.peterbe.com/plog/uniqifiers-benchmark
	seen = {} 
	result = [] 
	for item in seq: 
		if item in seen: continue 
		seen[item] = 1 
		result.append(item) 
	return result

import sys, os, json

args = sys.argv[1:]

try:
	in_file = open(os.path.expanduser(args[0]), 'r')
except IOError, e:
	print >> sys.stderr, "stop_name_lengths.py: error opening the input file."
	print >> sys.stderr, e
	sys.exit(1)

try:
	stops = json.loads(in_file.read())
except ValueError, e:
	print >> sys.stderr, "stop_name_lengths.py: error parsing JSON."
	print >> sys.stderr, e
	sys.exit(1)

in_file.close()

lengths = []

for stop in stops["stops"]:
	lengths.append("%02d\t%s" % (len(stop["stop_name"]), stop["stop_name"]))

lengths.sort()

for l in uniquify(lengths):
	print l

# vim: tw=80 cc=+1
