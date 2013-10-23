
/* JavaScript content from wlclient/js/deviceSensors/acquisition.js in Common Resources */
/**
 * @license
 * Licensed Materials - Property of IBM
 * 5725-G92 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */
/**
 * WL.Device
 */

__SensorsAcquisition = function() {
	
	/**
	 * Start acquisition on all sensors.Delegate the start action to all relevant sensors.
	 * @param policy -configure the acquisition. Policy object hold relevant entries per sensor.
	 * 		<li>	Geo: @see __Geo#startAcquisition
	 * 		<li>	Wifi: @see __Wifi#startAcquisition
	 * @param triggers - the object holding the trigger definitions for all sensors, in the form {Geo:{...}, Wifi:{...}}
	 * @param Object holding error handlers for each of the sensors. The object structure is {Geo: errorCallbackFunction, Wifi: errorCallbackFunction}
	 */
	this.startAcquisition = function(policy, triggers, onFailure) {

		var geoFailureCallback = (!onFailure || !onFailure.Geo) ? function(error)
				{WL.Logger.error("error starting Geo acquisition, reason: "+error);} : onFailure.Geo;
		var wifiFailureCallback = (!onFailure || !onFailure.Wifi) ? function(error)
				{WL.Logger.error("error starting Wifi acquisition, reason: "+error);} : onFailure.Wifi;		

		if (!policy.Geo) // not undefined and not null
			WL.Device.Geo.stopAcquisition();
		else WL.Device.Geo.startAcquisition(geoFailureCallback,policy.Geo,triggers.Geo);		
		
		if (!policy.Wifi) // not undefined and not null
			WL.Device.Wifi.stopAcquisition();
		else WL.Device.Wifi.startAcquisition(wifiFailureCallback,policy.Wifi,triggers.Wifi);
	};
	
	this.stopAcquisition = function()
	{
		WL.Device.Geo.stopAcquisition();
		WL.Device.Wifi.stopAcquisition();
		WL.Device.context = {}; // clear the context
	};
};

var sensorsAcquisition = new __SensorsAcquisition();

WL.Device.startAcquisition = sensorsAcquisition.startAcquisition;
WL.Device.stopAcquisition = sensorsAcquisition.stopAcquisition;

WL.Device.context = {};
WL.Device.getContext = function() {
	if (WLJSX.Object.keys(WL.Device.context).length == 0) {
		return null;
	}
	
	return WLJSX.Object.clone(WL.Device.context);
};



__DCTPiggyBacker = function () {
	
	this.name = "DeviceContextTransmission Piggybacker"; // for display/debug purposes
	var sessionRandom = Math.floor((1 << 24) * Math.random());
	var sessionTimestamp = new Date().getTime();			
	
	this.processOptions = function(options) {
		if (!WL.Client.__deviceContextTransmission.shouldSendDelta())
			return;
		
		var delta = WL.Client.__deviceContextTransmission.getDelta();
		if (delta != null) {
			options.parameters.__wl_deviceCtxDelta = WLJSX.Object.toJSON(delta);
		}
		options.parameters.__wl_deviceCtxVersion = WL.Client.__deviceContextTransmission.getVersion();
		
		options.parameters.__wl_deviceCtxSession = sessionRandom + '' + sessionTimestamp;
	};
	
	this.onSuccess = function(transport, options) {
		if (!WLJSX.Object.isUndefined(options.parameters.__wl_deviceCtxVersion)) {
			WL.Client.__deviceContextTransmission.clearDataThroughVersion(options.parameters.__wl_deviceCtxVersion);
		}
	};		
};



__DeviceContextTransmission = function() {
	this.currentVersion = -1;
	this.deletions = {};
	this.piggybackerAdded = false;	
	this.prevHadTZO = false;
	this.prevHadLastModified = false;
	this.sendDelta = false;
	
	
	var self = this;	
	
	this.shouldSendDelta = function() {
		return self.sendDelta;
	}
	
	this.enableDeltaSending = function(enabled) {
		self.sendDelta = enabled;
		if (enabled) {
			self.enablePiggybacking(); // piggybacking is necessary
		}
	}
	
	this.isEmpty = function(obj) {
		if (typeof obj == 'undefined')
			return true;
		
		for (var prop in obj)
			if (obj.hasOwnProperty(prop))
				return false;
		
		return true;	
	};
	
	this.getOwnProperties = function(obj) {
		var result = [];
		for (var prop in obj)
			if (obj.hasOwnProperty(prop))
				result.push(prop);
		
		return result;
	};
	
	this.enablePiggybacking = function() {
		if (self.piggybackerAdded) {
			return;
		}
		
		var dctPiggyBacker = new __DCTPiggyBacker();
		WLJSX.Ajax.WlRequestPiggyBackers.push(dctPiggyBacker);
		
		self.piggybackerAdded = true;
	};
	
	this.removeDeleteField = function(field) {
		if (!WLJSX.Object.isUndefined(self.deletions[field]))
			delete self.deletions[field];			
	}
	
	this.updateOtherFields = function() {
		if (WLJSX.Object.isUndefined(WL.Device.context.lastModified)) {
			if (self.prevHadLastModified)
				self.deletions.lastModified = self.currentVersion;
			
			self.prevHadLastModified = false;
		}
		else {
			self.removeDeleteField("lastModified");
			self.prevHadLastModified = true;
		}
		
		if (WLJSX.Object.isUndefined(WL.Device.context.timezoneOffset)) {
			if (self.prevHadTZO)
				self.deletions.timezoneOffset = self.currentVersion;		
			
			self.prevHadTZO = false;
		}
		else {
			self.removeDeleteField("timezoneOffset");
			self.prevHadTZO = true;
		}
	};
			
	this.updateSensor = function(sensorName) {		
		self.currentVersion++;
		self.removeDeleteField(sensorName);
		self.updateOtherFields();			
	};
	
	this.deleteSensor = function(sensorName) {
		self.currentVersion++;
		self.deletions[sensorName] = self.currentVersion;
		self.updateOtherFields();
	};
	
	this.getVersion = function() {
		return self.currentVersion;
	};

	this.getDelta = function() {
		if (WL.Device.context == null || self.isEmpty(WL.Device.context)) {		
			return null;
		}

		// WL.Device.context isn't empty... so we need to send it all as an update
		var result = {updates: WL.Device.context};

		// be sure we include whatever has been removed
		var deltaDelNames = WLJSX.Object.keys(self.deletions);
		if (deltaDelNames.length > 0) {
			result.deletions = deltaDelNames;
		}
		
		return result;
	};

	this.clearDataThroughVersion = function(versionSent) {	
		var deltaDelNames = WLJSX.Object.keys(self.deletions);

		for (var i = 0; i < deltaDelNames.length; i++) {
			var sensorName = deltaDelNames[i];
			if (self.deletions[sensorName] <= versionSent)
				delete self.deletions[sensorName];
		}
	};
};

WL.Client.__deviceContextTransmission = new __DeviceContextTransmission();
WL.Client.__deviceContextTransmission.enablePiggybacking();

