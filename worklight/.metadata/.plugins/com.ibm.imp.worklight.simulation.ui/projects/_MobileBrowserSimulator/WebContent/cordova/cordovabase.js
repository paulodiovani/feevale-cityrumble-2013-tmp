/*
 * Cordova is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 * 
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010-2011, IBM Corporation
 */

// device=Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_7; en-us) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1
_consoleLog("User Agent=" + navigator.userAgent);
var sim = true;

function rand(max){
	return Math.random() * max;
}

if (typeof Cordova === "undefined") {

	dumpObj = function(obj, name, indent, depth){
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
			var child = null;
			var output = indent + name + "\n";
			indent += "\t";
			var item;
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
			// _consoleLog("type=else");
			return obj;
		}
	};

	/**
	 * The order of events during page load and Cordova startup is as follows:
	 * 
	 * onDOMContentLoaded Internal event that is received when the web page is
	 * loaded and parsed. window.onload Body onload event. onNativeReady
	 * Internal event that indicates the Cordova native side is ready.
	 * onCordovaInit Internal event that kicks off creation of all Cordova
	 * JavaScript objects (runs constructors). onCordovaReady Internal event
	 * fired when all Cordova JavaScript objects have been created
	 * onCordovaInfoReady Internal event fired when device properties are
	 * available onDeviceReady User event fired to indicate that Cordova is
	 * ready onResume User event fired to indicate a start/resume lifecycle
	 * event onPause User event fired to indicate a pause lifecycle event
	 * onDestroy Internal event fired when app is being destroyed (User should
	 * use window.onunload event, not this one).
	 * 
	 * The only Cordova events that user code should register for are:
	 * onDeviceReady onResume
	 * 
	 * Listeners can be registered as: document.addEventListener("deviceready",
	 * myDeviceReadyListener, false); document.addEventListener("resume",
	 * myResumeListener, false); document.addEventListener("pause",
	 * myPauseListener, false);
	 */

	if (typeof (DeviceInfo) !== 'object') {
		DeviceInfo = {};
	}

	/**
	 * This represents the Cordova API itself, and provides a global namespace
	 * for accessing information about the state of Cordova.
	 * 
	 * @class
	 */
	var Cordova = {
	    queue : {
	        ready : true,
	        commands : [],
	        timer : null
	    },
	    documentEventHandler : {}, // Collection of custom document event
									// handlers
	    windowEventHandler : {}
	// Collection of custom window event handlers
	};

	/**
	 * Create a UUID
	 * 
	 * @return
	 */
	Cordova.createUUID = function(){
		return Cordova.UUIDcreatePart(4) + '-' + Cordova.UUIDcreatePart(2) + '-' + Cordova.UUIDcreatePart(2) + '-' + Cordova.UUIDcreatePart(2) + '-' + Cordova.UUIDcreatePart(6);
	};

	Cordova.UUIDcreatePart = function(length){
		var uuidpart = "";
		var i, uuidchar;
		for (i = 0; i < length; i++) {
			uuidchar = parseInt((Math.random() * 256), 0).toString(16);
			if (uuidchar.length === 1) {
				uuidchar = "0" + uuidchar;
			}
			uuidpart += uuidchar;
		}
		return uuidpart;
	};

	/**
	 * List of resource files loaded by Cordova. This is used to ensure JS and
	 * other files are loaded only once.
	 */
	Cordova.resources = {
		base : true
	};

	/**
	 * Determine if resource has been loaded by Cordova
	 * 
	 * @param name
	 * @return
	 */
	Cordova.hasResource = function(name){
		return Cordova.resources[name];
	};

	/**
	 * Add a resource to list of loaded resources by Cordova
	 * 
	 * @param name
	 */
	Cordova.addResource = function(name){
		_consoleLog("Cordova: Adding resource " + name);
		Cordova.resources[name] = true;
	};

	/**
	 * Custom pub-sub channel that can have functions subscribed to it
	 * 
	 * @constructor
	 */
	Cordova.Channel = function(type){
		this.type = type;
		this.handlers = {};
		this.guid = 0;
		this.onFire = false;
		this.fired = false;
		this.enabled = true;
	};

	/**
	 * Subscribes the given function to the channel. Any time that Channel.fire
	 * is called so too will the function. Optionally specify an execution
	 * context for the function and a guid that can be used to stop subscribing
	 * to the channel. Returns the guid.
	 */
	Cordova.Channel.prototype.subscribe = function(f, c, g){
		// _consoleLog("subscribe("+this.type+")");
		// _consoleLog("subscribe("+f+")");
		// need a function to call
		if (f === null) {
			return;
		}

		var func = f;
		if (typeof c === "object" && f instanceof Function) {
			func = Cordova.close(c, f);
		}

		g = g || func.observer_guid || f.observer_guid || this.guid++;
		func.observer_guid = g;
		f.observer_guid = g;
		this.handlers[g] = func;
		return g;
	};

	/**
	 * Like subscribe but the function is only called once and then it
	 * auto-unsubscribes itself.
	 */
	Cordova.Channel.prototype.subscribeOnce = function(f, c){
		var g = null;
		var _this = this;
		var m = function(){
			f.apply(c || null, arguments);
			_this.unsubscribe(g);
		};
		if (this.fired) {
			if (typeof c === "object" && f instanceof Function) {
				f = Cordova.close(c, f);
			}
			f.apply(this, this.fireArgs);
		} else {
			g = this.subscribe(m);
		}
		return g;
	};

	/**
	 * Unsubscribes the function with the given guid from the channel.
	 */
	Cordova.Channel.prototype.unsubscribe = function(g){
		if (g instanceof Function) {
			g = g.observer_guid;
		}
		this.handlers[g] = null;
		delete this.handlers[g];
	};

	/**
	 * Calls all functions subscribed to this channel.
	 */
	Cordova.Channel.prototype.fire = function(e){
		_consoleLog("fire(" + this.type + ")");
		var cnt = 0;
		if (this.enabled) {
			this.onFire = true;
			var fail = false;
			var item, handler, rv;
			for (item in this.handlers) {
				if (this.handlers.hasOwnProperty(item)) {
					cnt++;
					handler = this.handlers[item];
					if (handler instanceof Function) {
						rv = (handler.apply(this, arguments) === false);
						fail = fail || rv;
					}
				}
			}
			this.fired = true;
			this.fireArgs = arguments;
			_consoleLog(" -- sent " + cnt + " to " + this.type + " handlers");
			this.onFire = false;
			return !fail;
		}
		return true;
	};

	/**
	 * Calls the provided function only after all of the channels specified have
	 * been fired.
	 */
	Cordova.Channel.join = function(h, c){
		var i = c.length;
		var f = function(){
			if (!(--i)) {
				h();
			}
		};
		var len = i;
		var j;
		for (j = 0; j < len; j++) {
			if (!c[j].fired) {
				c[j].subscribeOnce(f);
			} else {
				i--;
			}
		}
		if (!i) {
			h();
		}
	};

	/**
	 * Boolean flag indicating if the Cordova API is available and initialized.
	 */
	// TODO: Remove this, it is unused here ... -jm
	Cordova.available = DeviceInfo.uuid !== undefined;

	/**
	 * Add an initialization function to a queue that ensures it will run and
	 * initialize application constructors only once Cordova has been
	 * initialized.
	 * 
	 * @param {Function}
	 *            func The function callback you want run once Cordova is
	 *            initialized
	 */
	Cordova.addConstructor = function(func){
		Cordova.onCordovaInit.subscribeOnce(function(){
			try {
				func();
			} catch (e) {
				_consoleLog("Failed to run constructor: " + e);
			}
		});
	};

	/**
	 * Plugins object
	 */
	if (!window.plugins) {
		window.plugins = {};
	}

	/**
	 * Adds a plugin object to window.plugins. The plugin is accessed using
	 * window.plugins.<name>
	 * 
	 * @param name
	 *            The plugin name
	 * @param obj
	 *            The plugin object
	 */
	Cordova.addPlugin = function(name, obj){
		if (!window.plugins[name]) {
			window.plugins[name] = obj;
		} else {
			_consoleLog("Error: Plugin " + name + " already exists.");
		}
	};

	/**
	 * onDOMContentLoaded channel is fired when the DOM content of the page has
	 * been parsed.
	 */
	Cordova.onDOMContentLoaded = new Cordova.Channel('onDOMContentLoaded');

	/**
	 * onNativeReady channel is fired when the Cordova native code has been
	 * initialized.
	 */
	Cordova.onNativeReady = new Cordova.Channel('onNativeReady');

	/**
	 * onCordovaInit channel is fired when the web page is fully loaded and
	 * Cordova native code has been initialized.
	 */
	Cordova.onCordovaInit = new Cordova.Channel('onCordovaInit');

	/**
	 * onCordovaReady channel is fired when the JS Cordova objects have been
	 * created.
	 */
	Cordova.onCordovaReady = new Cordova.Channel('onCordovaReady');

	/**
	 * onCordovaInfoReady channel is fired when the Cordova device properties
	 * has been set.
	 */
	Cordova.onCordovaInfoReady = new Cordova.Channel('onCordovaInfoReady');

	/**
	 * onCordovaConnectionReady channel is fired when the Cordova connection
	 * properties has been set.
	 */
	Cordova.onCordovaConnectionReady = new Cordova.Channel('onCordovaConnectionReady');

	/**
	 * onResume channel is fired when the Cordova native code resumes.
	 */
	Cordova.onResume = new Cordova.Channel('onResume');

	/**
	 * onPause channel is fired when the Cordova native code pauses.
	 */
	Cordova.onPause = new Cordova.Channel('onPause');

	/**
	 * onBackKeyDown channel is fired when the back key is pressed.
	 */
	Cordova.onBackKeyDown = new Cordova.Channel('onBackKeyDown');

	/**
	 * onMenuKeyDown channel is fired when the Menu key is pressed.
	 */
	Cordova.onMenuKeyDown = new Cordova.Channel('onMenuKeyDown');

	/**
	 * onBackKeyDown channel is fired when the back key is pressed.
	 */
	Cordova.onSearchKeyDown = new Cordova.Channel('onSearchKeyDown');

	/**
	 * onOnline channel is fired when the device gets online
	 */
	Cordova.onOnline = new Cordova.Channel('onOnline');

	/**
	 * onOffline channel is fired when the device gets offline
	 */
	Cordova.onOffline = new Cordova.Channel('onOffline');

	Cordova.onStartCallKeyDown = new Cordova.Channel('onStartCallKeyDown');
	
	Cordova.onEndCallKeyDown = new Cordova.Channel('onEndCallKeyDown');
	
	Cordova.onVolumeDownKeyDown = new Cordova.Channel('onVolumeDownKeyDown');
	
	Cordova.onVolumeUpKeyDown = new Cordova.Channel('onVolumeUpKeyDown');
	
	/**
	 * onDestroy channel is fired when the Cordova native code is destroyed. It
	 * is used internally. Window.onunload should be used by the user.
	 */
	Cordova.onDestroy = new Cordova.Channel('onDestroy');
	Cordova.onDestroy.subscribeOnce(function(){
		Cordova.shuttingDown = true;
	});
	Cordova.shuttingDown = false;

	// _nativeReady is global variable that the native side can set
	// to signify that the native code is ready. It is a global since
	// it may be called before any Cordova JS is ready.
	if (typeof _nativeReady !== 'undefined') {
		Cordova.onNativeReady.fire();
	}

	/**
	 * onDeviceReady is fired only after all Cordova objects are created and
	 * the device properties are set.
	 */
	Cordova.onDeviceReady = new Cordova.Channel('onDeviceReady');

	// Array of channels that must fire before "deviceready" is fired
	Cordova.deviceReadyChannelsArray = [Cordova.onCordovaReady, Cordova.onCordovaInfoReady, Cordova.onCordovaConnectionReady];

	// Hashtable of user defined channels that must also fire before
	// "deviceready" is fired
	Cordova.deviceReadyChannelsMap = {};

	/**
	 * Indicate that a feature needs to be initialized before it is ready to be
	 * used. This holds up Cordova's "deviceready" event until the feature has
	 * been initialized and Cordova.initComplete(feature) is called.
	 * 
	 * @param feature
	 *            {String} The unique feature name
	 */
	Cordova.waitForInitialization = function(feature){
		if (feature) {
			var channel = new Cordova.Channel(feature);
			Cordova.deviceReadyChannelsMap[feature] = channel;
			Cordova.deviceReadyChannelsArray.push(channel);
		}
	};

	/**
	 * Indicate that initialization code has completed and the feature is ready
	 * to be used.
	 * 
	 * @param feature
	 *            {String} The unique feature name
	 */
	Cordova.initializationComplete = function(feature){
		var channel = Cordova.deviceReadyChannelsMap[feature];
		if (channel) {
			channel.fire();
		}
	};

	/**
	 * Create all Cordova objects once page has fully loaded and native side is
	 * ready.
	 */
	Cordova.Channel.join(function(){
		_consoleLog("JOIN - onDOMContentLoaded + onNativeReady");

		// Run Cordova constructors
		Cordova.onCordovaInit.fire();

		// Fire event to notify that all objects are created
		Cordova.onCordovaReady.fire();

		// Fire onDeviceReady event once all constructors have run and Cordova
		// info has been
		// received from native side, and any user defined initialization
		// channels.
		Cordova.Channel.join(function(){
			_consoleLog("JOIN - onCordovaReady + onCordovaInfoReady");

			Cordova.onDeviceReady.fire();

			// Fire the onresume event, since first one happens before
			// JavaScript is loaded
			Cordova.onResume.fire();
		}, Cordova.deviceReadyChannelsArray);

	}, [Cordova.onDOMContentLoaded, Cordova.onNativeReady]);

	// Listen for DOMContentLoaded and notify our channel subscribers
	document.addEventListener('DOMContentLoaded', function(){
		Cordova.onDOMContentLoaded.fire();
	}, false);

	// Intercept calls to document.addEventListener and watch for deviceready
	Cordova.m_document_addEventListener = document.addEventListener;

	// Intercept calls to window.addEventListener
	Cordova.m_window_addEventListener = window.addEventListener;

	/**
	 * Add a custom window event handler.
	 * 
	 * @param {String}
	 *            event The event name that callback handles
	 * @param {Function}
	 *            callback The event handler
	 */
	Cordova.addWindowEventHandler = function(event, callback){
		Cordova.windowEventHandler[event] = callback;
	}

	/**
	 * Add a custom document event handler.
	 * 
	 * @param {String}
	 *            event The event name that callback handles
	 * @param {Function}
	 *            callback The event handler
	 */
	Cordova.addDocumentEventHandler = function(event, callback){
		Cordova.documentEventHandler[event] = callback;
	}

	/**
	 * Intercept adding document event listeners and handle our own
	 * 
	 * @param {Object}
	 *            evt
	 * @param {Function}
	 *            handler
	 * @param capture
	 */
	document.addEventListener = function(evt, handler, capture){
		var e = evt.toLowerCase();
		if (e === 'deviceready') {
			if ((Cordova.onDeviceReady.onFire == true) || (Cordova.onDeviceReady.fired == true))
				handler();
			else
				Cordova.onDeviceReady.subscribeOnce(handler);
		} else if (e === 'resume') {
			Cordova.onResume.subscribe(handler);
			if (Cordova.onDeviceReady.fired) {
				Cordova.onResume.fire();
			}
		} else if (e === 'pause') {
			Cordova.onPause.subscribe(handler);
		} else if (e === 'online') {
			Cordova.onOnline.subscribe(handler);
		} else if (e === 'offline') {
			Cordova.onOffline.subscribe(handler);
		} else if (e === 'backbutton') {
			Cordova.onBackKeyDown.subscribe(handler);
		} else if (e === 'menubutton') {
			Cordova.onMenuKeyDown.subscribe(handler);
		} else if (e === 'searchbutton') {
			Cordova.onSearchKeyDown.subscribe(handler);
		} else if (e === 'startcallbutton') {
			Cordova.onStartCallKeyDown.subscribe(handler);
		} else if (e === 'endcallbutton') {
			Cordova.onEndCallKeyDown.subscribe(handler);
		} else if (e === 'volumedownbutton') {
			Cordova.onVolumeDownKeyDown.subscribe(handler);
		} else if (e === 'volumeupbutton') {
			Cordova.onVolumeUpKeyDown.subscribe(handler);
		} else {
			// If subscribing to an event that is handled by a plugin
			if (typeof Cordova.documentEventHandler[e] !== "undefined") {
				if (Cordova.documentEventHandler[e](e, handler, true)) {
					return; // Stop default behavior
				}
			}

			Cordova.m_document_addEventListener.call(document, evt, handler, capture);
		}
	};

	/**
	 * Intercept adding window event listeners and handle our own
	 * 
	 * @param {Object}
	 *            evt
	 * @param {Function}
	 *            handler
	 * @param capture
	 */
	window.addEventListener = function(evt, handler, capture){
		var e = evt.toLowerCase();
			// If subscribing to an event that is handled by a plugin
		if (typeof Cordova.windowEventHandler[e] !== "undefined") {
			if (Cordova.windowEventHandler[e](e, handler, true)) {
				return; // Stop default behavior
			}
		}

		Cordova.m_window_addEventListener.call(window, evt, handler, capture);
	};

	// Intercept calls to document.removeEventListener and watch for events that
	// are generated by Cordova native code
	Cordova.m_document_removeEventListener = document.removeEventListener;

	// Intercept calls to window.removeEventListener
	Cordova.m_window_removeEventListener = window.removeEventListener;

	/**
	 * Intercept removing document event listeners and handle our own
	 * 
	 * @param {Object}
	 *            evt
	 * @param {Function}
	 *            handler
	 * @param capture
	 */
	document.removeEventListener = function(evt, handler, capture){
		var e = evt.toLowerCase();

		// If unsubscribing to Android backbutton
		if (e === 'backbutton') {
			// Cordova.exec(null, null, "App", "overrideBackbutton", [false]);
		}

		// If unsubcribing from an event that is handled by a plugin
		if (typeof Cordova.documentEventHandler[e] !== "undefined") {
			if (Cordova.documentEventHandler[e](e, handler, false)) {
				return; // Stop default behavior
			}
		}

		Cordova.m_document_removeEventListener.call(document, evt, handler, capture);
	};

	/**
	 * Intercept removing window event listeners and handle our own
	 * 
	 * @param {Object}
	 *            evt
	 * @param {Function}
	 *            handler
	 * @param capture
	 */
	window.removeEventListener = function(evt, handler, capture){
		var e = evt.toLowerCase();

		// If unsubcribing from an event that is handled by a plugin
		if (typeof Cordova.windowEventHandler[e] !== "undefined") {
			if (Cordova.windowEventHandler[e](e, handler, false)) {
				return; // Stop default behavior
			}
		}

		Cordova.m_window_removeEventListener.call(window, evt, handler, capture);
	};

	/**
	 * Method to fire document event
	 * 
	 * @param {String}
	 *            type The event type to fire
	 * @param {Object}
	 *            data Data to send with event
	 */
	Cordova.fireDocumentEvent = function(type, data){
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
	 * Method to fire window event
	 * 
	 * @param {String}
	 *            type The event type to fire
	 * @param {Object}
	 *            data Data to send with event
	 */
	Cordova.fireWindowEvent = function(type, data){
		_consoleLog("Cordova.fireWindowEvent(" + type + ")");
		var e = document.createEvent('Events');
		e.initEvent(type, false, false);
		if (data) {
			for ( var i in data) {
				e[i] = data[i];
			}
		}
		window.dispatchEvent(e);
	};

	/**
	 * Does a deep clone of the object.
	 * 
	 * @param obj
	 * @return {Object}
	 */
	Cordova.clone = function(obj){
		var i, retVal;
		if (!obj) {
			return obj;
		}

		if (obj instanceof Array) {
			retVal = [];
			for (i = 0; i < obj.length; ++i) {
				retVal.push(Cordova.clone(obj[i]));
			}
			return retVal;
		}

		if (typeof obj === "function") {
			return obj;
		}

		if (!(obj instanceof Object)) {
			return obj;
		}

		if (obj instanceof Date) {
			return obj;
		}

		retVal = {};
		for (i in obj) {
			if (!(i in retVal) || retVal[i] !== obj[i]) {
				retVal[i] = Cordova.clone(obj[i]);
			}
		}
		return retVal;
	};

	Cordova.callbackId = 0;
	Cordova.callbacks = {};
	Cordova.callbackStatus = {
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

	/**
	 * Execute a Cordova command. It is up to the native side whether this
	 * action is synch or async. The native side can return: Synchronous:
	 * PluginResult object as a JSON string Asynchrounous: Empty string "" If
	 * async, the native side will Cordova.callbackSuccess or
	 * Cordova.callbackError, depending upon the result of the action.
	 * 
	 * @param {Function}
	 *            success The success callback
	 * @param {Function}
	 *            fail The fail callback
	 * @param {String}
	 *            service The name of the service to use
	 * @param {String}
	 *            action Action to be run in Cordova
	 * @param {Array.
	 *            <String>} [args] Zero or more arguments to pass to the method
	 */
	Cordova.exec = function(success, fail, service, action, args){
		_consoleLog("^^^^^^^^^^^^ PARENT=" + parent + " WINDOW=" + window + " SAME?=" + (parent == window));
		try {
			var callbackId = service + Cordova.callbackId++
			
			//Retrieve the device uuid
			var uuid = "Error: unknownUUID";
			if (window.parent.sims != null) {
				for (var i = 0 ; i < window.parent.sims.length ; i++) {
					if (window.parent.sims[i].iFrame.contentWindow == window) {
						uuid = window.parent.sims[i].uuid;
						callbackId = callbackId + uuid;
						break;
					}
				}
			}
			
			// if (success || fail) {
			Cordova.callbacks[callbackId] = {
			    success : success,
			    fail : fail
			};
			// }
			_consoleLog("Cordova.exec(" + service + ", " + action + ", " + JSON.stringify(args) + "): callbackId=" + callbackId);
			// public String exec(final String service, final String action,
			// final String callbackId, final String jsonArgs, final boolean
			// async)
			// var r = prompt(Cordova.stringify(args),
			// "gap:"+Cordova.stringify([service, action, callbackId, true]));
			
			
			var s = null;
			if (window.opener) {
				s = JSON.stringify({
				    uuid : uuid,
				    service : service,
				    action : action,
				    callbackId : callbackId,
				    args : args
				});
				window.opener.postMessage(s, "*");
			} else {
				s = JSON.stringify({
				    uuid : uuid,
				    service : service,
				    action : action,
				    callbackId : callbackId,
				    args : args
				});
				window.parent.postMessage(s, "*");
			}
		} catch (e2) {
			_consoleLog("Error: " + e2);
		}
	};

	window.addEventListener("message", function(e){
		_consoleLog("*****PG BC***** " + e.domain + " said: " + e.data);
		var r = e.data;

		// If a result was returned
		_consoleLog("typeof result=" + (typeof r) + " r=" + r);
		if (r.length > 0) {
			// if ((typeof r == "string") && (r.length > 0)) {
			_consoleLog("Result from exec=<" + dumpObj(r, '', ' ', 2) + ">");
			eval("var v=" + r + ";");
			var callbackId = v.id;
			var cast = v.cast;
			// var temp = "+cast+"("+this.getJSONString() + ");\n"
			if (cast) {
				// _consoleLog("CAST==="+"var
				// temp="+cast+"("+JSON.stringify(v.message)+");\n");
				// eval("var temp="+cast+"("+JSON.stringify(v.message)+");\n");
				// _consoleLog("***** CAST:"+" var temp="+cast+"("+r+");");
				eval("var temp=" + cast + "(" + r + ");");
				v = temp;
			}
			// _consoleLog("After CAST="+dumpObj(v, '', ' ', 3));

			// If status is OK, then return value back to caller
			if (v.status === Cordova.callbackStatus.OK) {

				// If there is a success callback, then call it now with
				// returned value
				if ((typeof(Cordova.callbacks[callbackId]) != 'undefined') 
					&& (Cordova.callbacks[callbackId] != null)) {
					if (Cordova.callbacks[callbackId].success) {
						try {
							Cordova.callbacks[callbackId].success(v.message);
						} catch (e) {
							_consoleLog("Error in success callback: " + callbackId + " = " + e);
						}

						// Clear callback if not expecting any more results
						if (!v.keepCallback) {
							delete Cordova.callbacks[callbackId];
						}
					}
				}
				return v.message;
			}

			// If no result
			else if (v.status === Cordova.callbackStatus.NO_RESULT) {

				// Clear callback if not expecting any more results
				if (!v.keepCallback) {
					delete Cordova.callbacks[callbackId];
				}
			}

			// If event
			else if (v.status === Cordova.callbackStatus.EVENT) {
				if (v.message == 'pause') {
					Cordova.onPause.fire();
				} else if (v.message == 'resume') {
					Cordova.onResume.fire();
				} else if (v.message == 'backbutton') {
					Cordova.onBackKeyDown.fire();
				} else if (v.message == 'menubutton') {
					Cordova.onMenuKeyDown.fire();
				} else if (v.message == 'searchbutton') {
					Cordova.onSearchKeyDown.fire();
				} else if (v.message == 'online') {
					Cordova.onOnline.fire();
				} else if (v.message == 'offline') {
					Cordova.onOffline.fire();
				} else if (v.message == 'endcallbutton') {
					Cordova.onEndCallKeyDown.fire();
				} else if (v.message == 'startcallbutton') {
					Cordova.onStartCallKeyDown.fire();
				} else if (v.message == 'volumeupbutton') {
					Cordova.onVolumeUpKeyDown.fire();
				} else if (v.message == 'volumedownbutton') {
					Cordova.onVolumeDownKeyDown.fire();
				} else {
					Cordova.fireEvent(v.message);
				}
			}

			// If error, then display error
			else {
				_consoleLog("Error: Status=" + v.status + " Message=" + v.message);

				// If there is a fail callback, then call it now with returned
				// value
				if (Cordova.callbacks[callbackId].fail) {
					try {
						Cordova.callbacks[callbackId].fail(v.message);
					} catch (e1) {
						_consoleLog("Error in error callback: " + callbackId + " = " + e1);
					}

					// Clear callback if not expecting any more results
					if (!v.keepCallback) {
						delete Cordova.callbacks[callbackId];
					}
				}
				return null;
			}
		}
	}, false);

	/**
	 * Called by native code when returning successful result from an action.
	 * 
	 * @param callbackId
	 * @param args
	 */
	Cordova.callbackSuccess = function(callbackId, args){
		_consoleLog("callbackSuccess(" + dumpObj(args, '', ' ', 2) + ")");

		if ((typeof(Cordova.callbacks[callbackId]) != 'undefined') 
			&& (Cordova.callbacks[callbackId] != null)) {

			// If result is to be sent to callback
			if (args.status === Cordova.callbackStatus.OK) {
				try {
					if (Cordova.callbacks[callbackId].success) {
						Cordova.callbacks[callbackId].success(args.message);
					}
				} catch (e) {
					_consoleLog("Error in success callback: " + callbackId + " = " + e);
				}
			}

			// Clear callback if not expecting any more results
			if (!args.keepCallback) {
				delete Cordova.callbacks[callbackId];
			}
		} else {
			delete Cordova.callbacks[callbackId];
		}
	};

	/**
	 * Called by native code when returning error result from an action.
	 * 
	 * @param callbackId
	 * @param args
	 */
	Cordova.callbackError = function(callbackId, args){
		// _consoleLog("callbackError("+args+")");

		if ((typeof(Cordova.callbacks[callbackId]) != 'undefined') 
			&& (Cordova.callbacks[callbackId] != null)) {
			try {
				if (Cordova.callbacks[callbackId].fail) {
					Cordova.callbacks[callbackId].fail(args.message);
				}
			} catch (e) {
				_consoleLog("Error in error callback: " + callbackId + " = " + e);
			}

			// Clear callback if not expecting any more results
			if (!args.keepCallback) {
				delete Cordova.callbacks[callbackId];
			}
		} else {
			delete Cordova.callbacks[callbackId];
		}
	};

	Cordova.close = function(context, func, params){
		if (typeof params === 'undefined') {
			return function(){
				return func.apply(context, arguments);
			};
		} else {
			return function(){
				return func.apply(context, params);
			};
		}
	};

	/**
	 * Load a JavaScript file after page has loaded.
	 * 
	 * @param {String}
	 *            jsfile The url of the JavaScript file to load.
	 * @param {Function}
	 *            successCallback The callback to call when the file has been
	 *            loaded.
	 */
	Cordova.includeJavascript = function(jsfile, successCallback){
		var id = document.getElementsByTagName("head")[0];
		var el = document.createElement('script');
		el.type = 'text/javascript';
		if (typeof successCallback === 'function') {
			el.onload = successCallback;
		}
		el.src = jsfile;
		id.appendChild(el);
	};

};

window.Cordova = Cordova;
window.PhoneGap = Cordova;
