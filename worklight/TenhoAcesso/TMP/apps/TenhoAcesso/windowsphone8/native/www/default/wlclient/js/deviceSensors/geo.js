
/* JavaScript content from wlclient/js/deviceSensors/geo.js in Common Resources */
/**
 * @license
 * Licensed Materials - Property of IBM
 * 5725-G92 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */
/**
 * Geographic location sensor
 */
(function(WL) {
	

function __Geo() {
	var triggersManager = new __GEOTriggers;

	var watchId = null;
	var watchOptions = null;
	
	var supportsExtendedGeolocation =	WL.Client.getEnvironment() === WL.Env.IPHONE ||
										WL.Client.getEnvironment() === WL.Env.IPAD ||
										WL.Client.getEnvironment() === WL.Env.ANDROID;
	
	var updateDeviceContext = function(pos) {
		WL.Logger.debug("Updating Geo context");
		WL.Device.context.Geo = pos;
		WL.Device.context.lastModified = pos.timestamp;
		WL.Device.context.timezoneOffset = new Date().getTimezoneOffset(); 
		WL.Client.__deviceContextTransmission.updateSensor("Geo");
	};
	
	function clearWatch() {
		if (supportsExtendedGeolocation) {
			WL.Device.extendedGeolocation.clearWatch(watchId);				
		}
		else {
			navigator.geolocation.clearWatch(watchId);
		}
		watchId = null;
	};
	
    function isIOSEnv() {
        return WL.EnvProfile.isEnabled(WL.EPField.ISIOS);
    }
	
	// Returns default params, overrides if provided with values
	function parseParameters(options) {
	    var opt = {
	        maximumAge: 100,
	        timeout: Infinity,
	        enableHighAccuracy: false,
	        desiredAccuracy: 0,
	        minChangeDistance: 0,
	    	minChangeTime: 0
	    };

	    if (options) {
	        if (options.maximumAge !== undefined && !isNaN(options.maximumAge) && options.maximumAge > 100) {
	            opt.maximumAge = options.maximumAge;
	        }
	        if (options.enableHighAccuracy !== undefined) {
	            opt.enableHighAccuracy = options.enableHighAccuracy;
	        }
	        if (options.timeout !== undefined && !isNaN(options.timeout)) {
	            if (options.timeout < 0) {
	                opt.timeout = 0;
	            } else {
	                opt.timeout = options.timeout;
	            }
	        }
	        // additions over Cordova
	        if (options.minChangeDistance !== undefined && !isNaN(options.minChangeDistance) && options.minChangeDistance > 0) {
	            opt.minChangeDistance = options.minChangeDistance;
	        }
	        if (options.minChangeTime !== undefined && !isNaN(options.minChangeTime) && options.minChangeTime > 0) {
	        	opt.minChangeTime = options.minChangeTime;
	        }
	        if (options.enableHighAccuracy) {
	        	// optional highAccuracyOptions - translated internally to a single desiredAccuracy attribute
	        	if (options.highAccuracyOptions && (typeof options.highAccuracyOptions == 'object')) {
	        		var highAccuracyOptions = options.highAccuracyOptions;
	        		if (highAccuracyOptions.desiredAccuracy !== undefined && !isNaN(highAccuracyOptions.desiredAccuracy) && highAccuracyOptions.desiredAccuracy > 0) {
	        			opt.desiredAccuracy = highAccuracyOptions.desiredAccuracy;
	        		}
	        		// in iOS, if the iOSBestAccuracy attribute is defined - it overrides the desiredAccuracy attribute
	        		if (isIOSEnv() &&
	        				(highAccuracyOptions.iOSBestAccuracy === WL.Device.Geo.IOS_BEST_ACCURACY || 
	        				 highAccuracyOptions.iOSBestAccuracy === WL.Device.Geo.IOS_BEST_ACCURACY_FOR_NAVIGATION)) {
	        			opt.desiredAccuracy = highAccuracyOptions.iOSBestAccuracy;
	        		}
	        	}
	        }
	    }

	    return opt;
	};
	
	
	/** 
	 * Start location acquisition. On each location change, update the device context and trigger application callbacks and events transmission.
	 *   
	 * @param {function} errorCallback - executed in case acquisition fails. The function should take an error param. 
	 * 		For structure of the object and list of error codes, see the documentation of navigator.geolocation.watchPosition() 
	 * @param options - configure the acquisition. An optional parameter with optional properties named: 
	 * 		<li>	enableHighAccuracy (boolean)
	 *		<li>	timeout (seconds to wait for initial reading, then max interval between readings)
	 *		<li>	maximumAge (indicates that the acquisition may return caches positions whose ages are no greater than the specified time in milliseconds)
	 * 		For more details, @see navigator.geolocation.watchPosition() 
	 * */
	this.startAcquisition = function(onFailure,options,triggers) {	
		if (!WL.Device.context.hasOwnProperty("Geo")) {
			WL.Device.context.Geo = {}; // initialize to empty state			
			WL.Client.__deviceContextTransmission.updateSensor("Geo");
		}

		watchOptions = parseParameters(options);
		triggersManager.updateTriggers(triggers,options,"Geo");
		var startTime = new Date().getTime();
		
		function onSuccess(pos) {
			// ignore updates received after acquisition was stopped
			if(watchId == null) {
				return;
			}
			pos = fixPosition(pos);
            
			updateDeviceContext(pos);						
			triggersManager.locationAcquired(pos,"Geo"); 
		};
		
		function fail(err) {
			// ignore errors received after acquisition was stopped
			if(watchId == null) {
				return;
			}	
			onFailure(err);
		};
		
		if (watchId != null) {
			clearWatch();
		}
		
		watchId = true;  
		// this is done since watchId is used as a flag in the above onSuccess() function,  
		// which may be called from within the next call - watchPosition() - if a cached position is used

		if (supportsExtendedGeolocation) {
			watchId = WL.Device.extendedGeolocation.watchPosition(onSuccess, fail, watchOptions);				
		}
		else {
			watchId = navigator.geolocation.watchPosition(onSuccess, fail, watchOptions);
		}	
	};
	
	function fixPosition(position) {
		if (typeof position.timestamp === 'object') {
			var pos = WLJSX.Object.clone(position);			
			pos.timestamp = pos.timestamp.getTime(); // we want the timestamp to be the number of milliseconds since 1970. But in some environments it's a Date object
			return pos;			
		}
		return position;

	}
	
	/**
	 * stop the acquisition
	 */
	this.stopAcquisition = function() {
		if (watchId != null) {
			clearWatch();
		}
		
		triggersManager.clearTriggers();
		
		if (WL.Device.context.hasOwnProperty("Geo")) {
			WL.Client.__deviceContextTransmission.deleteSensor("Geo");
			delete WL.Device.context.Geo;
		}
		
		watchOptions = null;
	};
	
	
	/** 
	 * Acquire a location. Upon success: 
 	 * <ol> update the context (if 'ongoing acquisition' is enabled, the request was for a same-or-better accuracy than the ongoing acquisition,
 	 * 		and the new position is fresher than the context) 
	 * <ol> perform a callback
	 * <ol> dispatch the triggers (under the same conditions as above) 
	 * Params:
	 * <li> error callback - executed in case acquisition fails. The function should take an error param. 
	 * 		For structure of the object and list of error codes, see the documentation of navigator.geolocation.watchPosition() 
	 * <li> options - configure the acquisition. An optional parameter with optional properties named: 
	 * 			enableHighAccuracy (boolean)
	 *			timeout (seconds to wait for acquisition)
	 *			maximumAge (indicates that the acquisition may return caches positions whose ages are no greater than the specified time in milliseconds)
	 * 		For more details, @see navigator.geolocation.watchPosition() 
	 * */
	this.acquirePosition = function(onSuccess, onFailure, options) {
		options = parseParameters(options);
		
		function successFn(pos) {
			pos = fixPosition(pos);
			
			function updateRequired() {
				if (watchId == null)
					return false; // update is required only if watching
				var lastPosition = WL.Device.context.Geo;
				if (lastPosition) {  // if a reading was already fetched, check if we need to update it
					if (pos.timestamp < lastPosition.timestamp)
						return false;
					if (pos.timestamp === lastPosition.timestamp && pos.longitude === lastPosition.longitude && 
							pos.latitude === lastPosition.latitude && pos.altitude === lastPosition.altitude &&
							pos.accuracy === lastPosition.accuracy)
						return false; // same reading - no need to update
					if (!options.enableHighAccuracy && watchOptions.enableHighAccuracy) {
						return false;  // new reading was for low accuracy, when watch is for high accuracy - don't update
					}
				}
				return true;	 
			};

			
			if (updateRequired()) {  		// if needed, change the device context
				updateDeviceContext(pos);
			}
			try{
				onSuccess(pos);  			// in any case - call the success callback
			}
			catch(e) {
				  WL.Logger.error("Exception thrown from Geo location acquisition callback: " + e);
			}
			if (updateRequired()) {   		// if (still) needed - evaluate the triggers   (needs a second check since the policy might have been changed by the callback)
				triggersManager.locationAcquired(pos,"Geo"); 
			}
		};
		
		if (supportsExtendedGeolocation) {
			WL.Device.extendedGeolocation.getCurrentPosition(successFn, onFailure, options);				
		}
		else {
			navigator.geolocation.getCurrentPosition(successFn, onFailure, options);		
		}
	};
	
	this.IOS_BEST_ACCURACY = -1;
	this.IOS_BEST_ACCURACY_FOR_NAVIGATION = -2;
	
	this.Profiles = {
			PowerSaving: function() {
				return {
					enableHighAccuracy:false,
					minChangeTime: 300000, //5 minutes
					minChangeDistance: 1000, // 1Km
					maximumAge: 300000  //5 minutes
				};
			},
			RoughTracking: function() {
				return {
					enableHighAccuracy:true,
					highAccuracyOptions: {
						desiredAccuracy: 200  //meters
					},
					minChangeTime: 30000, //30 seconds
					minChangeDistance: 50, // meters
					maximumAge: 60000  //60 seconds
				};
			},
			LiveTracking: function() {
				return {
					enableHighAccuracy:true,
					highAccuracyOptions: {
						iOSBestAccuracy: WL.Device.Geo.IOS_BEST_ACCURACY
					},
					maximumAge: 0 
				};
			}
	}

};

WL.Device.Geo = new __Geo();

})(WL);


