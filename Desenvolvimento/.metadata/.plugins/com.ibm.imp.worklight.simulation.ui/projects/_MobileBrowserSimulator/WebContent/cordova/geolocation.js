/*
 * Cordova is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010-2011, IBM Corporation
 */

if (!Cordova.hasResource("geolocation")) {
	Cordova.addResource("geolocation");

	/**
	 * This class provides access to device GPS data.
	 * 
	 * @constructor
	 */
	var Geolocation = function() {

		// The last known GPS position.
		this.lastPosition = null;

		// Geolocation listeners
		this.listeners = {};
	};

	/**
	 * Coordinates object
	 */
	Coordinates = function(latitude, longitude, altitude, accuracy,
			altitudeAccuracy, heading, speed) {
		this.latitude = latitude;
		this.longitude = longitude;
		this.altitude = altitude;
		this.accuracy = accuracy;
		this.altitudeAccuracy = altitudeAccuracy;
		this.heading = heading;
		this.speed = speed;
	};
	/**
	 * Position object
	 */
	Position = function(c, t) {
		this.coords = c; // Coordinates
		this.timestamp = t;
	};

	/**
	 * Position error object
	 * 
	 * @constructor
	 * @param code
	 * @param message
	 */
	PositionError = function(code, message) {
		this.code = code;
		this.message = message;
	};

	PositionError.PERMISSION_DENIED = 1;
	PositionError.POSITION_UNAVAILABLE = 2;
	PositionError.TIMEOUT = 3;

	/**
	 * Asynchronously aquires the current position.
	 * 
	 * @param {Function}
	 *            successCallback The function to call when the position data is
	 *            available
	 * @param {Function}
	 *            errorCallback The function to call when there is an error
	 *            getting the heading position. (OPTIONAL)
	 * @param {PositionOptions}
	 *            options The options for getting the position data. (OPTIONAL)
	 */
	Geolocation.prototype.getCurrentPosition = function(successCallback,
			errorCallback, options) {
		_consoleLog("Geolocation.getCurrentPosition()");

		var maximumAge = 10000;
		var enableHighAccuracy = false;
		var timeout = 10000;
		if (typeof options !== "undefined") {
			if (typeof options.maximumAge !== "undefined") {
				maximumAge = options.maximumAge;
			}
			if (typeof options.enableHighAccuracy !== "undefined") {
				enableHighAccuracy = options.enableHighAccuracy;
			}
			if (typeof options.timeout !== "undefined") {
				timeout = options.timeout;
			}
		}
		// navigator._geo.listeners.global = {"success" : successCallback,
		// "fail" : errorCallback };
		Cordova.exec(successCallback, errorCallback, "Geolocation",
				"getCurrentLocation",
				[ enableHighAccuracy, timeout, maximumAge ]);
	};

	/**
	 * Asynchronously watches the geolocation for changes to geolocation. When a
	 * change occurs, the successCallback is called with the new location.
	 * 
	 * @param {Function}
	 *            successCallback The function to call each time the location
	 *            data is available
	 * @param {Function}
	 *            errorCallback The function to call when there is an error
	 *            getting the location data. (OPTIONAL)
	 * @param {PositionOptions}
	 *            options The options for getting the location data such as
	 *            frequency. (OPTIONAL)
	 * @return String The watch id that must be passed to #clearWatch to stop
	 *         watching.
	 */
	Geolocation.prototype.watchPosition = function(successCallback,
			errorCallback, options) {
		var maximumAge = 10000;
		var enableHighAccuracy = false;
		var timeout = 10000;
		if (typeof options !== "undefined") {
			if (typeof options.frequency !== "undefined") {
				maximumAge = options.frequency;
			}
			if (typeof options.maximumAge !== "undefined") {
				maximumAge = options.maximumAge;
			}
			if (typeof options.enableHighAccuracy !== "undefined") {
				enableHighAccuracy = options.enableHighAccuracy;
			}
			if (typeof options.timeout !== "undefined") {
				timeout = options.timeout;
			}
		}

		// Start watch timer
		var id = Cordova.createUUID();
		// navigator._geo.listeners[id] = setInterval(function() {
		Cordova.exec(successCallback, errorCallback, "Geolocation", "start", [
				id, enableHighAccuracy, timeout, maximumAge ]);
		return id;
	};

	/**
	 * Clears the specified heading watch.
	 * 
	 * @param {String}
	 *            id The ID of the watch returned from #watchPosition
	 */
	Geolocation.prototype.clearWatch = function(id) {
		Cordova.exec(null, null, "Geolocation", "stop", [ id ]);
		delete navigator._geo.listeners[id];
	};

	/**
	 * Force the Cordova geolocation to be used instead of built-in.
	 */
	Geolocation.usingCordova = false;
	Geolocation.useCordova = function() {
		if (Geolocation.usingCordova) {
			return;
		}
		Geolocation.usingCordova = true;
		_consoleLog("#################### Using Cordova geolocation.");

		// Set built-in geolocation methods to our own implementations
		// (Cannot replace entire geolocation, but can replace individual
		// methods)
		navigator.geolocation.setLocation = navigator._geo.setLocation;
		navigator.geolocation.getCurrentPosition = navigator._geo.getCurrentPosition;
		navigator.geolocation.watchPosition = navigator._geo.watchPosition;
		navigator.geolocation.clearWatch = navigator._geo.clearWatch;
		navigator.geolocation.start = navigator._geo.start;
		navigator.geolocation.stop = navigator._geo.stop;
	};

	Cordova.addConstructor(function() {
		navigator._geo = new Geolocation();
		// With Firefox, when we modify the geolocation service, it
		// automatically gets
		// reset to its original value after a few seconds. Therefore, we cannot
		// override it
		var browserUserAgent = navigator.userAgent;
		if (typeof navigator.originalUserAgent !== "undefined")
			browserUserAgent = navigator.originalUserAgent;
		if (browserUserAgent.indexOf('Firefox') == -1) {
			navigator.geolocation = navigator._geo;
			Geolocation.useCordova();
		} else {
			navigator.geolocation.start = navigator._geo.start;
			navigator.geolocation.stop = navigator._geo.stop;
		}
	});

};
