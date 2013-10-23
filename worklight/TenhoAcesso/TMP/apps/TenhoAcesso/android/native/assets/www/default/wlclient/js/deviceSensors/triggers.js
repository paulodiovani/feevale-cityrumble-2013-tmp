
/* JavaScript content from wlclient/js/deviceSensors/triggers.js in Common Resources */
/**
 * @license
 * Licensed Materials - Property of IBM
 * 5725-G92 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */
/**
 * 
 */
	__Triggers = function()
	{
		this.triggersContainer = {};
		
		/**
		 * Clear the state
		 */
		this.clearTriggers = function()
		{
			this.triggersContainer = {};
		};
		
		/**
		 * Updating the internal container of triggers objects. Removing deleted triggers, adding new ones.We assume the trigger is identified
		 * by the name of the property inside the containing object (therefore the developer cannot change a trigger - if he want to change he will
		 * have to delete it and then enter a new one - in two steps)
		 */
		this.updateTriggers=function(triggers, policy, sensor)
		{
			WL.Logger.debug("Updating triggers for a sensor "+sensor+" \n");
			var isCollectionEmpty = isEmpty(this.triggersContainer);
									
			if (triggers) {
				var triggerProperties = WLJSX.Object.keys(triggers);
				for (var i = 0; i < triggerProperties.length; i++) 
				{   //each entry is a trigger object and the name of the trigger is the property name, store them under this name if not stored already
					var triggerProperty = triggerProperties[i];
					
					if (!(triggerProperty in this.triggersContainer))
					{
						WL.Logger.debug("The trigger "+triggerProperty+ " is new, adding...");
						this.triggersContainer[triggerProperty] = this.createTrigger(triggers[triggerProperty]); 
						 
					}
					
				}
			}			
			
			//need to iterate over the entries which were removed from the triggers object and remove them from container
			if (!isCollectionEmpty)
			{				
				for (var triggerObject in this.triggersContainer) 
				{   					
					if (!triggers || !(triggerObject in triggers))  //the trigger object was deleted, remove it from  container
					{
						WL.Logger.debug("The trigger "+triggerObject+ "is being deleted...");
						delete this.triggersContainer[triggerObject];
					}					
				}
			}
			
			//validating triggers
			for (var triggerObject in this.triggersContainer)
			{
				if (this.triggersContainer[triggerObject].validate) //the trigger has validate function 
				{
					this.triggersContainer[triggerObject].validate(policy); //run the validation function
				}
			}
			
		};
		
		
		/**
		 * The sensor will call this function to cause evaluation of triggers in the trigger collection
		 */
		this.locationAcquired= function(location,sensor)
		{
			var deviceContext = WL.Device.getContext();
			var callbacks = [];
			var eventsToTransmit = [];
			var i =0;
			var j=0;
			var transmitImmediate = false;
			
			WL.Logger.debug("New location acquired by a sensor " + sensor+" ,evaluating triggers...");
			for (var triggerProperty in this.triggersContainer) 
			{  
				var triggerObject = this.triggersContainer[triggerProperty];
				var evaluationResult = triggerObject.evaluate(location);
				if (evaluationResult == true)
				{
					//invoke callback if such is defined on this trigger
					if (triggerObject.callback != undefined)
					{
						//add the callback function into the callback queue, do not execute right away
						callbacks[i] = triggerObject.callback;
						i++;						
					}
						
					//fire event if such is defined on this object
					//TODO need to evaluate if need to actively transmit here
					if (triggerObject.eventToTransmit != undefined)
					{						
						var event = triggerObject.eventToTransmit.event;						
						var transmitNow = triggerObject.eventToTransmit.transmitImmediately;						
						if (transmitNow) 
						{							
							transmitImmediate = true;
						}
												
						eventsToTransmit[j] = WLJSX.Object.clone(event);
						j++;
						
						
					}
						
				}
			}
			 
			// transmit events
			WL.Client.transmitEvents(eventsToTransmit,transmitImmediate);
			
			for (var i = 0; i < callbacks.length; i++) 
			{
				  var callbackFunction = callbacks[i];
				  try {
					  callbackFunction(deviceContext);
				  }
				  catch(err) {
					  WL.Logger.error("Exception thrown from trigger callback: " + err);
				  }
			}
			
		};
		
		/////Internal functions
		function isEmpty(ob){
		    for(var i in ob){ if(ob.hasOwnProperty(i)){return false;}}
			  return true;
	    };
	};
	
	//Triggers definitions
	//general trigger with all the information
	function Trigger(trigger)
	{	
		if (trigger != undefined)
		{
			this.callback = trigger.callback;
			this.eventToTransmit = trigger.eventToTransmit;
		}
							
		this.evaluate = function(location){
			return false;
		};
				
		
				
	};
	
	/////GEO triggers
	GEOLocationAcquiredTrigger = function(trigger)
	{	this.base = Trigger;	
		this.base(trigger);
		
		this.evaluate =function(location)
		{
			return true;
		};
	};	
	GEOLocationAcquiredTrigger.prototype = new Trigger;
	
	GEOLocationChangedTrigger =function(trigger)
	{
		this.base = Trigger;
		this.base(trigger);
		this.previousLocation = undefined;
		this.sensitivity = trigger.minChangeDistance;

		this.validate = function(policy)
		{
			if (this.sensitivity && policy.minChangeDistance && this.sensitivity < policy.minChangeDistance){
				WL.Logger.error("Trigger geo PositionChange minChangeDistance param value: " + this.sensitivity+ " is smaller than the policy minChangeDistance value:" + policy.minChangeDistance + " and therefore will have no effect.");
			}
		};
		
		this.evaluate =function(location){
			var latitude = location.coords.latitude;
			var longitude = location.coords.longitude;
			var accuracy = location.coords.accuracy;
			
			if (this.previousLocation == undefined)
			{					
				this.previousLocation = WLJSX.Object.clone(location);								
				return true;
			}
			else
			{
				var evaluationResult = false;
				if (this.sensitivity)
				{
					
					//calculate the distance between the old point and the current point, change is considered only if the distance >sensitivity
					var distance = WL.Geo.getDistanceBetweenCoordinates(location.coords, this.previousLocation.coords);
					
					if (distance > this.sensitivity)
					{
						this.previousLocation = WLJSX.Object.clone(location);
						evaluationResult = true;
					}
				}else
				{
					if (latitude!=this.previousLocation.coords.latitude || longitude!=this.previousLocation.coords.longitude || accuracy!= this.previousLocation.coords.accuracy)
					{						
						this.previousLocation = WLJSX.Object.clone(location);											
						evaluationResult = true;
					}
				}
				
				return evaluationResult;
			}
			 
		};
	};
	GEOLocationChangedTrigger.prototype =  new Trigger;	
	
	GEOAreaTrigger = function(trigger)
	{	
		this.base = Trigger;	
		this.base(trigger);
		this.triggerConfidenceOptions = {
				confidenceLevel : "low", bufferZoneWidth : 0, polygonInfo : null };
		this.lowConfidenceOptions = {
				confidenceLevel : "low", bufferZoneWidth : 0, polygonInfo : null };
		
		if (trigger != undefined)
		{
			this.circle = trigger.circle;
			this.polygon  = trigger.polygon;
			if (this.circle && this.polygon)
			{
				WL.Logger.error("A trigger should be defined as either a circle or a polygon, not both");
			}
			if(trigger.confidenceLevel)
				this.triggerConfidenceOptions.confidenceLevel = trigger.confidenceLevel;
			if(trigger.bufferZoneWidth){
				this.triggerConfidenceOptions.bufferZoneWidth = trigger.bufferZoneWidth;
				this.lowConfidenceOptions.bufferZoneWidth = trigger.bufferZoneWidth;			
			}
		};		
		
		this.init = function(enteringOptions, exitingOptions){
			if (this.circle)
			{
				this.isInside = function (coordinate){
					return WL.Geo.isInsideCircle(coordinate, this.circle, enteringOptions);
				}
				this.isOutside = function (coordinate){
					return WL.Geo.isOutsideCircle(coordinate, this.circle, exitingOptions);
				}
			}		
			else if (this.polygon) 
			{
				this.isInside = function (coordinate){
					return WL.Geo.isInsidePolygon(coordinate, this.polygon, enteringOptions);
				}
				this.isOutside = function (coordinate){
					return WL.Geo.isOutsidePolygon(coordinate, this.polygon, exitingOptions);
				}			
			}
		};
	};	
	GEOAreaTrigger.prototype = new Trigger;
	
	
	GEOEnteringTrigger = function(trigger)
	{	
		this.parent = GEOAreaTrigger;	
		this.parent(trigger);
		this.init(this.triggerConfidenceOptions,this.lowConfidenceOptions);
		this.isInsideArea = true;
		
		this.evaluate =function(location)
		{
			if(!this.isInsideArea){
				if(this.isInside(location.coords)){
					if(this.isInsideArea === false){
						this.isInsideArea = true;
						return true;
					}
					this.isInsideArea = true;
				}
			}
			else if(this.isInsideArea){
				if(this.isOutside(location.coords)){
					this.isInsideArea = false;
				}
			}
			return false; //either not in the area or already was reported as inside the area, the state hasn't changed and therefore "Entering" is not happening
		};
	};	
	GEOEnteringTrigger.prototype = new GEOAreaTrigger;

	GEOExitingTrigger = function(trigger)
	{	
		this.parent = GEOAreaTrigger;	
		this.parent(trigger);
		this.init(this.lowConfidenceOptions, this.triggerConfidenceOptions);
		this.isOutsideArea = true;
		
		this.evaluate =function(location)
		{
			if(!this.isOutsideArea){
				if(this.isOutside(location.coords)){
					if(this.isOutsideArea === false){
						this.isOutsideArea = true;
						return true;
					}
					this.isOutsideArea = true;
				}
			}
			else if(this.isOutsideArea){
				if(this.isInside(location.coords)){
					this.isOutsideArea = false;
				}
			}
			return false; //either not in the area or already was reported as inside the area, the state hasn't changed and therefore "Entering" is not happening
		};
	};	
	GEOExitingTrigger.prototype = new GEOAreaTrigger;	
	
	GEODwellingInsideTrigger = function(trigger)
	{	
		this.parent = GEOAreaTrigger;	
		this.parent(trigger);
		
		this.startDwellingTime = undefined; // in milliseconds
		this.dwellingTime = trigger.dwellingTime;
		if(!this.dwellingTime)
			this.dwellingTime = 0;

		this.init(this.triggerConfidenceOptions,this.lowConfidenceOptions);
		this.isInsideArea = false;
		
		this.evaluate =function(location)
		{
			var locationTimestamp = (location.timestamp)? location.timestamp: new Date().getTime();
			if(!this.isInsideArea){
				if(this.isInside(location.coords)){
					this.isInsideArea = true;
					this.startDwellingTime = locationTimestamp;						
				}
			}
			else if(this.isInsideArea){
				if(this.isOutside(location.coords)){
					this.isInsideArea = false;
				}
			}

			if(this.startDwellingTime){
				if(this.isInsideArea){
					if(locationTimestamp - this.startDwellingTime >= this.dwellingTime){
						this.startDwellingTime = undefined;
						return true;
					}
				}
				else{
					this.startDwellingTime = undefined;
				}
			}		
			return false; 
			
		};
	};	
	GEODwellingInsideTrigger.prototype = new GEOAreaTrigger;

	GEODwellingOutsideTrigger = function(trigger)
	{	
		this.parent = GEOAreaTrigger;	
		this.parent(trigger);
		this.startDwellingTime = undefined; // in milliseconds
		this.dwellingTime = trigger.dwellingTime;
		if(!this.dwellingTime)
			this.dwellingTime = 0;

		this.init(this.lowConfidenceOptions, this.triggerConfidenceOptions);
		this.isOutsideArea = false;
		
		this.evaluate =function(location)
		{
			var locationTimestamp = (location.timestamp)? location.timestamp: new Date().getTime();
			if(!this.isOutsideArea){
				if(this.isOutside(location.coords)){
					this.isOutsideArea = true;
					this.startDwellingTime = locationTimestamp;						
				}
			}
			else if(this.isOutsideArea){
				if(this.isInside(location.coords)){
					this.isOutsideArea = false;
				}
			}

			if(this.startDwellingTime){
				if(this.isOutsideArea){
					if(locationTimestamp - this.startDwellingTime >= this.dwellingTime){
						this.startDwellingTime = undefined;
						return true;
					}
				}
				else{
					this.startDwellingTime = undefined;
				}
			}		
			return false; 			
		};
	};	
	GEODwellingOutsideTrigger.prototype = new GEOAreaTrigger;

	///WIFI Triggers
	WIFILocationAcquiredTrigger = function(trigger)
	{
		
		this.base = Trigger;
		this.base(trigger);
		this.evaluate =function(location)
		{
			return true;
		};
	};	
	WIFILocationAcquiredTrigger.prototype =new Trigger;
	
	WIFIVisibleNetworksChangedTrigger =function(trigger)
	{
		this.base = Trigger;
		this.base(trigger);
		this.previousLocation = undefined;
		

		this.evaluate =function(location){
			var accessPoints = location.accessPoints;
			var currentSSIDs = accessPoints;
			
			if (this.previousLocation == undefined)
			{
				this.previousLocation = accessPoints;
				if (accessPoints.length != 0) return true; //in case WIFI location was acquired, and we had no previous location, but the new location is empty
				return false;
			}
			else
			{
				//if the length is different - the position was changed
				if (currentSSIDs.length!= this.previousLocation.length)
				{
					this.previousLocation = accessPoints;
					return true;
				}
				//iterate over the current SSIDs (we assume they are sorted) and check with SSIds in previous position
				for (var i = 0; i < currentSSIDs.length; i++) 
				{					
					var currentSSID = currentSSIDs[i];
					var previousSSID =  this.previousLocation[i];
					if (currentSSID.SSID != previousSSID.SSID || currentSSID.MAC != previousSSID.MAC)					  
					{
						this.previousLocation = accessPoints;
						return true;
					}					 
					  
				}
				return false;
			}
			 
		};
	};
	WIFIVisibleNetworksChangedTrigger.prototype = new Trigger;
	
	WIFIConnectedTrigger =function(trigger)
	{
		this.base = Trigger;
		this.base(trigger);
		this.connected = false;
		
		if (trigger != undefined)
		{
			this.network = trigger.connectedAccessPoint;
			if (this.network == undefined)
			{
				WL.Logger.error("Wifi Connect trigger should have connectedAccessPoint field specified");
				throw new Error("Wifi Connect trigger should have connectedAccessPoint field specified");
			}
		}
		
		this.validate = function(policy)
		{
			//validating that the connected network appear in the policy
			
			if (this.network.SSID == "*" && (!this.network.MAC || this.network.MAC == "*")) return;
			var specs = policy.accessPointFilters;
			var match = false;
			
			for ( var i = 0; i < specs.length; i++)
			{
				if (this.network.SSID == specs[i].SSID || specs[i].SSID == "*")
				{
					if (this.network.MAC)
					{
						if (specs[i].MAC && (specs[i].MAC == this.network.MAC || specs[i].MAC == "*"))
						{
							match = true;
							break;
						}
					}else
					{
						match = true;
						break;
					}
				}
			}
			
			if (!match)
			{
				WL.Logger.error("The WIFI Connect trigger with  network specification: "+WLJSX.Object.toJSON(this.network)+" will have no affect, since this network do not appear in WIFI acquisition policy");
			}
		};
		
		
		this.evaluate =function(location){
			var connectedNetwork = location.connectedAccessPoint;
			//if the current connected network is equal to the defined in the trigger,
			//and previously was disconnected from it - evaluate as true.
			var isConnected = false;
			if (connectedNetwork && (this.network.SSID == connectedNetwork.SSID || this.network.SSID == "*"))
			{
				isConnected = true;
				//check if MAC is defined and equals
				if (this.network.MAC)
				{
					if (this.network.MAC == connectedNetwork.MAC){
						isConnected = true;
					}
					else{
						isConnected = false;
					}
					
				}				
			}
			
			if (isConnected && !this.connected){
				//connected now and previously wasn't
				this.connected = true;
				return true;
			}
			if (!isConnected)
			{
				this.connected = false;
			}
			
			return false;
		};
	};
	WIFIConnectedTrigger.prototype = new Trigger;
	
	WIFIDisconnectedTrigger =function(trigger)
	{
		this.base = Trigger;
		this.base(trigger);
		this.connected = false;
		
		if (trigger != undefined)
		{
			this.network = trigger.connectedAccessPoint;	
			if (this.network == undefined)
			{
				WL.Logger.error("Wifi Disconnect trigger should have connectedAccessPoint field specified");
				throw new Error("Wifi Disconnect trigger should have connectedAccessPoint field specified");
			}
		}
		
		this.validate = function(policy)
		{
			//validating that the connected network appear in the policy
			
			if (this.network.SSID == "*" && (!this.network.MAC || this.network.MAC == "*")) return;
			var specs = policy.accessPointFilters;
			var match = false;
			
			for ( var i = 0; i < specs.length; i++)
			{
				if (this.network.SSID == specs[i].SSID || specs[i].SSID == "*")
				{
					if (this.network.MAC)
					{
						if (specs[i].MAC && (specs[i].MAC == this.network.MAC || specs[i].MAC == "*"))
						{
							match = true;
							break;
						}
					}else
					{
						match = true;
						break;
					}
				}
			}
			
			if (!match)
			{
				WL.Logger.error("The WIFI Disconnect trigger with network specification: "+WLJSX.Object.toJSON(this.network)+" will have no affect, since this network do not appear in WIFI acquisition policy");
			}
		};
		
		this.evaluate =function(location){
			var connectedNetwork = location.connectedAccessPoint;
			//if the current connected network is equal to the defined in the trigger,
			//and previously was disconnected from it - evaluate as true.
			var isConnected = false;
			if (connectedNetwork && (this.network.SSID == connectedNetwork.SSID || this.network.SSID == "*"))
			{
				isConnected = true;
				//check if MAC is defined and equals
				if (this.network.MAC)
				{
					if (this.network.MAC == connectedNetwork.MAC){
						isConnected = true;
					}
					else{
						isConnected = false;
					}
					
				}				
			}
			
			if (!isConnected && this.connected){
				//diconnected now and previously was connected
				this.connected = false;
				return true;
			}
			if (isConnected)
			{
				this.connected = true;
			}
			
			return false;
		};
	};
	WIFIDisconnectedTrigger.prototype = new Trigger;
	
	WIFIAreaTrigger = function(trigger)
	{	
		this.base = Trigger;	
		this.base(trigger);
		this.isInsideArea = undefined;

		if (trigger != undefined)
		{
			this.accessPointSpecs = trigger.areaAccessPoints;
			if (this.accessPointSpecs == undefined)
			{
				WL.Logger.error("Wifi area trigger should have areaAccessPoints field specified");
				throw new Error("Wifi area trigger should have areaAccessPoints field specified");
			}
			this.exactLocation = !trigger.otherAccessPointsAllowed;
		}
		
		this.validate = function(policy)
		{
			//validating that the access point specs appear in the policy
			for (var j=0; j< this.accessPointSpecs.length; j++)
			{
				var thisNetwork = this.accessPointSpecs[j];
				if (thisNetwork.SSID == "*" && (!thisNetwork.MAC || thisNetwork.MAC == "*")) continue;
				var specs = policy.accessPointFilters;
				var match = false;
				
				for ( var i = 0; i < specs.length; i++)
				{
					if (thisNetwork.SSID == specs[i].SSID || specs[i].SSID == "*")
					{
						if (thisNetwork.MAC)
						{
							if (specs[i].MAC && (specs[i].MAC == thisNetwork.MAC || specs[i].MAC == "*"))
							{
								match = true;
								break;
							}
						}else
						{
							match = true;
							break;
						}
					}
				}
				
				if (!match)
				{
					WL.Logger.error("The WIFI Area trigger with  access point specification: "+WLJSX.Object.toJSON(thisNetwork)+" will have no effect, since this network do not appear in WIFI acquisition policy");
				}

			}
		};
		
		this.arrangeSSIDs = function(location)
		{			
			var arrangedLocations = new Array();
			for (var i = 0; i < location.length; i++)
			{
				var SSID= location[i].SSID;
				var MAC = location[i].MAC;
				if (!arrangedLocations[SSID]) arrangedLocations[SSID] ={}; //if no such SSID exists in the data structure yet
				if (MAC) arrangedLocations[SSID][MAC]={}; //register the MAC under the SSID
			} 
			
			return arrangedLocations;
		};

		this.compareSSIDs = function(arrangedSSIDs,accessPointSpecs,exactLocation)
		{
			//iterate over the trigger specs and see if all is visible
			for (var i=0; i < accessPointSpecs.length; i++)
			{
				var definedSSID = accessPointSpecs[i].SSID;
				var definedMAC = accessPointSpecs[i].MAC;
				
				if (arrangedSSIDs[definedSSID]) //such SSID exists in the visible networks list
				{
					if (definedMAC) //the acess point spec includes MAC definiion 
					{
						if (arrangedSSIDs[definedSSID][definedMAC]) //if such MAC is visible in visible networks list
						{
							arrangedSSIDs[definedSSID][definedMAC].checked = true;
							continue;
						}
						return false;
					}
					arrangedSSIDs[definedSSID].checked = true;
					continue;
				}
				return false;
			}
			
			if (exactLocation) //we should see only the networks specified in the triggers and nothing more
			{
				for (var key in arrangedSSIDs)
				{			
					var SSID = arrangedSSIDs[key];
					if (!SSID.checked) //the SSID was not marked as checked - all MACS should be marked 
					{
						var checkedMACs = false;
						for (var MAC in SSID) //checking the MACs..
						{
							checkedMACs = true;
							var obj = SSID[MAC];
							if (!obj.checked) return false;
						}
						
						if (!checkedMACs) return false; //the SSID is not checked and no MACs
					}
				}
			} 
			
			return true;
		};
		
	};	
	WIFIAreaTrigger.prototype = new Trigger;
	
	WIFIEnteringTrigger =function(trigger)
	{
		this.parent = WIFIAreaTrigger;	
		this.parent(trigger);

		this.evaluate =function(location){
			
			var accessPoints = location.accessPoints;
			var arrangedISSIDs = this.arrangeSSIDs(accessPoints);
			
			var isInside = false;
			isInside = this.compareSSIDs(arrangedISSIDs,this.accessPointSpecs,this.exactLocation);
			
			if (isInside)
			{
				if (!this.isInsideArea) //either was not in the area or previous position undefined
				{
					if(this.isInsideArea === false){
						this.isInsideArea = true;
						return true;
					}else{ // this.isInsideArea === undefined
						this.isInsideArea = true;	
						
					}
					
				}
			}
			else
			{
				this.isInsideArea=false;
			}
			
			return false;
			 
		};
	};
	WIFIEnteringTrigger.prototype = new WIFIAreaTrigger;
	
	WIFIDwellingInsideTrigger = function(trigger)
	{	
		this.parent = WIFIAreaTrigger;	
		this.parent(trigger);
		this.startDwellingTime = undefined; // in milliseconds
		this.dwellingInterval = trigger.dwellingTime;
		if(!this.dwellingInterval)
			this.dwellingInterval = 0;
		
		this.evaluate =function(location)
		{
			//get the current timestamp
			var locationTimestamp = (location.timestamp)? location.timestamp: new Date().getTime();
			
			var accessPoints = location.accessPoints;
			var arrangedISSIDs = this.arrangeSSIDs(accessPoints);
			
			var isInside = false;
			isInside = this.compareSSIDs(arrangedISSIDs,this.accessPointSpecs,this.exactLocation);
			
			if (isInside) {
				
				if (!this.isInsideArea) //previously was not in the area and now is
				{						
					this.isInsideArea = true;
					this.startDwellingTime = locationTimestamp;								
				}
			}
			else
			{							
				this.isInsideArea = false;
			}

			if(this.startDwellingTime){				
				if(this.isInsideArea){					
					if(locationTimestamp - this.startDwellingTime >= this.dwellingInterval){						
						this.startDwellingTime = undefined;
						return true;
					}					
				}
				else{					
					this.startDwellingTime = undefined;
				}
			}
			
			return false; 
			
		};
	};	
	WIFIDwellingInsideTrigger.prototype = new WIFIAreaTrigger;
	
	WIFIExitingTrigger =function(trigger)
	{
		this.parent = WIFIAreaTrigger;
		this.parent(trigger);
				
		this.evaluate =function(location){
			var accessPoints = location.accessPoints;
			var arrangedISSIDs = this.arrangeSSIDs(accessPoints);
			
			var isInside = false;
			isInside = this.compareSSIDs(arrangedISSIDs,this.accessPointSpecs,this.exactLocation);
			
			if (!isInside)
			{
				if (!(this.isInsideArea === false)) //either previously was in the area or undefined
				{
					//previously was inside
					if (this.isInsideArea === true)
					{						
						this.isInsideArea = false;
						return true;
					}else
					{ // this.isInsideArea === undefined
						this.isInsideArea = false;							
					}
					
				}
			}
			else
			{
				this.isInsideArea=true;
			}
			
			return false;
			 
		};
	};
	WIFIExitingTrigger.prototype = new WIFIAreaTrigger;
	
	WIFIDwellingOutsideTrigger = function(trigger)
	{	
		this.parent = WIFIAreaTrigger;	
		this.parent(trigger);
		this.startDwellingTime = undefined; // in milliseconds
		this.dwellingInterval = trigger.dwellingTime;
		if(!this.dwellingInterval)
			this.dwellingInterval = 0;
		
		this.evaluate =function(location)
		{
			var locationTimestamp = (location.timestamp)? location.timestamp: new Date().getTime();
			var accessPoints = location.accessPoints;
			var arrangedISSIDs = this.arrangeSSIDs(accessPoints);
			
			var isInside = false;
			isInside = this.compareSSIDs(arrangedISSIDs,this.accessPointSpecs,this.exactLocation);
			
			if (!isInside) {
				if (!(this.isInsideArea === false)) //previously was not in the area and now is
				{			
					this.isInsideArea = false;
					this.startDwellingTime = locationTimestamp;									
				}
			}
			else
			{				
				this.isInsideArea = true;
			}

			if(this.startDwellingTime){
				if(this.isInsideArea===false){
					if(locationTimestamp - this.startDwellingTime >= this.dwellingInterval){
						this.startDwellingTime = undefined;
						return true;
					}
				}
				else{
					this.startDwellingTime = undefined;
				}
			}
			
			return false; //either not in the area or already was reported as inside the area, the state hasn't changed and therefore "Entering" is not happening
			
		};
	};	
	WIFIDwellingOutsideTrigger.prototype = new WIFIAreaTrigger;
	
	///Extending the general trigger manager object with sensor specific ones (which will be instantiated in each sensor)
	__GEOTriggers = function()
	{		
		this.base = __Triggers;
		this.base();
		//create a GEO trigger given the trigger description object
		this.createTrigger = function(trigger)
		{
			var triggerType = trigger.type;
			switch (triggerType) {
				case "PositionChange":
			      return new GEOLocationChangedTrigger(trigger);			     
			   case "LocationAcquired":
				   return new GEOLocationAcquiredTrigger(trigger);			   
			   case "Enter":
				   return new GEOEnteringTrigger(trigger);					   
			   case "Exit":
				   return new GEOExitingTrigger(trigger);
			   case "DwellInside":
				   return new GEODwellingInsideTrigger(trigger);					   
			   case "DwellOutside":
				   return new GEODwellingOutsideTrigger(trigger);
			   default:
				   WL.Logger.error("Unsupported trigger type: " + triggerType);
			   	   throw new Error("Unsupported trigger type: " + triggerType);
			}
		};
	};	
	__GEOTriggers.prototype = new __Triggers;
	
	
	__WIFITriggers = function()
	{		
		this.base = __Triggers;
		this.base();
		//create a WIFI trigger given the trigger description object
		this.createTrigger = function(trigger)
		{
			var triggerType = trigger.type;
			switch (triggerType) {
				case "VisibleAccessPointsChange":
			      return new WIFIVisibleNetworksChangedTrigger(trigger);			     
			   case "LocationAcquired":
				   return new WIFILocationAcquiredTrigger(trigger);			   
			   case "Enter":	
				   return new WIFIEnteringTrigger(trigger);	
			   case "Exit":		
				   return new WIFIExitingTrigger(trigger);
			   case "DwellInside":
				   return new WIFIDwellingInsideTrigger(trigger);					   
			   case "DwellOutside":
				   return new WIFIDwellingOutsideTrigger(trigger);
			   case "Connect":
				   return new WIFIConnectedTrigger(trigger);
			   case "Disconnect":
				   return new WIFIDisconnectedTrigger(trigger);	   

			   default:
				   WL.Logger.error("Unsupported trigger type: " + triggerType);
			   	   throw new Error("Unsupported trigger type: " + triggerType);
			}
		};
	};	
	__WIFITriggers.prototype =  new __Triggers;