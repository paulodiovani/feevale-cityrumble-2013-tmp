
/* JavaScript content from wlclient/js/deviceSensors/wifi.js in Common Resources */
/**
 * @license
 * Licensed Materials - Property of IBM
 * 5725-G92 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */
	

__Wifi = function() {	
	
	/**
	 * Wifi sensor for Android and iOS
	 */
	this.PERMISSION = 0;
	this.DISABLED = 1;
	this.FAILED_START_SCAN = 2;
	
	var DEFAULT_INTERVAL = 10000;
	var DEFAULT_SIGNAL_STRENGTH = 15;
	
	var triggersManager = new __WIFITriggers;
	// parses the policy a more workable format
	
	function verifyPolicy(policy, verifyInterval)
	{
		if (policy == undefined || isEmpty(policy)){ 
			WL.Logger.error("Unsupported WIFI policy : should not be empty");
			throw new Error("Unsupported WIFI policy : should not be empty");
		}
		
		if (verifyInterval && policy.interval == undefined)
		{
			//using default interval
			policy.interval = DEFAULT_INTERVAL;
			WL.Logger.error("WIFI policy should include interval specification, using default: "+DEFAULT_INTERVAL);
		}
		
		if (policy.accessPointFilters == undefined)
		{
			WL.Logger.error("WIFI policy should include accessPointFilters specification");
			throw new Error("WIFI policy should include accessPointFilters specification");
		}
		
		if (policy.signalStrengthThreshold == undefined)
		{
			policy.signalStrengthThreshold = DEFAULT_SIGNAL_STRENGTH;
			WL.Logger.error("WIFI policy should include signalStrengthThreshold specification, using default: "+DEFAULT_SIGNAL_STRENGTH);
		}
	};
	
	function parsePolicy(policy) {
		var result = {};
		var specs = policy.accessPointFilters;
		for ( var i = 0; i < specs.length; i++) {
			var policyObj = specs[i];
			var ssid = policyObj.SSID;
			var mac = policyObj.MAC;
			if (!result[ssid]) {
				// an empty objects signifies no MAC address
				result[ssid] = {};
			}
			if (mac) {
				result[ssid][mac] = true;
			}
		}
		result.strength = policy.signalStrengthThreshold;
		return result;
	}

	//sort the entires in the results array, each entry of the type: {SSId: , MAC: } where MAC is optional
	function sortEntries(a,b)
	{
		if (a.SSID == b.SSID)
		{
			//compare MACS if exist
			if (a.MAC != undefined)
			{
				if (b.MAC == undefined){
					return 1;
				}
				//compare the MACs
				if (a.MAC > b.MAC) return 1;
				if (a.MAC < b.MAC) return -1;
				return 0;
			}else
			{
				if (b.MAC == undefined){
					return 0;
				}
				return -1;
			}
			
		}
		
		//compare the SSIDs
		if (a.SSID > b.SSID) return 1;
		if (a.SSID < b.SSID) return -1;
		return 0;
	}
	
	
	function isEmpty(obj) {
		for ( var key in obj) {
			return false;
		}
		return true;
	};
	
	// parses the raw data results, according to the policy
	function parseResults(policy, rawData) {
		// a method that check if an object is empty (no MAC address given in
		// policy)
		/*var isEmpty = function(obj) {
			for ( var key in obj) {
				return false;
			}
			return true;
		};*/

		var minStrength = policy.strength;
		var accessPoints = [];
		var result = {};		 
		var receivedSsids = {}; // used to filter repeats in case no MAC is
								// given
		for ( var i = 0; i < rawData.length; i++) {
			var scanResult = rawData[i];
			
			if (scanResult.strength < minStrength && scanResult.connected != true) {
				continue;
			}
			var ssid = scanResult.SSID;
			var mac = scanResult.MAC;
			
			if (policy["*"] !== undefined) //any SSIDs
			{
				if (isEmpty(policy["*"])) { // no MACs given - any network goes
					if (!receivedSsids[ssid]) { // only take first
						accessPoints.push({
							SSID : ssid
						});
						if (scanResult.connected)
						{
							if (!result.connectedAccessPoint)
							{
								result.connectedAccessPoint = {};
							}
							result.connectedAccessPoint.SSID = ssid;
						}						
						receivedSsids[ssid] = true;
					}
				} 
				else if (policy["*"][mac] || policy["*"]["*"]) {
					// mac expected, or "*"
					accessPoints.push({
						SSID : ssid,
						MAC : mac
					});
					if (scanResult.connected)
					{
						if (!result.connectedAccessPoint)
						{
							result.connectedAccessPoint = {};
						}
						result.connectedAccessPoint.SSID = ssid;
						result.connectedAccessPoint.MAC = mac;
					}
				}
			}
			
			if (policy[ssid] !== undefined) { // SSID is defined in policy
				if (isEmpty(policy[ssid])) { // no MAC given
					if (!receivedSsids[ssid]) { // only take first
						accessPoints.push({
							SSID : ssid
						});
						if (scanResult.connected)
						{
							if (!result.connectedAccessPoint)
							{
								result.connectedAccessPoint = {};
							}
							result.connectedAccessPoint.SSID = ssid;
						}						
						receivedSsids[ssid] = true;
					}
				} else if (policy[ssid][mac] || policy[ssid]["*"]) {
					// mac expected, or "*"
					accessPoints.push({
						SSID : ssid,
						MAC : mac
					});
					if (scanResult.connected)
					{
						if (!result.connectedAccessPoint)
						{
							result.connectedAccessPoint = {};
						}
						result.connectedAccessPoint.SSID = ssid;
						result.connectedAccessPoint.MAC = mac;
					}
				}
			}
		}
		result.accessPoints = accessPoints;		
		return result;
	}

	this.updateWifi = function(locationData) {
		var currDate = new Date();
		var now = currDate.getTime();
		locationData.timestamp = now;

		WL.Device.context.lastModified = now;
		WL.Device.context.timezoneOffset = currDate.getTimezoneOffset(); 
		WL.Device.context.Wifi = locationData;
		
		WL.Client.__deviceContextTransmission.updateSensor("Wifi");
	}

	// acquires raw data from the plugin
	this.acquireRawData = function(onSuccess, onFailure) {
		// if onFailure is undefined, use an empty function			
		cordova.exec(onSuccess, onFailure || function() {}, "WifiPlugin", "acquireWifi", []);
	}
	
	function syncRun(f) { // ensures all functions do not interfere with eachother
		setTimeout(f, 0);
	}

	// filters the data according to the specs (also parses the specs, unlike
	// parse results)
	function filterData(rawData, options) {
		var policy = options;
		policy = parsePolicy(policy);
		/*WL.Logger.debug("Filtering data: according to policy \n");
		WL.Logger.debug(JSON.stringify(policy));
		WL.Logger.debug("Filtering data: the raw data \n");
		WL.Logger.debug(JSON.stringify(rawData));
		WL.Logger.debug("Filtering data: the filtered data \n");*/
		var results = parseResults(policy, rawData);
		
		var accessPoints = results.accessPoints;
		//sort access points lexicographically
		accessPoints.sort(sortEntries);
		
		results.accessPoints = accessPoints;
		//WL.Logger.debug(JSON.stringify(results));
		return results;
	}
	
	function filterConnectedNetwork(rawData) {
		var result = null;
		
		for ( var i = 0; i < rawData.length; i++) {
			var scanResult = rawData[i];
		    if (scanResult.connected)
		    {
		    	//the connected network
		    	result = {}
		    	result.SSID = scanResult.SSID;
				result.MAC = scanResult.MAC;
				result.signalStrength = scanResult.strength;
				break;
		    }
		   
		}
		return result;
	};

	this.stopAcquisition  = function()
	{		
		this.stopAcquisitionInterval();
		triggersManager.clearTriggers();
		
		if (!WLJSX.Object.isUndefined(WL.Device.context.Wifi)) {		
			WL.Client.__deviceContextTransmission.deleteSensor("Wifi");
			delete WL.Device.context.Wifi;
		}
		
		if (this._intervalFiltering) 
		{
			this._intervalFiltering = null;
		}
		
		
	};
	
	this.startAcquisition = function(onFailure, policy, triggers) {
		var updateWifiMethod = this.updateWifi;
		var acquireRawDataMethod = this.acquireRawData;
		//verify that the policy contains all the required information
		verifyPolicy(policy,true);
		
		if (WLJSX.Object.isUndefined(WL.Device.context.Wifi)) {
			WL.Device.context.Wifi = {}; // initialize to empty state
			WL.Client.__deviceContextTransmission.updateSensor("Wifi");
		}
		
		if (this.intervalId) {				
			clearInterval(this.intervalId);
			this.intervalId = null;				
		}
		triggersManager.updateTriggers(triggers,policy, "Wifi");
		

		var intervalFiltering = function(rawData) {			
			var results = filterData(rawData, policy);
			updateWifiMethod(results);
			triggersManager.locationAcquired(results,"Wifi");
		};
		this._intervalFiltering = intervalFiltering;	

		this.intervalId = setInterval(function() {									
			acquireRawDataMethod(intervalFiltering, onFailure);
		}, policy.interval);
			
		
		

	};

	this.stopAcquisitionInterval = function() {
	
		var that = this;
			if (that.intervalId) {		
				clearInterval(that.intervalId);
				that.intervalId = null;				
			}
		
	};

	this.acquireVisibleAccessPoints = function(onSuccess, onFailure, policy) {
		var that = this;
		verifyPolicy(policy,false);
		var acqSuccess = function(rawData) {
			
				var results = filterData(rawData, policy);
				if (that._intervalFiltering) {
					that._intervalFiltering(rawData);
				}
				onSuccess(results);
			
		};
		this.acquireRawData(acqSuccess, onFailure);
	};
	
	this.getConnectedAccessPoint = function(onSuccess, onFailure) {
		var DISABLED_CODE = this.DISABLED;
		var acqSuccess = function(rawData) {
			syncRun(function() {
				var results = filterConnectedNetwork(rawData);				
				onSuccess(results);
			});
		};
		
		var acqFailure = function(errorCode)
		{

			//check what is the errorCode - if the acquisition has failed due to WIFI being disabled just return empty data
			if (errorCode == DISABLED_CODE){
				//return on success with empty information
				var data = [];
				acqSuccess(data);
			}else
			{
				onFailure(errorCode);
			}
		}
		this.acquireRawData(acqSuccess, acqFailure);
	};
};

__StubWifi = function() {
		
	this.stopAcquisition  = function()
	{
	
	};
	
	this.startAcquisition = function(onFailure, policy, triggers) {
	
	};

	this.stopAcquisitionInterval = function() {
	
	};

	this.acquireVisibleAccessPoints = function(onSuccess, onFailure, policy) {
	};
	
	this.getConnectedAccessPoint = function(onSuccess, onFailure){		
	};	

};

switch(WL.Client.getEnvironment()) {
case WL.Env.IPHONE:
case WL.Env.IPAD:
case WL.Env.ANDROID:
	WL.Device.Wifi = new __Wifi() 
	break;
default:
	WL.Device.Wifi =  new __StubWifi();
}


