define(["dojo/_base/declare", "dojo/_base/lang", 
        "dojo/_base/connect", "dojo/_base/Color", "dojox/gauges/GlossyCircularGauge", 
        "widgets/CompassNeedle"], function(declare, lang, connect, Color,
        GlossyCircularGauge, CompassNeedle){

	/*
	 * ===== GlossyCircularGaugeBase = dojox.gauges.GlossyCircularGaugeBase;
	 * =====
	 */

	return declare("widgets.Compass", GlossyCircularGauge, {
	    // summary:
	    // Represents a compass with a glossy appearance.
	    // example:
	    // | <div dojoType="widgets.Compass"
	    // | id="compass"
	    // | width="300"
	    // | height="300"
	    // | min="0"
	    // | max="100"
	    // | value="0"
	    // | majorTicksInterval="10"
	    // | majorTicksColor="#c4c4c4"
	    // | minorTicksInterval="5"
	    // | minorTicksColor="#c4c4c4"
	    // | color="black"
	    // | needleColor="#c4c4c4"
	    // | font="normal normal normal 10pt sans-serif"
	    // | textIndicatorFont="normal normal normal 20pt sans-serif"
	    // | textIndicatorVisible="true"
	    // | textIndicatorColor="#c4c4c4"
	    // | majorTicksLabelPlacement="inside"|"outside"
	    // | noChange="true"
	    // | title="title"
	    // | scalePrecision="0"
	    // | textIndicatorPrecision="0">
	    // | </div>

	    // summary:
	    // Creates a new GlossyCircularGauge.
	    constructor : function(){
	    },

	    drawBackground : function(group){
		    this.inherited(arguments);
	    },

	    drawForeground : function(group){
		    this.inherited(arguments);
	    },
	    
	    startup : function(){
		    this.inherited(arguments);
		    this.removeIndicator(this._needle);
		    var needle = new CompassNeedle();
		    this.addIndicator(needle);
		    this._needle = needle;
		    connect.connect(needle, "valueChanged", lang.hitch(this, function(){
			    this.value = needle.value;
			    this._textIndicator.update(needle.value);
			    this.onValueChanged();
		    }));
	    }
	});
});
