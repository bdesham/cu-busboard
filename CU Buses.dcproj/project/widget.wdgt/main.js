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

//var stops;

var config = {
	"time": 45,
	"stop_code": "",
	"stop_id": "",
	"stop_verbose": ""
};

var updateDisplayInterval;

var bad_stop_code = "";

var api_key = "afea17046e244cda8f56b5e1fe5f2019";

var json_success;

var widget_version_major = 1;
var widget_version_minor = 0;
var widget_version = widget_version_major + "." + widget_version_minor;

var new_version_available = false;

// we store the old value of the stop code before showing the preferences. if it
// hasn't changed when we flip back to the front, don't refresh the data. we
// initialize this to the empty string so that we don't double-refresh when the
// widget is first launched

var old_stop_code = "";

var old_time = 45;

// time between refreshes (in milliseconds)

var refresh_interval = 1000*60;


//
// # Backend application logic
//

//
// ## Miscellaneous utility functions
//

function id_basename(id)
{
	return id.replace(/:.+/, "");
}

//
// ## Network stuff
//

function json_success_callback(json)
{
	json_success = true;
	
	if (json.stat == "ok") {
		//window.console.log("successfully got data, stat = ok");
	
		var data = process_json(json);
		refresh_ui_from_data(data);
	} else {
		display_message("Sorry, but the CUMTD server seems to be having problems.");
		window.console.log("Got JSON from the server, but stat = \"" + json.stat + "\"");
	}
}

function update_data()
{
	if (!config.stop_code || config.stop_code == "")
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
	
	
	// set and pass some fake data for testing
	/*
	var fake_data_not_okay = {
		"stat": "server is on fire"
	};
	
	var fake_data_no_buses = {
		"stat": "ok",
		"departures": []
	};
	
	json_success_callback(fake_data_not_okay);
	*/
}

function check_json_success()
{
	if (json_success == false) {
		display_message("There was an error getting information from the CUMTD server.");
	}
}	

function process_json(json)
{
	var result = {"stop": config.stop_verbose, "departures": []};
	var departures = json['departures'];
	var now = Date.now();
	
	//window.console.log(departures.length + " departures");
	
	for (var i = 0; i < departures.length; i++) {
		var depart = departures[i];
		
		var expected = convert_date(depart.expected);
		var time = Math.floor((expected - now)/(1000*60));
		
		result["departures"][i] = {
			"route": depart.route,
			"ending": depart.destination.stop_id,
			"time_millis": expected - now,
			"time": time
		};
	}
	
	result.departures.sort(sort_departures);
	
	return result;
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
		minutes = "0" + minutes;
	
	if (hour == 0)
		return "12:" + minutes + " AM";
	else if (hour <= 11)
		return hour + ":" + minutes + " AM";
	else if (hour == 12)
		return "12:" + minutes + " PM";
	else
		return (hour - 12) + ":" + minutes + " PM";
}

function convert_date(date)
{
	var regex = /(\d\d\d\d)-(\d\d)-(\d\d) (\d\d:\d\d:\d\d)/;
	var pieces = regex.exec(date);
	var result = new Date(pieces[2] + "/" + pieces[3] + "/" + pieces[1] + " "
			+ pieces[4] + " GMT-0500");
	
	return result.getTime();
}

function sort_departures(a, b)
{
	return a.time_millis - b.time_millis;
}

//
// ## Functions to deal with stops
//

function get_stop_id(stop)
{
	if (stop in stops)
		return stops[stop]["id"];
	else {
		//window.console.log("No stop_id found for \"" + stop + "\"");
		return "";
	}
}

function get_intersection_id(stop)
{
	if (stop in stops) {
		return id_basename(stops[stop]["id"]);
	}
	else {
		//window.console.log("No stop_id found for \"" + stop + "\"");
		return "";
	}
}

function get_verbose_stop_name_from_code(stop)
{
	if (stop in stops)
		return stops[stop]["verbose"];
	else {
		//window.console.log("No verbose name found for \"" + stop + "\"");
		return "";
	}
}

function get_verbose_stop_name_from_id(id)
{
	for (key in stops) {
		if (stops[key]["id"] == id)
			return stops[key]["verbose"];
	}
	
	// if that didn't work, try to match the base of the id (the part before
	// the colon)
	id = id_basename(id);
	
	for (key in stops) {
		if (id_basename(stops[key]["id"]) == id)
			return stops[key]["verbose"];
	}
	
	//window.console.log("No verbose name found for \"" + id + "\"");	
	return "";
}

//
// ## Functions to deal with routes
//

function prettify_route_name(name)
{
	name = wrap_in_span(name, "Limited", "font-size: 85%; text-transform: uppercase");
	name = wrap_in_span(name, "Lsq", "font-size: 85%; text-transform: uppercase");
	
	if (name.match(/YellowHOPPER Gerty/i)) {
		name = name.replace(/HOPPER Gerty/,
			"H<span style='font-size: 85%'>OP.</span>"
			+ " <span style='font-weight: normal; font-size: 80%'>Gerty</span>");
	} else if (name.match(/HOPPER/))
		name = wrap_in_span(name, "OPPER", "font-size: 85%");
	
	if (name.match(/Air Bus/))
		name = "&#x2708; " + name;
	
	if (name.match(/Teal Orchard Downs/i)) {
		name = name.replace(/^(.+ Teal) Orchard Downs/,
			"$1 <span style='font-weight: normal; font-size: 80%'>Orch. Downs</span>");
	}
	
	return name;
}


//
// # Preference handling
//

function update_preferences()
{
	// set the stop code
	var stop = document.getElementById("field_stop").value;
	//window.console.log("stop code is " + stop);
	widget.setPreferenceForKey(stop, dashcode.createInstancePreferenceKey("stop_code"));
	
	// set the time
	var time = document.getElementById("popup_lookahead").value;
	//window.console.log("time is " + time);
	widget.setPreferenceForKey(time, dashcode.createInstancePreferenceKey("time"));

	return read_preferences();
}

// read the preferences from the plist. returns 0 if the preference was actually
// set, 1 if it wasn't (i.e. this is the first run of this invocation of the
// widget), or 2 if there was a preference but the stop code is invalid

function read_preferences()
{
	var retcode = -1;
	var time = widget.preferenceForKey(dashcode.createInstancePreferenceKey("time"));
	
	if (time) {
		config.time = time;
		retcode = 0;
	} else {
		config.time = 45;
		retcode = 1;
	}
	
	document.getElementById("popup_lookahead").setAttribute("value", time);

	var stop_code = widget.preferenceForKey(dashcode.createInstancePreferenceKey("stop_code"));
	
	if (stop_code) {
		if (!(stop_code in stops)) {
			bad_stop_code = stop_code;

			set_title("CU Buses");
			display_message("&ldquo;" + bad_stop_code +
					"&rdquo; isn&rsquo;t a stop. Please double-check your code.");
					
			config.stop_code = "";
			config.stop_id = "";
			config.stop_verbose = "";
				
			document.getElementById("field_stop").setAttribute("value", stop_code);
				
			retcode = 2;
		}
		
		bad_stop_code = "";

		config.stop_code = stop_code;
		config.stop_id = get_intersection_id(stop_code);
		config.stop_verbose = get_verbose_stop_name_from_code(stop_code);
				
		document.getElementById("field_stop").setAttribute("value", stop_code);
	} else {
		display_message("Please click the"
				+ " <span style='font-style: italic; font-family: \"Times New Roman\"; font-weight: bold'>i</span>"
				+ " button at the bottom-right of this widget and enter a stop code.");
		retcode = 1;
	}
	
	return retcode;
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
	var major = parseInt(json.latest_version_major);
	var minor = parseInt(json.latest_version_minor);

	if ((major > widget_version_major) ||
			((major == widget_version_major) && (minor > widget_version_minor))) {
		//window.console.log('New version available: ' + major + '.' + minor);
		document.getElementById('button_update').style.visibility = "visible";
		new_version_available = true;
	} else {
		//window.console.log('We have the newest version: ' + major + '.' + minor);
		document.getElementById('button_update').style.visibility = "hidden";
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
	"black": "#1b1d1e",
	"red_bg": "#d10000",
	"red_fg": "#ffffff",
	"yellow_bg": "#ffc400",
	"yellow_fg": "#000000",
	"green_bg": "#007f00",
	"green_fg": "#ffffff"
};

//
// ## High-level UI functions
//

function refresh_ui_from_data(data)
{
	if (bad_stop_code)
		return;
	
	var list = document.getElementById("list").object;

	var departures = data.departures;
	var dummy = array_of_spaces(departures.length);
	list.setDataArray(dummy);
	
	//
	// top and bottom labels
	//
	
	set_title(config["stop_verbose"]);
	set_status("Updated at " + get_current_time());

	// handle the case where there are no departures. (we assume here that we
	// got a valid response from the server, but it contained no departures. the
	// error-checking to make sure that we did get a valid response is somewhere
	// else.)
	
	if (departures.length == 0) {
		display_message("There are no buses coming in the next " + config.time +
				" minutes.");
		return;
	}
	
	clear_message();
	
	//
	// departures
	//
		
	for (i = 0; i < departures.length; i++) {
		var row = list.rows[i].object;
		var departure = departures[i];
		
		var time = departure.time;
		
		row.templateElements.route_text.innerHTML = prettify_route_name(departure.route);
		
		if (time > 0)
			row.templateElements.arrival_time_text.innerText = time + " min";
		else
			row.templateElements.arrival_time_text.innerText = "DUE";
			
		var terminus = get_verbose_stop_name_from_id(departure.ending);
		row.templateElements.route_text.setAttribute("title", "Route ends at "
				+ terminus);

		var time_style = row.templateElements.arrival_time_text.style;
		
		if (time <= 5) {
			time_style.setProperty("background-color", colors["red_bg"]);
			time_style.setProperty("color", colors["red_fg"]);
		} else if (time > 5 && time <= 10) {
			time_style.setProperty("background-color", colors["yellow_bg"]);
			time_style.setProperty("color", colors["yellow_fg"]);
		} else {
			time_style.setProperty("background-color", colors["green_bg"]);
			time_style.setProperty("color", colors["green_fg"]);
		}
	}
}

//
// ## Timer functions
//

function start_timer()
{
    update_data();

    if (!updateDisplayInterval)
        updateDisplayInterval = setInterval(update_data, refresh_interval);
}

function stop_timer()
{
    if (updateDisplayInterval) {
        clearInterval(updateDisplayInterval);
        updateDisplayInterval = null;
    }
}

//
// ## Set various UI properties
//

function display_message(html)
{
	// clear all departures--probably not necessary here (?)
	document.getElementById("list").object.setDataArray([]);
	
	document.getElementById("text_message").innerHTML = html;
}

function clear_message()
{
	document.getElementById("text_message").innerHTML = "";
}

function set_title(text)
{
	document.getElementById("top_text").innerText = text;
}

function set_status(text)
{
	if (new_version_available)
		document.getElementById("status_text").innerText = "Flip to the back for a software update!";
	else
		document.getElementById("status_text").innerText = text;
}

//
// ## Miscellaneous UI utility functions
//

function wrap_in_span(text, words, style)
{
	return text.replace(words, "<span style='" + style + "'>" + words
			+ "</span>");
}

function array_of_spaces(len)
{
	var arr = [];
	for (var i = 0; i < len; i++) {
		arr[i] = " ";
	}
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

	document.getElementById("text_version").innerText = "CU Buses v" + widget_version;
	document.getElementById("text_version").style.setProperty("text-decoration", "underline");
	document.getElementById("text_version").style.setProperty("cursor", "pointer");

	document.getElementById("text_thanks").title = "They provide the buses too.";
			
	// "restore" the message text to the style we want
	
	var message = document.getElementById("text_message");
	message.innerText = "";
	message.style.setProperty("font-family", "'Helvetica Neue'");
	message.style.setProperty("font-size", "16px");
	message.style.setProperty("font-style", "normal");
	
	// clear the list to avoid the unsightly flash of example content
	
	document.getElementById("list").object.setDataArray([]);

	// check to see whether this is a new instance of this widget

	var prefs = read_preferences();
	
	if (prefs == 1) {
		showBack(null);
	}
	
	// set up refreshing
	
	start_timer();
}

// Called when the widget has been removed from the Dashboard

function remove()
{
	widget.setPreferenceForKey(null, dashcode.createInstancePreferenceKey("stop_id"));
	
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

// Called when the info button is clicked to show the back of the widget
//
// event: onClick event from the info button

function showBack(event)
{
	// Apple stuff
	
    var front = document.getElementById("front");
    var back = document.getElementById("back");

    if (window.widget) {
        widget.prepareForTransition("ToBack");
    }

    front.style.display = "none";
    back.style.display = "block";

    if (window.widget) {
        setTimeout('widget.performTransition();', 0);
    }
	
	// my stuff
	
	if (config && config.stop_code)
		old_stop_code = config.stop_code;
	else
		old_stop_code = "dummy";
	
	if (config && config.time)
		old_time = config.time;
	else
		old_time = 45;
}

// Called when the done button is clicked from the back of the widget
//
// event: onClick event from the done button

function showFront(event)
{
	// Apple stuff
	
    var front = document.getElementById("front");
    var back = document.getElementById("back");

    if (window.widget) {
        widget.prepareForTransition("ToFront");
    }

    front.style.display = "block";
    back.style.display = "none";

    if (window.widget) {
        setTimeout('widget.performTransition();', 0);
    }
	
	// my stuff

	if (update_preferences() == 0) {
		if (config.stop_code != old_stop_code) {
			display_message("Loading&hellip;");
			set_title(get_verbose_stop_name_from_code(config.stop_code));
			update_data();
		} else if (config.time > old_time) {
			// This is an "else if" because if the stop changed, the data will
			// be refetched using the newly-chosen time anyway so we don't need
			// to do anything extra. We don't bother to do anything if the
			// newly-selected time is *less* than the previous time; it'll be
			// fixed within a minute anyway.

			update_data();
		}
	}
}

// Show the route selection pane
//
// event: onClick event from the done button

function showRoutes(event)
{
	// Apple stuff
	
    var routes = document.getElementById("route_selection");
    var back = document.getElementById("back");

    if (window.widget) {
        widget.prepareForTransition("ToRoutes");
    }

    routes.style.display = "block";
    back.style.display = "none";

    if (window.widget) {
        setTimeout('widget.performTransition();', 0);
    }
}

// Called when the info button is clicked to show the back of the widget
//
// event: onClick event from the info button

function showBackFromRoutes(event)
{
	// Apple stuff
	
    var routes = document.getElementById("route_selection");
    var back = document.getElementById("back");

    if (window.widget) {
        widget.prepareForTransition("ToBack");
    }

    routes.style.display = "none";
    back.style.display = "block";

    if (window.widget) {
        setTimeout('widget.performTransition();', 0);
    }
}




// 
// ### My event handlers
//

function button_look_up_code_handler(event)
{
    widget.openURL("http://www.cumtd.com/maps-and-schedules/bus-stops");
	return;
}

function button_update_handler(event)
{
    widget.openURL("http://bdesham.github.com/cu-buses/index.html#download");
	return;
}

function lookahead_change_handler(event)
{
	var time = parseInt(document.getElementById("popup_lookahead").value);
    config.time = time;
	widget.setPreferenceForKey(time, dashcode.createInstancePreferenceKey("time"));
	return;
}

function text_version_handler(event)
{
    widget.openURL("http://bdesham.github.com/cu-buses/");
	return;
}

function toggleCheckbox(event)
{
    var route = event.toElement.innerText.replace(/ .+/, "");
	var checkbox = document.getElementById("input_" + route);
	checkbox.checked = !checkbox.checked;
	return;
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


