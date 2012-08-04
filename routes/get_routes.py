#!/usr/bin/python

# get_routes.py
#
# Copyright (c) 2011-12 by Benjamin Esham (www.bdesham.info)
# 
# This project is released under the terms found in the "LICENSE.md" file.
#
# The CUMTD API outputs routes in an ugly format, e.g. "5W GREEN EX". This script
# fetches the list of routes in use in preparation for further processing.
#
# usage: get_routes.py api_key > routes_raw.txt

import sys, json, re, urllib2

args = sys.argv[1:]

api_key = args[0]

try:
	url = 'http://developer.cumtd.com/api/v2.1/json/GetRoutes?key=%s' % api_key
	api_result_text = urllib2.urlopen(url).read()
except urllib2.HTTPError, e:
	print >> sys.stderr, "get_routes.py: got an HTTP error while trying to get data from CUMTD."
	print >> sys.stderr, e
	sys.exit(1)

try:
	api_result_json = json.loads(api_result_text)
except ValueError, e:
	print >> sys.stderr, "get_routes.py: error parsing JSON."
	print >> sys.stderr, e
	sys.exit(1)

routes = []
regex = re.compile(r"^(?:\d{1,2}[A-Z]? )?(.+?)\s*$")

for route in api_result_json['routes']:
	print route['route_id']
	routes.append(regex.sub(r"\1", route['route_id']))

print "---"

for route in sorted(set(routes)):
	print route
