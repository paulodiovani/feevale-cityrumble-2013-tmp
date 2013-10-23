require(["dojo/dom",
	"dojo/has",
	"dojo/dom-construct",
	"dijit/form/Select"], function(dom, has, domConstruct, Select){
	addService("Capture", function(){
		this.captureDir = undefined;
		this.audioFiles = [];
		this.videoFiles = [];
		this.video = dom.byId("captureVideoPlayer");

		// Public
		// Handle requests
		this.exec = function(action, args, callbackId, uuid){
			_consoleLog("Capture." + action + "()");
			
			var generateError = dijit.byId('sim_capture_generate_error_checkbox').checked;
			if (generateError == true) {
				var errorSelectValue = dijit.byId('sim_capture_generate_error').get("value");
				var errorCode = null;
				// CAPTURE_INTERNAL_ERR = 0
				// CAPTURE_APPLICATION_BUSY = 1
				// CAPTURE_INVALID_ARGUMENT = 2
				// CAPTURE_NO_MEDIA_FILES = 3
				// CAPTURE_NOT_SUPPORTED = 20
				if (errorSelectValue.toString().indexOf("CAPTURE_INTERNAL_ERR") != -1) {
					errorCode = 0;
				} else if (errorSelectValue.toString().indexOf("CAPTURE_APPLICATION_BUSY") != -1) {
					errorCode = 1;
				} else if (errorSelectValue.toString().indexOf("CAPTURE_INVALID_ARGUMENT") != -1) {
					errorCode = 2;
				} else if (errorSelectValue.toString().indexOf("CAPTURE_NO_MEDIA_FILES") != -1) {
					errorCode = 3;
				} else if (errorSelectValue.toString().indexOf("CAPTURE_NOT_SUPPORTED") != -1) {
					errorCode = 20;
				} else {
					// generate an error code  randomly.
					var d = new Date();
					errorCode = d.getTime() % 5;
					if (errorCode > 4)
						errorCode = 20;
				}
				
				return new PluginResult(callbackId,
											PluginResultStatus.ERROR,
											errorCode, false);
			}
			
			var limit = 1;
			var platformID = getSimByUUID(uuid).device.platformID;
			var isiOS = platformID.toString().indexOf(
					".ios.") != -1;
			if ((isiOS == false) && (typeof args !== "undefined")) {
			    for (var i = 0; i < args.length; i++) {
			        if ((typeof args[i].limit !== "undefined")
			            && (args[i].limit !== null)) {
			            limit = args[i].limit;
			            break;
			        }
			    }
			}
			switch (action) {
				case "captureAudio" :
					var r = this.getAudioFiles(limit);
					return new PluginResult(callbackId, PluginResultStatus.OK, r, false);
				case "captureVideo" :
					r = this.getVideoFiles(limit);
					return new PluginResult(callbackId, PluginResultStatus.OK, r, false);
				default :
					alert('Capture.' + action + "() not implemented");
					return new PluginResult(callbackId, PluginResultStatus.OK, "NOT IMPLEMENTED", false);
			}
		};

		this.playVideo = function(f){
			f = this.captureDir + f;
			var hasFF = has("ff") || (typeof window.navigator.originalUserAgent !== "undefined");
			if (has("chrome") || hasFF)
				f = f + ".ogg";
			else
				f = f + ".mp4";
			if (!this.video) {
				var captureVideoContainer = dom.byId("captureVideoContainer");
				this.video = dom.create("video", {
				    autoplay : true,
				    style : "width : 150px; "
				}, captureVideoContainer);
			}
			var v = this.video;
			v.src = f;
		};

		this.newMediaFile = function() {
			var f = window.frames;
			if(f) {
			    for ( var i = 0; i < f.length; i++) {
			    	if (typeof f[i].MediaFile !== "undefined")
			    		return new f[i].MediaFile();
				}
			}
			return {};
		};

		this.generateError = function(f){
			f = this.captureDir + f;
			var hasFF = has("ff") || (typeof window.navigator.originalUserAgent !== "undefined");
			if (has("chrome") || hasFF)
				f = f + ".ogg";
			else
				f = f + ".mp4";
			if (!this.video) {
				var captureVideoContainer = dom.byId("captureVideoContainer");
				this.video = dom.create("video", {
				    autoplay : true,
				    style : "width : 150px; "
				}, captureVideoContainer);
			}
			var v = this.video;
			v.src = f;
		};
		
		this.getAudioFiles = function(limit){
			var a = this.audioFiles;
			var ret = [];
			var hasFF = has("ff") || (typeof window.navigator.originalUserAgent !== "undefined");
			if (a.length < limit)
				limit = a.length;
			for ( var i = 0; i < limit; i++) {
				var f = a[i];
				if (hasFF)
					f = f + ".ogg";
				else
					f = f + ".mp3";
				var mediaFile = this.newMediaFile();
				mediaFile.name = f;
				mediaFile.fullPath = this.captureDir + f;
				if (hasFF)
					mediaFile.type = "audio/ogg";
				else
					mediaFile.type = "audio/mpeg";
				mediaFile.lastModifiedDate = new Date().toString();
				mediaFile.size = rand(10000, 0) + 500;
				
				var applet = document.cordovaFileApplet;				
				if (applet) {
					try {
						mediaFile.fullPath = applet.mapURLToFile(mediaFile.fullPath);
					} catch (err) {
						alert("Cannot map " + mediaFile);
					}
				}
				
				ret.push(mediaFile);
			}
			
			return ret;
		};

		this.getVideoFiles = function(limit){
			var a = this.videoFiles;
			var ret = [];
			var hasFF = has("ff") || (typeof window.navigator.originalUserAgent !== "undefined");
			if (a.length < limit)
				limit = a.length;
			for ( var i = 0; i < limit; i++) {
				var f = a[i];
				if (has("chrome") || hasFF)
					f = f + ".ogg";
				else
					f = f + ".mp4";
				var mediaFile = this.newMediaFile();
				mediaFile.name = f;
				mediaFile.fullPath = this.captureDir + f;
				if (has("chrome") || hasFF)
					mediaFile.type = "video/ogg";
				else
					mediaFile.type = "video/mp4";
				mediaFile.lastModifiedDate = new Date().toString();
				mediaFile.size = rand(10000, 0) + 500;
				
				var applet = document.cordovaFileApplet;				
				if (applet) {
					try {
						mediaFile.fullPath = applet.mapURLToFile(mediaFile.fullPath);
					} catch (err) {
						alert("Cannot map " + mediaFile);
					}
				}
				
				ret.push(mediaFile);
			}
			return ret;
		};

		this.setFile = function(a, checked, data){
			var i = a.indexOf(data);

			if (checked) {
				if (i == -1)
					a.push(data);
			} else if (i != -1) {
				a.splice(i, 1);
			}
		};

		this.setAudioFile = function(checked, data){
			this.setFile(this.audioFiles, checked, data);
		};

		this.setVideoFile = function(checked, data){
			this.setFile(this.videoFiles, checked, data);
		};
		
		this.generateError = function(checked){
			var comboTest = dijit.byId('captureAudioFile1');
			if (checked == true) {
				dijit.byId('captureAudioFile1').set('checked', false);
				dijit.byId('captureAudioFile2').set('checked', false);
				dijit.byId('captureAudioFile3').set('checked', false);
				dijit.byId('captureVideoFile1').set('checked', false);
				dijit.byId('captureVideoFile2').set('checked', false);
				dijit.byId('captureVideoFile3').set('checked', false);
			}
		};

		// Initialization
		{
			var n = _pg_sim_nls;
			var hasFF = has("ff") || (typeof window.navigator.originalUserAgent !== "undefined");
			if (!(has("chrome") || hasFF || has("ie") || has("safari"))) {
				var parentNode = dom.byId("capture");
				domConstruct.empty(parentNode);
				parentNode.innerHTML = n.sim_capture_browserSupport;
			} else {
				dom.byId('sim_capture_choose_audio').innerHML = n.sim_capture_choose_audio;
				dom.byId('sim_capture_audio1').innerHTML = n.sim_capture_audio1;
				dom.byId('sim_capture_audio2').innerHTML = n.sim_capture_audio2;
				dom.byId('sim_capture_audio3').innerHTML = n.sim_capture_audio3;
				
				dom.byId('sim_capture_choose_video').innerHML = n.sim_capture_choose_video;
				dom.byId('sim_capture_video1').innerHTML = n.sim_capture_video1;
				dom.byId('sim_capture_video2').innerHTML = n.sim_capture_video2;
				dom.byId('sim_capture_video3').innerHTML = n.sim_capture_video3;
				sim_capture_playVideo1_button.set("label", n.sim_capture_playVideo);
				sim_capture_playVideo2_button.set("label", n.sim_capture_playVideo);
				sim_capture_playVideo3_button.set("label", n.sim_capture_playVideo);
				
				var errorSelect = dijit.byId('sim_capture_generate_error');
				var listOfErrors = [
				      { value: n.sim_compass_error_random, label: n.sim_compass_error_random },
				      { value: "CAPTURE_INTERNAL_ERR", label: n.sim_compass_generate + " CAPTURE_INTERNAL_ERR" },
				      { value: "CAPTURE_APPLICATION_BUSY", label: n.sim_compass_generate + " CAPTURE_APPLICATION_BUSY" },
				      { value: "CAPTURE_INVALID_ARGUMENT", label: n.sim_compass_generate + " CAPTURE_INVALID_ARGUMENT" },
				      { value: "CAPTURE_NO_MEDIA_FILES", label: n.sim_compass_generate + " CAPTURE_NO_MEDIA_FILES" },
				      { value: "CAPTURE_NOT_SUPPORTED", label: n.sim_compass_generate + " CAPTURE_NOT_SUPPORTED" }
				  ];
				errorSelect.addOption(listOfErrors);
     			errorSelect.set('value', n.sim_compass_error_random);
     			
				this.captureDir = getScriptBase("capture.js") + "capture/";
				
				// Fix for Chrome which does not rewind  (Defect 98516)
				var captureAudioPlayer1 = dom.byId("captureAudioPlayer1");
				captureAudioPlayer1.addEventListener('ended', function() {
						captureAudioPlayer1.pause();
						captureAudioPlayer1.currentTime = 0;
					}
 				);
				
				var captureAudioPlayer2 = dom.byId("captureAudioPlayer2");
				captureAudioPlayer2.addEventListener('ended', function() {
						captureAudioPlayer2.pause();
						captureAudioPlayer2.currentTime = 0;
					}
 				);
				
				var captureAudioPlayer3 = dom.byId("captureAudioPlayer3");
				captureAudioPlayer3.addEventListener('ended', function() {
						captureAudioPlayer3.pause();
						captureAudioPlayer3.currentTime = 0;
					}
 				);
 				
 				// Set an extension supported by the browser
				var hasFF = has("ff") || (typeof window.navigator.originalUserAgent !== "undefined");
 				if (hasFF) {
					captureAudioPlayer1.src = this.captureDir + "AudioFile1.ogg";
					captureAudioPlayer2.src = this.captureDir + "AudioFile2.ogg";
					captureAudioPlayer3.src = this.captureDir + "AudioFile3.ogg";
				} else {
					captureAudioPlayer1.src = this.captureDir + "AudioFile1.mp3";
					captureAudioPlayer2.src = this.captureDir + "AudioFile2.mp3";
					captureAudioPlayer3.src = this.captureDir + "AudioFile3.mp3";
					
				}
 				
 				this.playVideo('VideoFile1');
			}
		}
	});
});