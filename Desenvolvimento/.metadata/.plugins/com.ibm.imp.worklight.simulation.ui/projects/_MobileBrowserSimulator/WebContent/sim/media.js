require(["dojo/dom"], function(dom){
	addService("Media", function(){

		var Media = {};
		Media.MEDIA_STATE = 1;
		Media.MEDIA_DURATION = 2;
		Media.MEDIA_ERROR = 9;

		// Media states
		Media.MEDIA_NONE = 0;
		Media.MEDIA_STARTING = 1;
		Media.MEDIA_RUNNING = 2;
		Media.MEDIA_PAUSED = 3;
		Media.MEDIA_STOPPED = 4;
		
		var audioTag = dom.byId("sim_media_audio");
		var audioUrlCurrent = null; // current url to play
		var audioUrlId = null; // current media id playing
		var audioCallback = null; // callback to app
		var audioState = Media.MEDIA_NONE; // current audio state
		var audioInterval = null; // current duration interval
		var audioPlayRecord = true; // T=play, F=record

		/**
		 * Set mode, so we don't send error when file to be recorded can't be
		 * loaded.
		 * 
		 * @param T=play, F=record
		 */
		var audioMode = function(play){
			audioPlayRecord = play;
		};

		/**
		 * Init audio for playing url
		 * 
		 * @param callback
		 *            The media status callback id to the app
		 * @param id
		 *            The media player id for the app
		 * @param url
		 *            The url to play
		 */
		var audioUrl = function(callback, id, url){

			// Set parameters
			audioUrlCurrent = url;
			audioUrlId = id;
			audioCallback = callback;
			audioTag.setAttribute('src', url);

			// Load audio url
			if (!audioPlayRecord) {
				return;
			}
			audioTag.load();

			// Set up listeners
			audioTag.addEventListener("load", function(){
				if (audioCallback) {
					var message = {
					    id : audioUrlId,
					    msg : Media.MEDIA_DURATION,
					    value : roundNumber(audioTag.duration)
					};
					var r = new PluginResult(audioCallback, PluginResultStatus.OK, message, true);
					sendResult(r);
				}
			}, true);

			audioTag.addEventListener("pause", function(e){
				_consoleLog("pause");
			}, true);

			audioTag.addEventListener("play", function(e){
				_consoleLog("play");
				sendMediaState(Media.MEDIA_RUNNING);
			}, true);

			audioTag.addEventListener("ended", function(e){
				_consoleLog("ended");
				sendMediaState(Media.MEDIA_STOPPED);
			}, true);

			audioTag.addEventListener("error", function(e){
				_consoleLog("error");
				if (audioCallback) {
					var message = {
					    id : audioUrlId,
					    msg : Media.MEDIA_ERROR,
					    value : "Error"
					};
					var r = new PluginResult(audioCallback, PluginResultStatus.OK, message, true);
					sendResult(r);
				}
			}, true);
		};
		
		var currentTime = 0;
		var paused = false;

		/**
		 * Play audio
		 */
		var audioPlay = function(){
			audioTag.addEventListener('playing', function() {
				if (paused)
					audioTag.currentTime = currentTime;
				paused = false;
					
			}, false);
			audioTag.play();
			sendMediaState(Media.MEDIA_RUNNING);
		};

		/**
		 * Pause audio
		 */
		var audioPause = function(){
			paused = true;
			audioTag.addEventListener('pause', function() {
				if (paused)
					currentTime = audioTag.currentTime;					
			}, false);
			audioTag.pause();
			sendMediaState(Media.MEDIA_PAUSED);
		};

		/**
		 * Stop audio
		 */
		var audioStop = function(){
			paused = false;
			audioTag.pause();
			sendMediaState(Media.MEDIA_STOPPED);
		};

		/**
		 * Seek audio
		 * 
		 * @param time
		 */
		var audioSeek = function(time){
			audioTag.currentTime = time;
			audioTag.play();
		};

		/**
		 * Get audio duration
		 * 
		 * @return
		 */
		var audioDuration = function(){
			return roundNumber(audioTag.duration);
		};

		/**
		 * Get audio current position
		 * 
		 * @return
		 */
		var audioCurrentPosition = function(){
			return roundNumber(audioTag.currentTime);
		};

		/**
		 * Send media state back to app
		 * 
		 * @param state
		 */
		var sendMediaState = function(state){
			if (audioState != state) {
				audioState = state;
				if (audioCallback) {
					var message = {
					    id : audioUrlId,
					    msg : Media.MEDIA_STATE,
					    value : audioState
					};
					var r = new PluginResult(audioCallback, PluginResultStatus.OK, message, true);
					sendResult(r);
				}
			}
		};

		var setVolume = function(v) {
			audioTag.volume = v;
		};
		
		// Public
		// Handle requests
		this.exec = function(action, args, callbackId){
			if (action == 'startPlayingAudio') {
				audioMode(true);
				audioUrl(callbackId, /* id */args[0], /* src */args[1]);
				audioPlay();
				return new PluginResult(callbackId, PluginResultStatus.OK, "", true); // keep
																						// callbackId
			} else if (action == 'stopPlayingAudio') {
				audioStop(); // args[0] = id
				return new PluginResult(callbackId, PluginResultStatus.OK, "", true); // keep
																						// callbackId
			} else if (action == 'seekToAudio') {
				audioSeek(args[1]); // args[0] = id
				return new PluginResult(callbackId, PluginResultStatus.OK, "", true); // keep
																						// callbackId
			} else if (action == 'pausePlayingAudio') {
				audioPause(); // args[0] = id
				return new PluginResult(callbackId, PluginResultStatus.OK, "", true); // keep
																						// callbackId
			} else if (action == 'getCurrentPositionAudio') {
				var r = audioCurrentPosition(); // args[0] = id
				return new PluginResult(callbackId, PluginResultStatus.OK, r, false);
			} else if (action == 'startRecordingAudio') {
//				debugger
				audioMode(false);
				var id = args[0];
				var src = args[1];
//				audioUrl(Cordova.Media.onStatus, /* id */args[0], /* src */args[1]);
				audioUrlCurrent = src;
				audioRecordStart();
				return new PluginResult(callbackId, PluginResultStatus.OK, r, true); // keep
																						// callbackId
			} else if (action == 'stopRecordingAudio') {
				audioRecordStop(); // args[0] = id
				return new PluginResult(callbackId, PluginResultStatus.OK, r, true); // keep
																						// callbackId				
			} else if (action == 'release') {
				// args[0] = id
				return new PluginResult(callbackId, PluginResultStatus.OK, r, false);
			} else if(action == "setVolume") {
				// args[0] = id
				// args[1] = volume
				setVolume(args[1]);
				return new PluginResult(callbackId, PluginResultStatus.OK, r, false);
			}
			return new PluginResult(callbackId, PluginResultStatus.INVALID_ACTION);
		};

		// Initialization
		{
		}

	});
});
