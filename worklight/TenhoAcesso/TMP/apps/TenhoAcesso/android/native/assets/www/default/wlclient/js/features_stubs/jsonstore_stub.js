
/* JavaScript content from wlclient/js/features_stubs/jsonstore_stub.js in Common Resources */
/**
 * @license
 * Licensed Materials - Property of IBM
 * 5725-G92 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

var WL = WL || {};

WL.JSONStore = (function (_) {
	var publicAPI = [
		         		"init",
		        		"get",
		        		"initCollection",
		        		"usePassword",
		        		"clearPassword",
		        		"closeAll",
		        		"documentify",
		        		"changePassword",
		        		"destroy",
		        		"getErrorMessage"
	        		];
	
	var stub = {};
	
	var jsonStoreEnabled = function() { 
		return !(_.isUndefined(WL._JSONStoreImpl)) 
	};
	
	_.each(publicAPI, function(apiName) {
		var implName = apiName;
		stub[apiName] = 
			(function(apiName, implName) {
				return function() {
					if (jsonStoreEnabled()) {
						return  WL._JSONStoreImpl[implName].apply(WL._JSONStoreImpl, arguments);
					} else {
						var featureName = 'JSONStore';
						var cmd = 'WL.JSONStore.' + apiName;
						throw new Error(WL.Utils.formatString(WL.ClientMessages.missingFeatureException, featureName, cmd));
					}
				};
			})(apiName, implName);
	});
	
	return stub;
}(WL_));