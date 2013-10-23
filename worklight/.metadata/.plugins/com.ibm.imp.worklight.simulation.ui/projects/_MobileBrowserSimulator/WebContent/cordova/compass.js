/*
 * Cordova is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010-2011, IBM Corporation
 */

if (!Cordova.hasResource("compass")) {

	Cordova.addResource("compass");
	(function() {

		/**
		 * This class provides access to device Compass data.
		 * 
		 * @constructor
		 */
		var Compass = function() {
			/**
			 * The last known Compass position.
			 */
			this.lastHeading = null;

			/**
			 * List of compass watch timers
			 */
			this.timers = {};
		};

		CompassHeading = function(magneticHeading, trueHeading, headingAccuracy, timestamp) {
			  this.magneticHeading = (magneticHeading !== undefined ? magneticHeading : null);
			  this.trueHeading = (trueHeading !== undefined ? trueHeading : null);
			  this.headingAccuracy = (headingAccuracy !== undefined ? headingAccuracy : null);
			  this.timestamp = (timestamp !== undefined ? timestamp : new Date().getTime());
		};

		CompassError = function(err) {
		    this.code = (err !== undefined ? err : null);
		};

		CompassError.COMPASS_INTERNAL_ERR = 0;
		CompassError.COMPASS_NOT_SUPPORTED = 1;

		/**
		 * Asynchronously acquires the current heading.
		 * 
		 * @param {Function}
		 *            successCallback The function to call when the heading data
		 *            is available
		 * @param {Function}
		 *            errorCallback The function to call when there is an error
		 *            getting the heading data. (OPTIONAL)
		 * @param {PositionOptions}
		 *            options The options for getting the heading data such as
		 *            timeout. (OPTIONAL)
		 */
		Compass.prototype.getCurrentHeading = function(successCallback,
				errorCallback, options) {
            if (typeof successCallback !== "function") {
                console.log("Compass Error: successCallback is not a function");
                return;
              }

              // errorCallback optional
              if (errorCallback && (typeof errorCallback !== "function")) {
                console.log("Compass Error: errorCallback is not a function");
                return;
              }

              var win = function(result) {
                  var ch = new CompassHeading(result.magneticHeading, result.trueHeading, result.headingAccuracy, result.timestamp);
                  successCallback(ch);
              };
              var fail = function(code) {
                  var ce = new CompassError(code);
                  errorCallback(ce);
              };


			// Get heading
			Cordova.exec(win, fail, "Compass", "getHeading", options);
		};

		/**
		 * Asynchronously aquires the heading repeatedly at a given interval.
		 * 
		 * @param {Function}
		 *            successCallback The function to call each time the heading
		 *            data is available
		 * @param {Function}
		 *            errorCallback The function to call when there is an error
		 *            getting the heading data. (OPTIONAL)
		 * @param {HeadingOptions}
		 *            options The options for getting the heading data such as
		 *            timeout and the frequency of the watch. For iOS, filter parameter
         *            specifies to watch via a distance filter rather than time.(OPTIONAL)
		 * @return String The watch id that must be passed to #clearWatch to
		 *         stop watching.
		 */
		Compass.prototype.watchHeading = function(successCallback,
				errorCallback, options) {
            // Default interval (100 msec)
            var frequency = (options !== undefined && options.frequency !== undefined) ? options.frequency : 100;
            var filter = (options !== undefined && options.filter !== undefined) ? options.filter : 0;

            // successCallback required
            if (typeof successCallback !== "function") {
              console.log("Compass Error: successCallback is not a function");
              return;
            }

            // errorCallback optional
            if (errorCallback && (typeof errorCallback !== "function")) {
              console.log("Compass Error: errorCallback is not a function");
              return;
            }

            var id = Cordova.createUUID();
            if (filter > 0) {
                // is an iOS request for watch by filter, no timer needed
            	navigator.compass.timers[id] = "iOS";
                navigator.compass.getCurrentHeading(successCallback, errorCallback, options);
            } else {
                // Start watch timer to get headings
            	 navigator.compass.timers[id] = window.setInterval(
					function() {
						navigator.compass.getCurrentHeading(successCallback, errorCallback);
					},
					frequency);
            }

            return id;
		};

		/**
		 * Clears the specified heading watch.
		 * 
		 * @param {String}
		 *            id The ID of the watch returned from #watchHeading.
		 */
		Compass.prototype.clearWatch = function(id) {
            // Stop javascript timer & remove from timer list
            if (id && navigator.compass.timers[id]) {
                if (navigator.compass.timers[id] != "iOS") {
                      window.clearInterval(navigator.compass.timers[id]);
                  } else {
                    // is iOS watch by filter so call into device to stop
                    Cordova.exec(null, null, "Compass", "stopHeading", []);
                }
                delete navigator.compass.timers[id];
            }

			/*// Stop javascript timer & remove from timer list
			if (id && navigator.compass.timers[id]) {
				clearInterval(navigator.compass.timers[id]);
				delete navigator.compass.timers[id];
			}*/
		};
		Cordova.addConstructor(function() {
			navigator.compass = new Compass();
		});
	}());
}
