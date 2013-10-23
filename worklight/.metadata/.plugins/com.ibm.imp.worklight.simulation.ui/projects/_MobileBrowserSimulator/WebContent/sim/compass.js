require(
		[ "dojo/dom", "dijit/registry" ],
		function(dom, registry) {
			addService(
					"Compass",
					function() {
						var currentHeading = rand(360);
						var _sim_compass_timer_is_on = false;
						var inError = 0;
												
						var connectIdWidget = null;
						var connectIdHeading = null;
						var iOsFilters = new Array();

						// Get current heading value
						var getHeading = function() {
							return currentHeading.toFixed(3);
						};

						var getTimeStamp = function() {
							return new Date().getTime();
						};

						var getAccuracy = function() {
							return rand(10) / 10;
						};

						this.getCompassHeading = function() {
							var mh = getHeading();
							var th = getHeading();
							var ha = getAccuracy();
							var ts = getTimeStamp();
							var CompassHeading = function(mh, th, ha, ts) {
								this.magneticHeading = mh;
								this.trueHeading = th;
								this.headingAccuracy = ha;
								this.timestamp = ts;
							};
							return new CompassHeading(mh, th, ha, ts);
						};
						
						this.getCompassErrorCode = function() {
							// generate an error code  randomly.
							var d = new Date();
							return this.code = d.getTime() % 2;
						};
						
						// Public
						// Generate next heading value
						this.nextHeading = function() {
							if (rand(10) > 9)
								currentHeading = rand(360);
							else {
								var r = randRange(20);
								currentHeading += r;
							}
							if (currentHeading <= 0)
								currentHeading += 360;
							if (currentHeading > 360)
								currentHeading -= 360;
							currentHeading = parseFloat(currentHeading);
							sim_compass_heading.set("value", currentHeading.toFixed(3));
							sim_compass_widget.set("value", currentHeading.toFixed(3));
						};

						this.timedCompassUpdate = function() {
							if (_sim_compass_timer_is_on == true) {
								this.nextHeading();
								setTimeout(dojo.hitch(this, this.timedCompassUpdate), 1000);
							}
						};

						this.isTimerStarted = function() {
							return _sim_compass_timer_is_on;
						};

						this.headingValueChanged = function() {
							if (currentHeading.toFixed(3) != parseFloat(
									sim_compass_widget.get("value")).toFixed(3)) {
								currentHeading = parseFloat(sim_compass_widget.get("value"));
								if (currentHeading != parseFloat(sim_compass_heading.get("value")))
									sim_compass_heading.set("value", currentHeading.toFixed(3));
							} else {
								var newValue = parseFloat(sim_compass_heading.get("value"));
								if (isNaN(newValue)) {
									if (sim_compass_heading.get("value") != "")
										sim_compass_heading.set("value", currentHeading);
								} else {
									var resetHeading = false;
									while ((newValue < 0) || (newValue > 360)) {
										if (newValue <= 0)
											newValue += 360;
										if (newValue > 360)
											newValue -= 360;
										resetHeading = true;
									}
									currentHeading = newValue;
									if (resetHeading)
										sim_compass_heading.set("value", currentHeading);
								}
								if (currentHeading != parseFloat(sim_compass_widget.get("value")))
									sim_compass_widget.set("value",	currentHeading.toFixed(3));
								
							}
							for (var uuid in iOsFilters) {
								if ((Math.abs(currentHeading - iOsFilters[uuid].lastValue.magneticHeading) >= iOsFilters[uuid].filter)
									&& (Math.abs(currentHeading - iOsFilters[uuid].lastValue.magneticHeading + 360) >= iOsFilters[uuid].filter)
									&& (Math.abs(currentHeading - iOsFilters[uuid].lastValue.magneticHeading - 360) >= iOsFilters[uuid].filter)) {
									if (inError > 0) {
										inError--;
										this.updateErrorButton();
										sendResult(new PluginResult(
											iOsFilters[uuid].callbackId,
											PluginResultStatus.ERROR,
											this.getCompassErrorCode(),
											true));
										return;
									}
									iOsFilters[uuid].lastValue = this.getCompassHeading();
									sendResult(new PluginResult(
										iOsFilters[uuid].callbackId,
										PluginResultStatus.OK,
										iOsFilters[uuid].lastValue,
										true));
									
								}
							}
						};

						this.startStopTimer = function() {
							if (_sim_compass_timer_is_on == false) {
								_sim_compass_timer_is_on = true;
								this.timedCompassUpdate();
								sim_compass_startStop_button.set("label", n.sim_common_stop);
							} else {
								_sim_compass_timer_is_on = false;
								sim_compass_startStop_button.set("label", n.sim_common_start);
							}

							sim_compass_widget.set("noChange", _sim_compass_timer_is_on);
							sim_compass_heading.set("readOnly", _sim_compass_timer_is_on);
						};

						this.generateError = function() {
							inError++;
							this.updateErrorButton();
						};

						this.updateErrorButton = function() {
							var n = _pg_sim_nls;
							var l = n.sim_compass_error_button;
							if(inError > 0)
								l = l + " " + inError;
							sim_compass_error_button.set("label", l);
						};
						
						// Public
						// Handle requests
						this.exec = function(action, args, callbackId, uuid) {
							switch (action) {
							case 'getHeading':
								var keepCallback = false;
								var platformID = getSimByUUID(uuid).device.platformID;
								var isiOS = platformID.toString().indexOf(".ios.") != -1;
								if ((typeof args !== "undefined") && ( args != null)) {
									if ((typeof args.filter !== "undefined") && ( args.filter != null)) {
										keepCallback = true;
										if (!isiOS) {
											return new PluginResult(callbackId, PluginResultStatus.INVALID_ACTION, 0, keepCallback);
										}
									}
								}
								if (inError > 0) {
									inError--;
									this.updateErrorButton();
									return new PluginResult(callbackId,
											PluginResultStatus.ERROR,
											this.getCompassErrorCode(), keepCallback);
								} else {								
									var r = this.getCompassHeading();
									if (isiOS) {
										if ((typeof args !== "undefined") && ( args != null)) {
											if ((typeof args.filter !== "undefined") && ( args.filter != null)) {
												iOsFilters[uuid] = new Object();
												iOsFilters[uuid].lastValue = r;
												iOsFilters[uuid].filter = args.filter;
												iOsFilters[uuid].callbackId = callbackId;
											}
										}
									}
									return new PluginResult(callbackId, PluginResultStatus.OK, r, keepCallback);
								}
								break;
							case 'stopHeading':
								if ((typeof iOsFilters[uuid] !== "undefined") && (iOsFilters[uuid] != null)) {
									var cbId = iOsFilters[uuid].callbackId;
									delete iOsFilters[uuid];
									// Here we just return results to have the callbackIds removed
									sendResult(new PluginResult(cbId, PluginResultStatus.NO_RESULT, null, false));
								}
								return new PluginResult(callbackId, PluginResultStatus.NO_RESULT, null, false);
								
								break;
							default:
								return new PluginResult(callbackId, PluginResultStatus.INVALID_ACTION);
								break;
							}
						};

						// Initialization
						{
							var n = _pg_sim_nls;
							var l;
							l = dom.byId("sim_compass_heading_label");
							l.innerHTML = n.sim_compass_heading_label;

							sim_compass_next_button.set("label",
									n.sim_compass_next_button);
							sim_compass_startStop_button.set("label",
									n.sim_common_start);
							sim_compass_error_button.set("label",
									n.sim_compass_error_button);
							this.nextHeading();
							connectIdWidget = dojo.connect(
									sim_compass_widget, "onValueChanged", this,
									this.headingValueChanged);
							connectIdHeading = dojo.connect(
									sim_compass_heading, "onKeyUp", this,
									this.headingValueChanged);
						}

					});
		});