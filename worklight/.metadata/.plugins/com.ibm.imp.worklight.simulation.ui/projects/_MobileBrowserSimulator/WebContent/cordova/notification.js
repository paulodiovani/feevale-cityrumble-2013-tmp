/*
 * Cordova is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010-2011, IBM Corporation
 */

if (!Cordova.hasResource("notification")) {
Cordova.addResource("notification");

/**
 * This class provides access to notifications on the device.
 * @constructor
 */
var Notification = function() {
};

/**
 * Open a native alert dialog, with a customizable title and button text.
 *
 * @param {String} message              Message to print in the body of the alert
 * @param {Function} completeCallback   The callback that is called when user clicks on a button.
 * @param {String} title                Title of the alert dialog (default: Alert)
 * @param {String} buttonLabel          Label of the close button (default: OK)
 */
Notification.prototype.alert = function(message, completeCallback, title, buttonLabel) {
	var _title = (title || "Alert");
	var _buttonLabel = (buttonLabel || "OK");
	alert("Title=" + _title + "\nMessage=" + message + "\nButton=" + _buttonLabel);
	if (completeCallback) {
		completeCallback();
	}
};

/**
 * Open a native confirm dialog, with a customizable title and button text.
 * The result that the user selects is returned to the result callback.
 *
 * @param {String} message              Message to print in the body of the alert
 * @param {Function} resultCallback     The callback that is called when user clicks on a button.
 * @param {String} title                Title of the alert dialog (default: Confirm)
 * @param {Array} buttonLabels          Array of the labels of the buttons (default: ['OK', 'Cancel'])
 */
Notification.prototype.confirm = function(message, resultCallback, title, buttonLabels) {
	var _title = (title || "Confirm");
	var _buttonLabels = (buttonLabels || ["OK", "Cancel"]);
	
    if (typeof _buttonLabels === 'string') {
        console.log("Notification.confirm(string, function, string, string) is deprecated.  Use Notification.confirm(string, function, string, array).");
        var buttonLabelString = _buttonLabels;
        _buttonLabels = buttonLabelString.split(",");
    }
    
	var r = confirm("Title=" + _title + "\nMessage="  +message + "\nButtons=" + _buttonLabels);
	if (resultCallback) {
		resultCallback(r);
	}
};

/**
 * Open a native prompt dialog, with a customizable title and button text.
 * The following results are returned to the result callback:
 *  buttonIndex     Index number of the button selected.
 *  input1          The text entered in the prompt dialog box.
 *
 * @param {String} message              Dialog message to display (default: "Prompt message")
 * @param {Function} resultCallback     The callback that is called when user clicks on a button.
 * @param {String} title                Title of the dialog (default: "Prompt")
 * @param {Array} buttonLabels          Array of strings for the button labels (default: ["OK","Cancel"])
 */
Notification.prototype.prompt = function(message, resultCallback, title, buttonLabels) {
    var _message = (message || "Prompt message");
    var _title = (title || "Prompt");
    var _buttonLabels = (buttonLabels || ["OK","Cancel"]);
    var promptResult = prompt("Title=" + _title + "\nMessage=" + _message + "\nButtons=" + _buttonLabels, '');
    if (resultCallback) {
    	var callbackResult = {};
    	if(promptResult) {
    		callbackResult.buttonIndex = 1;
    		callbackResult.input1 = promptResult;
    	} else {
    		callbackResult.buttonIndex = 2;
    	}
		resultCallback(callbackResult);
	}
},

/**
 * Start spinning the activity indicator on the statusbar
 */
Notification.prototype.activityStart = function() {
	_consoleLog("Notification.activityStart()");
	sim_showPopUp("Activity", "Activity started.");

};

/**
 * Stop spinning the activity indicator on the statusbar, if it's currently spinning
 */
Notification.prototype.activityStop = function() {
	_consoleLog("Notification.activityStop()");
	sim_hidePopUp();
};

/**
 * Display a progress dialog with progress bar that goes from 0 to 100.
 *
 * @param {String} title        Title of the progress dialog.
 * @param {String} message      Message to display in the dialog.
 */
Notification.prototype.progressStart = function(title, message) {
	_consoleLog("Notification.progressStart(): Title="+title+" message="+message);
	sim_showPopUp("Progress", "Progress started.<br>Title: "+title+"<br>Message: "+message);
};

/**
 * Set the progress dialog value.
 *
 * @param {Number} value         0-100
 */
Notification.prototype.progressValue = function(value) {
	_consoleLog("Notification.progressValue("+value+")");
	sim_showPopUp("Progress", "Progress value = "+value);
};

/**
 * Close the progress dialog.
 */
Notification.prototype.progressStop = function() {
	_consoleLog("Notification.progressStop()");
	sim_hidePopUp();
};

/**
 * Causes the device to blink a status LED.
 *
 * @param {Integer} count       The number of blinks.
 * @param {String} colour       The colour of the light.
 */
Notification.prototype.blink = function(count, colour) {
	sim_showPopUp("Blink", "Blink "+count+" times with color "+colour+".");
};

/**
 * Causes the device to vibrate.
 *
 * @param {Integer} mills       The number of milliseconds to vibrate for.
 */
Notification.prototype.vibrate = function(mills) {
	alert('Vibrate for ' + mills + ' ms.');
};

/**
 * Causes the device to beep.
 * On Android, the default notification ringtone is played "count" times.
 *
 * @param {Integer} count       The number of beeps.
 */
Notification.prototype.beep = function(count) {
	alert('Beep ' + count + ' times.');
};

Cordova.addConstructor(function() {
    navigator.notification = new Notification();
});

/**
 * Show popup
 * 
 * @param title
 *            The title of the popup
 * @param content
 *            The content of the popup
 */
function sim_showPopUp(title, content){
	var div = _pg_sim_div;
	if (!div) {
		div = document.createElement('div');
		div.innerHTML = '';
		div.style.color = "white";
		div.style.position = "absolute";
		div.style.left = 1 + "px";
		div.style.top = "100px";
		div.style.width = (window.innerWidth - 6) + "px";
		div.style.height = "300px";
		div.style.background = "gray";
		div.style.border = "2px solid white";
		div.style.visibility = "hidden";
		document.body.appendChild(div);
		_pg_sim_div = div;
	}

	div.innerHTML = "<div style='background:darkgray;color:white;font-size:larger;'><center>" + title + "</center></div>" + "<div style='padding:5px;'>" + content + "</div>"
	        + "<div style='position:absolute;bottom:0px;left:0px;width:100%;background:darkgray;text-align:right;'><button onclick='hidePopUp();'>OK</button></div>";
	div.style.visibility = "visible";
}

/**
 * Hide popup
 */
function sim_hidePopUp(){
	if (_pg_sim_div) {
		_pg_sim_div.style.visibility = "hidden";
	}
}

/**
 * Popup div
 */
_pg_sim_div = null;


};
