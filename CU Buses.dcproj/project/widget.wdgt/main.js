/*
 * main.js
 * CU Buses
 *
 * Copyright (c) 2011 by Benjamin Esham (www.bdesham.info)
 *
 * This project is released under the terms found in the "LICENSE.md" file.
 */


// 
// # Global variables
//

//
// ## Constants
//

var debugging = false;

var all_routes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14,
	22, 27, 180, 190, 280];

var api_key = 'afea17046e244cda8f56b5e1fe5f2019';

var widget_version_major = 1;
var widget_version_minor = 8;
var widget_version = widget_version_major + '.' + widget_version_minor;

// time between refreshes (in milliseconds)

var refresh_delay_time = 1000*60;

//
// ## Others
//

var config = {};

var latest_json = {};

var refresh_interval;

var bad_stop_code = '';

var json_success;

var new_version_available = false;

var old_config = {};


//
// # Backend application logic
//

//
// ## Miscellaneous utility functions
//

function debug(text)
{
	if (debugging)
		window.console.log(text);
}

function id_basename(id)
{
	return id.replace(/:.+/, '');
}

function contain_same_elements(array1, array2)
{
	return (array1.sort().join(',') == array2.sort().join(','));
}


//
// ## Network stuff
//

function json_success_callback(json)
{
	json_success = true;
	latest_json = json;
	
	if (json.stat == 'ok') {
		var data = process_json(json);
		refresh_ui_from_data(data);
	} else if (json.stat == 'fail') {
		display_message('Sorry, but the CUMTD server seems to be having problems.');
		window.console.log('API error ' + json.err.code + ': "' + json.err.msg + '"');
	} else {
		display_message('Sorry, but the CUMTD server seems to be having problems.');
		window.console.log('API error, stat = "' + json.stat + '"');
	}
}

function update_data()
{
	if (!config.stop_code || config.stop_code == '')
		return;

	var args = {
		'key': api_key,
		'stop_id': config.stop_id,
		'pt': config.time
	};
	
	json_success = false;
	
	$.getJSON('http://developer.cumtd.com/api/v1.0/json/departures.getListByStop',
		args, json_success_callback);
	
	// give the request five seconds to complete and show an error if it's not
	// done by then.  (the JSON request is asynchronous so if we make the
	// request and immediately check its status, it almost certainly won't be
	// done yet and we'll incorrectly show the user an error message.) if the
	// request *does* go through but it takes more than five seconds, we'll show
	// an (incorrect) error for a little while but then the data will be
	// displayed properly.
	setTimeout(check_json_success, 1000*5);
	
	
	// uncomment this to simulate an error
	
	/*
	var fake_data_not_okay = {
		'stat': 'server is on fire'
	};
	
	var fake_data_no_buses = {
		'stat': 'ok',
		'departures': []
	};
	
	json_success_callback(fake_data_not_okay);
	*/
	
	// uncomment this to fake an entire departure list
	
	/*
	refresh_ui_from_data({'stop': 'whatever', 'departures': [
		{'route': '9B BROWN', 'ending': 'IT:1', 'wait_time_ms': 1000*60*3, 'wait_time_min': 3},
		{'route': '9A BROWN', 'ending': 'IT:1', 'wait_time_ms': 1000*60*3, 'wait_time_min': 3},
		]});
	*/
}

function check_json_success()
{
	if (json_success == false)
		display_message('There was an error getting information from the CUMTD server.');
}	

function process_json(json)
{
	var result = {'stop': config.stop_verbose, 'departures': []};
	var departures = json['departures'];

	var now = Date.now();

	var date_regex = /(\d\d\d\d)-(\d\d)-(\d\d) (\d\d:\d\d:\d\d)/;
	
	for (var i = 0; i < departures.length; i++) {
		var depart = departures[i];

		// parse the "expected" date/time

		var pieces = date_regex.exec(depart.expected);
		var date = new Date(pieces[2] + '/' + pieces[3] + '/' + pieces[1] + ' '
				+ pieces[4] + ' GMT-0600');

		// calculate the time difference
	
		var time_diff_ms = date.getTime() - now;
		
		// load up the object

		result['departures'][i] = {
			'route': depart.route,
			'ending': depart.destination.stop_id,
			'wait_time_ms': time_diff_ms,
			'wait_time_min': Math.floor(time_diff_ms/(1000*60)),
			'time_string': date.toLocaleTimeString().replace(/ C[DS]T$/, '')
		};
	}
	
	result.departures.sort(sort_departures);
	
	return result;
}

//
// ## Route-handling functions
//

function get_canonical_route_number(n)
{
	if (all_routes.indexOf(n) > -1)
		return n;
	else if (n == 100) // stupid yellow
		return 1;
	else if (n % 10 == 0 && all_routes.indexOf(n/10) > -1)
		return n/10;
	else {
		window.console.log('Unrecognized route number: ' + n);
		return n;
	}
}

//
// ## Date and time utility functions
//

// returns the time in the format "1:46 PM"

function get_current_time()
{
	var now = new Date();
	var hour = now.getHours();
	var minutes = now.getMinutes();
	
	if (minutes < 10)
		minutes = '0' + minutes;
	
	if (hour == 0)
		return '12:' + minutes + ' AM';
	else if (hour <= 11)
		return hour + ':' + minutes + ' AM';
	else if (hour == 12)
		return '12:' + minutes + ' PM';
	else
		return (hour - 12) + ':' + minutes + ' PM';
}

function sort_departures(a, b)
{
	return a.wait_time_ms - b.wait_time_ms;
}

//
// ## Functions to deal with stops
//

function get_stop_id(stop)
{
	if (stop in stops)
		return stops[stop]['id'];
	else {
		debug('No stop_id found for code "' + stop + '"');
		return '';
	}
}

function get_intersection_id(stop)
{
	if (stop in stops)
		return id_basename(stops[stop]['id']);
	else {
		debug('No intersection id found for code "' + stop + '"');
		return '';
	}
}

function get_verbose_stop_name_from_code(stop)
{
	if (stop in stops)
		return stops[stop]['verbose'];
	else {
		debug('No verbose name found for code "' + stop + '"');
		return '';
	}
}

function get_verbose_stop_name_from_id(id)
{
	for (key in stops) {
		if (stops[key]['id'] == id)
			return stops[key]['verbose'];
	}
	
	// if that didn't work, try to match the base of the id (the part before
	// the colon)
	id = id_basename(id);
	
	for (key in stops) {
		if (id_basename(stops[key]['id']) == id)
			return stops[key]['verbose'];
	}
	
	debug('No verbose name found for id "' + id + '"');	
	return '';
}

//
// ## Functions to deal with routes
//

function prettify_route_name(name)
{
	debug('prettify_route_name: got name "' + name + '"');
	
	// separate the pieces
	
	var re = new RegExp('^(\\S+) (.+?)\\s*$');
	var matches = re.exec(name);
	
	var route_number = matches[1];
	var route_name = matches[2].toUpperCase();
	
	// construct the formatted route name
	
	var result = '';
	
	if (route_number == '27S' || route_number == '270S')
		result += '&#x2708; ';
	
	result += route_number + ' ';
	
	if (route_name in formatted_route_names)
		result += formatted_route_names[route_name];
	else {
		debug('prettify_route_name: "' + route_name + '" not found in formatted_route_names');
		result += route_name;
	}
	
	debug('prettify_route_name: returning "' + result + '"');
	
	return result;
}


//
// # Preference handling
//

function get_preference(name)
{
	return widget.preferenceForKey(dashcode.createInstancePreferenceKey(name));
}

function set_preference(name, value)
{
	widget.setPreferenceForKey(value, dashcode.createInstancePreferenceKey(name));
}

function update_preferences()
{
	debug('update_preferences: config.routes is ' + config.routes.toString());
	set_preference('time', document.getElementById('popup_lookahead').value);
	set_preference('routes', '[' + config.routes.join(',') + ']');
	set_preference('stop_code', document.getElementById('field_stop').value);

	return read_preferences();
}

// Reads the preferences from the plist and updates `config`. Where no
// preference is set, reasonable defaults are set--except for the stop code.
// This function returns 0 if an acceptable stop code is set, 1 if none is set,
// or 2 if a stop code is set but it is not a valid one.

function read_preferences()
{
	// time
	
	var time = get_preference('time');
	var time_int = parseInt(time);
	
	if (time && [15, 30, 45, 60].indexOf(time_int) > -1)
		config.time = time_int;
	else
		config.time = 45;
	
	document.getElementById('popup_lookahead').setAttribute('value', config.time);

	// routes

	var routes = get_preference('routes');
	
	if (routes) {
		var routes_arr = routes.replace(/\[(.+)\]/g, '$1').split(',');

		routes_arr = routes_arr.map(function(e) {
			return parseInt(e);
		});
		routes_arr = routes_arr.filter(function(e) {
			return (all_routes.indexOf(e) > -1);
		});
		
		debug('read_preferences: in "if (routes)" and routes_arr = ' + routes_arr.toString());

		config.routes = routes_arr;
	} else
		config.routes = all_routes.slice();
	
	update_routes_checkboxes_from_list(config.routes);

	// stop code

	var stop_code = get_preference('stop_code');
	
	if (stop_code) {
		if (!(stop_code in stops)) {
			bad_stop_code = stop_code;

			set_title('CU Buses');
			display_message('&ldquo;' + bad_stop_code +
					'&rdquo; isn&rsquo;t a stop. Please double-check your code.');
					
			config.stop_code = '';
			config.stop_id = '';
			config.stop_verbose = '';
				
			document.getElementById('field_stop').setAttribute('value', stop_code);
				
			return 2;
		} else {
			bad_stop_code = '';

			config.stop_code = stop_code;
			config.stop_id = get_intersection_id(stop_code);
			config.stop_verbose = get_verbose_stop_name_from_code(stop_code);
					
			document.getElementById('field_stop').setAttribute('value', stop_code);

			return 0;
		}
	} else {
		display_message("Please click the"
				+ " <span style='font-style: italic; font-family: \"Times New Roman\"; font-weight: bold'>i</span>"
				+ " button at the bottom-right of this widget and enter a stop code.");
				
		config.stop_code = '';
		config.stop_id = '';
		config.stop_verbose = '';

		return 1;
	}
}


//
// # Updating
//

function check_for_updates()
{
	$.getJSON('http://bdesham.github.com/cu-buses/version.js',
			{}, check_for_updates_callback);
}

function check_for_updates_callback(json)
{
	if (!('latest_version_major' in json
				&& 'latest_version_minor' in json)) {
		window.console.log('In check_for_updates_callback but got bad JSON');

		document.getElementById('button_update').style.visibility = 'hidden';
		new_version_available = false;

		return;
	}

	var major = parseInt(json.latest_version_major);
	var minor = parseInt(json.latest_version_minor);

	if ((major > widget_version_major) ||
			((major == widget_version_major) && (minor > widget_version_minor))) {
		debug('New version available: ' + major + '.' + minor);
		document.getElementById('button_update').style.visibility = 'visible';
		new_version_available = true;
	} else {
		debug('We have the newest version: ' + major + '.' + minor);
		document.getElementById('button_update').style.visibility = 'hidden';
		new_version_available = false;
	}
}


//
// # UI functions
//

//
// ## Variables
//

var colors = {
	'black': '#1b1d1e',
	'red_bg': '#d10000',
	'red_fg': '#ffffff',
	'yellow_bg': '#ffc400',
	'yellow_fg': '#000000',
	'green_bg': '#007f00',
	'green_fg': '#ffffff'
};

//
// ## High-level UI functions
//

function refresh_ui_from_data(data)
{
	if (bad_stop_code)
		return;
	
	var list = document.getElementById('list').object;

	var departures = data.departures;
	list.setDataArray(array_of_spaces(departures.length));
	
	//
	// top and bottom labels
	//
	
	set_title(config['stop_verbose']);
	set_status('Updated at ' + get_current_time());
	
	// find out how many of these departures we're actually going to show
	
	var is_desired_route = function(departure) {
		//debug('is_desired_route: route: ' + departure.route);
		var raw_route = departure.route.replace(/(\d+).+/, '$1');
		var canonical_route = get_canonical_route_number(parseInt(raw_route))
		return (config.routes.indexOf(canonical_route) > -1);
	}
	
	departures = departures.filter(is_desired_route);
	list.setDataArray(array_of_spaces(departures.length));

	// handle the case where there are no departures. (we assume here that we
	// got a valid response from the server, but it contained no departures. the
	// error-checking to make sure that we did get a valid response is somewhere
	// else.)
	
	if (departures.length == 0) {
		display_message('There are no buses coming in the next ' + config.time +
				' minutes.');
		return;
	}
	
	clear_message();
	
	//
	// departures
	//
		
	for (i = 0; i < departures.length; i++) {
		var row = list.rows[i].object;
		var departure = departures[i];
		var time = departure.wait_time_min;
		
		row.templateElements.route_text.innerHTML = prettify_route_name(departure.route);
		
		if (time > 0)
			row.templateElements.arrival_time_text.innerText = time + ' min';
		else
			row.templateElements.arrival_time_text.innerText = 'DUE';
			
		row.templateElements.arrival_time_text.setAttribute('title',
				'Bus expected at ' + departure.time_string);
			
		var terminus = get_verbose_stop_name_from_id(departure.ending);
		row.templateElements.route_text.setAttribute('title',
				'Route ends at ' + terminus);

		var time_style = row.templateElements.arrival_time_text.style;
		
		if (time <= 5) {
			time_style.setProperty('background-color', colors['red_bg']);
			time_style.setProperty('color', colors['red_fg']);
		} else if (time > 5 && time <= 10) {
			time_style.setProperty('background-color', colors['yellow_bg']);
			time_style.setProperty('color', colors['yellow_fg']);
		} else {
			time_style.setProperty('background-color', colors['green_bg']);
			time_style.setProperty('color', colors['green_fg']);
		}
	}
}

//
// ## Timer functions
//

function start_timer()
{
    update_data();

    if (!refresh_interval)
        refresh_interval = setInterval(update_data, refresh_delay_time);
}

function stop_timer()
{
    if (refresh_interval) {
        clearInterval(refresh_interval);
        refresh_interval = null;
    }
}

//
// ## Set various UI properties
//

function display_message(html)
{
	// clear all departures--probably not necessary here (?)
	document.getElementById('list').object.setDataArray([]);
	
	document.getElementById('text_message').innerHTML = html;
}

function clear_message()
{
	document.getElementById('text_message').innerHTML = '';
}

function set_title(text)
{
	var title = text.replace(/  +/g, ' ');
	var top_text = document.getElementById('top_text');

	if (title.length >= 34)
		top_text.style.setProperty('font-size', '10pt');
	else if (title.length >= 29)
		top_text.style.setProperty('font-size', '11pt');
	else
		top_text.style.setProperty('font-size', '13pt');

	top_text.innerText = title;
}

function set_status(text)
{
	if (new_version_available) {
		document.getElementById('status_text').innerText
				= 'Flip to the back for a software update!';
	} else
		document.getElementById('status_text').innerText = text;
}

function update_routes_checkboxes_from_list(routes)
{
	all_routes.forEach(function(val, idx) {
		var route = parseInt(val);
		if (routes.indexOf(route) > -1)
			document.getElementById('input_' + route).checked = true;
		else 
			document.getElementById('input_' + route).checked = false;
	});
}


//
// ## Miscellaneous UI utility functions
//

function array_of_spaces(len)
{
	var arr = [];
	for (var i = 0; i < len; i++)
		arr[i] = ' ';
	
	return arr;
}

//
// ## Event handlers
//

//
// ### Built-in event handlers
//

// Called by HTML body element's onload event when the widget is ready to start

function load()
{
    dashcode.setupParts();

	// start the update timer
	
	check_for_updates();
    var update_timer_interval = setInterval(check_for_updates, 1000*60*60*36);
	
	// things that have to be done programatically

	var version = document.getElementById('text_version');
	version.innerText = 'CU Buses v' + widget_version;
	version.style.setProperty('text-decoration', 'underline');
	version.style.setProperty('cursor', 'pointer');
	
	//var box_routes = document.getElementById('box_routes');
	//box_routes.style.setProperty('opacity', 0.0);
	//box_routes.style.setProperty('visibility', 'visible');
	$('#box_routes').hide();
	
	$('#box_clipper').css({'overflow': 'hidden'});
	
	document.getElementById('text_version').title = 'Click to visit the CU Buses website';

	document.getElementById('text_thanks').title = 'They provide the buses too.';
			
	// clear the list to avoid the unsightly flash of example content
	
	document.getElementById('list').object.setDataArray([]);

	// check to see whether this is a new instance of this widget

	if (read_preferences() == 1)
		animate_front_to_back(null);
	
	// set up refreshing
	
	start_timer();
}

// Called when the widget has been removed from the Dashboard

function remove()
{
	set_preference('time', null);
	set_preference('routes', null);
	set_preference('stop_code', null);
	
	stop_timer();
}

// Called when the widget has been hidden

function hide()
{
    stop_timer();
}

// Called when the widget has been shown

function show()
{
	if (read_preferences() == 0)
		start_timer();
}

//
// ### Pane-to-pane transitions
//

function animate_front_to_back(event)
{
	// store our preferences so we can see later if anything changed
	
	old_config.stop_code = config.stop_code;
	old_config.stop_id = config.stop_id;
	old_config.stop_verbose = config.stop_verbose;
	old_config.time = config.time;
	old_config.routes = config.routes.slice();
	
	debug('animate_front_to_back: old stop code is "' + old_config.stop_code + '"');
	debug('animate_front_to back: old routes were ' + old_config.routes.toString());

	// do the actual animation
	
    var front = document.getElementById('front');
    var back = document.getElementById('back');

	widget.prepareForTransition('ToBack');

    front.style.display = 'none';
    back.style.display = 'block';

	setTimeout('widget.performTransition();', 0);
}

function animate_back_to_front(event)
{
	// my stuff

	if (update_preferences() == 0) {
		debug('animate_back_to_front: new stop code is "' + config.stop_code + '"');
		debug('animate_back_to_front back: new routes are ' + config.routes.toString());

		if (config.stop_code != old_config.stop_code) {
			display_message('Loading&hellip;');
			set_title(get_verbose_stop_name_from_code(config.stop_code));
			update_data();
		} else if ((config.time != old_config.time)
				|| !contain_same_elements(config.routes, old_config.routes)) {
			update_data();
		}
	}

	// do the actual animation
	
    var front = document.getElementById('front');
    var back = document.getElementById('back');

	widget.prepareForTransition('ToFront');

    front.style.display = 'block';
    back.style.display = 'none';

	setTimeout('widget.performTransition();', 0);
}

function animate_back_to_routes(event)
{
	// the routes box starts out having the same position as the prefs box, so
	// we need to move it out of the way before we do anything else
	$('#box_routes').show().animate({top: 286}, 0);
	
	$('#box_prefs').animate({top: -286}, 250);
	$('#box_routes').animate({top: -16}, 250);
}

function animate_routes_to_back(event)
{
	debug('animate_routes_to_back: config.routes is ' + config.routes.join(','));
	
	$('#box_prefs').animate({top: -16}, 250);
	$('#box_routes').animate({top: 286}, 250);
}

// 
// ### My event handlers
//

function button_look_up_code_handler(event)
{
    widget.openURL('http://www.cumtd.com/maps-and-schedules/bus-stops');
	return;
}

function button_update_handler(event)
{
    widget.openURL('http://bdesham.github.com/cu-buses/index.html#download');
	return;
}

function lookahead_change_handler(event)
{
	var time = parseInt(document.getElementById('popup_lookahead').value);
    config.time = time;
	widget.setPreferenceForKey(time, dashcode.createInstancePreferenceKey('time'));
	return;
}

function text_version_handler(event)
{
    widget.openURL('http://bdesham.github.com/cu-buses/');
	return;
}

function checkbox_change_handler(event)
{
	var route = parseInt(event.target.id.replace(/.+_/, ''));
	var state = document.getElementById(event.target.id).checked;
	var index = config.routes.indexOf(route);
	
	debug('checkbox_change_handler: toggling ' + route);
	
	if (index > -1 && state == false)
		config.routes.splice(index, 1);
	else if (index == -1 && state == true)
		config.routes.push(route);
	else if (index > -1 && state == true)
		window.console.log('Trying to add route ' + route
				+ ' to config.routes but already present');
	else if (index == -1 && state == false)
		window.console.log('Trying to remove route ' + route
				+ ' from config.routes but not present');
	else
		window.console.log('Something weird happened in checkbox_change_handler');
	
	debug('config.routes is ' + config.routes.join(','));
}

function checkbox_text_handler(event)
{
    var route = event.toElement.innerText.replace(/ .+/, '');
	$('#input_' + route).click();
}

function button_selectall_handler(event)
{
	all_routes.forEach(function(route, idx) {
		var state = document.getElementById('input_' + route).checked;
		if (!state)
			$('#input_' + route).click();
	});
}

function button_deselectall_handler(event)
{
	all_routes.forEach(function(route, idx) {
		var state = document.getElementById('input_' + route).checked;
		if (state)
			$('#input_' + route).click();
	});
}

//
// # Code that will actually run! (i.e., not functions)
//

if (window.widget) {
    widget.onremove = remove;
    widget.onhide = hide;
    widget.onshow = show;
}

// vim: tw=80 cc=+1
