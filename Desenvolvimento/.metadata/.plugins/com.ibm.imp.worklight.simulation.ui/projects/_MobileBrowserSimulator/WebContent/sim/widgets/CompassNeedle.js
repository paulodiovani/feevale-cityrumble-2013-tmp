define(["dojo/_base/declare", "dojo/_base/Color", "dojox/gauges/AnalogIndicatorBase"], 
		function(declare, Color, AnalogIndicatorBase){

	/*
	 * ===== AnalogIndicatorBase = dojox.gauges.AnalogIndicatorBase; =====
	 */

	return declare("widgets.CompassNeedle", [AnalogIndicatorBase], {
	    // summary:
	    // The needle for the dojox.gauges.GlossyCircularGauge and
	    // dojox.gauges.GlossySemiCircularGauge.
	    // description:
	    // This object defines the needle for the
	    // dojox.gauges.GlossyCircularGauge and
	    // dojox.gauges.GlossySemiCircularGauge.
	    // Since the needle is created by the gauges class, you do not have to
	    // use this class directly.

	    interactionMode : "gauge",

	    // color: String
	    // The color of the indicator.
	    // color: '#c40000',

	    _getShapes : function(group){
		    // summary:
		    // Overrides AnalogIndicatorBase._getShapes

		    if (!this._gauge)
			    return null;

		    var shapes = [];
		    var scale = Math.min((this._gauge.width / this._gauge._designWidth), (this._gauge.height / this._gauge._designHeight));

		    var makeShape = function(path, color){
			    var g = group.createGroup();
			    shapes.push(g);
			    g.createGroup().setTransform({
			        xx : scale,
			        xy : 0,
			        yx : 0,
			        yy : scale,
			        dx : 0,
			        dy : 0
			    });
			    var p = g.children[0].createPath({
				    path : path
			    });
			    if (color.type) {
				    p.setFill(color).setStroke({
				        color : Color.blendColors(new Color(color.colors[2]), new Color('black'), 0.8),
				        width : 1,
				        style : "Solid",
				        cap : "butt",
				        join : 20.0
				    });
			    } else {
				    p.setFill(color).setStroke({
				        color : Color.blendColors(new Color(color), new Color('black'), 0.8),
				        width : 1,
				        style : "Solid",
				        cap : "butt",
				        join : 20.0
				    });
			    }
		    };
		    var ga = {
		        type : "linear",
		        x1 : -20,
		        y1 : -140,
		        x2 : 20,
		        y2 : 0,

		        colors : [{
		            offset : 0,
		            color : "#c40000"
		        }, {
		            offset : 0.5,
		            color : "#ffffff"
		        }, {
		            offset : 1,
		            color : "#c40000"
		        }]
		    };
		    makeShape("M -20 0 L 0 -140 L 0 0 Z", ga); // "#c40000");
		    makeShape("M 0 0 L 0 -140 L 20 0 Z", "#c49999");

		    var g1 = {
		        type : "linear",
		        x1 : 50,
		        y1 : -20,
		        x2 : 80,
		        y2 : 20,
		        colors : [{
		            offset : 0,
		            color : "#c0c0c0"
		        }, {
		            offset : 0.5,
		            color : "#202040"
		        }, {
		            offset : 1,
		            color : "#c0c0c0"
		        }]
		    };
		    makeShape("M0 -10 L100 0 L 0 10 Z", g1);

		    makeShape("M-20 0 L0 140 L 0 0 Z", "#c0c0c0");

		    var gb = {
		        type : "linear",
		        x1 : -20,
		        y1 : 20,
		        x2 : 20,
		        y2 : 140,
		        colors : [{
		            offset : 0,
		            color : "#505050"
		        }, {
		            offset : 0.5,
		            color : "#202040"
		        }, {
		            offset : 1,
		            color : "#505050"
		        }]
		    };

		    makeShape("M0 0 L0 140 L 20 0 Z", gb); //"#505050");
		    var g2 = {
		        type : "linear",
		        x1 : -30,
		        y1 : -10,
		        x2 : -40,
		        y2 : 10,
		        colors : [{
		            offset : 0,
		            color : "#c0c0c0"
		        }, {
		            offset : 1,
		            color : "#505050"
		        }]
		    };
		    makeShape("M 0 10 L-100 0 L 0 -10 Z", g2);

		    return shapes;

	    }

	});
});