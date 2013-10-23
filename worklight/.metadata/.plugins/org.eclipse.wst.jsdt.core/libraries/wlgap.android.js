/*
* Licensed Materials - Property of IBM
* 5725-G92 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
* US Government Users Restricted Rights - Use, duplication or
* disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
*/

/**
 * Native pages API for the android environment.
 */

// Overriding PhoneGap's stringify because its errornous.
PhoneGap.stringify = Object.toJSON;
 
document.observe('resume', 
		function (){
			var e = document.createEvent('Events'); 
			e.initEvent('foreground', false, false); 
			document.dispatchEvent(e);
		}
);

// Overrides the default openURL method.
WL.App.openURL = function(url, target, options){
	PhoneGap.exec(null, null, "Utils", "openURL", [url]);
};

WL.Client.reloadApp = function () {
	//clear the session cookies to prevent double cookies submit
	PhoneGap.exec(null, null, 'Utils', 'clearSessionCookies', []);
	document.location.reload();
};

WL.App.getScreenHeight = function(){
	return WL.Client.__getScreenHeight();
};

WL.App.getScreenWidth = function(){
	return WL.Client.__getScreenWidth();
};


WL.App.getScreenSize = function(callback) {
    cordova.exec(callback, callback, "Utils", "getScreenSize", []);
};

WL.App.update = function(){
	PhoneGap.exec(null, null, "DirectUpdate", "updateApp", [
	    WL.NativePage._getCookiesForNative(),
	    [WL.ClientMessages.directUpdateDownloadingMessage,
	     WL.ClientMessages.directUpdateErrorMessageNotEnoughStorage]
	]);
};

WL.App._showDirectUpdateErrorMessage = function(message){
	WL.SimpleDialog.show(WL.ClientMessages.directUpdateErrorTitle, message, [
 	    {text:WL.ClientMessages.reload, handler:WL.App.update},
 		{text:WL.ClientMessages.exit, handler:WL.App.close}
 	]);
};

__WLNativePage = function(){
    
	var __nativePageCallback = null;
    
	/**
     * Causes the entire application screen visible to the user, to be switched by a native display.
     * @param className {string} - the name of the native class. 
     * @param callback {function} - a function object that will be called when the native page switches 
     * back to the WebView. This function will be passed a single object (JSON) parameter when invoked.
     * @param data (optional) {object} - a JSON object that will be sent to the native class. The data must be single dimensioned
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
            PhoneGap.exec(null, null, "NativePage", "show", [this._getCookiesForNative(), className, data]);
        } else {
        	throw new Error("A native page is already loaded. Cannot call another native page.");
        }
    };

    /**
     * Internal use, should never be called directly - called from the native android activity java code. 
     * @param data JSON object with data sent form the main native android activity
     * @return
     */
    this.onNativePageClose = function(data){
    	var callback = __nativePageCallback;
  
    	// allow calling show function again
    	__nativePageCallback = null;
    	callback(data);
	};
	
	/**
	 * Internal use. create a text representation of the session cookies, for use of native Android code
	 * when sending requests for the worklight server
	 */
	this._getCookiesForNative = function() {
		var cookies = JSON.stringify(WL.CookieManager.createCookieHeaders().Cookie); 
		return cookies.substring(1, cookies.length - 2);
	};
};

__WL.prototype.NativePage = new __WLNativePage;
WL.NativePage = new __WLNativePage;

__WLTabBarItem = function(){
	this.__id = null;
	
	/**
	 * Manually set this tab bar item as enabled or disabled. 
	 * The enabled/disabled state of this item remains unaffected through calls to WLTabBar.setEnabled. 
	 * @brief manually set this item as enabled or disabled
	 * @param {boolean} enabled a boolean value determines the enabled state of the named tab item
     */
	this.setEnabled = function(isEnabled){
        WL.Validators.validateArguments(['boolean'], arguments, 'WL.TabBarItem.setEnabled');
        var tabElement = $(this.__id);
        tabElement.writeAttribute("enable", isEnabled ? "enabled" : "disabled");
		if (isEnabled) {
			tabElement.removeClassName("tabDisabled");
			WL.TabBar.__addEvents (this.__id);
		} else {
			tabElement.addClassName("tabDisabled");
			WL.TabBar.__removeEvents (this.__id);
		}
	};
};
/**
* Native TabBar API for the Android Environment.
*/
__WLTabBar = function(){
	var isInit = false;
	var items = {};
	var itemLength = 0;
	var tabBar = null;
	var activeTab = null;
	var callbackMap = new Object();
	var parentDivId = null;

	/**
	 * Return true if the TabBar is initialized
	 */
	function isInitialized() {
		return isInit;
	};

	/**
	 * Initializes the TabBar. 
	 * Must be called before using any other TabBar function.
	 * If you use setParentDivId, call setParentDivId before init. 
	 */
	this.init = function (){
		if (isInitialized()){
			this.removeAllItems();
			this.setEnabled(true);
			return;
		}
		tabBar = new Element('ul', { 'class': 'tabBar','id':'wlTabBar'});
		var parentElement = (parentDivId != null) ? $(parentDivId) : $("content");
		parentElement.setStyle({'padding':0,'margin':0});
		parentElement.insert({top : tabBar});
        // resize event cause error in FF preview
        if (WL.Client.getEnvironment() != WL.Environment.PREVIEW) {
			window.addEventListener("resize", function() {
				adjustTabsWidth();
			}.bind(this));
		}
		isInit = true;
	};
	
	/**
	 * In case you need the tab bar will be added to other div out of content,
	 * Call this function before init() with the parentDivId
	 * @param divId - the parentDivID 
	 */
	this.setParentDivId = function (divId) {
		WL.Validators.validateArguments(['string'], arguments, 'WL.TabBar.setParentDivId');
		parentDivId = divId;
	};

	/**
	 * Creates a new tab bar item and adds it to the tab bar. 
	 *
	 * @param {String} id internal name to refer to this tab by
	 * @param {function} callback function object representing a function with no arguments that would be invoked when the tab item is touched
	 * @param {String} [title] title text to show on the tab, or null if no text should be shown
	 * @param {Object} [options] Options for customizing the individual tab item
	 *  imgSrc - imgSrc for normal tab
	 *  imgSrcSelected - imgSrc for selected tab
	 *  
	 * @return a WL.TabBar object 
	 */
	this.addItem = function (id, callback, title, options){
		if (!isInitialized()){
			return;
		}
		
		WL.Validators.validateArguments(['string', 'function','string','object'], arguments, 'WL.TabBar.addItem');
		WL.Validators.validateOptions({image : 'string', imageSelected : 'string'}, options, "WL.TabBar.addItem");
		
		// do not allow two items with the same id
		if (typeof items[id] !== 'undefined') {
			throw new Error("A Tab Bar item with id '" + id + "' Already exists.");
		} 
		
		// prepare the tab element
		var newTab = new Element('li', {'id': id, 'class':'tabItem'});
		var imgSrc = (options.image != undefined) ? options.image : null;
		var imgSrcSelected = (options.imageSelected != undefined) ? options.imageSelected : null;
		var tabSpan = new Element('span', {'style' : 'background-image : url(' + imgSrc + ')', 'class' : 'tabSpan'}).update(title);
		
		newTab.appendChild(tabSpan);
		newTab.writeAttribute("imgSrc", imgSrc);
		newTab.writeAttribute("imgSrcSelected", imgSrcSelected);
		newTab.writeAttribute("enable", "enabled");
		
		// add the tab into the tabBar
		tabBar.insert(newTab);
		
		callbackMap[id] = callback;
		this.__addEvents (id);
		
		items[id] = $(id);
		itemLength++;
		if (itemLength == 1) {
			WL.TabBar.setSelectedItem (id);
		}

		//adjust the tabs width
		adjustTabsWidth();
		var item = new __WLTabBarItem;
		item.__id = id;
		return item;
	};

	/**
	 * Removes all the previously added items from the TabBar. The effect is immediate.
	 */
	this.removeAllItems = function(){
		if (!isInitialized()){
			return;
		}
		for (tabItemId in items) {
			items[tabItemId].remove();
		}
		items = {};
		itemLength = 0;
	};

	/**
	 * Android only - Sets the visibility state of the tab bar.  The tab bar has to be created first.
	 * @param isVisible{boolean} - if true, sets the tab bar visible. if false, hides the tab bar.
	 */
	this.setVisible = function(isVisible){
		if (!isInitialized()){
			return;
		}
		WL.Validators.validateArguments(['boolean'], arguments, 'WL.TabBar.setVisible');
		if (tabBar != null){
			if (isVisible) {		
				tabBar.show(); 
			} else {
				tabBar.hide();
			}
		}
	};

	/**
	 * Manually select an individual tab bar item, or nil for deselecting a currently selected tab bar item.
	 * @param {String} id the name of the tab to select, or null if all tabs should be deselected
	 * @see createItem
	 * @see bindItems
	 */
	this.setSelectedItem = function(id){
		WL.Validators.validateArguments(['string'], arguments, 'WL.TabBarItem.setSelectedItem');
		if (typeof items[id] != "undefined") {
			items[id].addClassName("tabItemActive");
			items[id].childElements()[0].setStyle({'background-image' : 'url(' + items[id].readAttribute("imgSrcSelected") + ')'});
			if (activeTab != null && activeTab.id != items[id].id) {
				activeTab.removeClassName("tabItemActive");
				activeTab.childElements()[0].setStyle({'background-image' : 'url(' + activeTab.readAttribute("imgSrc") + ')'});
			}
			activeTab = items[id];
		} else {
			 WL.Logger.error(id + " id is not appear to be one of the tab bar items.");
		}
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
		for (tabItemId in items) {
			var tabElement = items[tabItemId];
			var isItemHasEnableAtt = (items[tabItemId].readAttribute("enable") === "enabled");
			if (isEnabled && isItemHasEnableAtt) {
				tabElement.removeClassName("tabDisabled");
				this.__addEvents(items[tabItemId].id);
				if (activeTab.id == items[tabItemId].id) {
					tabElement.addClassName("tabItemActive");
				}
			} else if (!isEnabled) {
				this.__removeEvents (items[tabItemId].id);
				tabElement.addClassName("tabDisabled");
				if (activeTab.id == items[tabItemId].id) {
					tabElement.removeClassName("tabItemActive");
				}
			}
		}
	};
	
	this.__removeEvents = function (id) {
		items[id].stopObserving('click');
		items[id].stopObserving('touchstart');
		items[id].stopObserving('touchend');
	};
	
	this.__addEvents = function (id) {
		addClickEvent (id, callbackMap[id]);
		addTouchEvent (id);
	};
	
	var adjustTabsWidth = function() {
		if (!isInitialized() || itemLength == 0){
			return;
		}
		
		var availableWidth = tabBar.offsetWidth;
		var itemWidth = Math.ceil(availableWidth / itemLength);
		var i = 0;
		for (tabItem in items) {
			i++;
			if (i == itemLength){
				// On last item use leftover space
				itemWidth = availableWidth - (itemWidth * (itemLength - 1));
			}
			items[tabItem].setStyle({'width': "" + itemWidth + 'px'});
		}
		
	};
	
	var addClickEvent = function (id, callback) {
		Event.observe(id, 'click', function () {
			WL.TabBar.setSelectedItem (id);
			callback();
		});
	};
	
	var addTouchEvent = function(id) {
		Event.observe(id, 'touchstart', function () {
			if (items[id].readAttribute('enable') !== "enabled") {
				return;
			}
			items[id].addClassName('tabTouch');
			if (activeTab.id == id) {
				tabBar.addClassName('tabBarTouch');
			}
		});
		
		Event.observe(id, 'touchend', function () {
			items[id].removeClassName('tabTouch');
			if (activeTab.id == id) {
				tabBar.removeClassName('tabBarTouch');
			}
		});
	};
}; 

__WL.prototype.TabBar = new __WLTabBar;
WL.TabBar = new __WLTabBar;


/**
 * Native OptionsMenu API for the Android Environment. 
 */
__WLOptionsMenu = function (){
    var callbacks;
    var SETTING_OPTIONS_MENU_ITEM = "wlSettings";
    
    function isInitialized() {
    	// handle preview
        if (typeof NativeOptionsMenu === "undefined" || !NativeOptionsMenu.isInit()){
            WL.Logger.error("WL.OptionsMenu.init() must be called first.");
            return false;
        }   
        return true;
    }
    
    this.__onItemClicked = function (id){
       (callbacks[id])();   
    };
    
    /**
     * Initializes the Android toolbar, enabling it, and making it visible. Must
     * be called before using it.
     * 
     * @param id -
     *            number, currently not used.
     */
    this.init = function (){
        callbacks = [];                     
        NativeOptionsMenu.init(WL.Utils.getCurrentSkinName());
        this.__addWLSettingItem();
    };
    
    /**
     * Adds an item to the Android Options Menu. Can be called only after
     * initializing the menu. Items are ordered on the menu according to
     * the order in which they were added. If you add a item with an existing ID, the new item
     * replaces the existing one.
     * 
     * @param id
     *            Mandatory string. Identifies the item.
     * 
     * @param callback
     *            Mandatory JavaScript function. The callback function that should be invoked
     *            when the user touches the item.
     * 
     * @param title
     *            Mandatory string. The title of the item.
     *            
     * @param options - Hash options object. Available options:
     *          image - 
     *            The path to the item's icon, starting from
     *            the application root directory. Per Android's guidelines, the
     *            icon should be a 48-by-48 pixel black and white PNG file.     
     *          enabled -
     *            Boolean. Defines whether the item is enabled or
     *            disabled.
     * @return Item
     */
    this.addItem = function (id, callback, title, options){
        if (!isInitialized()){
            return;
        }
        WL.Validators.validateArguments(['string', 'function', 'string', 'object'], arguments, 'WL.OptionsMenu.addItem');
        WL.Validators.validateOptions({enabled: 'boolean', image: 'string'}, options, 'WL.OptionsMenu.addItem options');
        var defaultOptions = {
        	enabled: true,
        	image: null
        };
        
        callbacks[id] = callback;       
        Object.extend(defaultOptions, options);
        
        this.removeItem(SETTING_OPTIONS_MENU_ITEM);
        var itemToReturn = NativeOptionsMenu.addItem(
        	id, 
        	"WL.OptionsMenu.__onItemClicked('" + id + "')", 
        	title, defaultOptions.image, 
        	defaultOptions.enabled);
        this.__addWLSettingItem();
        return itemToReturn;
    };
    
    this.__addWLSettingItem = function (){
        if (!isInitialized()){
            return;
        }
        callbacks[SETTING_OPTIONS_MENU_ITEM] = WL.App.__showWLPreferences;
        return NativeOptionsMenu.addItem(SETTING_OPTIONS_MENU_ITEM, "WL.OptionsMenu.__onItemClicked('wlSettings')", "Worklight Settings", "images/settings.png", true);
    };

    /**
     * Returns the item with the specified ID. Once you get an item, you can
     * use it's set methods to change the item's properties.
     * @param id Mandatory string. The ID of the required item. 
     * @return A NativeItem object. If the specified ID is not found, the method returns null.
     */
    this.getItem = function (id){
        if (!isInitialized()){
            return;
        }
        WL.Validators.validateArguments(['string'], arguments, 'WL.OptionsMenu.getItem');
        return NativeOptionsMenu.getItem(id);
    };
    
    /**
     * Removes the item with the indicated ID from the menu. Can be
     * called only after initializing the menu. If no item is found with
     * the specified ID, nothing happens.<p>
     * If no item is found with the specified ID, nothing happens.
     * @param id Mandatory string. The ID of the item to be removed.
     */     
    this.removeItem = function (id){
        if (!isInitialized()){
            return;
        }
        WL.Validators.validateArguments(['string'], arguments, 'WL.OptionsMenu.removeItem');
        NativeOptionsMenu.removeItem(id);
        delete callbacks[id];
    };
    
    /**
     * Removes all items from the menu. Can be called only after
     * initializing the menu.
     */
    this.removeItems = function (){
        if (!isInitialized()){
            return;
        }
        NativeOptionsMenu.removeItems();
        callbacks = [];
        this.__addWLSettingItem();
    };

    /**
     * Enables/Disables the menu.
     * @param isEnabled boolean signifying the request
     */
    this.setEnabled = function (enabled){
        if (!isInitialized()){
            return;
        }
        WL.Validators.validateArguments(['boolean'], arguments, 'WL.OptionsMenu.setEnabled');
        NativeOptionsMenu.setEnabled(enabled);
    };
        
    /**
     * @return whether the menu is enabled.
     */
    this.isEnabled = function (){
        if (!isInitialized()){
            return;
        }
        return NativeOptionsMenu.isEnabled();
    };
    
    /**
     * Set the menu visibility.
     * @param isVisible boolean signifying the request
     */
    this.setVisible = function (visible){
        if (! NativeOptionsMenu){
            return;
        }
        WL.Validators.validateArguments(['boolean'], arguments, 'WL.OptionsMenu.setVisible');
        NativeOptionsMenu.setVisible(visible);
    };
        
    /**
     * @return whether the menu is visible. 
     */
    this.isVisible = function (){
        if (! NativeOptionsMenu){
            return false;
        }
        return NativeOptionsMenu.isVisible();
    };
};

__WL.prototype.OptionsMenu = new __WLOptionsMenu;
WL.OptionsMenu = new __WLOptionsMenu;

/**
 * @deprecated
 */
WL.App.close = function() {
	navigator.app.exitApp();
};

/**
 * Push Notification API for the android environment.
 */
__WLPush = function() {
	var eventSourceIDIndex = 0;
	var notificationCallbacks = {};
	var eventSourceTokens = {};
	var defaultSubscribeOptions = {
		alert : true,
		badge : true,
		sound : true,
		onFailure : function(){WL.Logger.error("WL.Client.Push.subscribe: error subsribing for notifications");},
		onSuccess : function(){}};
	var defaultUnsubscribeOptions = {
		onFailure : function(){WL.Logger.error("WL.Client.Push.unsubscribe: error unsubscribing from notifications");},
		onSuccess : function(){}};
	
	this.subscribe = function(alias, options) {
	};
	
	this.unsubscribe = function(alias, options) {
	};
	
	/**
     * Called when ready to subcribe for events
     */
	this.onReadyToSubscribe = function () {
	};
	
	/**
     * Register event source for push notification. Must be called on application initialization before any subscribe call.
     * @param alias {string} - alias of the event source.
     * @param adapter {string}
     * @param eventSource {string}
     * @param callback {function} optional - this callback will be invoked upon receiving push notification.  This function signature is function (props, payload).
     */
	this.registerEventSourceCallback = function (alias, adapter, eventSource, callback) {
	};
	
	/**
     * Check subscribe status of an event source.
     * @param alias {string} - alias of the event source.
     */
	this.isSubscribed = function (alias) {
	};
	
	 /**
     * @return true if the environment supports push.
     */
    this.isPushSupported = function() {
    	return WL.EnvProfile.isEnabled(WL.EPField.SUPPORT_PUSH);
    };
	
	
	//----- Notifications -----------------------------------------------------
	
	var listeners = [];
	
	function onNativeSubscriptionSuccess(adapter, eventSource, onNotification, options, deviceToken) {
		eventSourceTokens["" + adapter + "." + eventSource] = deviceToken;
		var requestOptions = {
			onSuccess : options.onSuccess,
			onFailure : options.onFailure
		};
		
		requestOptions.parameters = {};
		requestOptions.parameters.token = deviceToken;
		requestOptions.parameters.adapter = adapter;
		requestOptions.parameters.eventSource = eventSource;
		requestOptions.parameters.eventSourceID = eventSourceIDIndex;
		requestOptions.parameters.subscribe = Object.toJSON(options);
		new Ajax.WLRequest("notifications", requestOptions);
		
		notificationCallbacks["" + eventSourceIDIndex] = onNotification;
		eventSourceIDIndex++;
	}
	
	function serverUnsubscribe(adapter, eventSource, options, token) {
		var requestOptions = {
			onSuccess : options.onSuccess,
			onFailure : options.onFailure
		};
		requestOptions.parameters = {};
		requestOptions.parameters.token = token;
		requestOptions.parameters.adapter = adapter;
		requestOptions.parameters.eventSource = eventSource;
		requestOptions.parameters.unsubscribe = "";
		new Ajax.WLRequest("notifications", requestOptions);
	}

	
	this.__onmessage = function (props, payload) {
		WL.Logger.debug("WL.Client.Push received notification for eventSourceID " + payload.eventSourceID);
		try { 
			notificationCallbacks["" + payload.eventSourceID](props, payload);
		} catch(e) {
			WL.Logger.error("Failed invoking notification callback function. " + e.message);
		}
	};
	
	function startDispatching() {
		PhoneGap.exec(null, null, 'Push', 'dispatch', ['WL.Client.Push.__onmessage']);
	}
};

// Disable the prompt on android preview because phonegap use promt for debugging
if (WL.StaticAppProps.ENVIRONMENT == WL.Env.PREVIEW) {
	prompt = function () {
	};
}

//Back Button support functions
WL.App.overrideBackButton = function(callback) {
	WL.Validators.validateArguments(['function'], arguments, "WL.App.overrideBackButton");
	document.addEventListener("backbutton", callback, false);
};

WL.App.resetBackButton = function() {
	WL.Validators.validateArguments([], arguments, "WL.App.resetBackButton");
	document.removeEventListener("backbutton", callback, false);
};

//Support toast message
WL.Toast.show = function(text) {
	WL.Validators.validateArguments(['string'], arguments, "WL.Toast.show");
	PhoneGap.exec(null, null, "Utils", "toast", [text]);
};

WL.App.copyToClipboard = function(text) {
	return PhoneGap.exec(null, null, "Utils", "copyToClipboard", [text]);
};

WL.Device.getNetworkInfo = function(callback){
	return PhoneGap.exec(callback, callback, "NetworkDetector", "getNetworkInfo", []);
};

__WLClient.prototype.Push = new __WLPush();
WL.Client.Push = new __WLPush();
