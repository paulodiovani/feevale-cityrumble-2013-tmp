
/* JavaScript content from wlclient/js/wlgap-wp7.js in windowsphone Common Resources */
/*
* Licensed Materials - Property of IBM
* 5725-G92 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
* US Government Users Restricted Rights - Use, duplication or
* disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
*/

/* Copyright (C) Worklight Ltd. 2006-2012.  All rights reserved. */

/**
 * @deprecated
 */
WL.App.close = function () {
    cordova.exec(function () {}, function () { }, "WLExit", "exit", []);
};

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
    var lastVisibleState;
    var lastEnabledState;

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
     * @return whether the menu is enabled.
     */
    this.isEnabled = function() {
	// error handling
	if (!isInitialized()) {
	    return;
	}

	// calls the native code. the result will delivered to the callback method _onIsEnabled.
	cordova.exec(function () { WL.OptionsMenu._onIsEnabled() }, function () { }, "WLApplicationBar", "isEnabled", []);
	return lastEnabledState;
    };

    // a private helper method for isEnabled.
    this._onIsEnabled = function(isEnabled) {
	lastEnabledState = isEnabled;
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
     * @return whether the menu is visible.
     */
    this.isVisible = function() {
	// error handling
	if (!isInitialized()) {
	    return;
	}

	// calls the native code. the result will delivered to the callback method _onIsVisible.
	var isVisibleVar;
    cordova.exec(function (result) { WL.OptionsMenu._onIsVisible(result) }, function () { }, "WLApplicationBar", "isVisible", []);
	return lastVisibleState;
    };

    // a private helper method for isVisible.
    this._onIsVisible = function(isVisible) {
	lastVisibleState = isVisible;
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

// Back Button support
WL.App.overrideBackButton = function(callback) {
    WL.Validators.validateArguments(['function'], arguments, "WL.App.overrideBackButton ");
	WL.App.resetBackButton();
    navigator.device.overrideBackButton(callback);
};

WL.App.resetBackButton = function() {
    WL.Validators.validateArguments([], arguments, "WL.App.resetBackButton ");
    navigator.device.resetBackButton();
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
    reachabilityUrl = WL.Client.getAppProperty(WL.AppProp.APP_SERVICES_URL) + "reach";
    // Phonegap code sometimes stops working after repeated checks, add timeout
    window.connectivityCheckDone = false;
    setTimeout(this.__networkCheckTimeout, 6000);
    navigator.network.isReachable(reachabilityUrl, this.wlReachableCallback, {});
};

/////////
// Busy indicator
/////////
WL.BusyIndicator = WLJSX.Class.create({
    _isVisible: false,
    show: function () {
        this._isVisible = true;
        if (WL.StaticAppProps.ENVIRONMENT == WL.Env.PREVIEW) {
            return;
        }
        cordova.exec(function () { }, function () { }, 'WLBusyIndicator', "show", []);
    },

    hide: function () {
        this._isVisible = false;
        if (WL.StaticAppProps.ENVIRONMENT == WL.Env.PREVIEW) {
            return;
        }
        cordova.exec(function () { }, function () { }, 'WLBusyIndicator', "hide", []);
    },

    isVisible: function () {
        return this._isVisible;
    }
});