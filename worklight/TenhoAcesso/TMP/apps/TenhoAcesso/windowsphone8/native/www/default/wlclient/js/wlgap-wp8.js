
/* JavaScript content from wlclient/js/wlgap-wp8.js in windowsphone8 Common Resources */
/**
* @license
* Licensed Materials - Property of IBM
* 5725-G92 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
* US Government Users Restricted Rights - Use, duplication or
* disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
*/

/* Copyright (C) Worklight Ltd. 2006-2012.  All rights reserved. */

WL.App.close = function () {
};

wl_remoteDisableChallengeHandler.__generateDialogueButtons = function()
{
	 var buttons = [ {
         text : WL.ClientMessages.close,
      

         handler : function() {
         }
     } ];
	 
	 return buttons;
}

//js alert
window.webAlert = window.alert;
window.alert = function(msg) {
    try {
	cordova.exec('Notification.Alert;' + msg);
    } catch (e) {
	WL.Logger.debug("Problem show native WP alert for message " + msg);
	window.webAlert(msg);
    }
};

WL.App.openURL = function (url) {
    cordova.exec(function () {}, function () {}, "WLOpenURL", "open", [url]);
};

// add dynamicly meta tag for init scale of the widget
function setScaleMetaTag() {
    var meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'initial-scale=1.0';
    document.getElementsByTagName('head')[0].appendChild(meta);
}

setScaleMetaTag();

/**
 * Options Menu Implementation for Windows Phone. Please note: In Windows Phone terminology, Options Menu is
 * actually the Application Bar.
 */
__WLOptionsMenu = function() {
    var isInit = false;
    var itemIdToItem = {};

    /**
     * Initializes the options menu. Must be called before using any other OptionsMenu function.
     * @param {Object} [options] Options for customizing the options menu init state opcaity - a decimal
     *                number between 0.0 and 1.0 that represents the opacity factor. 1.0 is fully opaque, 0.0
     *                is fully transparent.
     */
    this.init = function(options) {
	// validate arguments
	WL.Validators.validateOptions({
	    opacity : 'number'
	}, options, 'WL.OptionsMenu.init options');
	var defaultOptions = {
	    opacity : 1.0
	};
	WLJSX.Object.extend(defaultOptions, options);

	// call native
	cordova.exec(function () { }, function () { }, "WLApplicationBar", "init", [WL.Utils.getCurrentSkinName()]);
	isInit = true;

	// initialize state
	this.setOpacity(defaultOptions.opacity);

	// show application bar
	this.setVisible(true);
    };

    /**
     * Return true if the OptionsMenu is initialized
     */
    function isInitialized() {
	if (!isInit) {
	    WL.Logger.error("WL.OptionsMenu.init() must be called first.");
	}
	return isInit;
    }
    ;

    /**
     * Adds an item to the Options Menu. Can be called only after initializing the menu. Items are ordered on
     * the menu according to the order in which they were added. If you add a item with an existing ID, the
     * new item replaces the existing one. No more than 4 items allowed (redundant items are ignored).
     * 
     * @param id Mandatory string. Identifies the item.
     * 
     * @param callback Mandatory JavaScript function. The callback function that should be invoked when the
     *                user touches the item.
     * 
     * @param title Mandatory string. The title of the item.
     * 
     * @param options - Hash options object. Available options: image - The path to the item's image, starting
     *                from the application root directory. Per Windows Phone's guidelines, the image should be
     *                a 48-by-48 pixel black and white PNG file. enabled - Boolean. Defines whether the item
     *                is enabled or disabled.
     * @return WL.OptionsMenu.Item
     */
    this.addItem = function(id, callback, title, options) {
        // error handling
        if (!isInitialized()) {
            return;
        }
		
        WL.Validators.validateArguments(['string', 'function', 'string', 'object'], arguments, 'WL.OptionsMenu.addItem');
        WL.Validators.validateOptions({
            enabled: 'boolean',
            image: 'string'
        }, options, 'WL.OptionsMenu.addItem options');
		
        var defaultOptions = {
            enabled: true,
            image: null
        };

        WLJSX.Object.extend(defaultOptions, options);
        // no more than 4 items allowed.
        var itemCount = 0;
        for (var k in itemIdToItem) {
            itemCount++;
        }

        if (itemCount >= 4) {
            WL.Logger.error("WL.OptionsMenu.addItem: No more than 4 items allowed.");
            return;
        }
        // creates new item, add it to the hash, and call native code
        var newItem = new WL.OptionsMenu.Item(id, callback, title, defaultOptions.image, defaultOptions.enabled);
        var nativeAction;
        if (itemIdToItem[id] === undefined) {
            nativeAction = "addItem";
        } else {
            nativeAction = "updateItem";
        }

        cordova.exec(function () { }, function () { }, "WLApplicationBar", nativeAction, [id, title, defaultOptions.image, defaultOptions.enabled]);
        itemIdToItem[id] = newItem;

        return newItem;
    };

    /**
     * Returns the item with the specified ID. Once you get an item, you can use it's set methods to change
     * the item's properties.
     * @param id Mandatory string. The ID of the required item.
     * @return A WL.OptionMenu.Item object. If the specified ID is not found, the method returns null.
     */
    this.getItem = function(id) {
	// error handling
	if (!isInitialized()) {
	    return;
	}
	WL.Validators.validateArguments(['string'], arguments, 'WL.OptionsMenu.getItem');

	// retrieves the item from the hash, and returns it
	var item = itemIdToItem[id];
	return (typeof item != 'undefined') ? item : null;
    };

    /**
     * Removes the item with the indicated ID from the menu. Can be called only after initializing the menu.
     * If no item is found with the specified ID, nothing happens.
     * <p>
     * If no item is found with the specified ID, nothing happens.
     * @param id Mandatory string. The ID of the item to be removed.
     */
    this.removeItem = function(id) {
	// error handling
	if (!isInitialized()) {
	    return;
	}
	WL.Validators.validateArguments(['string'], arguments, 'WL.OptionsMenu.removeItem');

	// if item exists - removes the item from the hash, and calls the native code.
	if (typeof itemIdToItem[id] != 'undefined') {
	    delete itemIdToItem[id];
		cordova.exec(function () { }, function () { }, "WLApplicationBar", "removeItem", [id]);
	}
    };

    /**
     * Removes all items from the menu. Can be called only after initializing the menu.
     */
    this.removeItems = function() {
	// error handling
	if (!isInitialized()) {
	    return;
	}

	// removes all items from the hash, and calls the native code.
	itemIdToItem = {};
	cordova.exec(function () { }, function () { }, "WLApplicationBar", "removeItems", []);
    };

    /**
     * Enables/Disables the menu.
     * @param isEnabled boolean signifying the request
     */
    this.setEnabled = function(isEnabled) {
	// error handling
	if (!isInitialized()) {
	    return;
	}
	WL.Validators.validateArguments(['boolean'], arguments, 'WL.OptionsMenu.setEnabled');

	// calls the native code
	cordova.exec(function () { }, function () { }, "WLApplicationBar", "setEnabled", [isEnabled]);
    };

    /**
     * Get menu enabled state
     * 
     * @callback is a callback that receives a boolean with enabled state
     */
    this.isEnabled = function(callback) {
    	WL.Validators.validateArguments(['function'], arguments, 'WL.OptionsMenu.isEnabled');
    	//error handling
    	if (!isInitialized()) {
    		callback(false);
    		return;
    	}

		// 	calls the native code. the result will delivered to the callback method.
		cordova.exec(callback, callback, "WLApplicationBar", "isEnabled", []);
    };

    /**
     * Set the menu visibility.
     * @param isVisible boolean signifying the request
     */
    this.setVisible = function(isVisible) {
	// error handling
	WL.Validators.validateArguments(['boolean'], arguments, 'WL.OptionsMenu.setVisible');

	// calls the native code
	cordova.exec(function () { }, function () { }, "WLApplicationBar", "setVisible", [isVisible]);
    };

    /**
     * Get the menu visibility state
     * 
     * @callback is a callback that receives a boolean with visible state 
     */
    this.isVisible = function(callback) {
    	WL.Validators.validateArguments(['function'], arguments, 'WL.OptionsMenu.isVisible');
    	
    	// error handling
    	if (!isInitialized()) {
    		callback(false);
    		return;
    	}

    	// calls the native code. the result will delivered to the callback method.
	
    	cordova.exec(callback, callback, "WLApplicationBar", "isVisible", []);
    };

    /**
     * Set the opacity of the Options Menu.
     * @param opacity a decimal number between 0.0 and 1.0 that represents the opacity factor. 1.0 is fully
     *                opaque, 0.0 is fully transparent.
     */
    this.setOpacity = function(opacity) {
	// error handling
	if (!isInitialized()) {
	    return;
	}
	// WL.Validators.validateArguments(['boolean'], arguments, 'WL.OptionsMenu.setVisible');

	// calls the native code
	cordova.exec(function () { }, function () { }, "WLApplicationBar", "setOpacity", [opacity]);
    };
};

__WL.prototype.OptionsMenu = new __WLOptionsMenu;
WL.OptionsMenu = new __WLOptionsMenu;

/**
 * The item that represents an options menu item (i.e. application bar image button)
 */
WL.OptionsMenu.Item = WLJSX.Class.create({

    initialize : function(id, callbackFunction, title, imagePath, enabled) {
	    this.id = id;
	    this.callbackFunction = callbackFunction;
	    this.title = title;
	    this.imagePath = imagePath;
	    this.enabled = enabled;
    },

    setTitle : function(title) {
	    WL.Validators.validateArguments(['string'], arguments, 'WL.OptionsMenu.Item.setTitle');
	    this.title = title;
	    cordova.exec(function () { }, function () { }, "WLApplicationBar", "updateItem", [this.id, this.title, this.imagePath, this.enabled]);
    },

    setImagePath : function(imagePath) {
	    WL.Validators.validateArguments(['string'], arguments, 'WL.OptionsMenu.Item.setImagePath');
	    this.imagePath = imagePath;
	    cordova.exec(function () { }, function () { }, "WLApplicationBar", "updateItem", [this.id, this.title, this.imagePath, this.enabled]);
    },

    setEnabled : function(enabled) {
	    WL.Validators.validateArguments(['boolean'], arguments, 'WL.OptionsMenu.Item.setEnabled');
	    this.enabled = enabled;
	    cordova.exec(function(){}, function(){}, "WLApplicationBar", "updateItem", [this.id,this.title,this.imagePath,this.enabled]);
    },

    _invokeCallback : function() {
	this.callbackFunction(this.id);
    }
});

var __backButtonCallback;

// Back Button support
WL.App.overrideBackButton = function(callback) {
	WL.Validators.validateArguments(['function'], arguments, "WL.App.overrideBackButton ");
	WL.App.resetBackButton();
	document.addEventListener("backbutton", callback, false);
	__backButtonCallback = callback;
};

WL.App.resetBackButton = function() {
	 WL.Validators.validateArguments([], arguments, "WL.App.resetBackButton ");
	if (__backButtonCallback != null) {
		document.removeEventListener('backbutton', __backButtonCallback, false);
		__backButtonCallback = null;
	}
};

// Implementation for reachability check to windowsphone env

WL.Utils.wlReachableCallback = function(reachability) {
    if (!window.connectivityCheckDone) {
	window.connectivityCheckDone = true;
	var hasConnection = ((reachability.code || parseInt(reachability)) !== NetworkStatus.NOT_REACHABLE);
	if (!hasConnection) {
	    WL.Logger.debug("No connection to " + reachabilityUrl);
	}
	WL.Utils.dispatchWLEvent(hasConnection ? __WL.InternalEvents.REACHABILITY_TEST_SUCCESS : __WL.InternalEvents.REACHABILITY_TEST_FAILURE);
    }
};

WL.Utils.__networkCheckTimeout = function() {
    if (!window.connectivityCheckDone) {
	WL.Logger.debug("Connectivity check has timed out");
	window.connectivityCheckDone = true;
	WL.Utils.dispatchWLEvent(__WL.InternalEvents.REACHABILITY_TEST_FAILURE);
    }
};

// checks that the WL server is available, and fires an appropriate event.
WL.Utils.wlCheckReachability = function() {
	var connectionType = navigator.connection.type;
	if (connectionType === Connection.NONE) {
		WL.Logger.debug("No connection to network.");
	}
		
	WL.Utils.dispatchWLEvent(connectionType === Connection.NONE ? __WL.InternalEvents.REACHABILITY_TEST_FAILURE : __WL.InternalEvents.REACHABILITY_TEST_SUCCESS);
};


/**
 * Push Notification API for the windows phone environment.
 */
__WLPush = function() {
	var subscribedSMSEventSources = {};
 	var isTokeUpdatedOnServer = false;
    var subscribedEventSources = {};
    var registeredEventSources = {};
    var pendindPushEventsArray = new Array();
    
    var defaultSubscribeOptions = {
        alert : true,
        badge : true,
        sound : true,
        requestHeaders : {},
        onFailure : function() {
            WL.Logger.error("WL.Client.Push.subscribe: error subscribing for notifications");
        },
        onSuccess : function() {
        }
    };
    
    var defaultUnsubscribeOptions = {
        requestHeaders : {},
        onFailure : function() {
            WL.Logger.error("WL.Client.Push.unsubscribe: error unsubscribing from notifications");
        },
        onSuccess : function() {
        }
    };
 
    var defaultSubscribeSMSOptions = {
        requestHeaders : {},
        onFailure : function() {
            WL.Logger.error("WL.Client.Push.subscribeSMS: error subscribing for notifications");
        },
        onSuccess : function() {
        }
    };
    var defaultUnsubscribeSMSOptions = {
        requestHeaders : {},
        onFailure : function() {
            WL.Logger.error("WL.Client.Push.unsubscribeSMS: error unsubscribing from notifications");
        },
        onSuccess : function() {
        }
    };

    this.subscribeSMS = function(alias, adapter, eventSource, phoneNumber, options) {
     
        WL.Validators.validateArguments([ 'string', 'string', 'string', 'string', WL.Validators.validateObjectOrNull ], arguments, 'WL.Client.Push.subscribeSMS');
        WL.Validators.validateOptionsLoose({
            onSuccess : 'function',
            onFailure : 'function'
        }, options, "WL.Client.Push.subscribeSMS");

        if (!options) {
            options = {};
        }
        
        var extendedOptions = WLJSX.Object.extend(WLJSX.Object.clone(defaultSubscribeSMSOptions), options);
        
        var subscribedSMSEventSource = {
                "adapter" : adapter,
                "eventSource" : eventSource
            };
        
        var requestOptions = {
            onSuccess : function() {
            	subscribedSMSEventSources[alias] = subscribedSMSEventSource;
                if (extendedOptions.onSuccess) {
                    extendedOptions.onSuccess();
                }
            },
            onFailure : extendedOptions.onFailure
        };

        requestOptions.requestHeaders = {};
        requestOptions.parameters = {};
        requestOptions.parameters.adapter = subscribedSMSEventSource.adapter;
        requestOptions.parameters.eventSource = subscribedSMSEventSource.eventSource;
        requestOptions.parameters.alias = alias;
        requestOptions.parameters.transport = "SMS";
    	requestOptions.parameters.phoneNumber = phoneNumber;
        requestOptions.parameters.subscribe = WLJSX.Object.toJSON(options);
        new WLJSX.Ajax.WLRequest("notifications", requestOptions);
    };

    this.unsubscribeSMS = function(alias, options) {

    	 if (!subscribedSMSEventSources[alias] || !subscribedSMSEventSources[alias].adapter) {
             WL.Logger.error("No subscribed push SMS event source for alias '" + alias + "'.");
             if (options.onSuccess) {
                 options.onSuccess();
             }
             return;
         }

        WL.Validators.validateArguments([ 'string', WL.Validators.validateObjectOrNull ], arguments, 'WL.Client.Push.unsubscribeSMS');
        WL.Validators.validateOptionsLoose({
            onSuccess : 'function',
            onFailure : 'function'
        }, options, "WL.Client.Push.unsubscribeSMS");

        var extendedOptions = WLJSX.Object.extend(WLJSX.Object.clone(defaultUnsubscribeSMSOptions), options);

        var subscribedSMSEventSource = subscribedSMSEventSources[alias];
        var requestOptions = {
            onSuccess : function() {
                subscribedSMSEventSources[alias] = {};
                if (extendedOptions.onSuccess) {
                    extendedOptions.onSuccess();
                }
            },
            onFailure : extendedOptions.onFailure
        };
        requestOptions.requestHeaders = {};
        requestOptions.parameters = {};
        requestOptions.parameters.alias = alias;
        requestOptions.parameters.adapter = subscribedSMSEventSource.adapter;
        requestOptions.parameters.eventSource = subscribedSMSEventSource.eventSource;
        requestOptions.parameters.unsubscribe = "";
        requestOptions.parameters.transport = "SMS";
        new WLJSX.Ajax.WLRequest("notifications", requestOptions);
    };
    
    /**
     * Register event source for push notification. Must be called on
     * application initialization before any subscribe call.
     * 
     * @param alias
     *            {string} - alias of the event source.
     * @param adapter
     *            {string}
     * @param eventSource
     *            {string}
     * @param callback
     *            {function} - this callback will be invoked upon receiving push
     *            notification. This function signature is function (props,
     *            payload).
     */
    this.registerEventSourceCallback = function(alias, adapter, eventSource, callback) {
        WL.Validators.validateMinimumArguments(arguments, 3, "WL.Client.Push.registerEventSourceCallback");
        WL.Validators.validateArguments([ 'string', 'string', 'string', WL.Validators.validateFunctionOrNull ], arguments,
                'WL.Client.Push.registerEventSourceCallback');
        if (typeof registeredEventSources[alias] != "undefined") {
            WL.Logger.error("Cannot register to event source callback with existing alias: " + alias);
            return;
        }
        if (!isAbleToSubscribe(alias, true)) {
            return;
        }
        registeredEventSources[alias] = {
            "adapter" : adapter,
            "eventSource" : eventSource,
            "callback" : callback
        };
    };

    this.__isDeviceSupportPush = function() {
        return typeof device.version != undefined && parseFloat(device.version.substr(0, 3)) >= 2.2;
    };

    this.__updateToken = function(serverToken) {
        cordova.exec(function(deviceToken) {
            updateTokenCallback(serverToken, deviceToken);
        }, function(error) {
            WL.Logger.error("Push notifications will not be received, because application failed to subscribe to Microsoft Push Notification Services due to " + error);
            WL.SimpleDialog.show(WL.ClientMessages.error, WL.ClientMessages.notificationUpdateFailure, [ {
                text : WL.ClientMessages.ok
            } ]);
        }, 'Push', 'subscribe', []);
    };

    this.subscribe = function(alias, options) {
        if (!isAbleToSubscribe(alias, false)) {
            return;
        }

        WL.Validators.validateArguments([ 'string', WL.Validators.validateObjectOrNull ], arguments, 'WL.Client.Push.subscribe');
        WL.Validators.validateOptionsLoose({
            alert : 'boolean',
            sound : 'boolean',
            badge : 'boolean',
            onSuccess : 'function',
            onFailure : 'function'
        }, options, "WL.Client.Push.subscribe");

        if (!options) {
            options = {};
        }
        var extendedOptions = WLJSX.Object.extend(WLJSX.Object.clone(defaultSubscribeOptions), options);
        var registeredEventSource = registeredEventSources[alias];
        var requestOptions = {
            onSuccess : function() {
            	subscribedEventSources[alias] = true;
                if (extendedOptions.onSuccess) {
                    extendedOptions.onSuccess();
                }
                if (WL.Client.Push.__hasPendings()) {
                    WL.Client.Push.__dispatchPendings();
                }
            }, 
            onFailure : function () {
            	extendedOptions.onFailure();
            }
        };
        
        requestOptions.requestHeaders = {};
        requestOptions.parameters = {};
        requestOptions.parameters.adapter = registeredEventSource.adapter;
        requestOptions.parameters.eventSource = registeredEventSource.eventSource;
        requestOptions.parameters.alias = alias;
        requestOptions.parameters.subscribe = WLJSX.Object.toJSON(options);
        new WLJSX.Ajax.WLRequest("notifications", requestOptions);
        //WP8 still not support dispatch pendings
        //cordova.exec(null, null, 'Push', 'dispatch', [ 'WL.Client.Push.__onmessage' ]);
    };

    this.unsubscribe = function(alias, options) {
        if (!isAbleToSubscribe(alias, false)) {
            return;
        }

        WL.Validators.validateArguments([ 'string', WL.Validators.validateObjectOrNull ], arguments, 'WL.Client.Push.unsubscribe');
        WL.Validators.validateOptionsLoose({
            onSuccess : 'function',
            onFailure : 'function'
        }, options, "WL.Client.Push.unsubscribe");

        options = WLJSX.Object.extend(WLJSX.Object.clone(defaultUnsubscribeOptions), options);

        var registeredEventSource = registeredEventSources[alias];
        var requestOptions = {
            onSuccess : function() {
            	subscribedEventSources[alias] = false;
                if (options.onSuccess) {
                    options.onSuccess();
                }
            },
            onFailure : function () {
            	options.onFailure();
            }
        };
        requestOptions.parameters = {};
        requestOptions.parameters.alias = alias;
        requestOptions.parameters.adapter = registeredEventSource.adapter;
        requestOptions.parameters.eventSource = registeredEventSource.eventSource;
        requestOptions.parameters.unsubscribe = "";
        new WLJSX.Ajax.WLRequest("notifications", requestOptions);
    };
    
    /**
     * Clear the subscribed event sources
     */
    this.__clearSubscribedEventSources = function(eventSources) {
        WL.Logger.debug("Clearing notification subscriptions.");
        subscribedEventSources = {};
    };

    this.__updateSubscribedEventSources = function (eventSources) {
        WL.Logger.debug("Updating notification subscriptions.");
        for (var i = 0; i<eventSources.length; i++) {
            subscribedEventSources[eventSources[i].alias] = true;
        }
    };
    
    /**
     * @return true if the environment supports SMS push.
     */
    this.isPushSMSSupported = function() {
        return WL.EnvProfile.isEnabled(WL.EPField.SUPPORT_PUSH_SMS);
    };

    /**
     * Check subscribe status of an SMS related event source.
     * 
     * @param alias
     *            {string} - alias of the event source.
     */
    this.isSMSSubscribed = function(alias) {
    	 return (typeof subscribedSMSEventSources[alias] != "undefined" && typeof subscribedSMSEventSources[alias].eventSource != "undefined");
    };
    
    /**
     * Clear the subscribed SMS event sources
     */
    this.__clearSubscribedSMSEventSources = function(eventSources) {
        WL.Logger.debug("Clearing SMS notification subscriptions.");
        subscribedSMSEventSources = {};
    };

     /**
     * Update the subscribed SMS event sources
     */
    this.__updateSubscribedSMSEventSources = function(eventSources) {
        WL.Logger.debug("Updating SMS notification subscriptions.");
       
		if(!eventSources) return;
	
		for (var i = 0, len = eventSources.length; i < len; ++i) {
	        subscribedSMSEventSources[eventSources[i].alias] = {
	                "adapter" : eventSources[i].adapter,
	                "eventSource" : eventSources[i].eventSource
	        };
	    }
    };

    /**
     * Check subscribe status of an event source.
     * 
     * @param alias
     *            {string} - alias of the event source.
     */
    this.isSubscribed = function(alias) {
        return typeof subscribedEventSources[alias] != "undefined" && subscribedEventSources[alias];
    };

    /**
     * Called when ready to subcribe for events
     */
    this.onReadyToSubscribe = function() {
    };
    
    this.__onmessage = function(props, payload) {
        WL.Logger.debug("WL.Client.Push received notification for alias " + payload.alias);
        try {
            if (subscribedEventSources[payload.alias] && registeredEventSources[payload.alias] && registeredEventSources[payload.alias].callback) {
                registeredEventSources[payload.alias].callback(props, payload);
            } else {
                // in case no lgoin user with this alias
                pendindPushEventsArray.push ({"alias" : payload.alias, "props": props, "payload": payload});
            }
        } catch (e) {
            WL.Logger.error("Failed invoking notification callback function: " + e.message);
        }
    };
    
    this.__hasPendings = function (){
        return pendindPushEventsArray && pendindPushEventsArray.length > 0;
    };
    
    this.__dispatchPendings = function () {
        //Dispatch the pendings push notifications
        for (var i = 0; i<pendindPushEventsArray.length; i++) {
            pendindPushEvent = pendindPushEventsArray[i];
            if(subscribedEventSources[pendindPushEvent.alias]) {
                registeredEventSources[pendindPushEvent.alias].callback(pendindPushEvent.props, pendindPushEvent.payload);
                delete pendindPushEventsArray[i];
            }
        }
    };

    /**
     * @return true if the environment supports push.
     */
    this.isPushSupported = function() {
        return WL.EnvProfile.isEnabled(WL.EPField.SUPPORT_PUSH);
    };

    function isAbleToSubscribe(alias, isRegistering) {
        if (!WL.Client.Push.__isDeviceSupportPush()) {
            WL.Logger.error("The current Android version " + device.version + " does not support push notifications.");
            return false;
        }

        if (!isTokeUpdatedOnServer) {
            WL.Logger.error("Can't subscribe, notification token is not updated on the server");
            return false;
        }

        // isRegistering means If check from register function, then
        // registeredEventSources not exist yet.
        if (!isRegistering && !registeredEventSources[alias]) {
            WL.Logger.error("No registered push event source for alias '" + alias + "'.");
            return false;
        }
        return true;
    };

    function updateTokenCallback(serverToken, deviceToken) {
        if (serverToken != deviceToken) {
            WL.Logger.debug("Push notification device token has changed, updating server notification token id.");
            var requestOptions = {
                onSuccess : function() {
                    isTokeUpdatedOnServer = true;
                    WL.Utils.dispatchWLEvent("readytosubscribe");
                    WL.Client.Push.onReadyToSubscribe();
                    if (WL.Client.Push.__hasPendings()) {
                        WL.Client.Push.__dispatchPendings();
                    }
                },
                onFailure : function() {
                    isTokeUpdatedOnServer = false;
                    WL.Logger.error("Failed to update token on server");
                    return;
                }
            };
            requestOptions.requestHeaders = {}
            requestOptions.parameters = {};
            requestOptions.parameters.updateToken = deviceToken;
            new WLJSX.Ajax.WLRequest("notifications", requestOptions);
        } else {
            isTokeUpdatedOnServer = true;
            WL.Utils.dispatchWLEvent("readytosubscribe");
            WL.Client.Push.onReadyToSubscribe();
            if (WL.Client.Push.__hasPendings()) {
                WL.Client.Push.__dispatchPendings();
            }
        }
    };
};

__WLClient.prototype.Push = new __WLPush();
WL.Client.Push = new __WLPush();