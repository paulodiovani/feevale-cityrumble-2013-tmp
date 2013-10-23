require(["dojo/dom", "dijit/registry"], function(dom, registry){
	addService("Battery", function(){

		_consoleLog("add battery service");
		var currentLevel = 90;
		var isPlugged = false;
		this.callbacks = new Array();

		// Get battery info
		var getBatteryInfo = function(){
			var r = {
			    isPlugged : isPlugged,
			    level : currentLevel
			};
			return r;
		};
		
		this.sendResult = function() {
			for (var uuid in this.callbacks) {
				if (getSimByUUID(uuid) == null) {
					delete this.callbacks[uuid];
				} else {
					sendResult(new PluginResult(this.callbacks[uuid], PluginResultStatus.OK, getBatteryInfo(), true));
				}
			}
		}

		// Public
		// Called by UI to send change in battery pluggedIn to device
		this.onChange = function(value){
			_consoleLog("*** ONCHANGE=" + value);
			isPlugged = value;
			this.sendResult(true);	
				
			localStorage.batteryIsPlugged = value;
		};

		// Public
		// Handle requests
		this.exec = function(action, args, callbackId, uuid){
			_consoleLog('Battery exec ' + action + " " + args + " " + callbackId);
			if (action == 'start') {
				this.callbacks[uuid] = callbackId;
				var r = getBatteryInfo();
				return new PluginResult(callbackId, PluginResultStatus.OK, r, true); // keep
				// callback
			} else if (action == 'stop') {
				var r = getBatteryInfo();
				delete this.callbacks[uuid];
				var cb = callbackId;
				callbackId = "";
				return new PluginResult(cb, PluginResultStatus.OK, r, false);
			}
			return new PluginResult(callbackId, PluginResultStatus.INVALID_ACTION);
		};

		// Initialization
		{
			var n = _pg_sim_nls;
			var v = dom.byId("sim_battery_plugedIn_label");
			v.innerHTML = n.sim_battery_plugedIn_label;

			v = dom.byId("sim_battery_batteryLevel_label");
			v.innerHTML = n.sim_battery_batteryLevel_label;

			// Retrieve settings from local storage
			isPlugged = localStorage.batteryIsPlugged === "true";
			currentLevel = localStorage.batteryLevel;
			if (!currentLevel) {
				currentLevel = 90;
			}
			sim_battery_pluggedIn.setChecked(isPlugged);
			
			// Set initial values
			sim_battery_hslider.onChange = dojo.hitch( this, function(value){
				if (value != currentLevel) {
					currentLevel = value;
					sim_battery_batteryLevel.set("value", currentLevel);
					this.sendResult();	
					localStorage.batteryLevel = currentLevel;
				}
			});
			dojo.connect(sim_battery_batteryLevel, "onKeyUp", null, dojo.hitch(this, function() {
				if (sim_battery_batteryLevel.get("value") == "")
					return;
				var newValue = parseInt(sim_battery_batteryLevel.get("value"));
				if (isNaN(newValue)) {
					sim_battery_batteryLevel.set("value", currentLevel);
				} else {
					if (newValue > 100) {
						newValue = 100;
						sim_battery_batteryLevel.set("value", 100);
					}
					if (newValue < 0) {
						newValue = 0;
						sim_battery_batteryLevel.set("value", 0);
					}
					if (currentLevel != newValue) {
						currentLevel = newValue;
						sim_battery_hslider.set("value", currentLevel);
						this.sendResult();	
						localStorage.batteryLevel = currentLevel;
					}


				}
			}));

			sim_battery_hslider.set('value', currentLevel);
			sim_battery_batteryLevel.set('value', currentLevel);
			getBatteryInfo();
		}

	});
});