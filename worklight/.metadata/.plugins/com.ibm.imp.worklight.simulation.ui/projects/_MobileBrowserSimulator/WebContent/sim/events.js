require(["dojo/dom"], function(dom){
	addService("Events", function(){

		// Public
		// Handle requests
		this.exec = function(action, args, callbackId){
			_consoleLog("Events." + action + "()");
			// return new PluginResult(callbackId, PluginResultStatus.OK, "", false);
			return new PluginResult(callbackId, PluginResultStatus.INVALID_ACTION);
		};

		// Initialization
		{
			var n = _pg_sim_nls;
			sim_events_pause_button.set("label",  n.sim_events_pause_button);
			sim_events_resume_button.set("label", n.sim_events_resume_button);
			sim_events_back_button.set("label", n.sim_events_back_button);
			sim_events_menu_button.set("label", n.sim_events_menu_button);
			sim_events_search_button.set("label", n.sim_events_search_button);
			sim_events_online_button.set("label", n.sim_events_online_button);
			sim_events_offline_button.set("label", n.sim_events_offline_button);
			
			sim_events_startCall_button.set("label", n.sim_events_startCall_button);
			sim_events_endCall_button.set("label", n.sim_events_endCall_button);
			
			sim_events_volumeUp_button.set("label", n.sim_events_volumeUp_button);
			sim_events_volumeDown_button.set("label", n.sim_events_volumeDown_button);
			
		}
	});
});
