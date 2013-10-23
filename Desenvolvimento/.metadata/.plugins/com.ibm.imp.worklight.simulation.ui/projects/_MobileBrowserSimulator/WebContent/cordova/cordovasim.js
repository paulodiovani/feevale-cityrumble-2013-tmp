// Cordova uses the navigator to store the device and network instances
// On Firefox, when loading a new web page in an already open MBS, these objects
// are not deleted, causing the deviceReady event not to be fired.
if (typeof navigator.device !== "undefined")
	delete navigator.device;
if (typeof navigator.network !== "undefined")
	delete navigator.network;
if (typeof navigator.accelerometer !== "undefined")
	delete navigator.accelerometer;
if (typeof navigator.camera !== "undefined")
	delete navigator.camera;
if (typeof navigator.compass !== "undefined")
	delete navigator.compass;
if (typeof navigator.contacts !== "undefined")
	delete navigator.contacts;
if (typeof navigator.Crypto !== "undefined")
	delete navigator.Crypto;
if (typeof navigator.fileMgr !== "undefined")
	delete navigator.fileMgr;
if (typeof navigator.notification !== "undefined")
	delete navigator.notification;
if (typeof navigator.notifications !== "undefined")
	delete navigator.notifications;
if (typeof navigator.appmgmt !== "undefined")
	delete navigator.appmgmt;
if (typeof navigator._geo !== "undefined")
	delete navigator._geo;

if(typeof window._debugCordova === "undefined")
	window._debugCordova = false;

if (window.parent._debugSim == true)
	window._debugCordova = true;

_consoleLog = function(msg) {
	if(window._debugCordova)
		console.log(msg);
};

// Determine base URL for Cordova JS files
var mbs_path = window.parent.location.pathname;
var p = mbs_path.indexOf("index");
var _pg_sim_cordovaDir= mbs_path.substring(0, p) + "cordova/";
_consoleLog("Cordova is loaded from " + _pg_sim_cordovaDir);

//Array listing all Cordova JS files
var _pg_sim_jsfiles = [
        "cordovabase.js",
        "utils.js",
        "accelerometer.js",
        "app.js",
        "device.js",
        "battery.js",
        "camera.js",
        "capture.js",
        "compass.js",
        "contact.js",
        "crypto.js",
        "file.js",
        "filetransfer.js",
        "geolocation.js",
        "media.js",
        "network.js",
        "notification.js",
        "position.js",
        "storage.js",
        "splashscreen.js",
        "logger.js"
        ];

/**
 * Load a JavaScript file after page has loaded.
 * 
 * @param {String}
 *            jsfile The url of the JavaScript file to load.
 * @param {Function}
 *            successCallback The callback to call when the file has been
 *            loaded.
 */
var _pg_sim_loadJavascript = function(jsfile, successCallback){	
	_consoleLog("loadJavascript(" + jsfile + ")");
	if (jsfile == _pg_sim_jsfiles[0]) {
		// We ensure that cordovabase.js is loaded first by loading it synchronously.
		var xhrObj = new XMLHttpRequest();
		xhrObj.open('GET', _pg_sim_cordovaDir + jsfile, false);
		xhrObj.send('');
		if (xhrObj.status != 200) {
		   // Cannot load cordovabase.js...
			return;
		} else {
		   eval(xhrObj.responseText);
		   successCallback();
	    }	
	}
	var id = document.getElementsByTagName("head")[0];
	var el = document.createElement('script');
	el.type = 'text/javascript';
	if (typeof successCallback === 'function') {
		el.onload = successCallback;
	}
	el.src = _pg_sim_cordovaDir + jsfile;
	id.appendChild(el);
};

// Intercept calls to document.addEventListener and watch for deviceready
var _pg_document_addEventListener = document.addEventListener;
var _pg_deviceready_listeners = [];

document.addEventListener = function(evt, handler, capture){
	var e = evt.toLowerCase();
	if (e === 'deviceready') {
		_pg_deviceready_listeners.push(handler);
	} else {
		_pg_document_addEventListener.call(document, evt, handler, capture);
	}
};


// Load all Cordova JS files
var _pg_sim_jsindex = 0;
function _pg_sim_loadjsfiles(){
	_consoleLog("_pg_sim_loadjsfiles(" + _pg_sim_jsindex + ")");
	if (_pg_sim_jsindex < _pg_sim_jsfiles.length) {
		_pg_sim_loadJavascript(_pg_sim_jsfiles[_pg_sim_jsindex++], _pg_sim_loadjsfiles);
	} else {
		_consoleLog("All Cordova files are loaded");
		Cordova.onDOMContentLoaded.fire();
		Cordova.onNativeReady.fire();

		var onCordovaInitOver = function() {
		_consoleLog("Calling deviceready listeners not already called");
			for ( var i = 0; i < _pg_deviceready_listeners.length; i++) {
				_pg_deviceready_listeners[i]();
			}
		};
		if ((Cordova.onDeviceReady.onFire == true) || (Cordova.onDeviceReady.fired == true))
			onCordovaInitOver();
		else
			Cordova.onDeviceReady.subscribeOnce(onCordovaInitOver);
	}
}
_pg_sim_loadjsfiles();