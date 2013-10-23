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
if (!Cordova.hasResource("appmgmt")) {
  Cordova.addResource("appmgmt"); 
*/

/**
 * @name IBM Application Management APIs
 * @fileOverview A collection of objects to support application management through a Cordova plugin.
 * <p>
 * We extended the capabilities of Cordova to support the native application management 
 * APIs of registration and policies for Android and iOS. In this document we will show 
 * how to install the Application Management plugin, describe the available APIs and show usage 
 * samples.
 * </p>
 * 
 * <h3>Installation</h3>
 * <p>
 * There are two parts to any Cordova plugin, native code and JavaScript code which should be included in your project.
 * </p>
 * <h4>Android</h4>
 * <p>
 * On Android, the ApplicationManagementPlugin plugin Java source code needs to be included in your Android project as a JAR library. 
 * In addition, the JavaScript for the ApplicationManagementPlugin plugin needs to be added to the ./assets/www/* folder of 
 * your Android project and linked in your HTML source code. The final thing that needs to be done is an additional element 
 * needs to be added to the ./res/xml/plugins.xml file.
 * <ol>
 * <li>Modify your project's ./res/xml/plugins.xml file to include the com.ibm.mobile.ApplicationManagementPlugin
 * <pre class="code">
 * &lt;plugins&gt;
 *	....
 *   &lt;plugin name="com.ibm.mobile.ApplicationManagementPlugin" 
 *              value="com.ibm.mobile.plugin.ApplicationManagementPlugin"/&gt;    
 * &lt;/plugins&gt;
 * </pre>
 * </li>
 * <li>Copy appmgmt.js file to your /assets/www/* folder.</li>
 * <li>Add appmgmt.jar file to your project.</li>
 * </ol>
 * </p>
 * 
 * <h4>iOS</h4>
 * <p> 
 * On iOS, the IBMMobile framework needs to be included in your project. In addition, the JavaScript for the 
 * ApplicationManagementPlugin plugin needs to be added to the <tt>./www/*</tt> folder of your iOS project and linked 
 * in your HTML source code. The final thing that needs to be done is an additional element needs to be added to the 
 * <tt>Cordova.plist</tt> file. 
 * </p>
 * <ol>
 * <li> Modify your project's <tt>Cordova.plist</tt> file to include the <tt>com.ibm.mobile.applicationmanagementplugin</tt> key
 * <pre class="code">
 * &lt;plist version="1.0"&gt;
 * 
 *      &lt;dict&gt;
 * 
 *           ...
 * 
 *           &lt;key>Plugins&lt;/key&gt;
 * 
 *           &lt;dict&gt;
 * 
 *                ...
 * 
 *                &lt;key&gt;com.ibm.mobile.applicationmanagementplugin&lt;/key&gt;
 * 
 *                &lt;string&gt;IBMAppManPlugin&lt;/string&gt;
 * 
 *                ...
 * 
 *           &lt;/dict&gt;
 * 
 *           ...
 * 
 *      &lt;/dict&gt;
 * 
 * &lt;/plist&gt;
 * </pre>
 * </li>
 * <li> Copy <tt>appmgmt.js</tt> file to your <tt>./www/* folder</tt>. </li>
 * </ol>
 * 
 * <h3>Using the APIs</h3>
 *
 * Using the APIs require the developer to go through the following 3 steps:
 * <ol>
 * <li> In your HTML file,  make sure that you load the application management plugin 
 *      javascript file (<tt>appmgmt.js</tt>) after loading the Cordova javascript inerfaces. </li>
 * <li> In a JavaScript code segment. Make sure that the application management plugin is initialized by 
 *      following the <tt>applicationManagementInfoReady</tt>  event</li>
 * <li> Once the application management plugin is initialized, use the variosu APIs</li>
 * </ol> 
 * 
 * The below code sample show how the above 3 steps can be implemented.  
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
            };
            reg.onerror = function(e) {
                _consoleLog('FAILED  to register ' + e.operation + ' error is: ' + 
                            e.error);
            };
		
            reg.registerDevice();
        }
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
if (typeof com === "undefined") {
	/** @ignore */
	var com = {};
}

if (typeof com.ibm === "undefined") {
	/** @ignore */
	com.ibm = {};
}

if (typeof com.ibm.mobile === "undefined") {
	/**
	 * @namespace Holds all Application Management functionality.
	 */	
	com.ibm.mobile = {};
}
	
/** @ignore */
com.ibm.mobile.appmgmtUtil = {
		
		/** @ignore */
	_getSuccessCallback: function (obj, event, updateInfo) {
		/** @ignore */
		var callback = function (info) {
			// Success callback
			if(info && updateInfo) {
				navigator.appmgmt._updateRegistrationInfo(info);					
			}
			
			if (typeof obj[event] === "function") {
				obj[event](info);
			}				
		} 
		
		return callback;
	},
	
	/** @ignore */
	_getErrorCallback: function (obj, op) {
		/** @ignore */
		var callback = function(e) {
			
	        // Error callback. If onerror callback is available, call it.
            if (typeof obj["onerror"] === "function") {
                obj["onerror"](new com.ibm.mobile.RegistrationError(op, e));
            }
		}
		
		return callback
	}
};


/**
 * @ignore 
 * A shallow facade on top of the native application management plugin
 * @constructor
 */
com.ibm.mobile.ApplicationManagement = function() {
	this.available = false;
    this.deviceID = null;
    this.serverURL = null;
    this.username = null;
    this.password = null;
    this.pkg = null;
    this.version = null;
    this.isApplicationRegistered = false;
    this.isDeviceRegistered = false;
    this._getRegistrationInfo();
};


/**
 * Fetch the registration information (a {@link com.ibm.mobile.RegistrationInfo} object)
 * @ignore 
 */
com.ibm.mobile.ApplicationManagement.prototype.getRegistrationInfo = function(successCallback, errorCallback) {
    // Get info
    /* MBS return Cordova.exec(successCallback, 
    		errorCallback, 
    		"com.ibm.mobile.ApplicationManagementPlugin", 
    		"getRegisrationInfo", 
    		[]); */
	
	// MBS ADDED
	var info = new com.ibm.mobile.RegistrationInfo();
	successCallback(info);
	// MBS END ADDED
	
	return; 
};

/**
 * A wrapper for fetching the registration information in an asynchronous manner
 * @ignore 
 */
com.ibm.mobile.ApplicationManagement.prototype._getRegistrationInfo = function() {
   var me = this;
    this.getRegistrationInfo(    		
        function(info) {          
            me.available = true;
            me.deviceID = info.deviceID;
            me.serverURL = info.serverURL;
            me.username = info.username;
            me.password = info.password;            
            me.isDeviceRegistered = info.isDeviceRegistered;
            me.isApplicationRegistered = info.isApplicationRegistered;
            me.pkg = info.pkg;
            me.version = info.version;
        	_consoleLog("initialized registration information:[deviceID, serverURL, username, password, isDeviceRegistered, isApplicationRegistered, pkg, version]=[" + 
        			me.deviceID + "," + me.serverURL + 
            		"," + me.username + "," + me.password + 
            		","  + me.isDeviceRegistered + "," + me.isApplicationRegistered +
            		","  + me.pkg + "," + me.version +
            		"]");
            // fire ready event
        	/* MBS At least in MBS context, this is too early, because the app
        	 * installs it's listener of applicationManagementInfoReady only on
        	 * "onload" notification, that is *after* the event is fired. 
        	var e = document.createEvent('Events'); 
        	e.initEvent('applicationManagementInfoReady');
        	document.dispatchEvent(e);	
        	*/
        	// MBS: modified version to delay it:
        	window.addEventListener("load", 
                    function() {
        		var e = document.createEvent('Events'); 
            	e.initEvent('applicationManagementInfoReady');
            	document.dispatchEvent(e);	
        	}, false);
        	// MBS END OF MODIFIED VERSION
        },
        function(e) {
            _consoleLog("Error initializing ApplicationManagement: " + e);
            alert("Error initializing ApplicationManagement: " + e);
        });	
}

/**
 * Updated the saved registration information with new one
 * @ignore 
 */
com.ibm.mobile.ApplicationManagement.prototype._updateRegistrationInfo = function(jsonInfo) {
	
	if (!jsonInfo) {
		return;
	}
	
    this.deviceID = jsonInfo.deviceID;
    this.serverURL = jsonInfo.serverURL;
    this.username = jsonInfo.username;
    this.password = jsonInfo.password;
    this.isDeviceRegistered = jsonInfo.isDeviceRegistered;
    this.isApplicationRegistered = jsonInfo.isApplicationRegistered;
    this.pkg = jsonInfo.pkg;
    this.version = jsonInfo.version;
    _consoleLog("updating registration information:[deviceID, serverURL, username, password, isDeviceRegistered, isApplicationRegistered]=[" + 
    		this.deviceID + "," + this.serverURL + 
    		"," + this.username + "," + this.password + "," + 
    		this.isDeviceRegistered + "," + this.isApplicationRegistered + "]");
   
}

/**
 * A wrapper for registering a device
 * @ignore 
 */
com.ibm.mobile.ApplicationManagement.prototype.registerDevice = function(successCallback, failureCallback, serverURL, username, password, deviceID) {
	_consoleLog("com.ibm.mobile.ApplicationManagement.prototype.registerDevice");
	
	
	/* MBS
	var parameters = 	deviceID ? [serverURL, username, password, deviceID] :
		[serverURL, username, password];
	
	return Cordova.exec(successCallback,    				//Success callback from the plugin
		 failureCallback,     								//Error callback from the plugin
		 'com.ibm.mobile.ApplicationManagementPlugin',  	//Tell Cordova to run "com.ibm.mobile.ApplicationManagementPlugin" Plugin
		 'registerDevice',              					//Tell plugin, which action we want to perform
		 parameters);        								//Passing list of args to the plugin, device ID is optional
	*/
}

/**
 * A wrapper for de-registering a device
 * @ignore 
 */
com.ibm.mobile.ApplicationManagement.prototype.unregisterDevice = function(successCallback, failureCallback, serverURL, username, password, deviceID) {
	_consoleLog("com.ibm.mobile.ApplicationManagement.prototype.unregisterDevice");

	/* MBS
	var parameters = 	deviceID ? [serverURL, username, password, deviceID] :
		 [serverURL, username, password];
	 
 	return Cordova.exec(successCallback,    				//Success callback from the plugin
		 failureCallback,     								//Error callback from the plugin
		 'com.ibm.mobile.ApplicationManagementPlugin',  	//Tell Cordova to run "com.ibm.mobile.ApplicationManagementPlugin" Plugin
		 'unregisterDevice',              					//Tell plugin, which action we want to perform
		 parameters);        								//Passing list of args to the plugin, device ID is optional
	*/
};

/**
 * A wrapper for registering an application
 * @ignore 
 */
com.ibm.mobile.ApplicationManagement.prototype.registerApplication = function(successCallback, failureCallback, serverURL, username, password, deviceID) {
	_consoleLog("com.ibm.mobile.ApplicationManagement.prototype.registerApplication");
	
	/* MBS
	var parameters = 	deviceID ? [serverURL, username, password, deviceID] :
		[serverURL, username, password];
	
	return Cordova.exec(successCallback,    			//Success callback from the plugin
		 failureCallback,     							//Error callback from the plugin
		 'com.ibm.mobile.ApplicationManagementPlugin',  //Tell Cordova to run "com.ibm.mobile.ApplicationManagementPlugin" Plugin
		 'registerApplication',              			//Tell plugin, which action we want to perform
		 parameters);    								//Passing list of args to the plugin, device ID is optional
	*/
};

/**
 * A wrapper for de-registering an application
 * @ignore 
 */
com.ibm.mobile.ApplicationManagement.prototype.unregisterApplication = function(successCallback, failureCallback, serverURL, username, password, deviceID) {
	_consoleLog("com.ibm.mobile.ApplicationManagement.prototype.unregisterApplication");
	
	/* MBS
	var parameters = 	deviceID ? [serverURL, username, password, deviceID] :
		[serverURL, username, password];
	
	return Cordova.exec(successCallback,    			//Success callback from the plugin
		 failureCallback,     							//Error callback from the plugin
		 'com.ibm.mobile.ApplicationManagementPlugin',  //Tell Cordova to run "com.ibm.mobile.ApplicationManagementPlugin" Plugin
		 'unregisterApplication',              			//Tell plugin, which action we want to perform
		 parameters);    								//Passing list of args to the plugin, device ID is optional
	*/
};

/**
 * A wrapper for communication check
 * @ignore 
 */
com.ibm.mobile.ApplicationManagement.prototype.ping = function(successCallback, failureCallback, serverURL, username, password) {
	_consoleLog("com.ibm.mobile.ApplicationManagement.prototype.ping");

	/* MBS
	var parameters = 	serverURL ? [serverURL, username, password] : [];
	
	return Cordova.exec(successCallback,    					//Success callback from the plugin
		 failureCallback,     									//Error callback from the plugin
		 'com.ibm.mobile.ApplicationManagementPlugin',  		//Tell Cordova to run "com.ibm.mobile.ApplicationManagementPlugin" Plugin
		 'pingServer',              							//Tell plugin, which action we want to perform
		 parameters);      										//Passing list of args to the plugin, parameters are optional
	*/
};

/**
 * A wrapper for policy execution 
 * @ignore 
 */
com.ibm.mobile.ApplicationManagement.prototype.executePolicies = function(successCallback, failureCallback, serverURL, username, password, deviceID) {
	_consoleLog("ApplicationManagement.prototype.executePolicies");
	
	/* MBS
	return Cordova.exec(successCallback,    				//Success callback from the plugin
		 failureCallback,     								//Error callback from the plugin
		 'com.ibm.mobile.ApplicationManagementPlugin',  	//Tell Cordova to run "com.ibm.mobile.ApplicationManagementPlugin" Plugin
		 'executePolicies',              					//Tell plugin, which action we want to perform
		 [serverURL, username, password, deviceID]);      	//Passing list of args to the plugin
	*/
};

/**
 * A wrapper for posting feedback 
 * @ignore 
 */
com.ibm.mobile.ApplicationManagement.prototype.postFeedback = function(successCallback, failureCallback, pReason, pRating, pText) {
	_consoleLog("ApplicationManagement.prototype.postFeedback");
	
	/* MBS
	return Cordova.exec(successCallback,    				//Success callback from the plugin
		 failureCallback,     								//Error callback from the plugin
		 'com.ibm.mobile.ApplicationManagementPlugin',  	//Tell Cordova to run "com.ibm.mobile.ApplicationManagementPlugin" Plugin
		 'postFeedback',              						//Tell plugin, which action we want to perform
		 [pReason, pRating, pText]);      					//Passing list of args to the plugin
	*/
};
       
/* MBS: since in MBS it is not delayed, it needs to be executed once
 appmgmtsim.js is entirely evaluated, because the ctor of ApplicationManagement
 uses other functions not yet defined. Hence, for MBS, moved at the end of the file.  
Cordova.addConstructor(function() {
	if (typeof navigator.appmgmt === "undefined") {
		navigator.appmgmt = new com.ibm.mobile.ApplicationManagement();
	}
});
*/

// Registration

/**
 * Provides access to the registration information and returned as a result of a successful API call in the success callback.
 *   
 * A <tt>RegistrationInfo</tt> object is sent when a registration related method successfully returns via one of the 
 * registration callbacks. The first <tt>RegistrationInfo</tt> is fetched as part of the application management plugin 
 * initialization and following its retrival the plugin will fire the <tt>applicationManagementInfoReady</tt> event
 * to notify developers that application management services are available. 
 *     
 * @constructor
 */
com.ibm.mobile.RegistrationInfo = function() {
	
	/**
	 * The registered device ID (if registered, else undefined/null)
	 * @type string
	 */
	this.deviceID = null;
	
	/**
	 * The user name used for the last successful registration (if 
	 * registered, else undefined/null)
	 * 
	 * @type string
	 */
	this.username = null;
	
	/**
	 * The user password used for the last successful registration (if 
	 * registered, else undefined/null)
	 * 
	 * @type string
	 */
	this.password = null;
	
	/**
	 * The server URL used for the last successful registration (if 
	 * registered, else undefined)
	 * 
	 * @type string
	 */
	this.serverURL = null;
	
	/**
	 * <em>true</em> if the device was registered, <em>false</em> otherwise 
	 * @type boolean
	 */
	this.isDeviceRegistered = false;
	
	/**
	 * <em>true</em> if the application was registered, <em>false</em> otherwise
	 * @type boolean
	 */
	this.isApplicationRegistered = false;
	
	/**
	 * The identified package name of the application (that is used for any 
	 * application un/registration request)
	 *  
	 * @type string
	 */
	this.pkg = null;
	
	/**
	 * The identified version of the application (that is used for any 
	 * application un/registration request)
	 * 
	 * @type string
	 */
	this.version = null;
};

/**
 * Provides access to error information. 
 * 
 * Returned as a result of a failed API call in the onerror callback.
 *   
 * @constructor
 * @param operation {String}  the failed operation
 * @param errorCode {String}  the error code
 */
com.ibm.mobile.RegistrationError = function(pOperation, pErrorCode) {
	
	/**
	 * The operation that triggered the error
	 * @type string
	 * @see com.ibm.mobile.RegistrationError.REGISTER_DEVICE_OP
	 * @see com.ibm.mobile.RegistrationError.UNREGISTER_DEVICE_OP
	 * @see com.ibm.mobile.RegistrationError.REGISTER_APPLICATION_OP
	 * @see com.ibm.mobile.RegistrationError.UNREGISTER_APPLICATION_OP
	 * @see com.ibm.mobile.RegistrationError.CHECK_COMM_OP
	 */
   this.operation = pOperation;
	   
	/**
	 * The error code
	 * @type string
	 */
   this.error = pErrorCode;
};

/**#@+
 *  @see com.ibm.mobile.RegistrationError#operation
 *  @static 
 */

/**
 * Operation was/is device registration
 */
com.ibm.mobile.RegistrationError.REGISTER_DEVICE_OP 			= "registerDevice";
/**
 * Operation was/is device de-registration
 */
com.ibm.mobile.RegistrationError.UNREGISTER_DEVICE_OP 			= "unregisterDevice";
/**
 * Operation was/is application registration
 */
com.ibm.mobile.RegistrationError.REGISTER_APPLICATION_OP 		= "registerApplication";
/**
 * Operation was/is application de-registration
 */
com.ibm.mobile.RegistrationError.UNREGISTER_APPLICATION_OP 		= "unregisterApplication";
/**
 * Operation was/is communication test
 */
com.ibm.mobile.RegistrationError.CHECK_COMM_OP 					= "checkCommunication";

/**#@-*/

/**#@+
 *  @see com.ibm.mobile.RegistrationError#error
 *  @static 
 */

/**
 * Error was returned from the server
 */
com.ibm.mobile.RegistrationError.SERVER_ERR 				= "SERVER_ERR";				
/**
 * The server could not find the resource we looked for. Likely cause, 
 * an application with this version is not defined on the server 
 */
com.ibm.mobile.RegistrationError.APPLICATION_NOT_FOUND_ERR  = "APPLICATION_NOT_FOUND_ERR";	
/**
 * Security error. Likely reason, user ID and/or password are not correct   
 */
com.ibm.mobile.RegistrationError.UNAUTHORIZED_ERR 			= "UNAUTHORIZED_ERR";			
/**
 * Unable to connect to the server. Likely reason, wrong URL or network is down
 */
com.ibm.mobile.RegistrationError.CONNECTION_ERR 			= "CONNECTION_ERR";
/**
 * Illegal arguments were given 
 */
com.ibm.mobile.RegistrationError.BAD_ARGUMENTS_ERR			= "BAD_ARGUMENTS_ERR";			
/**
 * Unknown error during processing
 */
com.ibm.mobile.RegistrationError.UNSPECIFIED_ERR			= "UNSPECIFIED_ERR";			

/**#@-*/

/**
 * Constructs a empty registration object.
 *   
 * Can accept 3 optional parameters. If any of the parameters is null or undefined
 * it will be ignored, which in effect give multiple ways to instantiate the object
 * with two main uses:
 * <ol>
 * <li>Empty parameter list - similar to a Java default constructor </li>
 * <li>Full parameter list - all parameters are provided </li>
 * </ol>   
 * The sample code below show these options:
 * @example
 * 
 * // Registrator from an empty constructor 
 * var reg = new com.ibm.mobile.Registrator();
 *  
 * // Registrator with parameters 
 * var reg = new com.ibm.mobile.Registrator("demo", 
 *                                          "demo", 
 *                                          "http://localhost/mobilemgmt");
 *  
 * @param userid {String|null} user id for authentication
 * @param password {String|null} password for authentication
 * @param url {String|null} application management server URL
 *   
 * @class Let developers perform registration operations.
 * 
 * Provide APIs that let developers register and de-register the running application 
 * in the context of a specific device.
 */
com.ibm.mobile.Registrator = function(pUser, pPass, pURL) {
	
	/**
	 * A callback that is invoked when the ping operation to the server is complete. It is invoked 
	 * with a boolean value indicating whether a connection to the server is available or not.
	 * 
	 * @type Function
	 */
	this.oncheckcomplete = null;
	
	/**
	 * A callback that is invoked when a register device operation is complete. It is invoked with a 
	 * {@link com.ibm.mobile.RegistrationInfo } object
	 * 
	 * @type Function
	 */
	this.onregisterdevicecomplete = null;
	
	/**
	 * A callback that is invoked when an unregister device operation is complete. It is invoked with a 
	 * {@link com.ibm.mobile.RegistrationInfo } object
	 * 
	 * @type Function
	 */
	this.onurnegisterdevicecomplete = null;
	
	/**
	 * A callback that is invoked when a register application operation is complete. It is invoked with a 
	 * {@link com.ibm.mobile.RegistrationInfo } object
	 * 
	 * @type Function
	 */
	this.onregisterapplicationcomplete = null;
	
	/**
	 * A callback that is invoked when an unregister application operation is complete. It is invoked with a 
	 * {@link com.ibm.mobile.RegistrationInfo } object
	 * 
	 * @type Function
	 */
	this.onunregisterapplicationcomplete = null;
	
	/**
	 * A callback that is invoked if an error occurred in one of the operations. It is passed  
	 * {@link com.ibm.mobile.RegistrationError } object
	 * 	
	 * @type Function
	 */
	this.onerror = null;
	
	this._user = pUser;
	this._pass = pPass;
	this._url = pURL;
	
	// MBS ADDED
	var info = new com.ibm.mobile.RegistrationInfo();
	// Record the parameters such that they are available for registrator.getRegistrationInfo().
	// (Will be updated when (un)registerDevice/(un)registerApplication are called).
	info.username = this._user;
	info.password = this._pass;
	info.serverURL = this._url;
	this._registrationInfo = info;
	// MBS END ADDED
}

/**
 * Returns the current registration information.
 * 
 * @returns {com.ibm.mobile.RegistrationInfo} the current registration information
 */
com.ibm.mobile.Registrator.prototype.getRegistrationInfo = function() {
	/* MBS 
	var rc = new com.ibm.mobile.RegistrationInfo();

	if(navigator.appmgmt) {
		rc.deviceID 				= navigator.appmgmt.deviceID;
		rc.username 				= navigator.appmgmt.username;
		rc.password 				= navigator.appmgmt.password;
		rc.serverURL 				= navigator.appmgmt.serverURL;
		rc.isDeviceRegistered 		= navigator.appmgmt.isDeviceRegistered;
		rc.isApplicationRegistered 	= navigator.appmgmt.isApplicationRegistered;
		rc.pkg 						= navigator.appmgmt.pkg;
		rc.version 					= navigator.appmgmt.version;
	}
	
	return rc;
	*/
	
	// MBS ADDED
	return this._registrationInfo;
	// MBS END ADDED
}

// MBS ADDED
// todo: externalize
NOT_AVAILABLE_IN_MBS = "<not available in MBS>";
// MBS END ADDED

/**
 * Triggers a communication check to the application management server. 
 * 
 * A successful check will trigger a call to the callback referenced by 
 * {@link com.ibm.mobile.Registrator#oncheckcomplete}.
 */
com.ibm.mobile.Registrator.prototype.checkCommunication = function()  {
		
	// initiate the ping execution 
	navigator.appmgmt.ping(
			com.ibm.mobile.appmgmtUtil._getSuccessCallback(this, "oncheckcomplete", false),
	        com.ibm.mobile.appmgmtUtil._getErrorCallback(this, com.ibm.mobile.RegistrationError.CHECK_COMM_OP),
	        this._getServerURL(), 
	        this._getUserID(), 
	        this._getPassword());	
}

/**
 * Triggers a device registration request to the application management server.
 * 
 * Registers a device on server. The device ID is optional, and will be autogenerated if a
 * previous one does not exist.  A successful registration will trigger a call to the 
 * callback referenced by {@link com.ibm.mobile.Registrator#onregisterdevicecomplete}.
 *  
 *  @param suggestedDeviceID {String|null} A possible suggestion for a device ID to be used. 
 *                                         Needs to be in a GUUID format.
 */
com.ibm.mobile.Registrator.prototype.registerDevice = function(deviceID)  {
	/* MBS
	var me = this;
	// initiate the register execution 
	navigator.appmgmt.registerDevice(
			com.ibm.mobile.appmgmtUtil._getSuccessCallback(this, "onregisterdevicecomplete", true),
	        com.ibm.mobile.appmgmtUtil._getErrorCallback(this, com.ibm.mobile.RegistrationError.REGISTER_DEVICE_OP),
	        this._getServerURL(), 
	        this._getUserID(), 
	        this._getPassword(), 
	        deviceID);
	*/
	
	// MBS ADDED
	// Update the registration info:
	var info = this._registrationInfo;
	info.isDeviceRegistered = true;
	info.pkg = NOT_AVAILABLE_IN_MBS; 
	info.version = NOT_AVAILABLE_IN_MBS;
	info.deviceID = NOT_AVAILABLE_IN_MBS;
	
	var registrator = this;
	// Call the callback asynchronously (just as in the realty):
	setTimeout(function() {
		registrator.onregisterdevicecomplete(info);
	}, 10);
	// MBS END ADDED
}

/**
 * Triggers a device de-registration request to the application management server.
 *  
 * De-register a previously registered device from the server. A successful invocation will trigger a
 * call to the callback referenced by {@link com.ibm.mobile.Registrator#onunregisterdevicecomplete}.
 */
com.ibm.mobile.Registrator.prototype.unregisterDevice = function()  {
	/* MBS
	var me = this;
	// initiate the unregister execution 
	navigator.appmgmt.unregisterDevice(
			com.ibm.mobile.appmgmtUtil._getSuccessCallback(this, "onunregisterdevicecomplete", true),
	        com.ibm.mobile.appmgmtUtil._getErrorCallback(this, com.ibm.mobile.RegistrationError.UNREGISTER_DEVICE_OP),
	        this._getServerURL(), 
	        this._getUserID(), 
	        this._getPassword(), 
	        navigator.appmgmt.deviceID);
	*/
	
	// MBS ADDED
	// Update the registration info:
	var info = this._registrationInfo;
	info.isDeviceRegistered = false;
	
	// Call the callback asynchronously (just as in the realty):
	var registrator = this;
	setTimeout(function() {
		registrator.onunregisterdevicecomplete(info);
	}, 10);
	// MBS END ADDED
}

/**
 * Triggers an application registration request to the application management server.
 * 
 * Register the application on the server. A successful registration will trigger a
 * call to the callback referenced by {@link com.ibm.mobile.Registrator#onregisterapplicationcomplete}.
 */
com.ibm.mobile.Registrator.prototype.registerApplication = function()  {
	/* MBS
	var me = this;
	// initiate the register application execution 
	navigator.appmgmt.registerApplication(
			com.ibm.mobile.appmgmtUtil._getSuccessCallback(this, "onregisterapplicationcomplete", true),
	        com.ibm.mobile.appmgmtUtil._getErrorCallback(this, com.ibm.mobile.RegistrationError.REGISTER_APPLICATION_OP),
	        this._getServerURL(), 
	        this._getUserID(), 
	        this._getPassword(), 
	        navigator.appmgmt.deviceID);
	*/
	
	// MBS ADDED
	// Update the registration info:
	var info = this._registrationInfo;
	info.isApplicationRegistered = true;
	info.pkg = NOT_AVAILABLE_IN_MBS; 
	info.version = NOT_AVAILABLE_IN_MBS;
	info.deviceID = NOT_AVAILABLE_IN_MBS;
	
	// Call the callback asynchronously (just as in the realty):
	var registrator = this;
	setTimeout(function() {
		registrator.onregisterapplicationcomplete(info);
	}, 10);
	// MBS END ADDED
}

/**
 * Triggers an application de-registration request to the application management server.
 *  
 * De-register a previously registered application from the server. A successful invocation will trigger a
 * call to the callback referenced by {@link com.ibm.mobile.Registrator#onunregisterapplicationcomplete}.
 */
com.ibm.mobile.Registrator.prototype.unregisterApplication = function()  {
	/* MBS
	var me = this;
	// initiate the unregister application execution 
	navigator.appmgmt.unregisterApplication(
			com.ibm.mobile.appmgmtUtil._getSuccessCallback(this, "onunregisterapplicationcomplete", true),
	        com.ibm.mobile.appmgmtUtil._getErrorCallback(this, com.ibm.mobile.RegistrationError.UNREGISTER_APPLICATION_OP),
	        this._getServerURL(), 
	        this._getUserID(), 
	        this._getPassword(), 
	        navigator.appmgmt.deviceID);
	*/
	
	// MBS ADDED
	// Update the registration info:
	var info = this._registrationInfo;
	info.isApplicationRegistered = false;
	
	// Call the callback asynchronously (just as in the realty):
	var registrator = this;
	setTimeout(function() {
		registrator.onunregisterapplicationcomplete(info);
	}, 10);
	// MBS END ADDED
}

com.ibm.mobile.Registrator.prototype._getServerURL = function() {
	
	if(this._url)
		return this._url;
	
	return navigator.appmgmt.serverURL;
}

com.ibm.mobile.Registrator.prototype._getUserID = function() {
	
	if(this._user)
		return this._user;
	
	return navigator.appmgmt.username;
}

com.ibm.mobile.Registrator.prototype._getPassword = function() {
	
	if(this._pass)
		return this._pass;
	
	return navigator.appmgmt.password;
}

/**
 * Instantiate a new, <em>PolicyExecutor</em> object to facilitate the execution of application 
 * management policies.  
 * <p>
 * Once the object is instantiated, users can set the policy execution event handlers and than call the 
 * {@link com.ibm.mobile.PolicyExecutor#init} method to start executing policies as seen in the following 
 * sample.
 * </p> 
 * @class
 * 
 * This class handles the execution of application management policies
 * <p> 
 * The <em>PolicyExecutor</em> object provides access to the Application Management Policy capabilities. It 
 * enables executing the policies and their enforcement on the application.
 * 
 * To enforce policies, developers should set their policy enforcement event listeners 
 *  receive the following notifications and code their application specific implementation:
 * <ol>
 * <li> onshowmessages - invoked when there are messages to show. The developer should 
 *      present the messages to the user in the most appropriate manner and than resume 
 *      operation by calling the {@link com.ibm.mobile.PolicyExecutor#onShowMessagesCompleted} method </li>
 * <li> onuninstall, onwipe, onupdate policy operation notifications - invoked and in case there is an 
 *      operation to be executed. The developer should implement the operation in the most
 *      appropriate manner (e.g., for un-install, removign all application specific data
 *      and asking the user to uninstall)  and than resume 
 *      operation by calling the {@link com.ibm.mobile.PolicyExecutor#onOperationCompleted} method.
 *      <br> <b>Note:</b> When multiple policies are configured only one  (the most severe) of 
 *      the correlating event handlers will be notified</li> 
 * <li> the onshow, onblock policy application access events - called when policies allow the user
 *      to use the application and when user access to the application is blocked. Either onshow or 
 *      onblock will be invoked </li> 
 * <li> onerror in case an error occurred while retrieving policies. </li>
 * </ol>
 * 
 * <b>Note:</b>  before using this object both the device and application should be registered.
 * 
 * </p>
 * @example
&lt;script type="text/javascript" charset="utf-8" src="cordova.js"&gt;&lt;/script&gt;
&lt;script type="text/javascript" charset="utf-8" src="appmgmt.js"&gt;&lt;/script&gt;
&lt;script type="text/javascript" charset="utf-8"&gt;

    // Wait for ApplicationManagement Plugin to load
    //
    function onLoad() {
        document.addEventListener("applicationManagementInfoReady", 
                                  onApplicationManagementInfoReady, 
                                  false);
    }

    // ApplicationManagementInfoReady is ready
    //
    function onApplicationManagementInfoReady() {
        // <b>Important note, if the application is not registered, 
        // register it now prior to using the policies... </b> 
        runPolicies();
    }

    // This is just a mocked up sample. We show only the first of the meesages
    // that the user should see, place just a single operation processor,  
    // use alert to mock up the implementation etc. 
    function runPolicies() {
        // assuming device and application are registered
        // Instantiate a PolicyProcessor    
        var policyExecutor = new com.ibm.mobile.PolicyExecutor();
        
        // Will be called when the application is allowed to be presented 
        // (not blocked). Just show an alert in this sample
        policyExecutor.onshow = function() {
            alert("onshow");
        };
        
        // Will be called when the user is not allowed to access this application  
        // (one or more of the policies indicate that the application is blocked). 
        // Just show an alert in this sample
        policyExecutor.onblock = function() {
            alert("onblock");
        };
        
        // Will be called when there are one or more messages that needs to be shown to the 
        // user. When the user is done with the messages, the application must call
        // the method <em>onShowMessagesCompleted</em>
        //  
        // In this sample just show an alert with the first message.        
        policyExecutor.onshowmessages = function(messages) {
            if (messages.length > 0) {
                alert(messages[0].message);
            }
            
            // <b>Resume execution by calling <em>onShowMessagesCompleted</em> </b>
            policyExecutor.onShowMessagesCompleted();
        };

        // Will be called when there there is a data removal operation that needs to take place. 
        // When the operation is complete, the application must call the method <em>onShowMessagesCompleted</em>
        //  
        // In this sample just implement a single operation processor, but real applications
        // should implement all of them (including uninstall and update)        
        policyExecutor.onwipe = function() {
            alert("Should now remove all user generated application's data");
            
            // <b>Resume execution by calling <em>onOperationCompleted</em></b>
            policyExecutor.onOperationCompleted();
        };

        // Start processing the policies                                      
        policyExecutor.init();
    }
&lt;/script&gt;
 */
com.ibm.mobile.PolicyExecutor = function() {
	
    /**
     * Indicates whether the operation execution has started or done.
	 * @see com.ibm.mobile.PolicyExecutor.OP_NOT_STARTED
	 * @see com.ibm.mobile.PolicyExecutor.OP_STARTED
	 * @see com.ibm.mobile.PolicyExecutor.OP_DONE
     */
	this.operation_progress =	com.ibm.mobile.PolicyExecutor.OP_NOT_STARTED;
    
    /**
     * The operation that should be executed. Valid only when <em>operation_progress</em> is in the OP_STARTED
     * status
     * 
     *  @see com.ibm.mobile.PolicyExecutor.POLICY_OP_UNINSTALL
     *  @see com.ibm.mobile.PolicyExecutor.POLICY_OP_UPDATE
     *  @see com.ibm.mobile.PolicyExecutor.POLICY_OP_WIPE 
     */
	this.operation = null;

	/**
     * <em>true</em> if the application should be blocked from execution, otherwise 
     * <em>false</em> (the application should be presented to the user) 
     */
	this.block = false;
	
	// Event handlers
    /**
     * A callback that is invoked when a the policy indicates that the application can be shown (none block).
	 * 
	 * @type Function
     */
    this.onshow  = null;    			// show operation execution
	
    /**
     * A callback that is invoked when a the policy indicates that the application should be blocked.
	 * 
	 * @type Function
     */
    this.onblock = null;     			// block operation execution
    
    /**
     * A callback that is invoked when a the policy indicates that the entire application should 
     * be updated to the latest version. 
	 * 
	 * @type Function
     */
    this.onupdate = null;         		// update operation execution
    
    /**
     * A callback that is invoked when a the policy indicates that the application's HTML sources 
     * should be updated to the latest version.
	 * 
	 * @type Function
     * @ignore
     */
    this.onupdatehtml = null;        	// update html operation execution
    
    /**
     * A callback that is invoked when a the policy indicates that the application should be uninstalled.
	 * 
	 * @type Function
     */
    this.onuninstall = null;      		// uninstall operation execution
    
    /**
     * A callback that is invoked when a the policy indicates that the application data should be cleared. 
	 * 
	 * @type Function
     */
    this.onwipe = null;        			// clear data operation execution
    
    /**
     * A callback that is invoked if an error occurred. It is passed the error that occurred. 
	 * 
	 * @type Function
     */
    this.onerror = null;        		// error occured
    
    /**
     * A callback that is invoked when the policy indicates that an array of messages 
     * should be shown to the user. 
	 * 
	 * @type Function
     */
    this.onshowmessages = null;			// need to show messages
}

// Policy execution status 
/**
 * Indicates that the <em>PolicyExecutor</em> did not start executing policies yet (could be that the 
 * application do not have policies).
 */
com.ibm.mobile.PolicyExecutor.OP_NOT_STARTED = 0;

/**
 * Indicates that the <em>PolicyExecutor</em> started processing policies and one of the event handlers 
 * was called.
 */
com.ibm.mobile.PolicyExecutor.OP_STARTED = 1;

/**
 * Indicates that the policy execution is completed.
 */
com.ibm.mobile.PolicyExecutor.OP_DONE = 2;

// Operations 
/**
 * Indicates that the user should uninstall the application
 */
com.ibm.mobile.PolicyExecutor.POLICY_OP_UNINSTALL 			= "uninstall";

/**
 * Indicates that the user should install an update update of the application
 */
com.ibm.mobile.PolicyExecutor.POLICY_OP_UPDATE 				= "update";
/**
 * @ignore
 * Indicates that update HTML operation should be executed.
 */
com.ibm.mobile.PolicyExecutor.POLICY_OP_UPDATE_HTML 		= "update_html";

/**
 * Indicates that the operation should remove all on device 
 * content created by this application.
 */
com.ibm.mobile.PolicyExecutor.POLICY_OP_WIPE 				= "wipe";

/**
 * Retrieve the policies from server and invoke the matching event handlers.  
 * 
 * <p>
 * Event handlers will be called in the following order:
 * <ol>
 * <li>First when the developer provides an onshowmessages hadnler and the policies indicated 
 *     that there are messages, the onshowmessages is invoked with an array of messages to be 
 *     shown to the user. When done the developer should resume pilicy processing by calling 
 *     the method {@link com.ibm.mobile.PolicyExecutor#onShowMessagesCompleted}. </li>
 * <li>Than when the developer provides operation processing handlers and the policies indicated 
 *     that there is a pending operation, the matching operation processor is invoked. When done 
 *     the developer should resume pilicy processing by calling 
 *     the method {@link com.ibm.mobile.PolicyExecutor#onOperationCompleted}. </li>
 * <li>Lastly when the policies indicate that users are not allowed to use the application at this 
 *     time (blocked access) and the developer provides an onblock handler it will be invoked. 
 *     If access is not blocked and the onshow handlers is provided, onshow will be called. </li>
 * </ol>
 */
com.ibm.mobile.PolicyExecutor.prototype.init = function() {	
	
	var me = this;
	// initiate the policies retrieval and execution 
	navigator.appmgmt.executePolicies(
			
	        // Success callback
	        function(executionSet) {

	        	me.block = executionSet.shouldBlock;
	        	me.operation = executionSet.operation;
	        	if (executionSet.messages.length > 0 && typeof me.onshowmessages == "function") {
	        		me.onshowmessages(executionSet.messages);	        		
	        	} else {
	        		me.onShowMessagesCompleted();
	        	}	        	
	        },

	        com.ibm.mobile.appmgmtUtil._getErrorCallback(this, "policyProcessing"), 
	        navigator.appmgmt.serverURL, navigator.appmgmt.username, navigator.appmgmt.password, navigator.appmgmt.deviceID
	);
}

/**
 * This method should be called by the developer after showing the messages to the user. 
 * 
 * This method will resume policy processing by calling the operation handlers
 */
com.ibm.mobile.PolicyExecutor.prototype.onShowMessagesCompleted = function()
{
	_consoleLog("com.ibm.mobile.PolicyExecutor.prototype.onShowMessagesCompleted, has operation?" + this.operation);
	
	if (this.operation) {
        // If onupdate operation should be executed 
        if (this.operation == com.ibm.mobile.PolicyExecutor.POLICY_OP_UPDATE && 
        		typeof this.onupdate === "function") {
        	this.operation_progress = com.ibm.mobile.PolicyExecutor.OP_STARTED; 
        	this.onupdate();
        }
        
        // If onupdatehtml operation should be executed 
        if (this.operation == com.ibm.mobile.PolicyExecutor.POLICY_OP_UPDATE_HTML && 
        		typeof this.onupdatehtml === "function") {
        	this.operation_progress = com.ibm.mobile.PolicyExecutor.OP_STARTED;
        	this.onupdatehtml();
        }
        
        // If onuninstall operation should be executed 
        if (this.operation == com.ibm.mobile.PolicyExecutor.POLICY_OP_UNINSTALL && 
        		typeof this.onuninstall === "function") {
        	this.operation_progress = com.ibm.mobile.PolicyExecutor.OP_STARTED;
            this.onuninstall();
        }
        
        // If oncleardata operation should be executed 
        if (this.operation == com.ibm.mobile.PolicyExecutor.POLICY_OP_WIPE && 
        		typeof this.onwipe === "function") {
        	this.operation_progress = com.ibm.mobile.PolicyExecutor.OP_STARTED;
            this.onwipe();
        }
	} 
	
	if (this.operation_progress == com.ibm.mobile.PolicyExecutor.OP_NOT_STARTED) {
		//no operation at all, or a function was not supplied for it
		this.onOperationCompleted();
	}
}

/**
 * This method should be called by the developer  after policy operation is complete.
 * 
 * This method will resume policy processing by calling the onshow/onblock handlers
 */
com.ibm.mobile.PolicyExecutor.prototype.onOperationCompleted = function()
{
	_consoleLog("com.ibm.mobile.PolicyExecutor.prototype.onOperationCompleted, block?" + this.block);
	
	this.operation_progress = com.ibm.mobile.PolicyExecutor.OP_DONE;
	  // If onshow operation should be executed 
    if (!this.block && typeof this.onshow === "function") {
        this.onshow();
    }
	  // If onshow operation should be executed 
    if (this.block && typeof this.onblock === "function") {
        this.onblock();
    }
}

/**
 * Instantiate a new <em>FeedbackSender</em> that can be used to send feedback messages to the 
 * application management sender.
 * <p>
 * Once instantiated, developers should place event handlers into the <em>FeedbackSender</em> and
 * than call the method {@link com.ibm.mobile.FeedbackSender#postFeedback} as can be seen in the sample 
 * below. 
 * </p>
 * 
 * @example
    // Wait for ApplicationManagement Plugin to load
    function onLoad() {
        document.addEventListener("applicationManagementInfoReady", 
                                  onApplicationManagementInfoReady, 
                                  false);
    }

    // ApplicationManagementInfoReady is ready
    function onApplicationManagementInfoReady() {
        // 1. Instantiate a feedback sender
        var feedback = new com.ibm.mobile.FeedbackSender();
		
        // 2. Assign callback handlers for the asynch operation
        // First error handler 
        feedback.onerror = function(e) {
            _consoleLog('FAILED  to send feedback error is: ' + 
                        e.error);
        };
				
        // and success handler 
        feedback.onfeedbackcomplete = function(info) {
            _consoleLog('Feedback posted");										
        };         
		
        // Now post the feedback and wait for responses to return 
        feedback.postFeedback(com.ibm.mobile.FeedbackSender.Reason_COMMENT, 
                              2, 
                              "This is some feedback text");							
    }
 * 
 * @class
 * 
 * Let developers post feedback messages from their application to the application management server. 
 *
 * To send feedback developers should instantiate the <em>FeedbackSender</em>, assign success and error callback
 * handlers and than call the method {@link com.ibm.mobile.FeedbackSender#postFeedback}  
 * 
 */
com.ibm.mobile.FeedbackSender = function() {
	/**
	 * An error callback. Assign your error callback to this field prior to posting the feedback 
	 * @type Function
	 * @field
	 */
	this.onerror = null;        		

	/**
	 * A success callback. Assign your success callback to this field prior to posting the feedback 
	 * @type Function
	 * @field
	 */
	this.onfeedbackcomplete = null;     
};

/**
 * Let developers post feedback messages from their application to the application management server 
 *
 * A successful feedback post will trigger a call to the callback referenced by 
 * {@link com.ibm.mobile.FeedbackSender#onfeedbackcomplete}.
 * 
 * @param reason {com.ibm.mobile.FeedbackSender.Reason} One of the reasons defined in {@link com.ibm.mobile.FeedbackSender}
 * @param rating {number}	A number in the range of [1 - 10]
 * @param text {string} 	The content of the feedback message, up to 2048 characters long  
 * 
 * @see com.ibm.mobile.FeedbackSender.Reason_COMMENT 
 * @see com.ibm.mobile.FeedbackSender.Reason_FAILED_INSTALL
 * @see com.ibm.mobile.FeedbackSender.Reason_UNINSTALL 
 */
com.ibm.mobile.FeedbackSender.prototype.postFeedback = function(pReason, pRating, pText) {
	_consoleLog("com.ibm.mobile.FeedbackSender.prototype.postFeedback");
	
	var me = this;
	// initiate the unregister application execution 
	navigator.appmgmt.postFeedback(
			com.ibm.mobile.appmgmtUtil._getSuccessCallback(this, "onfeedbackcomplete", true),
	        com.ibm.mobile.appmgmtUtil._getErrorCallback(this, "postFeedback"),
	        pReason, 
	        pRating, 
	        pText);

}

/**#@+
 *  @static 
 */

/** Reason for the feedback message is Sending a comment */
com.ibm.mobile.FeedbackSender.Reason_COMMENT =  "COMMENT";
	
/** Reason for the feedback message is that installation of the application or a part of it failed */
com.ibm.mobile.FeedbackSender.Reason_FAILED_INSTALL = "FAILED_INSTALL";
	
/** Reason for the feedback message is that the application is about to be uninstalled */
com.ibm.mobile.FeedbackSender.Reason_UNINSTALL = "UNINSTALL";

/**#@-*/

/* MBS: moved at the end of the file. 
/* MBS
Cordova.addConstructor(function() {
*/
	if (typeof navigator.appmgmt === "undefined") {
		navigator.appmgmt = new com.ibm.mobile.ApplicationManagement();
	}
/* MBS
});
*/

/* MBS
} // END OF if (!Cordova.hasResource("appmgmt"))
*/
