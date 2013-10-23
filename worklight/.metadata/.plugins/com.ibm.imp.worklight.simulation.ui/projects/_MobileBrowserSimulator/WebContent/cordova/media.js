/*
 * Cordova is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010-2011, IBM Corporation
 */

if (!Cordova.hasResource("media")) {
Cordova.addResource("media");
(function() {


/**
 * This class provides access to the device media, interfaces to both sound and video
 *
 * @constructor
 * @param src                   The file name or url to play
 * @param successCallback       The callback to be called when the file is done playing or recording.
 *                                  successCallback() - OPTIONAL
 * @param errorCallback         The callback to be called if there is an error.
 *                                  errorCallback(int errorCode) - OPTIONAL
 * @param statusCallback        The callback to be called when media status has changed.
 *                                  statusCallback(int statusCode) - OPTIONAL
 * @param positionCallback      The callback to be called when media position has changed.
 *                                  positionCallback(long position) - OPTIONAL
 */
Media = function(src, successCallback, errorCallback, statusCallback, positionCallback) {

    // successCallback optional
    if (successCallback && (typeof successCallback !== "function")) {
        _consoleLog("Media Error: successCallback is not a function");
        return;
    }

    // errorCallback optional
    if (errorCallback && (typeof errorCallback !== "function")) {
        _consoleLog("Media Error: errorCallback is not a function");
        return;
    }

    // statusCallback optional
    if (statusCallback && (typeof statusCallback !== "function")) {
        _consoleLog("Media Error: statusCallback is not a function");
        return;
    }

    // statusCallback optional
    if (positionCallback && (typeof positionCallback !== "function")) {
        _consoleLog("Media Error: positionCallback is not a function");
        return;
    }

    this.id = Cordova.createUUID();
    _consoleLog("Media("+src+") id="+this.id);
    Cordova.mediaObjects[this.id] = this;
    this.src = src;
    this.successCallback = successCallback;
    this.errorCallback = errorCallback;
    this.statusCallback = statusCallback;
    this.positionCallback = positionCallback;
    this._duration = -1;
    this._position = -1;
};

// Media messages
Media.MEDIA_STATE = 1;
Media.MEDIA_DURATION = 2;
Media.MEDIA_POSITION = 3;
Media.MEDIA_ERROR = 9;

// Media states
Media.MEDIA_NONE = 0;
Media.MEDIA_STARTING = 1;
Media.MEDIA_RUNNING = 2;
Media.MEDIA_PAUSED = 3;
Media.MEDIA_STOPPED = 4;
Media.MEDIA_MSG = ["None", "Starting", "Running", "Paused", "Stopped"];

// TODO: Will MediaError be used?
var _MediaError = window.MediaError;

if(!_MediaError) {
    window.MediaError = _MediaError = function(code, msg) {
        this.code = (typeof code != 'undefined') ? code : null;
        this.message = msg || ""; // message is NON-standard! do not use!
    };
}

_MediaError.MEDIA_ERR_NONE_ACTIVE    = _MediaError.MEDIA_ERR_NONE_ACTIVE    || 0;
_MediaError.MEDIA_ERR_ABORTED        = _MediaError.MEDIA_ERR_ABORTED        || 1;
_MediaError.MEDIA_ERR_NETWORK        = _MediaError.MEDIA_ERR_NETWORK        || 2;
_MediaError.MEDIA_ERR_DECODE         = _MediaError.MEDIA_ERR_DECODE         || 3;
_MediaError.MEDIA_ERR_NONE_SUPPORTED = _MediaError.MEDIA_ERR_NONE_SUPPORTED || 4;
// TODO: MediaError.MEDIA_ERR_NONE_SUPPORTED is legacy, the W3 spec now defines it as below.
// as defined by http://dev.w3.org/html5/spec-author-view/video.html#error-codes
_MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED = _MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED || 4;


/**
 * Start or resume playing audio file.
 */
Media.prototype.play = function() {
    Cordova.exec(Cordova.Media.onStatus, Cordova.Media.onStatus, "Media", "startPlayingAudio", [this.id, this.src]);
};

/**
 * Stop playing audio file.
 */
Media.prototype.stop = function() {
    return Cordova.exec(Cordova.Media.onStatus, Cordova.Media.onStatus, "Media", "stopPlayingAudio", [this.id]);
};

/**
 * Seek or jump to a new time in the track..
 */
Media.prototype.seekTo = function(milliseconds) {
    Cordova.exec(Cordova.Media.onStatus, Cordova.Media.onStatus, "Media", "seekToAudio", [this.id, milliseconds]);
};

/**
 * Pause playing audio file.
 */
Media.prototype.pause = function() {
    Cordova.exec(Cordova.Media.onStatus, Cordova.Media.onStatus, "Media", "pausePlayingAudio", [this.id]);
};

/**
 * Get duration of an audio file.
 * The duration is only set for audio that is playing, paused or stopped.
 *
 * @return      duration or -1 if not known.
 */
Media.prototype.getDuration = function() {
    _consoleLog("Media.getDuration() - src="+this.src+" id="+this.id);
    return this._duration;
};

/**
 * Get position of audio.
 */
Media.prototype.getCurrentPosition = function(success, fail) {
    _consoleLog("Media.getCurrentPosition()");
    Cordova.exec(success, fail, "Media", "getCurrentPositionAudio", [this.id]);
};

/**
 * Start recording audio file.
 */
Media.prototype.startRecord = function() {
    _consoleLog("Media.startRecord() - src="+this.src+" id="+this.id);
//    alert("Recording not supported yet.");
    Cordova.exec(Cordova.Media.onStatus, Cordova.Media.onStatus, "Media", "startRecordingAudio", [this.id, this.src]);
};

/**
 * Stop recording audio file.
 */
Media.prototype.stopRecord = function() {
    _consoleLog("Media.stopRecord() - src="+this.src+" id="+this.id);
//    alert("Recording not supported yet.");
    Cordova.exec(Cordova.Media.onStatus, Cordova.Media.onStatus, "Media", "stopRecordingAudio", [this.id]);
};

/**
 * Stop recording audio file.
 */
Media.prototype.setVolume = function(v) {
	 _consoleLog("Media.setVolume() - src="+this.src+" id="+this.id + " volume=" + v);
    Cordova.exec(Cordova.Media.onStatus, Cordova.Media.onStatus, "Media", "setVolume", [this.id, v]);
};

/**
 * Release the resources.
 */
Media.prototype.release = function() {
    Cordova.exec(Cordova.Media.onStatus, Cordova.Media.onStatus, "Media", "release", [this.id]);
};

/**
 * List of media objects.
 * PRIVATE
 */
Cordova.mediaObjects = {};

/**
 * Object that receives native callbacks.
 * PRIVATE
 * @constructor
 */
Cordova.Media = function() {};

/**
 * Get the media object.
 * PRIVATE
 *
 * @param id            The media object id (string)
 */
Cordova.Media.getMediaObject = function(id) {
    return Cordova.mediaObjects[id];
};

/**
 * Audio has status update.
 * PRIVATE
 *
 * @param id            The media object id (string)
 * @param status        The status code (int)
 * @param msg           The status message (string)
 */
Cordova.Media.onStatus = function(data) { //id, msg, value) {
    var media = Cordova.mediaObjects[data.id];
    _consoleLog("Media.onStatus("+data.msg+", "+data.value+")");
    // If state update
    if (data.msg === Media.MEDIA_STATE) {
        if (data.value === Media.MEDIA_STOPPED) {
            if (media.successCallback) {
                media.successCallback();
            }
        }
        if (media.statusCallback) {
            media.statusCallback(data.value);
        }
    }
    else if (data.msg === Media.MEDIA_DURATION) {
        media._duration = data.value;
    }
    else if (data.msg === Media.MEDIA_ERROR) {
        if (media.errorCallback) {
            media.errorCallback(data.value);
        }
    }
    else if (data.msg == Media.MEDIA_POSITION) {
        media._position = data.value;
    }
};

}());
};
