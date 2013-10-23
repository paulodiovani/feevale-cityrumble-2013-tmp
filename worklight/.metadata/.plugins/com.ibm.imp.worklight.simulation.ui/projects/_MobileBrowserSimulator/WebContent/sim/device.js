require(["dojo/dom"], function(dom){
	addService("Device", function(){

		// Currently requested device UUID
		var requestedDeviceUUID = null;
		// Currently displayed device UUID
		var displayedDeviceId = 0;

		/**
		 * Get device properties
		 */
		var getDevice = function(){
			var r = {};
			r.name = "";
			r.platform = "";
			r.version = _pg_sim_nls.sim_device_no_version_info;
			r.uuid = "";
			r.cordova = "2.6";
			r.model = "";
			r.available = true;
			var sim = getSimByUUID(requestedDeviceUUID);
			if (sim != null) {
				r.name = sim.device.name;
				r.model = sim.device.name;
				r.platform = sim.platform.name;
				r.uuid = sim.uuid;
			}
			return r;
		};

		var getDeviceOrient = function(){
			var el = dom.byId("sim_device_deviceOrientForm");
			for ( var i = 0; i < el.deviceOrient.length; i++) {
				if (el.deviceOrient[i].checked) {
					return el.deviceOrient[i].value;
				}
			}
		};

		/**
		 * Restore settings from storage
		 */
		this.setDevice = function(){
			var model = "";
			var platform = "";
			var version = "";
			var uuid = "";
			var width = "";
			var height = "";
			var isRotated = false;
			var cordova = "";
			if (displayedDeviceId < 0)
				displayedDeviceId = 0;
			if (displayedDeviceId >= sims.length)
				displayedDeviceId = sims.length - 1;
			
			if ((displayedDeviceId == 0) || (sims.length == 0))
				sim_device_previous_button.setAttribute('disabled', true);
			else
				sim_device_previous_button.setAttribute('disabled', false);
			
			if (displayedDeviceId == sims.length - 1)
				sim_device_next_button.setAttribute('disabled', true);
			else
				sim_device_next_button.setAttribute('disabled', false);
			
			var sim = sims[displayedDeviceId];
			if (sim != null) {
				model = sim.device.name;
				platform = sim.platform.name;
				version = "No version info";
				uuid = sim.uuid;
				width = sim.device.width;
				height = sim.device.height;
				isRotated = sim.isRotated;
				cordova = "2.6";
			}
			sim_device_name.set("value", model);
			sim_device_platform.set("value", platform);
			sim_device_version.set("value", version);
			sim_device_uuid.set("value", uuid);
			sim_device_deviceWidth.set("value", width);
			sim_device_deviceHeight.set("value", height);
			dom.byId("sim_device_deviceOrientProfile").checked = !isRotated;
			dom.byId("sim_device_deviceOrientLandscape").checked = isRotated;
			sim_device_cordova.set("value", cordova);
			this.setDeviceSize();
		};

		/**
		 * Restore settings from storage
		 */
		this.nextDevice = function(){
			displayedDeviceId++;
			this.setDevice();
		};

		/**
		 * Restore settings from storage
		 */
		this.previousDevice = function(){
			displayedDeviceId--;
			this.setDevice();
		};

		/**
		 * Public Size has changed in UI
		 */
		this.setDeviceSize = function(){
			_consoleLog("setDeviceSize()");
			// New values
			var width = sim_device_deviceWidth.get("value");
			var height = sim_device_deviceHeight.get("value");
			var orient = getDeviceOrient();

			// Current values
			var simulator = dojo.byId("simulator");
			var simheader = dojo.byId("simheader");
			if (!simulator)
				return;
			var curWidth = simulator.simWidth;
			var curHeight = simulator.simHeight;
			var curOrient = simulator.simOrient;
			_consoleLog("w,h=" + width + "," + height + "  cur w,h=" + curWidth + "," + curHeight);

			// If orientation changed, then we need to fire event
			var fireOrient = false;
			if (curOrient && curOrient != orient) {
				fireOrient = true;
			}

			// If changed, then update
			if ((curWidth != width) || (curHeight != height) || (orient != curOrient)) {
				simulator.simWidth = width;
				simulator.simHeight = height;
				simulator.simOrient = orient;
				if (orient === 'p') {
					simulator.style.width = width + "px";
					simulator.style.height = height + "px";
					simheader.style.width = width + "px";
				} else {
					simulator.style.width = height + "px";
					simulator.style.height = width + "px";
					simheader.style.width = height + "px";
				}
				this.saveDevice();
			}
			simulator.style.visibility = "visible";

			// Fire orientation event
			if (fireOrient) {
				fireEvent("orientation");
			}
		};

		/**
		 * Public Save settings to storage
		 */
		this.saveDevice = function(){
			_consoleLog("saveDevice()");
		};

		// Public
		// Handle requests
		this.exec = function(action, args, callbackId){
			if (action == 'getDeviceInfo') {
				var r = getDevice();
				return new PluginResult(callbackId, PluginResultStatus.OK, r, false);
			}
			return new PluginResult(callbackId, PluginResultStatus.INVALID_ACTION);
		};

		this.setRequestedDeviceUUID = function(uuid){
			requestedDeviceUUID = uuid;
		};

		// Initialization
		{
			var n = _pg_sim_nls;
			dom.byId('sim_device_select_label').innerHTML = n.sim_device_select_label;
			
			sim_device_previous_button.set("label", n.sim_device_prev_button);
			sim_device_next_button.set("label", n.sim_device_next_button);
			
			this.setDevice();
		}

	});
});