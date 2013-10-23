require(["dojo/dom"], function(dom){
	addService("Network Status", function(){

		this.TYPE_UNKNOWN = "unknown";
		this.TYPE_ETHERNET = "ethernet";
		this.TYPE_WIFI = "wifi";
		this.TYPE_2G = "2g";
		this.TYPE_3G = "3g";
		this.TYPE_4G = "4g";
		this.TYPE_CELL = "cellular";
		this.TYPE_NONE = "none";

		var currentState = "offline";
		var callbacks = new Array();

		// Get network selected in UI
		var getNetwork = function(){
			var el = dom.byId("networkForm");
			for ( var i = 0; i < el.networkType.length; i++) {
				if (el.networkType[i].checked) {
					var value = el.networkType[i].value;
					if (value == "none") {
						currentState = "offline";
					} else {
						currentState = "online";
					}
					return el.networkType[i].value;
				}
			}
		};

		// Public
		// Called by UI to send change in network status to device
		this.onChange = function(value){
			for ( var i = 0; i < callbacks.length; i++) {
				sendResult(new PluginResult(callbacks[i], PluginResultStatus.OK, value, true));
			}
		};

		// Public
		// Handle requests
		this.exec = function(action, args, callbackId){
			if (action == 'getConnectionInfo') {
				callbacks.push(callbackId);
				var r = getNetwork();
				return new PluginResult(callbackId, PluginResultStatus.OK, r, true); // keep
																						// callback
			}
			return new PluginResult(callbackId, PluginResultStatus.INVALID_ACTION);
		};

		// Initialization
		{
			var n = _pg_sim_nls;
			dom.byId('sim_network_none').innerHTML = n.sim_network_none;
			dom.byId('sim_network_ethernet').innerHTML = n.sim_network_ethernet;
			dom.byId('sim_network_wifi').innerHTML = n.sim_network_wifi;
			dom.byId('sim_network_2g').innerHTML = n.sim_network_2g;
			dom.byId('sim_network_3g').innerHTML = n.sim_network_3g;
			dom.byId('sim_network_4g').innerHTML = n.sim_network_4g;
			dom.byId('sim_network_cell').innerHTML = n.sim_network_cell;
			dom.byId('sim_network_unknown').innerHTML = n.sim_network_unknown;
			
			getNetwork();
		}
	});
});
