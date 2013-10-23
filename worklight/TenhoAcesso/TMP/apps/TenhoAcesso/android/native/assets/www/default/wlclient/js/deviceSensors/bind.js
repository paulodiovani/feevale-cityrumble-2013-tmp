
/* JavaScript content from wlclient/js/deviceSensors/bind.js in Common Resources */
/**
 * @license
 * Licensed Materials - Property of IBM
 * 5725-G92 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */
__Binder = function() {
	this.bind = function() {		
	};
	
	this.unbind = function() {		
	};


};

var Binder = new __Binder();
WL.App.setKeepAliveInBackground = Binder.bind;

/* JavaScript content from wlclient/js/deviceSensors/bind.js in android Common Resources */
/**
 * @license
 * Licensed Materials - Property of IBM
 * 5725-G92 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */
__Binder = function() {
	this.bind = function(options) {
		var args = [];
		
		options = options || {};
		
		args.push(WL.Client.getAppProperty(WL.AppProperty.APP_DISPLAY_NAME));
		
		if (!WLJSX.Object.isUndefined(options.tickerText))
			args.push(options.tickerText);
		else args.push(WL.Client.getAppProperty(WL.AppProperty.APP_DISPLAY_NAME));
		
		if (!WLJSX.Object.isUndefined(options.contentTitle))
			args.push(options.contentTitle);
		else args.push(WL.Client.getAppProperty(WL.AppProperty.APP_DISPLAY_NAME));
		
		if (!WLJSX.Object.isUndefined(options.contentText))
			args.push(options.contentText);
		else args.push(WL.ClientMessages.keepAliveInBackgroundText);
		
		if (!WLJSX.Object.isUndefined(options.icon))
			args.push(options.icon);
		else args.push("push");
		
		if (!WLJSX.Object.isUndefined(options.notificationId))
			args.push(options.notificationId);
		else args.push(-111);
		
		// truly optional:
		if (!WLJSX.Object.isUndefined(options.className))
			args.push(options.className);
		
		PhoneGap.exec(function() {
			WL.Logger.debug("bind successful");
		}, function() {
			WL.Logger.debug("bind UNsuccessful");
		}, "ForegroundBinderPlugin", "bindToService", args);
	};
	
	this.unbind = function() {
		PhoneGap.exec(function() {
			WL.Logger.debug("unbind successful");
		}, function() {
			WL.Logger.debug("unbind UNsuccessful");
		}, "ForegroundBinderPlugin", "unbindFromService", []);
	};
};

var __WL_Binder = new __Binder();
WL.App.setKeepAliveInBackground = function(enabled, options) {
	if (enabled)
		__WL_Binder.bind(options);
	else __WL_Binder.unbind();
};



