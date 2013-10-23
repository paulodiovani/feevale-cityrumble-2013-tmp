/*
 * Cordova is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010-2011, IBM Corporation
 */

if (!Cordova.hasResource("device")) {
Cordova.addResource("device");
(function() {

/**
 * This represents the mobile device, and provides properties for inspecting the model, version, UUID of the
 * phone, etc.
 * @constructor
 */
Device = function() {
    _consoleLog("Device()");
    this.available = Cordova.available;   // TODO: Remove?
    this.platform = null;
    this.version = null;
    this.name = null;
    this.uuid = null;
    this.cordova = null;
    this.model = null;

    var me = this;

    this.getInfo(
        function(info) {
            _consoleLog("--- Got INFO");
            me.available = true;
            me.platform = info.platform.toString();
            me.version = info.version.toString();
            me.name = info.name.toString();
            me.uuid = info.uuid.toString();
            me.cordova = info.cordova.toString();
            me.model = info.model.toString();
            Cordova.onCordovaInfoReady.fire();
        },
        function(e) {
            me.available = false;
            _consoleLog("Error initializing Cordova: " + e);
            alert("Error initializing Cordova: "+e);
        });
};

/**
 * Get device info
 *
 * @param {Function} successCallback The function to call when the heading data is available
 * @param {Function} errorCallback The function to call when there is an error getting the heading data. (OPTIONAL)
 */
Device.prototype.getInfo = function(successCallback, errorCallback) {
	_consoleLog("Device.getInfo()");
    // successCallback required
    if (typeof successCallback !== "function") {
        _consoleLog("Device Error: successCallback is not a function");
        return;
    }

    // errorCallback optional
    if (errorCallback && (typeof errorCallback !== "function")) {
        _consoleLog("Device Error: errorCallback is not a function");
        return;
    }

    // Get info
    Cordova.exec(successCallback, errorCallback, "Device", "getDeviceInfo", []);
};

/*
 * DEPRECATED
 * This is only for Android.
 *
 * You must explicitly override the back button.
 */
Device.prototype.overrideBackButton = function() {
	_consoleLog("Device.overrideBackButton() is deprecated.  Use App.overrideBackbutton(true).");
	navigator.app.overrideBackbutton(true);
};

/*
 * DEPRECATED
 * This is only for Android.
 *
 * This resets the back button to the default behaviour
 */
Device.prototype.resetBackButton = function() {
	_consoleLog("Device.resetBackButton() is deprecated.  Use App.overrideBackbutton(false).");
	navigator.app.overrideBackbutton(false);
};

/*
 * DEPRECATED
 * This is only for Android.
 *
 * This terminates the activity!
 */
Device.prototype.exitApp = function() {
	_consoleLog("Device.exitApp() is deprecated.  Use App.exitApp().");
	navigator.app.exitApp();
};

Cordova.addConstructor(function() {
    navigator.device = window.device = new Device();
});
}());
}
