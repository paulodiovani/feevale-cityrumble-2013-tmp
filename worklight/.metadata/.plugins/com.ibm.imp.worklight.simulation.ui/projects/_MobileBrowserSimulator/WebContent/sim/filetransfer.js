addService("FileTransfer", function(){
	
	// Associative array of source windows to uuids (key is the uuid)
	var sources = new Array();
	
	// Public
	// Handle requests
	this.exec = function(action, args, callbackId, source, uuid){
		try {
			_consoleLog("cordovaFileTransferApplet.exec( " + action + " " + JSON.stringify(args) + " " + callbackId + " " + uuid );
			sources[uuid]=source;
			document.cordovaFileTransferApplet.exec(action, JSON.stringify(args), callbackId, uuid); 
			return; // Nothing is returned as Plugin Results are sent from Java code invoking the Javascript postResult method.
		} catch (e) {
			_consoleLog("ERROR: " + e);
		}
	};
		
	this.postResult = function(resultString, uuid) {
		_consoleLog("Message recieved from FileTransfer applet" + resultString);
		var source = sources[uuid];
		if ((source != null) && (typeof source !== "undefined")) {
			var result = null;
			try {
				result = JSON.parse(resultString);
			} catch (err) {
				_consoleLog(err.message);
				_consoleLog("Error occured while interpreting: " + resultString);
			}
			if (typeof result === 'object') {
				_consoleLog("posting...");
				try {
					source.postMessage(JSON.stringify(result), "*");
				} catch (err) {
					_consoleLog(err.message);
					_consoleLog("Error occured while stringifying: " + resultString);
				}
				_consoleLog("posted...");
			} else {
				source.postMessage(resultString, "*");
			}
		} else {
			_consoleLog("Error in postResult");
		}
	};

	// Initialization
	{
	}
});
