/*
* Licensed Materials - Property of IBM
* 5725-G92 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
* US Government Users Restricted Rights - Use, duplication or
* disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
*/

__WLMainView = function() {
	/**
	 * Invokes a JavaScript statement on the main application view. You must
	 * make sure that the JavaScript snippet provided has meaning in the view.
	 * 
	 * @param javascript
	 *            A mandatory string. This string will be invoked in the main
	 *            view.<br>
	 *            Note: The string must not contain the colon (":") character.
	 */
	this.invokeJS = function (javascript){};
	
	
	/**
	 * Note: This method is only supported on the iPhone.
	 * <p>
	 * Requests that a JavaScript statement in this view (the view to which the
	 * code containing this line belongs) and in the main view be invoked at the
	 * same time.
	 * 
	 * @param thisViewJS
	 *            A mandatory string. A JavaScript statement that will be
	 *            executed in this view.<br>
	 *            Note: The string must not contain the colon (":") character.
	 * @param mainViewJS
	 *            A mandatory string. A JavaScript statement that will be
	 *            executed in the main view.<br>
	 *            Note: The string must not contain the colon (":") character.
	 */
	this.invokeJSinSync = function (thisViewJS, mainViewJS){};
};

__WL.prototype.MainView = new __WLMainView;
WL.MainView = new __WLMainView;
