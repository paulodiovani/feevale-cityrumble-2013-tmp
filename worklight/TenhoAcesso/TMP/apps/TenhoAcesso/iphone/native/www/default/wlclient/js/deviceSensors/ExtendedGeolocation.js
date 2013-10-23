
/* JavaScript content from wlclient/js/deviceSensors/ExtendedGeolocation.js in Common Resources */
/**
 * @license
 * Licensed Materials - Property of IBM
 * 5725-G92 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */
/* Based on Cordova geolocation.js:
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/
(function(WL) {
	

function __ExtendedGeolocation() {
    var lastPosition = null; // reference to last known (cached) position returned
    var watches = {};   // list of watches in use
    var self = this;

	 // Returns a timeout failure, closed over a specified timeout value and error callback.
	 function createTimeout(errorCallback, timeout) {
	     var t = setTimeout(function() {
	         clearTimeout(t);
	         t = null;
	         errorCallback({
	             code:PositionError.TIMEOUT,
	             message:"Position retrieval timed out."
	         });
	     }, timeout);
	     return t;
	 }

    /**
   * Asynchronously acquires the current position.
   *
   * @param {Function} successCallback    The function to call when the position data is available
   * @param {Function} errorCallback      The function to call when there is an error getting the heading position. (OPTIONAL)
   * @param {PositionOptions} options     The options for getting the position data. (OPTIONAL)
   */
   this.getCurrentPosition = function(successCallback, errorCallback, options) {
//        argscheck.checkArgs('fFO', 'highAccuracyGeolocation.getCurrentPosition', arguments);
//        options = parseParameters(options); -- unnecessary - done in geo.js

        // Timer var that will fire an error callback if no position is retrieved from native
        // before the "timeout" param provided expires
	   	var id = createUUID();
        var timeoutTimer = {timer:null, id: id};
        
        var win = function(p) {
        	console.debug("getPosition acquired location at" + p.timestamp);
            clearTimeout(timeoutTimer.timer);
            if (!(timeoutTimer.timer)) {
                // Timeout already happened, or native fired error callback for
                // this geo request.
                // Don't continue with success callback.
                return;
            }
            var pos = new Position(
                {
                    latitude:p.latitude,
                    longitude:p.longitude,
                    altitude:p.altitude,
                    accuracy:p.accuracy,
                    heading:p.heading,
                    velocity:p.velocity,
                    altitudeAccuracy:p.altitudeAccuracy
                },
                p.timestamp // changed from Cordova since we want the timestamp, not a Date
            );
            lastPosition = pos;
            successCallback(pos);
        };
        var fail = function(e) {
        	console.debug("getPosition - error " + e);
            clearTimeout(timeoutTimer.timer);
            timeoutTimer.timer = null;
            var err = new PositionError(e.code, e.message);
            if (err.code === PositionError.TIMEOUT) {
            	//need to remove the callback and potentially stop listening to changes
            	self.execRemoveCallback(id);
            } 
            if (errorCallback) {
                errorCallback(err);
            }
        };

        // Check our cached position, if its timestamp difference with current time is less than the maximumAge, then just
        // fire the success callback with the cached position.
        if (lastPosition && (((new Date()).getTime() - lastPosition.timestamp) <= options.maximumAge)) {
            successCallback(lastPosition);
        // If the cached position check failed and the timeout was set to 0, error out with a TIMEOUT error object.
        } else if (options.timeout === 0) {
            fail({
                code:PositionError.TIMEOUT,
                message:"timeout value in PositionOptions set to 0 and no cached Position object available, or cached Position object's age exceeds provided PositionOptions' maximumAge parameter."
            });
        // Otherwise we have to call into native to retrieve a position.
        } else {
            if (options.timeout !== Infinity) {
                // If the timeout value was not set to Infinity (default), then
                // set up a timeout function that will fire the error callback
                // if no successful position was retrieved before timeout expired.
                timeoutTimer.timer = createTimeout(fail, options.timeout);
            } else {
                // This is here so the check in the win function doesn't mess stuff up
                // may seem weird but this guarantees timeoutTimer is
                // always truthy before we call into native
                timeoutTimer.timer = true;
            }
            this.execGetPosition(id,win,fail,options); 
            
        }
        
        return timeoutTimer;
    };
    /**
     * Asynchronously watches the geolocation for changes to geolocation.  When a change occurs,
     * the successCallback is called with the new location.
     *
     * @param {Function} successCallback    The function to call each time the location data is available
     * @param {Function} errorCallback      The function to call when there is an error getting the location data. (OPTIONAL)
     * @param {PositionOptions} options     The options for getting the location data such as frequency. (OPTIONAL)
     * @return String                       The watch id that must be passed to #clearWatch to stop watching.
     */
    this.watchPosition =function(successCallback, errorCallback, options) {
//       argscheck.checkArgs('fFO', 'highAccuracyGeolocation.watchPosition', arguments);
//       options = parseParameters(options);

        // Tell device to get a position ASAP, and also retrieve a reference to the timeout timer generated in getCurrentPosition
    	var watch = this.getCurrentPosition(successCallback, errorCallback, options);
        var id = watch.id;
    	watches[id]= watch;

        var fail = function(e) {
        	console.debug("error acquiring location: "+ e.code);

            clearTimeout(watches[id].timer);
            var err = new PositionError(e.code, e.message);
            if (errorCallback) {
                errorCallback(err);
            }
        };

        var win = function(p) {
        	console.debug("new location acquired at: "+ p.timestamp);

        	// make sure we don't report anything older than the last location updated
			if (lastPosition && p.timestamp <= lastPosition.timestamp) {
				console.debug("Acquired location is older or same as the previous location. Ignoring.");
				return;
            }
			
            clearTimeout(watches[id].timer);
            
            if (options.timeout !== Infinity) {
                watches[id].timer = createTimeout(fail, options.timeout);
            }
            
            var pos = new Position(
                    {
                        latitude:p.latitude,
                        longitude:p.longitude,
                        altitude:p.altitude,
                        accuracy:p.accuracy,
                        heading:p.heading,
                        velocity:p.velocity,
                        altitudeAccuracy:p.altitudeAccuracy
                    },
                    p.timestamp
                );
            lastPosition = pos;
            successCallback(pos);
        };
        
        this.execAddWatch(id, win, fail, options);

        return id;
    };
    /**
     * Clears the specified position watch.
     *
     * @param {String} id       The ID of the watch returned from #watchPosition
     */
    this.clearWatch = function(id) {
        if (id !== null && id !== undefined && watches[id] !== undefined) {
            clearTimeout(watches[id].timer);
            watches[id].timer = false;
            this.execClearWatch(id);
            this.execRemoveCallback(id);
            delete watches[id];
        }
    };
    
    /**
     * Create a UUID
     */
    function createUUID() {
        return UUIDcreatePart(4) + '-' +
            UUIDcreatePart(2) + '-' +
            UUIDcreatePart(2) + '-' +
            UUIDcreatePart(2) + '-' +
            UUIDcreatePart(6);
    }
    
    function UUIDcreatePart(length) {
        var uuidpart = "";
        for (var i=0; i<length; i++) {
            var uuidchar = parseInt((Math.random() * 256), 10).toString(16);
            if (uuidchar.length == 1) {
                uuidchar = "0" + uuidchar;
            }
            uuidpart += uuidchar;
        }
        return uuidpart;
    }

};

WL.Device.extendedGeolocation = new __ExtendedGeolocation();

})(WL);
/* JavaScript content from wlclient/js/deviceSensors/ExtendedGeolocation.js in iphone Common Resources */
/**
 * @license
 * Licensed Materials - Property of IBM
 * 5725-G92 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

(function(extendedGeolocation) {

	var MAX_INT = 2147483647; // largest 32-bit int

	function toInt(num) {
		return num > MAX_INT ? MAX_INT : num;
	}

	extendedGeolocation.execGetPosition = function(id, win, fail, options) {
		if (options.enableHighAccuracy) {
			cordova.exec(win, fail, "CoreLocationGetLocationPlugin","getLocation", [id, toInt(options.maximumAge),toInt(options.desiredAccuracy)]);
		} else {
			cordova.exec(win, fail, "SignificantChangeGetLocationPlugin","getLocation", [id, toInt(options.maximumAge)]);
		}
	};

	extendedGeolocation.execAddWatch = function(id, win, fail, options) {
		if (options.enableHighAccuracy) {
			cordova.exec(win, fail, "CoreLocationWatchPlugin", "addWatch", [id,toInt(options.maximumAge),toInt(options.desiredAccuracy),toInt(options.minChangeDistance)]);
		} else {
			cordova.exec(win, fail, "SignificantChangeWatchPlugin", "addWatch",[id,toInt(options.maximumAge)]);
		}
	};

	extendedGeolocation.execClearWatch = function(id) {
		cordova.exec(null, null, "CoreLocationWatchPlugin", "clearWatch",[id]);
		cordova.exec(null, null, "SignificantChangeWatchPlugin", "clearWatch",[id]);
	};

	extendedGeolocation.execRemoveCallback = function(callbackId) {
		cordova.exec(null, null, "CoreLocationGetLocationPlugin","removeCallback", [callbackId]);
		cordova.exec(null, null, "SignificantChangeGetLocationPlugin","removeCallback", [callbackId]);
	};

})(WL.Device.extendedGeolocation);
