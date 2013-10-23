require(["dojo/dom", "dijit/registry"], function(dom, registry){

	addService("Accelerometer", function(){
		var _accelIncr = 2;
		var _accelMax = 10;

		var changeAccel = function(){
			var ax = dom.byId("accelX");
			var x = parseFloat(ax.value);
			var ay = dom.byId("accelY");
			var y = parseFloat(ay.value);
			var az = dom.byId("accelZ");
			var z = parseFloat(az.value);

			if (x)
				x += randRange(_accelIncr);
			else
				x = randRange(2 * _accelMax);
			if (y)
				y += randRange(_accelIncr);
			else
				y = randRange(2 * _accelMax);
			if (z)
				z += randRange(_accelIncr);
			else
				z = randRange(2 * _accelMax);

			if (x > _accelMax)
				x = _accelMax;
			if (x < -_accelMax)
				x = -_accelMax;

			if (y > _accelMax)
				y = _accelMax;
			if (y < -_accelMax)
				y = -_accelMax;

			if (z > _accelMax)
				z = _accelMax;
			if (y < -_accelMax)
				y = -_accelMax;

			ay.value = y.toFixed(3);
			ax.value = x.toFixed(3);
			az.value = z.toFixed(3);
		};

		// Get current acceleration values
		var getAcceleration = function(){
			_consoleLog("--- getAcceleration()");
			var r = {};
			r.x = parseFloat(dom.byId("accelX").value);
			r.y = parseFloat(dom.byId("accelY").value);
			r.z = parseFloat(dom.byId("accelZ").value);
			r.timestamp = new Date().getTime();
			return r;
		};

		// Public
		// Generate next acceleration values
		this.nextAccel = function(){
			_consoleLog("--- nextAccel()");
			changeAccel();
		};

		var _sim_accel_timer_is_on = false;

		var timedAccelUpdate = function(){
			if (_sim_accel_timer_is_on == true) {
				changeAccel();
				setTimeout(timedAccelUpdate, 1000);
			}
		};

		this.startStopTimer = function(){
			if (_sim_accel_timer_is_on == false) {
				_sim_accel_timer_is_on = true;
				timedAccelUpdate();
				sim_accelerometer_startStop_button.set("label", n.sim_common_stop);
			} else {
				_sim_accel_timer_is_on = false;
				sim_accelerometer_startStop_button.set("label", n.sim_common_start);

			}
		};

		// Public
		// Handle requests
		this.exec = function(action, args, callbackId){
			if (action == 'getAcceleration') {
				var r = getAcceleration();
				return new PluginResult(callbackId, PluginResultStatus.OK, r, false);
			}
			return new PluginResult(callbackId, PluginResultStatus.INVALID_ACTION);
		};

		// Initialization
		{
			var n = _pg_sim_nls;
			var v = dom.byId("sim_accelerometer_accelX_label");
			v.innerHTML = n.sim_accelerometer_accelX_label;

			var v = dom.byId("sim_accelerometer_accelY_label");
			v.innerHTML = n.sim_accelerometer_accelY_label;

			var v = dom.byId("sim_accelerometer_accelZ_label");
			v.innerHTML = n.sim_accelerometer_accelZ_label;

			sim_accelerometer_nextAccel_button.set("label", n.sim_accelerometer_nextAccel_button);

			sim_accelerometer_startStop_button.set("label", n.sim_common_start);

			this.nextAccel();
		}
	});
});