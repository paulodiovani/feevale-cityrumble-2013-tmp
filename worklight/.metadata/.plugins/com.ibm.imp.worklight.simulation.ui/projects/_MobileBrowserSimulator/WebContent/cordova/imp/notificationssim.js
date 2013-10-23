/**
 * COPYRIGHT LICENSE:  This information contains sample code provided in source
 * code form. You may copy, modify, and distribute these sample programs in any
 * form without payment to IBM for the purposes of developing, using, marketing
 * or distributing application programs conforming to the application programming
 * interface for the operating platform for which the sample code is written.
 * Notwithstanding anything to the contrary,  IBM PROVIDES THE SAMPLE SOURCE CODE
 * ON AN "AS IS" BASIS AND IBM DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED,
 * INCLUDING, BUT NOT LIMITED TO, ANY IMPLIED WARRANTIES OR CONDITIONS OF
 * MERCHANTABILITY, SATISFACTORY QUALITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE,
 * AND ANY WARRANTY OR CONDITION OF NON-INFRINGEMENT.  IBM SHALL NOT BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL OR CONSEQUENTIAL DAMAGES ARISING OUT
 * OF THE USE OR OPERATION OF THE SAMPLE SOURCE CODE.  IBM HAS NO OBLIGATION TO
 * PROVIDE MAINTENANCE, SUPPORT, UPDATES, ENHANCEMENTS OR MODIFICATIONS TO THE
 * SAMPLE SOURCE CODE.
 */

// This is a modified version of appmgmt.js only used for the purpose of running
// in the Mobile Browser Simulator (MBS).

/* MBS
if (!Cordova.hasResource("notifications")) {
Cordova.addResource("notifications");
*/

/**
 * @name IBM Notifications APIs
 * @fileOverview A collection of objects to support the use of notifications through a Cordova plugin.
 * <p>
 * We extended the capabilities of Cordova to support the notification APIs provided by the IBM Mobile Platform Technology Preview 
 * for Android. In this document we will show how to install the Notifications plugin, describe the available APIs and show usage 
 * samples.
 * </p>
 * 
 * <h3>Installation</h3>
 * <p>
 * There are two parts to any Cordova plugin, native code and JavaScript code which should be included in your project.
 * </p>
 * <h4>Android</h4>
 * <p>
 * On Android, the Notifications plugin Java source code needs to be included in your Android project as a JAR library. 
 * In addition, the JavaScript for the Notifications plugin needs to be added to the ./assets/www/* folder of 
 * your Android project and linked in your HTML source code. The final thing that needs to be done is an additional element 
 * needs to be added to the ./res/xml/plugins.xml file.
 * <ol>
 * <li>Modify your project's ./res/xml/plugins.xml file to include the com.ibm.mobile.NotificationsPlugin
 * <pre class="code">
 * &lt;plugins&gt;
 *	....
 *   &lt;plugin name="com.ibm.mobile.NotificationsPlugin" 
 *              value="com.ibm.mobile.plugin.NotificationsPlugin"/&gt;    
 * &lt;/plugins&gt;
 * </pre>
 * </li>
 * <li>Copy notifications.js file to your /assets/www/* folder.</li>
 * <li>Add NotificationsPlugin.jar file to your project.</li>
 * </ol>
 * </p>
 * 
 * <h3>Using the APIs</h3>
 *
 * Use of the Notifications plugin APIs requires the following steps (your device/application must first be registered before you can make use of notifications):
 * <ol>
 * <li> In your HTML file,  make sure that you load the application management plugin 
 *      javascript file (<tt>appmgmt.js</tt>) after loading the Cordova javascript interfaces. </li>
 * <li> In a JavaScript code segment. Make sure that the application management plugin is initialized by 
 *      following the <tt>applicationManagementInfoReady</tt>  event</li>
 * <li> Once the application management plugin is initialized, use the various APIs to register your device and application.</li>
 * <li> Write a javascript notification handler that expects to be called with an int MsgCode and a String msg.</li>
 * <li> Use the notifications.registerNotifyCallback method to register the notification handler callback function.</li>
 * <li> Use the notifications.addMetadata and notifications.removeMetadata (according to the IBM Mobile Platform Technology Preview documentation for Notifications) to configure your application's notification channel as desired.</li>
 * <li> When the registered notification handler callback function receives a notification message, the application can handle the notification locally or can use notifications.reportSystemNotification method to add the message to the Android notification tray.</li>
 * </ol> 
 * 
 * The below code sample show how the above steps can be implemented.  
 * 
 * <pre class="code">
&lt;!DOCTYPE html&gt;
&lt;html&gt;
  &lt;head&gt;
    &lt;title&gt;Registration Example&lt;/title&gt;

    &lt;script type="text/javascript" charset="utf-8" src="cordova.js"&gt;&lt;/script&gt;
    &lt;-- <b>
        Step number 1:  
        Add a script tag pointing to the application management plugin file - 
        appmgmt.js </b> 
    --&gt;  
    &lt;script type="text/javascript" charset="utf-8" src="appmgmt.js"&gt;&lt;/script&gt;
    &lt;script type="text/javascript" charset="utf-8"&gt;

    // <b> Step number 2:
    // Wait for ApplicationManagement Plugin to load by listening to the 
    // onApplicationManagementInfoReady event </b>
    //
    function onLoad() {
        document.addEventListener("applicationManagementInfoReady", 
                                  onApplicationManagementInfoReady, false);
    }

    // <b> Step number 3:
    // We can start using the application management APIs. </b>
    //
    function onApplicationManagementInfoReady() {
    
    	//If your server is running on localhost for iOS devices use 127.0.0.1
    	//in the url    
        var reg = new com.ibm.mobile.Registrator("demo",
                                                 "demo",
                                                 "http://10.0.2.2:9080/mobilemgmt");
        var info = reg.getRegistrationInfo();
        if (!info.isDeviceRegistered || !info.isApplicationRegistered) {
       
            reg.onregisterdevicecomplete = function(info){
                var deviceID = info.deviceID;
                _consoleLog('Registered device with ID -&gt;' + deviceID);										
                reg.registerApplication();
            };		
            reg.onregisterapplicationcomplete = function(info) {
                _consoleLog('Registered application');
                // <b> Step number 5:
                // Register the application's notification handler callback. </b>
                //
                navigator.notifications.registerNotifyCallback(myNotificationHandler,
					function(){ // Success callback function.
						// success processing code
					},
					function(err){ // Failure callback function.
						alert("Error during register notification callback:", err);
						_consoleLog("Failed to register notification callback:", err);
					});							
            };
            reg.onerror = function(e) {
                _consoleLog('FAILED  to register ' + e.operation + ' error is: ' + 
                            e.error);
            };
		
            reg.registerDevice();
        }
    }
    
    // <b> Step number 4:
    // Notification handling method for callback. </b>
    //
    function myNotificationHandler(msgCode, msg){
		_consoleLog("Notification received. Code: " + msgCode + " Message: " + msg);
		
		// <b> Step number 7:
		// The received message can be added to the Android notification tray here using the notifications.reportSystemNotification call.</b>
		//
		navigator.notifications.reportSystemNotification("New sample notification waiting", "Received message from notification server (msgCode: " + msgCode + ")", msg); 
	}
	
    &lt;/script&gt;
  &lt;/head&gt;
  &lt;body&gt;
    &lt;h1&gt;Example&lt;/h1&gt;
    &lt;p&gt;Register Device and Application&lt;/p&gt;
  &lt;/body&gt;
&lt;/html&gt;
 * </pre>
 *  
 */

/**
 *  
 * @return Object literal singleton instance of Notifications
 */
var Notifications = function() {
	this.jsNotifyCallback = null;
};


/**
 * Register the application's notification handler callback function. This also initializes the NotificationsPlugin
 * (including the creation of the NotificationsPluginReceiver). 
 *
 * @param jsNotifyCallback {function} the application function to be called to process newly received notifications
 * @param successCallback {function} the application function to be called on successful completion of registerNotifyCallback function.
 * @param failureCallback {function} the application function to be called on failed completion of registerNotifyCallback function.
 * @returns PluginResult (from Cordova.exec)
 * @constructor
 */
Notifications.prototype.registerNotifyCallback = function(jsNotifyCallback, successCallback, failureCallback) {
	_consoleLog("Notifications.prototype.registerNotifyCallback", [jsNotifyCallback]);
	this.jsNotifyCallback = jsNotifyCallback;
	
	/* MBS
	return Cordova.exec(successCallback,       //Success callback from the plugin
	                     failureCallback,       //Error callback from the plugin
	                     'NotificationsPlugin', //Tell Cordova to run "NotificationsPlugin" Plugin
	                     'init',         		//Tell plugin, which action we want to perform
	                     []);         			//Passing list of args to the plugin
	*/
};


/**
 * Add a metadata key/value pair to the notification Intent. This is used to control the notification characteristics. 
 *
 * @param key {String} This will be added to the Intent as NotificationService.INTENT_ACTION_METADATA_EXTRA_STRING_KEY
 * @param value {String} This will be added to the Intent as NotificationService.INTENT_ACTION_METADATA_EXTRA_STRING_VALUE
 * @param successCallback {function} the application function to be called on successful completion of registerNotifyCallback function.
 * @param failureCallback {function} the application function to be called on failed completion of registerNotifyCallback function.
 * @returns PluginResult (from Cordova.exec)
 * @constructor
 */
Notifications.prototype.addMetadata = function(key, value, successCallback, failureCallback) {
	_consoleLog("Notifications.prototype.addMetadata", [key, value]);
	/* MBS	
	return Cordova.exec(successCallback,       //Success callback from the plugin
	                     failureCallback,       //Error callback from the plugin
	                     'NotificationsPlugin', //Tell Cordova to run "NotificationsPlugin" Plugin
	                     'addMetadata',         //Tell plugin, which action we want to perform
	                     [key, value]);         //Passing list of args to the plugin
	*/
};


/**
 * Remove metadata from the notification Intent (via the specified key). This is used to control the notification characteristics.
 *
 * @param key {String} This will be removed from the Intent as NotificationService.INTENT_ACTION_METADATA_EXTRA_STRING_KEY
 * @param successCallback {function} the application function to be called on successful completion of registerNotifyCallback function.
 * @param failureCallback {function} the application function to be called on failed completion of registerNotifyCallback function.
 * @returns PluginResult (from Cordova.exec)
 * @constructor
 */
Notifications.prototype.removeMetadata = function(key, successCallback, failureCallback) {
	_consoleLog("Notifications.prototype.removeMetadata", [key]);
	/* MBS 
	return Cordova.exec(successCallback,       //Success callback from the plugin
	                     failureCallback,       //Error callback from the plugin
	                     'NotificationsPlugin', //Tell Cordova to run "NotificationsPlugin" Plugin
	                     'removeMetadata',      //Tell plugin, which action we want to perform
	                     [key]);                //Passing list of args to the plugin
	*/
};


/**
 * Send the specified msg to the system notification tray with the provided title and scrolling ticker message. 
 *
 * @param ticker {String} the string that will be used in the scrolling banner indicating the new message that is waiting in the tray.
 * @param title {String} the title to be used for the new msg in the system notification tray.
 * @param msg {String} This is the actual message to be posted in the system notification tray.
 * @param successCallback {function} the application function to be called on successful completion of registerNotifyCallback function.
 * @param failureCallback {function} the application function to be called on failed completion of registerNotifyCallback function.
 * @returns PluginResult (from Cordova.exec)
 * @constructor
 */
Notifications.prototype.reportSystemNotification = function(ticker, title, msg, successCallback, failureCallback) {
	_consoleLog("Notifications.prototype.reportSystemNotification", [ticker, title, msg]);
	/* MBS
	return Cordova.exec(successCallback,            //Success callback from the plugin
			             failureCallback,            //Error callback from the plugin
                         'NotificationsPlugin',      //Tell Cordova to run "NotificationsPlugin" Plugin
                         'reportSystemNotification', //Tell plugin, which action we want to perform
                         [ticker, title, msg]);      //Passing list of args to the plugin
	*/
};


/**
 * Remove a notification from the system notification tray.  
 *
 * @param successCallback {function} the application function to be called on successful completion of registerNotifyCallback function.
 * @param failureCallback {function} the application function to be called on failed completion of registerNotifyCallback function.
 * @returns PluginResult (from Cordova.exec)
 * @constructor
 */
Notifications.prototype.clearSystemNotification = function(successCallback, failureCallback) {
	_consoleLog("Notifications.prototype.reportSystemNotification", []);
	/* MBS
	return Cordova.exec(successCallback,            //Success callback from the plugin
			             failureCallback,            //Error callback from the plugin
                         'NotificationsPlugin',      //Tell Cordova to run "NotificationsPlugin" Plugin
                         'clearSystemNotification',  //Tell plugin, which action we want to perform
                         []);                        //Passing list of args to the plugin
	*/
};


/**
 * Used by the NotificationPluginReceiver to pass the new notification back to the notifications object where it is then passed on to the
 * registered application notification handler callback function. 
 *
 * @ignore
 */
Notifications.prototype.onNotificationReceived = function (msgCode, msg) {
	if (this.jsNotifyCallback) {
    	this.jsNotifyCallback(msgCode, msg);
	}
};

/* MBS
Cordova.addConstructor(function() {
*/
	if (typeof navigator.notifications === "undefined") {
		navigator.notifications = new Notifications();
	}
/* MBS	
});
*/

/* MBS
} // END OF if (!Cordova.hasResource("notifications"))
*/