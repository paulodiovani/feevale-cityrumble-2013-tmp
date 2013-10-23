/*
 * Licensed Materials - Property of IBM
 * 5725-G92 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

__Analytics = function(){
 
	/**
	 * Enable the capture of analytics data.
	 *
	 * @param {object} (optional) options with
	 *     object.url="http://localhost:[PORT]/postreceiver" (default: WL.StaticAppProps.WORKLIGHT_ROOT_URL + "analytics")
	 */
	this.enable = function (options) { };

	/**
	 * Disable the capture of analytics data, reset all configuration values to their default values and call enable
	 * with an optional options object.
	 *
	 * @param {object} (optional) options with
	 *     object.url="http://localhost:[PORT]/postreceiver" (default: WL.StaticAppProps.WORKLIGHT_ROOT_URL + "analytics")
	 */
	this.restart = function (options) { };
	
	/**
	 * Disable the capture of analytics data.
	 */
	this.disable = function () { };
	
	/**
	 * Log a custom object to the analytics collector.
	 *
	 * @param {object} Message to log.
	 * @param {string} (optional) Name of the message to log.
	 */
	this.log = function(message, name) { };
	
	/**
	 * Get the current analytics collector state.
	 *
	 * @return {object} state with
	 *     state.enable=true/false
	 *     state.url="http://localhost:[PORT]/postreceiver"
	 *     state.currentQueueSize=[integer]
	 *     state.resumeEventAttached=true/false
	 */
	this.state = function() { };
	
};

__WL.prototype.Analytics = new __Analytics; 