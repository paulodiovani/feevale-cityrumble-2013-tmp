// Determine what base url where sim.html is located, so that we can ?

// Initial mobile HTML page to load
var htmlPage = "index.html";

// Flag that indicates plugins have been loaded and initialized
var initPluginsCompleted = false;

// PluginResult status enum
PluginResultStatus = {
    NO_RESULT : 0,
    OK : 1,
    CLASS_NOT_FOUND_EXCEPTION : 2,
    ILLEGAL_ACCESS_EXCEPTION : 3,
    INSTANTIATION_EXCEPTION : 4,
    MALFORMED_URL_EXCEPTION : 5,
    IO_EXCEPTION : 6,
    INVALID_ACTION : 7,
    JSON_EXCEPTION : 8,
    ERROR : 9,
    EVENT : 10
};

// List of plugins
var plugins = {};

/**
 * Update Device UI
 */
var updateDeviceUI = function(){
	/* plugins defined in sim/sim.js */
	if (plugins && plugins['Device']) {
		var s = getService('Device');
		if (s)
			s.setDevice();
	} else {
		_consoleLog("No device");
	}
};

// Associative array of simulators (key is the device uuid)
var sims = new Array();

var getSimByUUID = function(uuid){
	for ( var i = 0; i < sims.length; i++) {
		if (sims[i].uuid == uuid) {
			return sims[i];
		}
	}
	return null;
};

/**
 * Add/Change an element in the sims array
 */
var onDeviceChanged = function(sim){
	// add the device only if not already in sims
	var found = false;
	for ( var i = 0; i < sims.length; i++) {
		if (sims[i] == sim) {
			found = true;
			break;
		}
	}
	if (found == false)
		sims[sims.length] = sim;
	// update the UI
	updateDeviceUI();
};

/**
 * Remove an element in the sims array
 */
var onDeviceRemoved = function(uuid){
	for ( var i = 0; i < sims.length; i++) {
		if (sims[i].uuid == uuid) {
			sims.splice(i, 1);
			break;
		}
	}
	// update the UI
	updateDeviceUI();
};
dojo.subscribe('/mbs/devicechanged', onDeviceChanged);
dojo.subscribe('/mbs/deviceremoved', onDeviceRemoved);

/**
 * Method to fire document event. This is called by Java applets to send events
 * and data to JS.
 * 
 * @param {String}
 *            type The event type to fire
 * @param {Object}
 *            data Data to send with event
 */

fireDocumentEvent = function(type, data){
	_consoleLog("Cordova.fireDocumentEvent(" + type + ")");
	var e = document.createEvent('Events');
	e.initEvent(type, false, false);
	if (data) {
		for ( var i in data) {
			e[i] = data[i];
		}
	}
	document.dispatchEvent(e);
};

/**
 * Initialize plugins
 */
var initPlugins = function(){
	if (initPluginsCompleted)
		return;
	for ( var svc in plugins) {
		if (plugins[svc].obj === null) {
			plugins[svc].obj = new plugins[svc].callback();
		}
	}
	initPluginsCompleted = true;
	dojo.publish('/mbs/simpluginsready');
};

/**
 * Receives request destined for plugins from mobile device via postMessage
 * request. Returns PluginResult object back to mobile device by using
 * postMessage.
 * 
 * @param {Object}
 *            e e.data is JSON serialized string of request
 */
window.addEventListener("message", function(e){
	if (!initPluginsCompleted)
		initPlugins();
	_consoleLog("*****BC***** " + e.domain + " said: " + e.data + " origin:" + e.origin);
	eval("var t=" + e.data);
	_consoleLog(" -- DUMP=" + dumpObj(t, '', ' ', 2));
	var r = null;
	_consoleLog("type=" + (typeof plugins[t.service]));
	if (typeof plugins[t.service] === 'object') {
		if (t.service == "Device")
			plugins["Device"].obj.setRequestedDeviceUUID(t.uuid);
		if ((t.service == "File") || (t.service== "FileTransfer")) {
			plugins[t.service].obj.exec(t.action, t.args, t.callbackId, e.source, t.uuid);
			// for these plugins, we do not return any result as they are being processed asynchronously
			return;
		} else {
			r = plugins[t.service].obj.exec(t.action, t.args, t.callbackId, t.uuid);
		}
	} else {
		r = new PluginResult(t.callbackId, PluginResultStatus.CLASS_NOT_FOUND_EXCEPTION);
	}
	_consoleLog("Type of r=" + (typeof r) + "  Sending " + dumpObj(r, '', ' ', 3));
	if (typeof r === 'object') {
		e.source.postMessage(JSON.stringify(r), "*");
	} else {
		e.source.postMessage(r, "*");
	}
}, false);

/**
 * Send event to mobile device using postMessage
 * 
 * @param type
 */
var fireEvent = function(type){
	_consoleLog("fireEvent(" + type + ")");
	for ( var i = 0; i < sims.length; i++) {
		sims[i].iFrame.contentWindow.postMessage(JSON.stringify({
		    id : "",
		    status : PluginResultStatus.EVENT,
		    message : type
		}), "*");
	}
};

/**
 * Send result to mobile device using postMessage
 * 
 * @param {PluginResult}
 *            r
 */
var sendResult = function(r){
	_consoleLog("Sending result " + dumpObj(r, '', ' ', 2));
	for ( var i = 0; i < sims.length; i++)
		sims[i].iFrame.contentWindow.postMessage(JSON.stringify(r), "*");
};

/**
 * Create a new plugin result
 * 
 * @param id
 *            {String} The callback id
 * @param status
 *            {enum} PluginResultStatus
 * @param message
 *            {String} Stringified JSON object
 * @param keepCallback
 *            {Boolean} T=keep callback, F=remove callback (default=F)
 * @param cast
 *            {String} Cast (default=null)
 */
var PluginResult = function(id, status, message, keepCallback, cast){
	this.id = id;
	this.status = status;
	this.message = message;
	if (cast) {
		this.cast = cast;
	}
	this.keepCallback = keepCallback | false;
};

/**
 * List of available services
 */
var services = ["Network Status", "Media", "Geolocation", "File", "Contacts", "Compass", "Capture", "Camera", "Battery", "Accelerometer", "Device", "FileTransfer"];
/**
 * Register a plugin for a service.
 * 
 * @param service
 * @param callback
 */
var addService = function(service, callback){
	plugins[service] = {
	    callback : callback,
	    obj : null
	};
	if (initPluginsCompleted) {
		plugins[service].obj = new callback();
	} else {
		var allServicesDefined = true;
		for ( var i = 0; i < services.length; i++) {
			if (typeof plugins[services[i]] === "undefined") {
				allServicesDefined = false;
				break;
			}
		}
		if (allServicesDefined) {
			initPlugins();
		}
	}
};

/**
 * Return plugin object for service
 * 
 * @return {Object}
 */
var getService = function(service){
	return plugins[service].obj;
};

__global__getService = function(service) {
	return getService(service);
};

// -----------------------------------------------------------------------------
// HELPER METHODS
// -----------------------------------------------------------------------------

/**
 * Dump object to string.
 */
var dumpObj = function(obj, name, indent, depth){
	if (!indent) {
		indent = "  ";
	}
	if (!depth) {
		depth = 1;
	}
	if (!name) {
		name = "Obj";
	}
	if (depth > 10) {
		return indent + name + ": <Maximum Depth Reached>\n";
	}
	if (typeof obj == "object") {
		var output = indent + name + "\n";
		indent += "\t";
		var item = null;
		for (item in obj) {
			var child = '';
			try {
				child = obj[item];
			} catch (e) {
				child = "<Unable to Evaluate>";
			}
			if (typeof child == "object") {
				if (depth > 1) {
					output += dumpObj(child, item, indent, depth - 1);
				}
			} else {
				output += indent + item + ": " + child + "\n";
			}
		}
		return output;
	} else {
		return obj;
	}
};

/**
 * Load a JavaScript file.
 * 
 * @param {String}
 *            jsfile The url of the JavaScript file to load.
 * @param {Function}
 *            successCallback The callback to call when the file has been
 *            loaded.
 */
var loadJavascript = function(jsfile, successCallback){
	_consoleLog("loadJavascript(" + jsfile + ")");
	var id = document.getElementsByTagName("head")[0];
	var el = document.createElement('script');
	el.type = 'text/javascript';
	if (typeof successCallback === 'function') {
		el.onload = successCallback;
	}
	el.src = jsfile;
	id.appendChild(el);
};

/**
 * Determine base URL for a JS file.
 * 
 * @param {String}
 *            name The name of the JS file
 * @return {String}
 */
var getScriptBase = function(name){
	var dir = '';
	var lists = document.getElementsByTagName("script");
	for ( var i = 0; i < lists.length; i++) {
		_consoleLog("script tag=" + lists[i].src);
		var src = "" + lists[i].src;
		var p = src.indexOf(name);
		if (p > 0) {
			dir = src.substring(0, p);
			break;
		}
	}
	_consoleLog(">>>>>> " + name + " is loaded from " + dir);
	return dir;
};

/**
 * Get random number
 */
var rand = function(max, fixed){
	var r = Math.random() * max;
	if (fixed != undefined)
		r = parseFloat(r.toFixed(fixed));
	return r;
};

var randRange = function(range, fixed){
	var r = Math.random() * range - range / 2;
	if (fixed != undefined)
		r = parseFloat(r.toFixed(fixed));
	return r;
};

var randMinMax = function(min, max, fixed){
	var range = max - min;
	var r = Math.random(range) + min;
	if (fixed != undefined)
		r = parseFloat(r.toFixed(fixed));
	return r;
};

function roundNumber(num){
	var dec = 3;
	var po = Math.pow(10, dec);
	var result = Math.round(num * po) / po;
	return result;
}

if (typeof window._debugSim === "undefined")
	window._debugSim = false;

if ((mbsLogLevel == "cordova") || (mbsLogLevel == "all"))
	window._debugSim = true;

function _consoleLog(msg){
	if (window._debugSim)
		console.log(msg);
}

dojo.registerModulePath("pgsim", "../../sim");
_pg_sim_nls = dojo.i18n.getLocalization("pgsim", "pg");
