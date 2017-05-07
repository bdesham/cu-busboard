#!/usr/bin/python

# get_stops.py
#
# Copyright (c) 2011-2012 by Benjamin Esham (www.bdesham.info)
# 
# This project is released under the terms found in the "LICENSE.md" file.
#
# The CUMTD API expects a stop code of the form "IT:1", but these codes are not
# easily available to end users; they will want to use the four-digit
# text-message codes. To translate between the two, run this script to fetch
# the API's list of stops and generate a translation matrix that the widget can
# read.
#
# usage: get_stops.py api_key > output.js

import sys, json, urllib2
from cStringIO import StringIO

args = sys.argv[1:]

api_key = args[0]

try:
	url = 'http://developer.cumtd.com/api/v2.1/json/GetStops?key=%s' % api_key
	api_result_text = urllib2.urlopen(url).read()
except urllib2.HTTPError, e:
	print >> sys.stderr, "get_stops.py: got an HTTP error while trying to get data from CUMTD."
	print >> sys.stderr, e
	sys.exit(1)

try:
	api_result_json = json.loads(api_result_text)
except ValueError, e:
	print >> sys.stderr, "get_stops.py: error parsing JSON."
	print >> sys.stderr, e
	sys.exit(1)

stops = {}

for stop in api_result_json['stops']:
	code = stop['code']
	stops[code[3:]] = {'id': stop['stop_id'], 'verbose': stop['stop_name']}

# Manually add the Transit Plaza. The code 7411 is kind of a meta-code for all
# three platforms of the Plaza, but this code is not included in the output of
# stops.getList. (The same thing should happen with the Illinois Terminal and
# code 3121, but for whatever reason that one *is* included in stops.getList.)
stops['7411'] = {'id': 'PLAZA', 'verbose': 'Transit Plaza'}

# assemble the output

result = "var stops = {"

for code in sorted(stops.keys()):
	stop = stops[code]
	result += '\n"%s": {"id": "%s", "verbose": "%s"},' % (code, stop['id'], stop['verbose'])

# get rid of the trailing comma
result = result[:-1] + "\n};"

print result
