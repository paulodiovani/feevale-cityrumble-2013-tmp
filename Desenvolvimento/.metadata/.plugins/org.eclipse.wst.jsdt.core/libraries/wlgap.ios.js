/*
* Licensed Materials - Property of IBM
* 5725-G92 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
* US Government Users Restricted Rights - Use, duplication or
* disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
*/

__WLPush = function() {
	var isTokeUpdatedOnServer = false;
	var subscribedEventSources = {};
	var registeredEventSources = {};
	var defaultSubscribeOptions = {
		alert : true,
		badge : true,
		sound : true,
		onFailure : function(){WL.Logger.error("WL.Client.Push.subscribe: error subscribing for notifications");},
		onSuccess : function(){}};
	var defaultUnsubscribeOptions = {
		onFailure : function(){WL.Logger.error("WL.Client.Push.unsubscribe: error unsubscribing from notifications");},
		onSuccess : function(){}};
	
	/**
     * Register event source for push notification. Must be called on application initialization before any subscribe call.
     * @param alias {string} - alias of the event source.
     * @param adapter {string}
     * @param eventSource {string}
     * @param callback {function} - this callback will be invoked upon receiving push notification.  This function signature is function (props, payload).
     **/
	this.registerEventSourceCallback = function (alias, adapter, eventSource, callback) {
		WL.Validators.validateArguments(['string', 'string', 'string', WL.Validators.validateFunctionOrNull], arguments, 'WL.Client.Push.subscribe');
		registeredEventSources [alias] = {
            "adapter" : adapter,
            "eventSource" : eventSource,
            "callback" : callback
		};
	};
    
    this.__updateToken = function (serverToken) {
        PhoneGap.exec("Push.subscribe", 
                      GetFunctionName(function (deviceToken){updateTokenCallback(serverToken, deviceToken)}), 
                      GetFunctionName(updateTokenCallbackError), 
                      defaultSubscribeOptions);
	};
	
	this.subscribe = function(alias, options) {
		WL.Validators.validateArguments(['string', WL.Validators.validateObjectOrNull], arguments, 'WL.Client.Push.subscribe');
		WL.Validators.validateOptionsLoose({
			onSuccess : 'function',
			onFailure : 'function'}, options, "WL.Client.Push.subscribe");
		if (!isAbleToSubscribe(alias)) {
			return;
		}
		if (!options) {
			options = {};
		}
		var registeredEventSource = registeredEventSources[alias];
		var requestOptions = {
			onSuccess : function (){
				subscribedEventSources[alias] = true;
				if (options.onSuccess) {
					options.onSuccess();
				}
			} ,
			onFailure : options.onFailure
		};
		
		requestOptions.parameters = {};
		requestOptions.parameters.adapter = registeredEventSource.adapter;
		requestOptions.parameters.eventSource = registeredEventSource.eventSource;
		requestOptions.parameters.alias = alias;
		requestOptions.parameters.subscribe = Object.toJSON(options);
		new Ajax.WLRequest("notifications", requestOptions);
		PhoneGap.exec("Push.dispatch", 'WL.Client.Push.__onmessage');
	};
	
	this.unsubscribe = function(alias, options) {
		WL.Validators.validateArguments(['string', WL.Validators.validateObjectOrNull], arguments, 'WL.Client.Push.unsubscribe');
		WL.Validators.validateOptionsLoose({
                                           onSuccess : 'function',
                                           onFailure : 'function'}, options, "WL.Client.Push.unsubscribe");
        if (!isAbleToSubscribe(alias)) {
			return;
		}
        
        
		options = Object.extend(Object.clone(defaultUnsubscribeOptions), options);
        
		var registeredEventSource = registeredEventSources[alias];
		var requestOptions = {
			onSuccess : options.onSuccess,
			onFailure : options.onFailure
		};
		requestOptions.parameters = {};
		requestOptions.parameters.alias = alias;
		requestOptions.parameters.adapter = registeredEventSource.adapter;
		requestOptions.parameters.eventSource = registeredEventSource.eventSource;
		requestOptions.parameters.unsubscribe = "";
		new Ajax.WLRequest("notifications", requestOptions);
		subscribedEventSources[alias] = false;
	};
    
	this.__onmessage = function (props, payload) {
		WL.Logger.debug("WL.Client.Push received notification for eventSourceID " + payload.eventSourceID);
		try { 
            if (subscribedEventSources[payload.alias] && 
				registeredEventSources[payload.alias] && 
				registeredEventSources[payload.alias].callback) {
				registeredEventSources[payload.alias].callback(props, payload);
			}
		} catch(e) {
			WL.Logger.error("Failed invoking notification callback function. " + e.message);
		}
	};
	
	this.__updateSubscribedEventSources = function (eventSources) {
		WL.Logger.debug ("Updating notification subscriptions.");
		for (event in eventSources) {
			subscribedEventSources[eventSources[event].alias] = true;
		}
	};
	
	/**
     * Check subscribe status of an event source.
     * @param alias {string} - alias of the event source.
     */
	this.isSubscribed = function (alias) {
		return typeof subscribedEventSources[alias] != "undefined" && subscribedEventSources[alias] && typeof registeredEventSources[alias] != "undefined" && registeredEventSources[alias];
	};
	
	/**
     * Called when ready to subcribe for events
     */
	this.onReadyToSubscribe = function () {
	};
	
    function isAbleToSubscribe (alias) {
		if (!isTokeUpdatedOnServer){
			WL.Logger.error("Can't subscribe, notification token is not updated on the server");
			return false;
		} 	
		if (!registeredEventSources[alias]){
			WL.Logger.error("No registered push event source for alias " + alias);
			return false;
		}
		return true;
	};
    
	 /**
     * @return true if the environment supports push.
     */
    this.isPushSupported = function() {
		return WL.EnvProfile.isEnabled(WL.EPField.SUPPORT_PUSH);
    };
    
    function updateTokenCallback (serverToken, deviceToken) {
		if (serverToken != deviceToken) {
			WL.Logger.debug ("Push notification device token has changed, updating server notification token id.");
			var requestOptions = {
				onSuccess : function () {
					isTokeUpdatedOnServer = true;
					WL.Client.Push.onReadyToSubscribe ();
				},
				onFailure : function () {
					WL.Logger.error ("Failed to update token on server");
					return;
				}
			}; 
			isTokeUpdatedOnServer
			requestOptions.parameters = {};
			requestOptions.parameters.updateToken = deviceToken;
			new Ajax.WLRequest("notifications", requestOptions);
		} else {
			isTokeUpdatedOnServer = true;
			WL.Client.Push.onReadyToSubscribe();
            PhoneGap.exec("Push.dispatch", 'WL.Client.Push.__onmessage');
		}
	};
    
    function updateTokenCallbackError (){
        WL.Logger.error ("Error while try to retrive device token.");
    };
    
	//----- Utilities ---------------------------------------------------------
	
	// Benny: use the js callback method, like in UIControls (Tabbar). that way we dont need to use GetFunctionName
	// Benny: OR, rename this function createPhoneGapCallback(function, closure);
	function GetFunctionName(fn, closure) {
		// workaround buggy phonegap implementation in the following case:
		//    function a(){ function b(){} return GetFunctionName(b); }
		// calling a() with phonegap's implementation of GetFunctionName returns a useless function name.
		// so here we are wrapping all functions with anonymous wrappers, which phonegap handles well.
		return window['GetFunctionName'](function() { fn.apply(closure, arguments); });
	};
};

__WLBadge = function(){
	this.setNumber = function(number){
		WL.Validators.validateArguments(['number'], arguments, 'WL.Badge.setNumber');
		
		PhoneGap.exec("Badge.setNumber", number);
	};
};

__WL.prototype.Badge = new __WLBadge();
WL.Badge = new __WLBadge();

__WLClient.prototype.Push = new __WLPush();
WL.Client.Push = new __WLPush();

/**
 * Native pages API for the iOS environment.
 */
__WLNativePage = function(){

	var __nativePageCallback = null;
	
	/**
	 * Causes the entire application screen visible to the user, to be switched by a native display.
	 * @param className {string} - the name of the native class. (for example, "BarCodeController"). 
	 * @param callback {function} - a function object that will be called when the native page switches 
	 * back to the WebView. This function will be passed a single object (JSON) parameter when invoked.
	 * @param data {object} - a JSON object that will be sent to the native class. The data must be single dimensioned (all values must be of type 'string')
	 */
	this.show = function(className, callback, data){
    	if (arguments.length <= 2) {
        	WL.Validators.validateArguments(['string', 'function'], arguments, 'WL.NativePage.show');
    	} else {
        	WL.Validators.validateArguments(['string', 'function', 'object'], arguments, 'WL.NativePage.show');
            WL.Validators.validateAllOptionTypes(['string', 'number', WL.Validators.validateStringOrNull, 'boolean'], data, 'WL.NativePage.show');
    	}

        // prevent calling the show twice until it the call back done
		if (__nativePageCallback === null) {
			__nativePageCallback = callback;
			PhoneGap.exec("NativePage.show", className, data);
		} else {
	        throw new Error("A native page is already loaded. Cannot call another native page.");
		}
		
	};

	/**
	 * Internal use, should never be called directly - called from the Native Objective-C code. 
	 * @param data JSON object with data sent form the Native Page
	 * @return
	 */
	this.onNativePageClose = function(data){
		var callback = __nativePageCallback;
		
		// allow the callback function to invoke WL.NativePage.show()
		__nativePageCallback = null;
		
		callback(data);
	};

};

__WL.prototype.NativePage = new __WLNativePage;
WL.NativePage = new __WLNativePage;

/**
 * Native TabBarItem API for the iOS Environment. This object should not be created manually; 
 * rather, it is used by WL.TabBar.addItem
 */
WL.TabBarItem = Class.create({
    	__id : null,
    	
	initialize : function(id){
        	this.__id = id;
    	},

	/**
	 * Manually set this tab bar item as enabled or disabled. The enabled/disabled state of this item remains
	 * unaffected through calls to setEnabled. 
	 * @brief manually set this item as enabled or disabled
	 * @param {boolean} enabled a boolean value determines the enabled state of the named tab item
	 * @see setEnabled
	 */
	setEnabled : function(isEnabled){
		WL.Validators.validateArguments(['boolean'], arguments, 'WL.TabBarItem.setEnabled');
		PhoneGap.exec("UIControls.enableTabBarItem", this.__id, isEnabled);
	},
			 
	/**
	 * Update this item to change its badge value.
	 * @param {string} badge value to display in the optional circular badge on the item; if null or unspecified, the badge will be hidden
	 */
	updateBadge : function(badge) {
		WL.Validators.validateArguments([WL.Validators.validateStringOrNull], arguments, 'WL.TabBarItem.updateBadge');
						 
		if (!badge) {
			options = {};
		} else {
			options = {badge: badge};
		}
				 
		PhoneGap.exec("UIControls.updateTabBarItem", this.__id, options);
	}
							 
});
/**
 * Native TabBar API for the iOS Environment.
 */
__WLTabBar = function(){
	var isInit = false;
	var items = new Array();
	var tabBarTag = 0;
	var tabBarCallbacks = {};

    
    function isInitialized() {
        return isInit;
    }
	
    
    /**
	 * Initializes the TabBar. Must be called before using any other TabBar function.
	 */
    this.init = function (options){
        if (!WL.EnvProfile.isEnabled(WL.EPField.ISIOS)) {
            WL.Logger.debug("iOS TabBar has no impact when not run on an iOS device.");
            return;
        }         
		
        WL.Validators.validateOptions({}, options, "WL.TabBar.init");
		PhoneGap.exec("UIControls.createTabBar");
		isInit = true;
    };
	
	/**
	 * Creates a new tab bar item and adds it to the tab bar. 
	 * If the supplied image name is one of the labels listed below, then this method will construct a tab button
	 * using the standard system buttons.  Note that if you use one of the system images, that the \c title you supply will be ignored.
	 *
	 * <b>Tab Buttons</b>
	 *   - tabButton:More
	 *   - tabButton:Favorites
	 *   - tabButton:Featured
	 *   - tabButton:TopRated
	 *   - tabButton:Recents
	 *   - tabButton:Contacts
	 *   - tabButton:History
	 *   - tabButton:Bookmarks
	 *   - tabButton:Search
	 *   - tabButton:Downloads
	 *   - tabButton:MostRecent
	 *   - tabButton:MostViewed
	 * @param {String} id internal name to refer to this tab by
	 * @param {function} callback function object representing a function with no arguments that would be invoked when the tab item is touched
	 * @param {String} [title] title text to show on the tab, or null if no text should be shown
	 * @param {Object} [options] Options for customizing the individual tab item
	 *  - \c image filename or internal identifier to show, or null if now image should be shown
 	 *  - \c badge value to display in the optional circular badge on the item; if null or unspecified, the badge will be hidden
 	 *  
 	 * @return a WL.TabBar object 
     */
	this.addItem = function (id, callback, title, options){
		if (!isInitialized()){
            return;
        }
		
        WL.Validators.validateArguments(['string', 'function','string','object'], arguments, 'WL.TabBar.createItem');
		WL.Validators.validateOptions({
									  image : 'string', 
									  // not relevant for iOS, but here for compatability
									  selectedStateImage : 'string',
									  badge : 'string'}, options, "WL.TabBar.createItem");
		
		// do not allow two items with the same id
		itemsLength = items.length;
		for (i = 0 ; i < itemsLength ; i++) {
			WL.Logger.debug("items[i] " + items[i] + " == id " + id + " " + (items[i] == id));
			if (items[i] == id) {
				throw new Error("A Tab Bar item with id '" + id + "' Already exists.");
			}
		}

		items.push(id);
			
		var tag = tabBarTag;
		tabBarTag++;
		tabBarCallbacks[tag] = callback;
		
		PhoneGap.exec("UIControls.createTabBarItem", id, title, WL.Utils.getCurrentSkinName() + "/" +options.image, tag, options);
		
		// The native code needs the full list of items to show
		var parameters = [ "UIControls.showTabBarItems" ];
		for (var i = 0; i < items.length; i++) {
			parameters.push(items[i]);
		}
		PhoneGap.exec.apply(this, parameters);
		
		var item = new WL.TabBarItem(id);
		return item;
	};
	
	/**
	 * Removes all the previously added items from the TabBar. The effect is immediate.
	 */
	this.removeAllItems = function(){
		if (!isInitialized()){
            return;
        }
		
		items.clear();
		PhoneGap.exec("UIControls.showTabBarItems");
	};
	
	/**
	 * iOS only - Sets the visibility state of the tab bar.  The tab bar has to be created first.
	 * @param isVisible{boolean} - if true, sets the tab bar visible. if false, hides the tab bar.
	 * @param {Object} [options] Options indicating how the tab bar should be shown:
	 * - height integer indicating the height of the tab bar (default height: 49)
	 * - position specifies whether the tab bar will be placed at the top or bottom of the screen (default position: bottom)
	 */
	
	this.setVisible = function(isVisible, options){
		if (!isInitialized()){
            return;
        }
        WL.Validators.validateArguments(['boolean', WL.Validators.validateObjectOrNull], arguments, 'WL.TabBar.setVisible');
		
		if (!options) {
			options = {};
		}
		
		if (isVisible) {
			PhoneGap.exec("UIControls.showTabBar", options);
		} else {
			PhoneGap.exec("UIControls.hideTabBar");
		}
	};
	
	/**
	 * Manually select an individual tab bar item, or nil for deselecting a currently selected tab bar item.
	 * @param {String} id the name of the tab to select, or null if all tabs should be deselected
	 * @see createItem
	 * @see bindItems
     */
	this.setSelectedItem = function(id){
		if (!isInitialized()){
            return;
        }
		
        WL.Validators.validateArguments([WL.Validators.validateStringOrNull], arguments, 'WL.TabBar.setSelectedItem');
		
		PhoneGap.exec("UIControls.selectTabBarItem", id);
	};
	
	/**
	 * Manually enable or disable the whole tab bar. The individual enable/disable state of each tab bar item remains unaffected  
	 * @brief manually set the tab bar as enabled or disabled
	 * @param {boolean} isEnabled - boolean value determines the enabled state of the named tab item
	 * @see setEnabledItem
     */
	this.setEnabled = function(isEnabled){
		if (!isInitialized()){
            return;
        }
		
        WL.Validators.validateArguments(['boolean'], arguments, 'WL.TabBar.setEnabled');
		
		PhoneGap.exec("UIControls.enableTabBar", isEnabled);
	};
	
	/**
	 * Function called when a tab bar item has been selected.
	 * @param {Number} tag the tag number for the item that has been selected
	 */
	this.__tabBarItemSelected = function(tag) {
		if (typeof(tabBarCallbacks[tag]) == 'function') {
			tabBarCallbacks[tag]();
		}
	};
	
};

__WL.prototype.TabBar = new __WLTabBar;
WL.TabBar = new __WLTabBar;


function formatString(text) {
	var args = Array.prototype.slice.call(arguments, 1);
	return text.replace(/{(\d+)}/g, function(match, number) { 
		return typeof args[number] != 'undefined'
			? args[number]
			: '{' + number + '}';
	});
};

/**
 * @deprecated
 */
WL.App.close = function() {
};

/**
 * Update the web resources from the WrokLight server.
 * This feature is currently applicable only for Android and iOS platforms 
 */
WL.App.update = function (){
	PhoneGap.exec("WLApp.update");
};

WL.App._showDirectUpdateErrorMessage = function(message){
	var args = Array.prototype.slice.call(arguments);
	var formattedMessage = window.formatString.apply(null, args);
	WL.SimpleDialog.show(WL.ClientMessages.directUpdateErrorTitle, formattedMessage, [
 	    {text:WL.ClientMessages.reload, handler:WL.App.update},
 		{text:WL.ClientMessages.exit, handler:WL.App.close}
 	]);
};

WL.Device.getNetworkInfo = function(callback){
	return PhoneGap.exec(callback, callback, "NetworkDetector", "getNetworkInfo", []);
};

WL.App.copyToClipboard = function(text) {
	PhoneGap.exec("WLApp.copyToClipboard", text);
};