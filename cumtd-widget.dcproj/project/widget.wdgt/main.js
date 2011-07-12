/* 
 This file was generated by Dashcode.  
 You may edit this file to customize your widget or web page 
 according to the license.txt file included in the project.
 */

// 
// # Global variables
//

//var stops;

var updateDisplayInterval;

var api_key = "afea17046e244cda8f56b5e1fe5f2019";

var json_success;

// time between refreshes (in milliseconds)
var refresh_interval = 1000*60;

// default configuration

/*var config = {
	"time": 30,
	"stop": "IT:1",
	"stop_verbose": "Green and Cedar"
};
*/


//
// # Backend application logic
//

//
// ## Network stuff
//

function json_success_callback(json)
{
	json_success = true;
	
	if (json.stat == "ok") {
		window.console.log("successfully got data, stat = ok");
	
		var data = process_json(json);
		refresh_ui_from_data(data);
	} else {
		display_message("Sorry, but the CUMTD server seems to be having problems.");
		window.console.log("got data from server, but stat = \"" + json.stat + "\"");
	}
}

function update_data()
{
	var args = {
		'key': api_key,
		'stop_id': config.stop_id,
		'pt': config.time
	};
	
	json_success = false;
	
	$.getJSON('http://developer.cumtd.com/api/v1.0/json/departures.getListByStop',
		args, json_success_callback);
	
	// give the request five seconds to complete and show an error if it's not done by then.
	// (the JSON request is asynchronous so if we make the request and immediately check its
	// status, it almost certainly won't be done yet and we'll incorrectly show the user an
	// error message.) if the request *does* go through but it takes more than five seconds,
	// we'll show an (incorrect) error for a little while but then the data will be displayed
	// properly.
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
	
	json_success_callback(fake_data_no_buses);
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
	
	window.console.log(departures.length + " departures");
	
	for (var i = 0; i < departures.length; i++) {
		var depart = departures[i];
		
		var expected = convert_date(depart["expected"]);
		var time = Math.floor((expected - now)/(1000*60));
		
		result["departures"][i] = {
			"route": depart["route"],
			"ending": depart["destination"]["stop_id"],
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

// returns the time in the 12-hour format "HH:MM {AM,PM}"

function get_current_time()
{
	var now = new Date();
	var hour = now.getHours();
	var minutes = now.getMinutes();
	
	if (minutes < 10)
		minutes = "0" + minutes;
	
	if (hour <= 11)
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
	var result = new Date(pieces[2] + "/" + pieces[3] + "/" + pieces[1] + " " + pieces[4] + " GMT-0500");
	
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
		window.console.log("No stop_id found for \"" + stop + "\"");
		return "";
	}
}

function get_intersection_id(stop)
{
	if (stop in stops) {
		var id = stops[stop]["id"];
		return id.replace(/:\d+/, "");
	}
	else {
		window.console.log("No stop_id found for \"" + stop + "\"");
		return "";
	}
}

function get_verbose_stop_name_from_code(stop)
{
	if (stop in stops)
		return stops[stop]["verbose"];
	else {
		window.console.log("No verbose name found for \"" + stop + "\"");
		return "";
	}
}

function get_verbose_stop_name_from_id(id)
{
	for (key in stops) {
		if (stops[key]["id"] == id)
			return stops[key]["verbose"];
	}
	
	window.console.log("No verbose name found for \"" + id + "\"");	
	return "";
}

//
// ## Functions to deal with routes
//

function prettify_route_name(name)
{
	name = wrap_in_span(name, "OPPER", "font-size: 85%");
//	name = wrap_in_span(name, "Orchard Downs", "font-size: 80%");
	name = wrap_in_span(name, "Limited", "font-size: 85%; text-transform: uppercase");
	
	if (name.match(/Teal Orchard Downs/i)) {
		name = name.replace("Orchard Downs", "Orch. Downs");
		name = "<span style='font-size: 85%'>" + name + "</span>";
	}
	
	return name;
}


//
// # Preference handling
//

function update_preferences()
{
	// set the stop code
	
	var key = "stop_code";
	var value = document.getElementById("field_stop").value;
	
	window.console.log("value is " + value);
	
	widget.setPreferenceForKey(value, widget.identifier + "-" + key);
	
	read_preferences();
}

// read the preferences from the plist. returns 0 on success or 1 otherwise--presumably
// this would mean there aren't yet preferences

function read_preferences()
{
	var stop_code = widget.preferenceForKey(widget.identifier + "-" + "stop_code");
	
	if (stop_code) {
		config = {
			"time": 30,
			"stop_code": stop_code,
			"stop_id": get_intersection_id(stop_code),
			"stop_verbose": get_verbose_stop_name_from_code(stop_code)
		};
		
		return 0;
	} else {
		stop_code = "0156";
		config = {
			"time": 30,
			"stop_code": stop_code,
			"stop_id": get_intersection_id(stop_code),
			"stop_verbose": get_verbose_stop_name_from_code(stop_code)
		};
		
		return 1;
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
	var list = document.getElementById("list").object;

	var departures = data.departures;
	var dummy = array_of_spaces(departures.length);
	list.setDataArray(dummy);
	
	//
	// top and bottom labels
	//
	
	set_title(config["stop_verbose"]);
	set_status("Updated at " + get_current_time());

	
	// handle the case where there are no departures. (we assume here that we got a valid
	// response from the server, but it contained no departures. the error-checking to make
	// sure that we did get a valid response is somewhere else.)
	
	if (departures.length == 0) {
		display_message("There are no buses coming in the next " + config.time + " minutes.");
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
		row.templateElements.route_text.setAttribute("title", "Route ends at " + terminus);

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

function startTimer()
{
    update_data();

    if (!updateDisplayInterval)
        updateDisplayInterval = setInterval(update_data, refresh_interval);
}

function stopTimer()
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
	document.getElementById("status_text").innerText = text;
}

//
// ## Miscellaneous UI utility functions
//

function wrap_in_span(text, words, style)
{
	return text.replace(words, "<span style='" + style + "'>" + words + "</span>");
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
	
	read_preferences();
	
	startTimer();
	
	//update_data();
}

// Called when the widget has been removed from the Dashboard

function remove()
{
	widget.setPreferenceForKey(null, dashcode.createInstancePreferenceKey("stop_id"));
	
	stopTimer();
}

// Called when the widget has been hidden

function hide()
{
    stopTimer();
}

// Called when the widget has been shown

function show()
{
    // Restart any timers that were stopped on hide
	read_preferences();
	//update_data();
	startTimer();
}

// Called when the widget has been synchronized with .Mac

function sync()
{
}

// Called when the info button is clicked to show the back of the widget
//
// event: onClick event from the info button

function showBack(event)
{
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
}

// Called when the done button is clicked from the back of the widget
//
// event: onClick event from the done button

function showFront(event)
{
    var front = document.getElementById("front");
    var back = document.getElementById("back");

    if (window.widget) {
        widget.prepareForTransition("ToFront");
    }

    front.style.display="block";
    back.style.display="none";

    if (window.widget) {
        setTimeout('widget.performTransition();', 0);
    }
	
	update_preferences();
	update_data();
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
    widget.openURL("https://github.com/bdesham/cu-buses");
	return;
}


//
// # Code that will actually run! (i.e., not functions)
//

if (window.widget) {
    widget.onremove = remove;
    widget.onhide = hide;
    widget.onshow = show;
    widget.onsync = sync;
}