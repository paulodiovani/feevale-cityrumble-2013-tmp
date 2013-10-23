
/* JavaScript content from wlclient/js/analytics/analytics.js in Common Resources */
/**
 * @license
 * Licensed Materials - Property of IBM
 * 5725-G92 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

/*global TLT, WLJQ, WL_, cordova, __tealeafCallback, _enable */

var WL = WL || {};

/**
	Adds the ability to enable, disable, reset and log analytics data during a Worklight Application runtime.

	Enabling or disabling can be set by default on the wlInitOptions object, by creating the analytics object in
	it. The analytics object contains the boolean variable `enabled`, and optionally the string variable `url`.
	The event `WL/ANALYTICS/READY` will be triggered when WL.Analytics is enabled. WL.Analytics cannot be used
	before this event is triggered, or before using WL.Analytics.enable([options]) properly (see below).
	
	Note: No data will be sent to the Worklight server until the application is successfully connected to the server.
	This can be achieved by setting connectOnStartup : true in the wlInitOptions object in initOptions.js (which is
	found in [app folder]/common/js), or is done automatically on the first successful call to an adapter in the
	Worklight server.
	
	@class WL.Analytics
*/
WL.Analytics = (function (jQuery, lodash, TLT, global) {

	'use strict';

	var

	//Dependencies
	$ = jQuery,
	_ = lodash,

	//Constants
	PKG_NAME = 'wl.analytics',
	ANALYTICS_PATH = 'analytics',
	ANDROID_ENV = WL.Environment.ANDROID,
	IPHONE_ENV = WL.Environment.IPHONE,
	IPAD_ENV = WL.Environment.IPAD,
	CDV_PLUGIN_NAME = 'AnalyticsConfigurator',
	CDV_PLUGIN_CONFIGURE_TEALEAF = 'configureTealeaf',
	CDV_PLUGIN_SEND = 'send',
	CDV_PLUGIN_ENABLE = 'enable',
	CDV_PLUGIN_DISABLE = 'disable',
	CDV_PLUGIN_RESET_CONFIG = 'resetConfig',
	APP_VERSION_KEY = 'x-wl-app-version',
	TLT_INIT = 'initialized',
	TLT_DESTROYED = 'destroyed',
	QUEUE_THRESHOLD = 10,
	TLT_JS_QUEUE_MAX_THRESHOLD = 1000,

	logger = WL.Logger.create({pkg: PKG_NAME}),

	state = {

		//enabled: boolean is appended when state() is called

		//Value assigned when enabled is called
		url : null,

		//Amount of log events in the queue
		currentQueueSize : 0,

		//Flag to determine if flushQueue has been attached to the WL.Events.WORKLIGHT_IS_CONNECTED event
		wlconnectEventAttached: false,

		//JavaScript Date when the queue was sucesfully flushed
		lastUpdate: null
	},

	__setQueueThreshold = function (value) {
		if (!_.isNumber(value) || value < 0) {

			logger.error('Invalid queue threshold, value:', value);

		} else {

			QUEUE_THRESHOLD = value;
			logger.debug('Queue threshold set, value:', QUEUE_THRESHOLD);
		}

		return QUEUE_THRESHOLD;
	},

	__getWorklightHeaders = function (src) {
		var headers = WL.Client.getGlobalHeaders() || {},
			headersCopy;

		src = src || '';

		headers[APP_VERSION_KEY] = WL.Client.getAppProperty(WL.AppProp.APP_VERSION);

		//A new object returned, instead of a reference
		headersCopy = _.cloneDeep(headers);

		logger.debug(src, 'got headers:', headersCopy);

		return headersCopy;
	},

	__generateWorklightAnalyticsPath = function () {
		return WL.Client.getAppProperty(WL.AppProp.WORKLIGHT_ROOT_URL) + ANALYTICS_PATH;
	},

	__generateDefaultTLConfig = function (options) {

		return {
			core : {
				additionalHeaders : function () {
					return __getWorklightHeaders('generateDefaultTLConfig');
				},
				moduleBase: 'intermediate/modules/',
				modules: {
					performance: {
						events: [
							{ name: 'load', target: global },
							{ name: 'unload', target: global }
						]
					},
					replay: {
						events: []
					}
				},

				// Set the sessionDataEnabled flag to true only if it's OK to expose
				// Tealeaf session data to 3rd party scripts.
				sessionDataEnabled: false,
				sessionData: {

					// Set this flag if the session value needs to be hashed to derive the Tealeaf session ID
					sessionValueNeedsHashing: true,

					// Specify sessionQueryName only if the session id is derived from a query parameter.
					sessionQueryName: 'sessionID',
					sessionQueryDelim: ';',

					// sessionQueryName, if specified, takes precedence over sessionCookieName.
					sessionCookieName: 'jsessionid'
				},
				// list of ignored frames pointed by css selector (top level only)
				framesBlacklist: [
					'#iframe1'
				]
			},

			/******** SERVICES ********/

			services : {
				queue: [{
					qid: 'DEFAULT',
					endpoint: options.url,
					maxEvents: options.queueSize,
					serializer: 'json'
				}],

				message: {
					privacy: [
						{
							targets: [
								// CSS Selector: All password input fields
								'input[type=password]'
							],
							'maskType': 3
						}
					]
				},
				serializer: {
					json: {
						defaultToBuiltin: true,
						parsers: [ 'JSON.parse' ],
						stringifiers: [ 'JSON.stringify' ]
					}
				},
				browser: {
					jQueryObject: 'window.jQuery'
				}
			},

			/******** MODULES ********/

			modules : {
				performance: {
					filter: {
						navigationStart: true,
						unloadEventStart: true,
						unloadEventEnd: true,
						redirectStart: true,
						redirectEnd: true,
						fetchStart: true,
						domainLookupStart: true,
						domainLookupEnd: true,
						connectStart: true,
						connectEnd: true,
						secureConnectionStart: true,
						requestStart: true,
						responseStart: true,
						responseEnd: true,
						domLoading: true,
						domInteractive: true,
						domContentLoadedEventStart: true,
						domContentLoadedEventEnd: true,
						domComplete: true,
						loadEventStart: true,
						loadEventEnd: true
					}
				}
			}
		};
	},

	__createClientContext = function () {

		logger.debug('Started __createClientContext');

		var date = new Date(),

			clientContext = {

				// Only used to simplify the x2020 pipe logic
				// Get timezone offset returns the difference in minutes between UTC and local time
				timestamp: date.getTime() + date.getTimezoneOffset() * 60 * 1000,

				environment : WL.Client.getAppProperty(WL.AppProp.ENVIRONMENT),

				appName : WL.Client.getAppProperty(WL.AppProp.APP_DISPLAY_NAME),

				appVersion : WL.Client.getAppProperty(WL.AppProp.APP_VERSION),

				deviceContext : WL.Device.getContext()
			};

		logger.debug('Finished __createClientContext', clientContext);

		return clientContext;
	},

	__checkNativeEnvironment = function () {
		var env = WL.Client.getEnvironment();
		
		return (env === ANDROID_ENV ||
			env === IPHONE_ENV ||
			env === IPAD_ENV);
	},

	__callNative = function (options) {

		var deferred = $.Deferred(),
			errObj,

			success = function () {
				deferred.resolve();
			},

			failure = function (err) {
				errObj = {src: options.method, msg: err};
				deferred.reject(errObj);
			};

		cordova.exec(success, failure, options.plugin, options.method, options.params);

		return deferred.promise();
	},

	__routeToNativeOrJavaScript = function (options) {

		var deferred = $.Deferred();

		options = options || {};

		if (options.callNative) {

			//options should have the following keys:
			//plugin - cordova plugin name
			//method - cordova plugin method name
			//params - array with parameters sent to native plugin method
			__callNative(options)

			.then(function () {
				logger.debug('[Native] Finished', options.method, 'succesfully');
				deferred.resolve();
			})

			.fail(function (errObj) {
				logger.error('[Native] Finished', options.method, 'with errObj:', errObj);
				deferred.reject(errObj);
			});

		} else {

			setTimeout(function() {
				deferred.resolve();
			}, 0);
		}

		return deferred.promise();
	},

	__flushQueue = function (options) {

		options = _.extend({skipValidation: false}, options || {});

		var deferred = $.Deferred(),
			errObj,
			headers,
			WorklightAnalyticsURL;

		// the _isConnected flag is currently set to false, don't bother attempting AJAX GET connectivity confirmation
		if (!WL.Client.isConnected()) {
			setTimeout(function () {
				deferred.resolve();
			}, 0);
			return deferred.promise();
		}
		
		//Native has been set to interval POST rather than manual POST
		//Don't try to flush the queue because of lack of connectivity to the server
		if (QUEUE_THRESHOLD === 0 || (!options.skipValidation && state.currentQueueSize < QUEUE_THRESHOLD) ) {

			setTimeout(function () {
				deferred.resolve();
			}, 0);

			return deferred.promise();
		}

		// 0. Get the right headers to get passed Worklight's authentication
		// NOTE: No need to attach cookies, those are attached automatically
		headers = __getWorklightHeaders('flushQueue');

		// 2. The URL to the Worklight server is set, even if TLT's URL is different
		WorklightAnalyticsURL = __generateWorklightAnalyticsPath();

		// 3. Do an ajax GET (default) call to [worklightServerRootURL]/analytics
		$.ajax({
			url: WorklightAnalyticsURL,
			headers: headers
		})

		// 4. 200 Response means it's safe to flush the queue, by default if TLT
		// is unable to reach the Worklight Server the contents of the queue are lost
		// hence this flushQueue call that checks if we can access the Worklight Server
		.done(function () {

			// 5. Call the Native send function that transmits the contents of the queue to the server
			// or TLT's flushQueue method on JavaScript-only environments
			__routeToNativeOrJavaScript({
				callNative : __checkNativeEnvironment(),
				plugin : CDV_PLUGIN_NAME,
				method : CDV_PLUGIN_SEND,
				params : [headers]
			})

			.then(function () {

				if (!__checkNativeEnvironment()) {
					TLT.flushAll();
				}
				
				state.currentQueueSize = 0; //Reset
				state.lastUpdate = new Date();
				
				deferred.resolve();
			})

			.fail(function (errObj) {
				deferred.reject(errObj);
			});

		})

		// 5. When the Worklight Server is unreachable ($.ajax failed)
		// send an error object with the response from the network request
		// NOTE: This may occur frequently
		.fail(function (res) {

			errObj = {src: 'flushQueue', msg: res};
			deferred.resolve(errObj);
		});

		return deferred.promise();
	},

	__attachWLConnectEvent = function (state) {

		//0. Check if the WL.Events.WORKLIGHT_IS_CONNECTED event is already attached
		if (!state.wlconnectEventAttached) {

			//1. Attach to the WLConnect event to flush the queue when WL connects successfully
			
			$(document).on(WL.Events.WORKLIGHT_IS_CONNECTED, function () {
				__flushQueue({skipValidation: true})
			});

			//2. Update state object to represent the current state
			state.wlconnectEventAttached = true;
		}
	},

	__enableTealeaf = function (state) {

		var deferred = $.Deferred(),
			config = __generateDefaultTLConfig({url: state.url, queueSize: QUEUE_THRESHOLD}),
			TLTconfig;

		//If TLT is not enabled, enable the JavaScript and Native versions
		if (! TLT.isInitialized()) {

			__routeToNativeOrJavaScript({
				callNative : __checkNativeEnvironment(),
				plugin : CDV_PLUGIN_NAME,
				method : CDV_PLUGIN_ENABLE,
				params : []
			})

			.then(function () {
				TLT.init(config, function (str) {
					__tealeafCallback(str, deferred);
				});
			})

			.fail(function (errObj) {
				deferred.reject(errObj);
			});

		} else {

			//If TLT is enabled iterate over TLT's configuration object,
			//find the DEFAULT queue and update the URL
			TLTconfig = TLT.getConfig();

			try {
				_.each(TLTconfig.services.queue, function (queue) {

					if (queue.qid === 'DEFAULT') {
						queue.endpoint = state.url;
						logger.debug('URL updated to:', state.url);
					}
				});

				TLT.updateConfig(TLTconfig);

			} catch (e) {
				logger.error('Probably could not update the URL, e:', e);
			}

			setTimeout(function () {
				deferred.resolve();
			}, 0);
		}

		return deferred.promise();
	},

	__tealeafCallback = function (str, deferred) {

		//Passed via TLT.init and called when TLT.init() and TLT.destroy() finish
		//str is 'initialized' when TLT.init() finished
		//str is 'destroyed' when TLT.destroy() finished

		var errObj;

		if (str === TLT_INIT || str === TLT_DESTROYED) {

			logger.debug('__tealeafCallback returned, str:', str);
			deferred.resolve();

		} else {
			errObj = {src: 'TLT.init', msg: str};
			logger.error('Failed, str:', str, 'errObj:', errObj);
			deferred.reject(errObj);
		}
	},

	/**
		Logs a message with some Worklight contextual data and is then added to a Tealeaf queue. This
		queue will be flushed every 10 `WL.Analytics.log` calls, and every time the app goes to the 
		background. If flush queue fails to contact the server, an error object is passed as the second
		parameter of the success callback. The first parameter is always the same, see return values.
		
		The first parameter is the JSON object that you want to log as the message, and the second parameter 
		is an optional name for this particular event being logged. The contextual data provided by 
		Worklight is the application name and version, the environment in which the application is running,
		and the GPS and/or network information, if it is available, and if all required permissions
		are previously set for the application.

		@method log
		@param msg {Object} Message
		@param [name] {String} Name of the message
		@return {Promise} Resolved with true if the queue was flushed and false if the queue
			was not flushed. Rejected with an error object.

		@example

			WL.Analytics.log({data: [1,2,3]});
			//or
			WL.Analytics.log({data: [1,2,3]}, 'MyData');

			//Checking if the queue was flushed
			WL.Analytics.log({hello: 'world'})

			.always(function (wasQueueFlushed, errObj) {

				if (wasQueueFlushed) {

					WL.Logger.debug('The queue was flushed');

				} else {

					WL.Logger.debug('The queue was NOT flushed');
				}

				if (typeof errObj === 'object') {
					WL.Logger.debug('Error trying to flush the queue', errObj);
				}

			});

	*/
	_log = function (msg, name) {

		logger.debug('Started _log, name:', name, 'msg:', msg);

		var errObj,
			ctx,
			eventMessage;

		//0. If running on JS env without connectivity to the WL server, check if
		//   the queue can accept more events
		if (!__checkNativeEnvironment() &&
			state.currentQueueSize >= TLT_JS_QUEUE_MAX_THRESHOLD) {

			logger.warn('Max queue size reached, currentQueueSize:', state.currentQueueSize);

			//EXIT!
			return null;
		}

		//1. If TLT is not enabled, finish sucessfully without logging the event
		if (! TLT.isInitialized() ) {

			//Returns false because the queue was not flushed
			logger.debug('Finished _log, state.enable:', TLT.isInitialized());

			//EXIT!
			return null;
		}

		//2. Fail validation if name is Object, Array or Function OR msg is not an Object
		//Note: _.isObject([]) and _.isObject({}) return true
		if (!_.isObject(msg) || _.isObject(name) || _.isFunction(name)) {

			errObj = {src: 'log', msg: 'Invalid parameters sent'};
			logger.error('Finished _log with errObj', errObj);

			//EXIT!
			return errObj;
		}

		//3. Turn name into an empty string or the string representation of the value sent
		if (! _.isString(name)) {
			try {
				name = name.toString();
			} catch (e) {
				//Note: null and undefined go to this code path and get turned into empty strings
				name = '';
			}
		}

		//4. Get the application context (version, name, geolocation, etc.)
		ctx = __createClientContext();

		//5. Prepare the event message in a format TLT expects
		eventMessage = {
			eventMessage : msg,
			clientContext: ctx
		};

		//6. Log the TLT custom event
		TLT.logCustomEvent(name, eventMessage);
		state.currentQueueSize++;

		//7. Flush the queue if the QUEUE_THRESHOLD was reached, update currentQueueSize and exit

		logger.log('Finished _log');
		return __flushQueue();
	},

	/**
		Disables the capture of analytics data. Any data logged while WL.Analytics is
		disabled will be lost.

		@method disable
		@return {Promise} Resolved with no parameters, rejected with an error object.

		@example

			WL.Analytics.disable()

			.then(function () {
				//Capture of Analytics data is fully disabled.
			})

			.fail(function (errObj) {
				//errObj.src = function that failed
				//errObj.msg = error message
			});
	*/
	_disable = function () {

		logger.debug('Started _disable');

		var deferred = $.Deferred();

		//1. Stop TLT (JavaScript) if it's enabled
		if (TLT.isInitialized()) {

			TLT.destroy();
		}

		//2. Stop TLT (Native) via Cordova disable or finish succesfully
		__routeToNativeOrJavaScript({
			callNative : __checkNativeEnvironment(),
			plugin: CDV_PLUGIN_NAME,
			method: CDV_PLUGIN_DISABLE,
			params: []
		})

		.then(function () {
			logger.debug('Finished _disable');
			deferred.resolve();
		})

		.fail(function (errObj) {
			logger.debug('Finished _disable with errObj:', errObj);
			deferred.reject(errObj);
		});

		return deferred.promise();
	},

	/**
		Disables analytics capture, resets the Tealeaf configuration settings to their default value
		and re-enables the capture of analytics data. It can be called with an options object that
		has the same format as the one passed to `WL.Analytics.enable`. Any data in the queue will be
		discarded.
		
		In Android, it resets the configuration to what is set in the TLFConfigurableItems.properties
		file. In iOS, it resets it to the values in TLFConfigurableItems.plist. The URL will be set to
		whatever is specified in options.url, or if none is specified, the URL will point to the
		Worklight server, like `WL.Analytics.enable` does.

		@method restart
		@param [options] {Object} options has the same properties as the one passed to `WL.Analytics.enable`
		@return {Promise} Resolved with no parameters, rejected with an error object.

		@example

			WL.Analytics.restart({url: 'http://example.org'})

			.then(function () {
				//Tealeaf's configuration is reset to its default values
				//Capture of Analytics data is fully enabled.
				//Data will be sent to 'http://example.org'
			})

			.fail(function (errObj) {
				//errObj.src = function that failed
				//errObj.msg = error message
			});
	*/
	_restart = function (options) {

		logger.debug('Started _restart, options:', options);

		var deferred = $.Deferred();

		//0. Call disable, this will finish sucesfully even if it was already disabled
		_disable()

		.then(function () {
			return __routeToNativeOrJavaScript({
				callNative : __checkNativeEnvironment(),
				plugin : CDV_PLUGIN_NAME,
				method : CDV_PLUGIN_RESET_CONFIG,
				params : []
			});
		})

		.then(function () {

			//1. Reset TLT configuration back to the default one and Start TLT again
			_enable(options)

			.then(function () {

				logger.debug('Finished _restart');
				deferred.resolve();
			})

			.fail(function (errObj) {

				logger.error('Finished _restart with a failure on _enable, errObj:', errObj);
				deferred.reject(errObj);
			});

		})

		.fail(function (errObj) {

			logger.error('Finished _restart with a failure on _disable, errObj:', errObj);
			deferred.reject(errObj);
		});

		return deferred.promise();
	},

	/**
		Turns on the capture of analytics data. The promise returned by `enable`
		must be resolved prior to any `WL.Analytics` API call.

		The options object can contain the 'url' key with a string value pointing to 
		the server to which Tealeaf will POST its collected analytics data.
		If no URL is specified (meaning url is not defined, or url is an empty string),
		it will default to the Worklight server.

		If enable is called with a different URL than the one currently set, analytics
		data collected for the previous URL will be discarded and not sent to the new server.
		
		When enabled, any crash of the application will be logged and sent to the server
		when the app runs once again. The information logged for the crash is the stack trace
		together with the Worklight app name and version, and the environment in which the app
		was running.

		@method enable
		@param [options] {Object}
		@return {Promise} Resolved with no parameters, rejected with an error object.

		@example

			WL.Analytics.enable({url: 'http://example.org'})

			.then(function () {
				//Capture of Analytics data is fully enabled.
				//Data will be sent to 'http://example.org'
			})

			.fail(function (errObj) {
				//errObj.src = function that failed
				//errObj.res = error message
			});
	*/
	_enable = function (options) {

		logger.debug('Started _enable');

		var deferred = $.Deferred(),
			passedURL,
			errObj;

		//0. Support no options passed, turn it into an empty obj to pass validation
		if (_.isUndefined(options)) {
			options = {};
		}

		//1. Validation - check for {url: 'http://server/'}
		if (!_.isObject(options) && !_.isString(options.url)) {

			errObj = {src: 'enable', msg: 'Invalid parameters'};

			setTimeout(function () {
				deferred.reject(errObj);
			}, 0);

			logger.error('Failed validation, options:', options ,'errObj:', errObj);

			//EXIT!
			return deferred.promise();
		}

		//2. Add the new Tealeaf URL that was passed to the state object
		if (_.isString(options.url) && options.url.length > 0) {

			state.url = options.url;
			passedURL = options.url;

		} else {

			//URL was NOT passed, set default URL
			state.url = __generateWorklightAnalyticsPath();
		}

		//3. Attach to the WL.Events.WORKLIGHT_IS_CONNECTED event, the queue should be flushed when WL connects successfully
		__attachWLConnectEvent(state);

		//4. setPostURL via Cordova Plugin, if passedURL is not a string native is not called
		__routeToNativeOrJavaScript({
			callNative : _.isString(passedURL) && __checkNativeEnvironment(),
			plugin : CDV_PLUGIN_NAME,
			method : CDV_PLUGIN_CONFIGURE_TEALEAF,
			params : [{PostMessageUrl: state.url}]
		})

		//5. enable via Cordova Plugin
		.then(function () {
			return __enableTealeaf(state);
		})

		//6. Flush the queue, this sends data the server if we can access the server
		.then(function () {
			TLT.setAutoFlush(false);
			return __flushQueue({skipValidation: true});
		})

		//7. EXIT!
		.then(function () {
			logger.debug('Finished _enable');
			deferred.resolve();
		})

		.fail(function (errObj) {
			logger.error('Enabled failed, errObj', errObj);
			deferred.reject(errObj);
		});

		return deferred.promise();
	},

	/**
		The state object is kept by `WL.Analytics` and contains the following keys:

		* enabled (*boolean*) - Value is true if Tealeaf is enabled, false otherwise
		* url (*string*) - Value is the URL Tealeaf sends messages queued with `WL.Analytics.log`
		* currentQueueSize (*integer*) - Value is the number of messages in the queue
		* wlconnectEventAttached (*boolean*) - Value is true if the queue is flushed on WL.Events.WORKLIGHT_IS_CONNECTED event
		* lastUpdate (*date*) - Last time the server was accessible and log data was sent. Null if
			the server has never been reached.

		Changing the state object returned will not affect the state object kept internally.

		@method state
		@return {Object} Copy of the state object

		@example

			WL.Analytics.state();
			//{enabled: true, url: 'http://example.org', currentQueueSize: 1, wlconnectEventAttached: true}
	*/
	_state = function () {

		//0. Regenerate the 'enabled' status, WL.Analytics does not keep track of it
		state.enabled = TLT.isInitialized();

		//1. Return a copy instead of reference to the state object so users can't modify it
		return _.cloneDeep(state);
	};

	//public API
	return {
		enable : _enable,
		disable: _disable,
		restart : _restart,
		log: _log,
		state: _state,
		// Methods for unit testing ONLY:
		__setQueueThreshold : __setQueueThreshold,
		__getWorklightHeaders : __getWorklightHeaders,
		__generateWorklightAnalyticsPath : __generateWorklightAnalyticsPath,
		__generateDefaultTLConfig : __generateDefaultTLConfig,
		__createClientContext : __createClientContext,
		__checkNativeEnvironment : __checkNativeEnvironment,
		__callNative : __callNative,
		__routeToNativeOrJavaScript : __routeToNativeOrJavaScript,
		__flushQueue : __flushQueue,
		__attachWLConnectEvent : __attachWLConnectEvent,
		__enableTealeaf : __enableTealeaf,
		__tealeafCallback : __tealeafCallback
	};

}(WLJQ, WL_, TLT, window)); //WL.Analytics