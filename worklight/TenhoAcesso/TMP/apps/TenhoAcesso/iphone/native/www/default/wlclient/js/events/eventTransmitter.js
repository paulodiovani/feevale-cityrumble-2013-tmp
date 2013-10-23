
/* JavaScript content from wlclient/js/events/eventTransmitter.js in Common Resources */
/*
 * Licensed Materials - Property of IBM
 * 5725-G92 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */
"use strict";
/**
 * Event Transmitter - sends events to the WL server.
 */

function EventTransmitter() {
	// defaults
	this.defaultMaxMemSize = 1024 * 1024; 		// 1MB
	this.defaultMaxChunkSize = 64 * 1024; 		// 64 KB
	this.defaultInterval = 60000;		// default transmission interval is 1 minute
	this.defaultRetryInterval = 10000; 	// on failure, by default retry every 10 seconds
	this.defaultNumOfRetries = 2;		// try 3 times - 1 original transmission and 2 retries
	
	// parameters (can be changed in startTransmission() )
	this.maxMemSize = this.defaultMaxMemSize;  		// the amount of memory (in kb) the event buffer can hold (other events are stored in sessionStore)  
	this.maxChunkSize = this.defaultMaxChunkSize; 	// the max size (in kb) of each transmission chunk
	this.retryInterval = this.defaultRetryInterval;	// retry interval (ms)
	this.interval = this.defaultInterval;			// transmission interval (ms)
	this.numOfRetries = this.defaultNumOfRetries;	
	this.retriesLeft = this.numOfRetries;   

	// buffers
	this.openChunk = [];   // buffers events (actually, JSON of the events) to be sent
	this.transmissionChunkQueue = []; // buffers the chunks to be sent (each is a JSON representation of an events buffer)
	
	// private variables 
	this.numOfChunksInMemory = this.maxMemSize / this.maxChunkSize;
	this.openChunkSize = 4;  // size, in bytes, of the JSON string representation of the event buffer. Starts with 4 for the enclosing square brackets - []
	this.transmitting = false;
	this.timeoutID = null;
	this.lastFlush = null;
	
	this.sessionStoreQueueHead = 0;
	this.sessionStoreQueueTail = 0;
	
	this.prefix = "__WLTransmissionChunk_";
	var REQ_PATH_EVENTS = "events";
	
	var sessionStore = sessionStorage;  // TODO: an encrypted wrapper
	
	var piggybackerAdded = false;
	var earlyTimerId = null;
	
	
	var self = this;
	
	this.enablePiggybacking = function() {				
		if (piggybackerAdded)
			return;
		
		var piggybackFunction = function() {
			if (self.transmitting)
				return;

			if (earlyTimerId != null)
				clearTimeout(earlyTimerId);
						
			earlyTimerId = setTimeout(function() {
					WL.Logger.debug("Piggybacking event transmission");
					earlyTimerId = null;
					self.flushBufferFromAsync();
				}, 2000);
		};		
		
		// call piggyback function at the end of every successful transmission
		WLJSX.Ajax.WlRequestPiggyBackers.push({
			name : "Event Piggybacker", // for debug purposes
			onSuccess: function() {piggybackFunction();}			
		});
		
		piggybackerAdded = true;
	};
	
	/**
	 * transmitEvent - add an event to the queue, to be transmitted either on schedule or immediately (if immediate == true) 
 	 */
	this.transmitEvent = function(event,immediate) {
		self.transmitEvents([event],immediate);
	};		
	
	this.transmitEvents = function(eventsToTransmit,immediate) {
		// turn on piggybacking, since there are events to transmit
		self.enablePiggybacking(); 
		
		//insert the current device context into each event if not present already
		var deviceContext = WL.Device.getContext();
		
		for(var i=0; i< eventsToTransmit.length; i++) {
			var event = eventsToTransmit[i];
			if (!event.deviceContext) {
				event.deviceContext = deviceContext;
			}
			
			WL.Logger.debug("Adding event to transmission buffer: \n");
			WL.Logger.debug(event);
		
			var evtJson = WLJSX.Object.toJSON(event);
			
			if (self.openChunkSize + evtJson.length *2 >= self.maxChunkSize) { 
				// adding the event would cause the buffer to exceed max chunk size. 
				// Thus, we close the buffer, move it to the transmission queue, and create a new open buffer
				WL.Logger.debug("The new event will be too big for the open buffer\n");
				self.addOpenChunkToQueue();
			}
			self.openChunk.push(event);
			self.openChunkSize+= (evtJson.length + 1) *2 ; // extra char for the comma, 2 bytes per char
		}
		
		if (!self.transmitting) {  // if transmitting, we'll get to sending the new events on success - so nothing to do
			if (immediate) {	
				WL.Logger.debug("Immediate transmission... \n");
				
				clearTimeout(self.timeoutID);
				self.timeoutID = null;
				
				self.flushBuffer();
			}		
			else if (self.timeoutID == null){				
				var timeoutInterval = self.interval;
				
				if (self.lastFlush) {
					timeoutInterval -= (new Date().getTime() - self.lastFlush) % self.interval; // subtract passed time since last flush
				}
				WL.Logger.debug("setting transmit interval: "+timeoutInterval);
				self.timeoutID = setTimeout(self.flushBufferFromAsync,timeoutInterval);				
			}
		}
	};
	
	this.addOpenChunkToQueue = function() {
		if (self.openChunk.length >0) {
			var chunk = WLJSX.Object.toJSON(self.openChunk);
			if (self.transmissionChunkQueue.length < self.numOfChunksInMemory-1) {  // the memory holds the chunks in the queue + the open chunk
				WL.Logger.debug("adding the open chunk to the transmission chunks queue\n");
				self.transmissionChunkQueue.push(chunk);
			}
			else {
				WL.Logger.debug("in-memory queue is full, storing in session store");
				try {
					sessionStore.setItem(self.prefix+self.sessionStoreQueueTail, chunk);
					self.sessionStoreQueueTail++;
				}
				catch (e) {
					WL.Logger.error("storing in session store failed!",e);
					return; // we will continue storing events in the open chunk for now, until it is flushed or the problem somehow disappears
				}
			}
			WL.Logger.debug("creating a new open chunk\n");
			self.openChunk = [];
			self.openChunkSize = 4; // for the "[]" - two bytes per char
		}
	};
	
	// use to call flush buffer in async context (e.g. setTimeout)
	this.flushBufferFromAsync = function() {		
		if (!self.transmitting)
			self.flushBuffer();		
	}
	
	this.flushBuffer = function() {
		// note - flush can be called by piggybacker when no events are in the queue. This is ok, since the flush is scheduled relative
		// to the last transmission; it is possible for an event to have been added in the time in between 
		WL.Logger.debug("Flush called"); 

		if(self.transmissionChunkQueue.length==0) {
			self.addOpenChunkToQueue();  // nothing in the chunks queue -- we are going to use whatever is in the open chunk
		}
		if (self.transmissionChunkQueue.length>0) {
			WL.Logger.debug("Transmitting...: \n");
			
			self.transmitting = true;
			self.timeoutID = null;			
			self.lastFlush = new Date().getTime();

			// asynchronously send the first chunk, on success, try the next one or setup a timer to try again after the given interval passes
			var onSuccess = function()
			{
				WL.Logger.debug("Succesfully transmitted a chunk");
				self.transmitting = false;
				self.transmissionChunkQueue.shift();  	// remove the transmitted chunk from the queue
				self.fillQueueFromSessionStore();		// refill queue if possible

				if (self.transmissionChunkQueue.length > 0 || self.openChunk.length > 0) {  // we have more events chunks to transmit (in the queue or the event buffer)
					self.flushBuffer();  // transmit the next chunk
				} 
			};
			
			var onFailure = function() {
				self.transmitting = false;
				if (self.retriesLeft > 0) {
					WL.Logger.debug("Failed to transmit chunk, retrying");
					self.timeoutID = setTimeout(self.flushBufferFromAsync,self.retryInterval);
					self.retriesLeft--;
				}
				else {
					WL.Logger.debug("Failed to transmit " + self.numOfRetries +" times, giving up this transmission, will try again according to the given interval");
					self.retriesLeft = self.numOfRetries;
					self.timeoutID = setTimeout(self.flushBufferFromAsync,self.interval);
				}
			};	
						
			
			// asynchronously send the first chunk, on success, try the next one or setup a timer to try again after the given interval passes
			if (WL.Client.isConnected())
			{
				WL.Logger.debug("Client is connected,trying to transmit...");
				WL.Client.sendToServer(self.transmissionChunkQueue[0],onSuccess,onFailure);	
			}
			else
			{	
				onFailure();
			}			
								
		}
	};
	
	this.sendToServer = function(param, onSuccessFunc,onFailureFunc)
	{
        // need to send device context updates when transmitting events
		WL.Client.__deviceContextTransmission.enableDeltaSending(true);
		new WLJSX.Ajax.WLRequest(REQ_PATH_EVENTS, {
			parameters: {
				events:param
			},
			timeout : WL.AppProp.WLCLIENT_TIMEOUT_IN_MILLIS, // TODO: WL.Client.getAppProperty() didn't work, unlike in WLClient itself...
			onSuccess: onSuccessFunc,
			onFailure: onFailureFunc
		});
		WL.Client.__deviceContextTransmission.enableDeltaSending(false);
	};

	this.fillQueueFromSessionStore = function() {
		if (self.transmissionChunkQueue.length < self.numOfChunksInMemory -1 && // there's room for more in memory
				self.sessionStoreQueueTail-self.sessionStoreQueueHead > 0) { // the session store contains a chunk
			WL.Logger.debug("Refill buffer from session store...");
			var keyName = self.prefix+self.sessionStoreQueueHead;
			self.transmissionChunkQueue.push(sessionStore.getItem(keyName));
			sessionStore.removeItem(keyName);
			self.sessionStoreQueueHead++;
			WL.Logger.debug("Removed chunk from session store");
		}
	};
	
	this.setEventTransmissionPolicy = function(policy) {
		self.retryInterval= (policy.retryInterval > 0) 	? policy.retryInterval 	: self.defaultRetryInterval;
		self.maxChunkSize= 	(policy.maxChunkSize > 0) 	? policy.maxChunkSize * 1024	: self.defaultMaxChunkSize;
		if (!policy.eventStorageEnabled){
			WL.Logger.debug("storage not enabled, setting maxMemSize max value");
			self.maxMemSize = Number.MAX_VALUE;
		}else
		{
			WL.Logger.debug("storage enabled, setting maxMemSize to "+policy.maxMemSize);
			self.maxMemSize= 	(policy.maxMemSize > 0)		? Math.max(policy.maxMemSize * 1024,self.maxChunkSize *2) : self.defaultMaxMemSize;  // minimum twice the chunk size
		}
		
		self.interval= 		(policy.interval >= 0) 		? policy.interval  		: self.defaultInterval;
		self.numOfRetries= 	(policy.numOfRetries >= 0) 	? policy.numOfRetries			: self.defaultNumOfRetries;
		
		
		self.numOfChunksInMemory = self.maxMemSize / self.maxChunkSize;
		WL.Logger.debug("number chunks in memory"+self.numOfChunksInMemory);
		
		if ((self.openChunk.length >0 || self.transmissionChunkQueue.length) && // if there is something to transmit, AND...
			(self.retriesLeft==0 ||  											//  we're not waiting for a retry 
			self.lastFlush + self.retryInterval > new Date().getTime()+self.interval)) {  // or the retry will take place later than "now + interval"
			clearTimeout(self.timeoutID);								// then - clear the timer (set according to previous interval or retry)
			self.timeoutID = setTimeout(self.flushBufferFromAsync,self.interval); // and 
		}
	};
	
	this.stopTransmission = function() {
		if (self.timeoutID != null) {
			clearTimeout(self.timeoutID);
			self.timeoutID = null;
			self.lastFlush = null;
		}
		//cleaning session storage
		for (var i=self.sessionStoreQueueTail; i>=0;i--)
		{
			var eventObject = sessionStorage.getItem(this.prefix+i);
			if (eventObject != null)
			{
				sessionStorage.removeItem(this.prefix+i);
			}
		}
					
		self.sessionStoreQueueHead = 0;
		self.sessionStoreQueueTail = 0;
		self.transmitting = false;
		self.transmissionChunkQueue =[];
		self.openChunk = [];
		self.openChunkSize = 4; // for the "[]" - two bytes per char
	};
	
};

var evtTransmitter = new EventTransmitter();

/**
 * transmitEvent - add an event to the queue, to be transmitted either on schedule or immediately (if immediate == true)  
 * <p>
 * Note that this should be always called from the main Javascript thread. If you need to call it from an external thread (e.g. Cordova) - surround the call by setTimeout(transmitEvent,0).
 **/
WL.Client.transmitEvent = evtTransmitter.transmitEvent;

/** 
 * Set the event transmission policy, and start transmitting according to that policy
 */
WL.Client.setEventTransmissionPolicy = evtTransmitter.setEventTransmissionPolicy;
WL.Client.purgeEventTransmissionBuffer = evtTransmitter.stopTransmission;
WL.Client.flushBufferFromAsync = evtTransmitter.flushBufferFromAsync;

WL.Client.transmitEvents = evtTransmitter.transmitEvents;
WL.Client.sendToServer = evtTransmitter.sendToServer;
