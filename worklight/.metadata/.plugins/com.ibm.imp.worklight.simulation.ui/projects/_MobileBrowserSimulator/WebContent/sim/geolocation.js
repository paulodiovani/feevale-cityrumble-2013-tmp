var addGeolocFunction = function(dom, connect, html, has, domConstruct, domGeom, lang,
					  domStyle, registry, WidgetFeature, GfxLayer, GeometryFeature, Point) {
	var runningId = null;

	this.inError = 0;

	this.latChangeId = null;
	this.lonChangeId = null;
	this.headChangeId = null;
	this.compassChangeId = null;

	this.latKeyUpId = null;
	this.lonKeyUpId = null;
	this.accKeyUpId = null;
	this.altKeyUpId = null;
	this.altAccKeyUpId = null;
	this.headKeyUpId = null;
	this.velKeyUpId = null;

	this.widgetFeature = null;
	this.compass = null;
	
	this.latitude = 48.858242;
	this.longitude = 2.294521;
	this.accuracy = rand(100, 1);
	this.altitude = rand(10000, 1);
	this.heading = rand(360, 0);
	this.speed = rand(100, 2);
	this.altitudeAccuracy = 1;
	this.stepToNextLL = 0.2;

	this.getPositionError = function(code, msg) {
		var PositionError = function(e, m) {
			if (e == null) {
				// if the error is not provided, then we generate one randomly.
				var d = new Date();
				this.code = 1 + d.getTime() % 3;
			} else {
				this.code = e;
			}
			if (m == null) {
				if (this.code == 1)
					this.message = "Permission Denied.";
				else if (this.code == 2)
					this.message = "Position unavailable.";
				else if (this.code == 3)
					this.message = "Time out.";
				else
					this.message = "Unknown error.";
			} else {
				this.message = m;
			}
		};
		return new PositionError(code, msg);
	};

	// Get current geolocation values
	this.getGeolocation = function() {
		var Coordinates = function(latitude, longitude,
				altitude, accuracy, altitudeAccuracy,
				heading, speed) {
			this.latitude = latitude;
			this.longitude = longitude;
			this.altitude = altitude;
			this.accuracy = accuracy;
			this.altitudeAccuracy = altitudeAccuracy;
			this.heading = heading;
			this.speed = speed;
		};
		var r = new Coordinates(this.latitude,
				this.longitude, this.altitude,
				this.accuracy, this.altitudeAccuracy,
				this.heading, this.speed);
		var Position = function(c, t) {
			this.coords = c; // Coordinates
			this.timestamp = t;
		};
		var d = new Date();
		var t = d.getTime();
		return new Position(r, t);
	};

	this.updateMap = function() {
		var map = registry.byId('geolocationMap');
		if (map) {
			map = map.map;
			var from = dojox.geo.openlayers.EPSG4326;
			var to = map.olMap.getProjectionObject();
			var lon = parseFloat(this.longitude);
			var lat = parseFloat(this.latitude);
			var p = {
					x : lon,
					y : lat
			};
			OpenLayers.Projection.transform(p, from, to);
			map.olMap.setCenter(new OpenLayers.LonLat(p.x, p.y));
			
			if (typeof map._customGeometryLayer === "undefined") {
				// create a GfxLayer
				map._customGeometryLayer = new GfxLayer();
				// add layer to the map
    			map.addLayer(map._customGeometryLayer);
			}
			
			if (typeof map._customGeometryFeature !== "undefined") {
				map._customGeometryLayer.removeFeature(map._customGeometryFeature);
			}
			// create a GeometryFeature
    		var centerPoint = new Point({x:lon, y:lat});
			map._customGeometryFeature = new GeometryFeature(centerPoint);
			// set the shape properties, fill and stroke
			map._customGeometryFeature.setFill([ 255, 0, 0 ]);
			map._customGeometryFeature.setStroke([ 0, 0, 0 ]);
			map._customGeometryFeature.setShapeProperties({
			  r : 5
			});
			// add the feature to the layer
			map._customGeometryLayer.addFeature(map._customGeometryFeature);
    		
		}
		if (this.compass)
			this.compass.set("value", this.heading);

	};

	this.updateMap = function() {
		var map = registry.byId('geolocationMap');
		if (map) {
			map = map.map;
			var from = dojox.geo.openlayers.EPSG4326;
			var to = map.olMap.getProjectionObject();
			var lon = parseFloat(this.longitude);
			var lat = parseFloat(this.latitude);
			var p = {
					x : lon,
					y : lat
			};
			OpenLayers.Projection.transform(p, from, to);
			map.olMap.setCenter(new OpenLayers.LonLat(p.x, p.y));
		}
		if (this.compass)
			this.compass.set("value", this.heading);
	};
	
	this.updateMapCenterShape = function() {
		var map = registry.byId('geolocationMap');
		if (map) {
			map = map.map;
			if (typeof map._customGeometryLayer === "undefined") {
				// create a GfxLayer
				map._customGeometryLayer = new GfxLayer();
				// add layer to the map
				map.addLayer(map._customGeometryLayer);
			}

			if (typeof map._customGeometryFeature !== "undefined") {
				// Remove previously existing GeometryFeature
				map._customGeometryLayer.removeFeature(map._customGeometryFeature);
			}
			// create a GeometryFeature
			var lon = parseFloat(this.longitude);
			var lat = parseFloat(this.latitude);
			var centerPoint = new Point({x:lon, y:lat});
			map._customGeometryFeature = new GeometryFeature(centerPoint);
			// set the shape properties, fill and stroke
			map._customGeometryFeature.setFill([ 255, 0, 0 ]);
			map._customGeometryFeature.setStroke([ 0, 0, 0 ]);
			map._customGeometryFeature.setShapeProperties({
			  r : 5
			});
			// add the feature to the layer
			map._customGeometryLayer.addFeature(map._customGeometryFeature);
			map._customGeometryLayer.redraw();
		}
	};

	this.updateUI = function(map) {
		if (this.latitude != parseFloat(sim_geoloc_geoLat.get("value")))
			sim_geoloc_geoLat.set("value", this.latitude);
		if (this.longitude != parseFloat(sim_geoloc_geoLng.get("value")))
			sim_geoloc_geoLng.set("value", this.longitude);
		if (this.altitude != parseFloat(sim_geoloc_geoAlt.get("value")))
			sim_geoloc_geoAlt.set("value", this.altitude);
		if (this.accuracy != parseFloat(sim_geoloc_geoAcc.get("value")))
			sim_geoloc_geoAcc.set("value", this.accuracy);
		if (this.altitudeAccuracy != parseFloat(sim_geoloc_geoAltAcc.get("value")))
			sim_geoloc_geoAltAcc.set("value",this.altitudeAccuracy);
		if (this.heading != parseFloat(sim_geoloc_geoHead.get("value")))
			sim_geoloc_geoHead.set("value", this.heading);
		if (this.speed != parseFloat(sim_geoloc_geoVel.get("value")))
			sim_geoloc_geoVel.set("value", this.speed);
		if (map)
			this.updateMap();
		this.updateMapCenterShape();
			
	};

	this.nextLoc = function() {
		var ret = {
				latitude : this.nextLatitude(),
				longitude : this.nextLongitude(),
				altitude : this.nextAltitude()
		};
		return ret;
	};

	this.nextAltitude = function() {
		var a = parseFloat(this.altitude);
		a += randRange(this.stepToNextLL, 2);
		if (a > 10000)
			a = a - 10000;
		if (a < -0)
			a += a;
		return parseFloat(a.toFixed(2));
	};

	this.nextLatitude = function() {
		var l = parseFloat(this.latitude);
		l += randRange(this.stepToNextLL, 2);
		if (l > 90)
			l = l - 90;
		if (l < -90)
			l += 90;
		return parseFloat(l.toFixed(2));
	};

	this.nextLongitude = function() {
		var l = parseFloat(this.longitude);
		l += randRange(this.stepToNextLL, 2);
		if (l > 180)
			l = l - 180;
		if (l < -180)
			l += 180;
		return parseFloat(l.toFixed(2));
	};

	this.nextHeading = function() {
		if (!this.heading || rand(10) > 9)
			this.heading = rand(360);
		else {
			var r = randRange(20);
			this.heading += r;
		}
		if (this.heading <= 0)
			this.heading += 360;
		if (this.heading > 360)
			this.heading -= 360;
		this.heading = parseFloat(this.heading.toFixed(3));

		if (this.compass) {
			if (this.compassChangeId == null) {
				this.compassChangeId = dojo
				.connect(
						this.compass,
						"onValueChanged",
						null,
						dojo
						.hitch(
								this,
								function() {
									if (this.heading != parseFloat(this.compass.get("value"))) {
										this.heading = parseFloat(parseFloat(
												this.compass.get("value")).toFixed(3));
										if (this.heading != parseFloat(sim_geoloc_geoHead.get("value"))) {
											sim_geoloc_geoHead.set(
													"value",
													parseFloat(this.heading).toFixed(3));
											this.updateGeolocation(false);
										}
									}
								}));
			}
			this.compass.set("value", this.heading);
		}
	};

	this.onLatChange = function() {
		var newValue = parseFloat(sim_geoloc_geoLat
				.get("value"));
		if (isNaN(newValue)) {
			if ((sim_geoloc_geoLat.get("value") != "-")
					&& (sim_geoloc_geoLat.get("value") != ""))
				sim_geoloc_geoLat.set("value", this.latitude);
		} else {
			if (newValue != this.latitude) {
				this.latitude = newValue;
				this.updateMap();
				this.updateGeolocation(false);
			}
		}
	};

	this.onLonChange = function() {
		var newValue = parseFloat(sim_geoloc_geoLng.get("value"));
		if (isNaN(newValue)) {
			if ((sim_geoloc_geoLng.get("value") != "-")
					&& (sim_geoloc_geoLng.get("value") != ""))
				sim_geoloc_geoLng.set("value", this.longitude);
		} else {
			if (newValue != this.longitude) {
				this.longitude = newValue;
				this.updateMap();
				this.updateGeolocation(false);
			}
		}
	};

	this.onHeadChange = function() {
		var newValue = parseFloat(sim_geoloc_geoHead.get("value"));
		if (isNaN(newValue)) {
			if (sim_geoloc_geoHead.get("value") != "")
				sim_geoloc_geoHead.set("value", this.heading);
		} else {
			var resetHeading = false;
			while ((newValue < 0) || (newValue > 360)) {
				if (newValue <= 0)
					newValue += 360;
				if (newValue > 360)
					newValue -= 360;
				resetHeading = true;
			}
			if (resetHeading)
				sim_geoloc_geoHead.set("value", newValue);
			if (newValue != this.heading) {
				this.heading = newValue;
				this.updateMap();
				if (this.compass)
					this.compass.set("value", this.heading);
				this.updateGeolocation(false);
			}
		}
	};

	this.onAccChange = function() {
		var newValue = parseFloat(sim_geoloc_geoAcc
				.get("value"));
		if (isNaN(newValue)) {
			if (sim_geoloc_geoAcc.get("value") != "")
				sim_geoloc_geoAcc.set("value",
						this.accuracy);
		} else {
			if (newValue != this.accuracy) {
				this.accuracy = newValue;
				this.updateGeolocation(false);
			}
		}
	};

	this.onAltChange = function() {
		var newValue = parseFloat(sim_geoloc_geoAlt
				.get("value"));
		if (isNaN(newValue)) {
			if ((sim_geoloc_geoAlt.get("value") != "-")
					&& (sim_geoloc_geoAlt.get("value") != ""))
				sim_geoloc_geoAlt.set("value", this.altitude);
		} else {
			if (newValue != this.altitude) {
				this.altitude = newValue;
				this.updateGeolocation(false);
			}
		}
	};

	this.onAltAccChange = function() {
		var newValue = parseFloat(sim_geoloc_geoAltAcc.get("value"));
		if (isNaN(newValue)) {
			if (sim_geoloc_geoAltAcc.get("value") != "")
				sim_geoloc_geoAltAcc.set("value", this.altitudeAccuracy);
		} else {
			if (newValue != this.altitudeAccuracy) {
				this.altitudeAccuracy = newValue;
				this.updateGeolocation(false);
			}
		}
	};

	this.onVelChange = function() {
		var newValue = parseFloat(sim_geoloc_geoVel.get("value"));
		if (isNaN(newValue)) {
			if (sim_geoloc_geoVel.get("value") != "")
				sim_geoloc_geoVel.set("value", this.speed);
		} else {
			if (newValue != this.speed) {
				this.speed = newValue;
				this.updateGeolocation(false);
			}
		}
	};

	// Public
	// Generate next geolocation values
	this.nextGeolocation = function() {
		var hasFF = has("ff") || (typeof window.navigator.originalUserAgent !== "undefined");
		if (hasFF) {
			var n = _pg_sim_nls;
			var parentNode = dom.byId("geoloc");
			domConstruct.empty(parentNode);
			parentNode.innerHTML = n.sim_geoloc_usingFFgeolocation;
		} else {
			var ll = this.nextLoc();
			this.latitude = ll.latitude;
			this.longitude = ll.longitude;
			this.accuracy = rand(100, 1);
			this.altitude = ll.altitude;
			this.altitudeAccuracy = 1;
			this.nextHeading();
			this.speed = rand(100, 2);

			if (this.latChangeId == null) {
				this.latKeyUpId = dojo.connect(
						sim_geoloc_geoLat,
						"onKeyUp",
						null,
						dojo.hitch(this, this.onLatChange));
				this.latChangeId = dojo.connect(
						sim_geoloc_geoLat,
						"onChange",
						null,
						dojo.hitch(this, this.onLatChange));
			}
			if (this.lonChangeId == null) {
				this.lonKeyUpId = dojo.connect(
						sim_geoloc_geoLng,
						"onKeyUp",
						null,
						dojo.hitch(this, this.onLonChange));
				this.lonChangeId = dojo.connect(
						sim_geoloc_geoLng,
						"onChange",
						null,
						dojo.hitch(this, this.onLonChange));
			}
			if (this.headChangeId == null) {
				this.headKeyUpId = dojo.connect(
						sim_geoloc_geoHead,
						"onKeyUp",
						null,
						dojo.hitch(this, this.onHeadChange));
				this.headChangeId = dojo.connect(
						sim_geoloc_geoHead,
						"onChange",
						null,
						dojo.hitch(this, this.onHeadChange));
			}
			if (this.accKeyUpId == null) {
				this.accKeyUpId = dojo.connect(
						sim_geoloc_geoAcc,
						"onKeyUp",
						null,
						dojo.hitch(this, this.onAccChange));
			}
			if (this.altKeyUpId == null) {
				this.altKeyUpId = dojo.connect(
						sim_geoloc_geoAlt,
						"onKeyUp",
						null,
						dojo.hitch(this, this.onAltChange));
			}
			if (this.altAccKeyUpId == null) {
				this.altAccKeyUpId = dojo.connect(
						sim_geoloc_geoAltAcc,
						"onKeyUp",
						null,
						dojo.hitch(this, this.onAltAccChange));
			}
			if (this.velKeyUpId == null) {
				this.velAccKeyUpId = dojo.connect(
						sim_geoloc_geoVel,
						"onKeyUp",
						null,
						dojo.hitch(this, this.onVelChange));
			}

			this.updateUI(true);
		}
	};

	// Public
	// Update geolocation and send to device
	this.updateGeolocation = function(newVal) {
		if (newVal == true)
			this.nextGeolocation();
		var loc = this.getGeolocation();

		// Send update to device if geolocation watch is
		// running
		if (runningId !== null) {
			if (this.inError > 0) {
				this.inError--;
				this.updateErrorButton();
				sendResult(
						new PluginResult(runningId,
								PluginResultStatus.ERROR,
								this.getPositionError(), true));
				return;
			}
			var r = new PluginResult(runningId,
					PluginResultStatus.OK, loc, true);
			sendResult(r);
		}
	};

	var _sim_geoloc_timer_is_on = false;

	this.timedGeolocUpdate = function() {
		if (_sim_geoloc_timer_is_on == true) {
			this.updateGeolocation(true);
			setTimeout(lang.hitch(this,	this.timedGeolocUpdate), 1000);
		}
	};

	this.startStopTimer = function() {
		if (_sim_geoloc_timer_is_on == false) {
			_sim_geoloc_timer_is_on = true;
			this.timedGeolocUpdate();
			sim_geoloc_startStop_button.set("label", n.sim_common_stop);
		} else {
			_sim_geoloc_timer_is_on = false;
			sim_geoloc_startStop_button.set("label", n.sim_common_start);
		}
	};

	this.generateError = function() {
		this.inError++;
		this.updateErrorButton();
	};

	this.updateErrorButton = function() {
		var n = _pg_sim_nls;
		var l = n.sim_common_error_button;
		if (this.inError > 0)
			l = l + " " + this.inError;
		sim_geoloc_error_button.set("label", l);
	};

	// Public
	// Handle requests
	this.exec = function(action, args, callbackId) {
		var r = this.getGeolocation();

		if (action == 'getCurrentLocation') {
			if (this.inError > 0) {
				this.inError--;
				this.updateErrorButton();
				return new PluginResult(callbackId,
						PluginResultStatus.ERROR,
						this.getPositionError(), false);
			}
			return new PluginResult(callbackId,	PluginResultStatus.OK, r, false);
		} else if (action == 'start') { // watch location
			runningId = callbackId;
			if (this.inError > 0) {
				this.inError--;
				this.updateErrorButton();
				return new PluginResult(callbackId,
						PluginResultStatus.ERROR,
						this.getPositionError(), true);
			}
			return new PluginResult(callbackId,
					PluginResultStatus.OK, r, true); // keep
			// callbackId
		} else if (action == 'stop') { // stop watching
			runningId = null;
			if (this.inError > 0) {
				this.inError--;
				this.updateErrorButton();
				return new PluginResult(callbackId,
						PluginResultStatus.ERROR,
						this.getPositionError(), false);
			}
			return new PluginResult(callbackId,
					PluginResultStatus.OK, r, false);
		}
		return new PluginResult(callbackId,
				PluginResultStatus.INVALID_ACTION);
	};

	this.createWidget = function() {
		that.compass = compass;
		return div;
	};

	// Initialization
	{
		var n = _pg_sim_nls;
		dom.byId('sim_geoloc_latitude_label').innerHTML = n.sim_geoloc_latitude_label;
		dom.byId('sim_geoloc_longitude_label').innerHTML = n.sim_geoloc_longitude_label;
		dom.byId('sim_geoloc_accuracy_label').innerHTML = n.sim_geoloc_accuracy_label;
		dom.byId('sim_geoloc_altitude_label').innerHTML = n.sim_geoloc_altitude_label;
		dom.byId('sim_geoloc_altitudeAccuracy_label').innerHTML = n.sim_geoloc_altitudeAccuracy_label;
		dom.byId('sim_geoloc_heading_label').innerHTML = n.sim_geoloc_heading_label;
		dom.byId('sim_geoloc_velocity_label').innerHTML = n.sim_geoloc_velocity_label;
		sim_geoloc_next_button.set("label",
				n.sim_geoloc_next_button);
		sim_geoloc_startStop_button.set("label",
				n.sim_common_start);
		this.updateErrorButton();
		if (window.mbsOpenLayersAvailable == true) {
			var longitude = 2.294521;
			var latitude = 48.858242;
			var map = new dojox.geo.openlayers.widget.Map({
				initialLocation : {
					position : [ longitude, latitude ],
					extent : 2
				},
				id : "geolocationMap"
			}, "geolocationMapDiv");
			domStyle.set(map.domNode, {
				width : 100 + "%",
				height : 200 + "px"
			});
			map.startup();
			var control = new OpenLayers.Control({
				autoActivate : true
			});
			var that = this;
			OpenLayers.Util.extend(
				control,
				{
					chartSize : 70,
					draw : function(px) {
						OpenLayers.Control.prototype.draw.apply(this, arguments);
						if (!this._element) {
							var div = dojo.create(
									"div",
									{
										unselectable : "on",
										style : {
											position : "absolute",
											bottom : "0px",
											right : "0px",
										}
									},
									this.div);
							that.compass = new widgets.Compass(
									{
										background : [
													  10,
													  20,
													  200,
													  0 ],
										color : [
												   0x20,
												   0x20,
												   0x20 ],
										title : 'Heading',
										width : this.chartSize,
										height : this.chartSize,
										min : 0,
										max : 360,
										majorTicksInterval : 30,
										startAngle : 0,
										endAngle : 360,
										value : 0,
										textIndicatorFont : 'normal normal normal 7pt calibri,Helvetica,Arial,sans-serif',
										font : 'normal normal normal 4pt calibri,Helvetica,Arial,sans-serif',
										id : "compassWidget"
									}, div);
							that.compass.startup();
							this._element = div;
							this.map.events.register(
									'moveend',
									this,
									this.update);
							return div;
						}
					}
				});

			map.map.olMap.addControl(control);
			control.activate(true);
			// control.moveTo(10, 10);
			connect.connect(
					map.map.olMap,
					"setCenter",
					this,
					function(center, zoom,
							dragging,
							forceZoomChange) {
						if (dragging) {
							return;
						}
						var from = map.map.olMap
						.getProjectionObject();
						var to = dojox.geo.openlayers.EPSG4326;
						var p = {
								x : center.lon,
								y : center.lat
						};
						OpenLayers.Projection
						.transform(p, from,
								to);
						this.longitude = parseFloat(p.x
								.toFixed(2));
						this.latitude = parseFloat(p.y
								.toFixed(2));
						this.updateUI(false);
					});
		}

		this.nextGeolocation();
	}
};


if (window.mbsOpenLayersAvailable == true) {
	require(
			[ "dojo/dom", "dojo/_base/connect", "dojo/_base/html", "dojo/has",
			  "dojo/dom-construct", "dojo/dom-geometry", "dojo/_base/lang",
			  "dojo/dom-style", "dijit/registry",
			  "dojox/geo/openlayers/WidgetFeature", "dojox/geo/openlayers/GfxLayer",
			  "dojox/geo/openlayers/GeometryFeature", "dojox/geo/openlayers/Point"  ],
			  function(dom, connect, html, has, domConstruct, domGeom, lang,
					  domStyle, registry, WidgetFeature, GfxLayer, GeometryFeature, Point) {
				addService(
					"Geolocation",
					function() {
						var hitchedInit = dojo.hitch(this, addGeolocFunction, dom, connect, html, has, domConstruct, domGeom, lang, domStyle, registry, WidgetFeature, GfxLayer, GeometryFeature, Point);
						hitchedInit();
					});
			});
} else {
	require(
			[ "dojo/dom", "dojo/_base/connect", "dojo/_base/html", "dojo/has",
			  "dojo/dom-construct", "dojo/dom-geometry", "dojo/_base/lang",
			  "dojo/dom-style", "dijit/registry" ],
			  function(dom, connect, html, has, domConstruct, domGeom, lang,
					  domStyle, registry) {
				addService(
					"Geolocation",
					function() {
						var hitchedInit = dojo.hitch(this, addGeolocFunction, dom, connect, html, has, domConstruct, domGeom, lang, domStyle, registry);
						hitchedInit();
					});
			});
}