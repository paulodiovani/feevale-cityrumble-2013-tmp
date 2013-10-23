/*
 * Cordova is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010-2013, IBM Corporation
 */

if (!Cordova.hasResource("camera")) {
Cordova.addResource("camera");
(function() {

/**
 * This class provides access to the device camera.
 * 
 * @constructor
 */
var Camera = function() {
    this.successCallback = null;
    this.errorCallback = null;
    this.options = null;
};

/**
 * Format of image that returned from getPicture.
 * 
 * Example: navigator.camera.getPicture(success, fail, { quality: 80,
 * destinationType: Camera.DestinationType.DATA_URL, sourceType:
 * Camera.PictureSourceType.PHOTOLIBRARY})
 */
Camera.DestinationType = {
    DATA_URL: 0,            // Return base64 encoded string
    FILE_URI: 1,            // Return file uri (content://media/external/images/media/2 for Android)
    NATIVE_URI: 2        	// Return native uri (eg. asset-library://... for iOS)
};
Camera.prototype.DestinationType = Camera.DestinationType;

/**
 * Encoding of image returned from getPicture.
 * 
 * Example: navigator.camera.getPicture(success, fail, { quality: 80,
 * destinationType: Camera.DestinationType.DATA_URL, sourceType:
 * Camera.PictureSourceType.CAMERA, encodingType: Camera.EncodingType.PNG})
 */
Camera.EncodingType = {
    JPEG: 0,                    // Return JPEG encoded image
    PNG: 1                      // Return PNG encoded image
};
Camera.prototype.EncodingType = Camera.EncodingType;

/**
 * Source to getPicture from.
 * 
 * Example: navigator.camera.getPicture(success, fail, { quality: 80,
 * destinationType: Camera.DestinationType.DATA_URL, sourceType:
 * Camera.PictureSourceType.PHOTOLIBRARY})
 */
Camera.PictureSourceType = {
    PHOTOLIBRARY : 0,           // Choose image from picture library (same as
								// SAVEDPHOTOALBUM for Android)
    CAMERA : 1,                 // Take picture from camera
    SAVEDPHOTOALBUM : 2         // Choose image from picture library (same as
								// PHOTOLIBRARY for Android)
};
Camera.prototype.PictureSourceType = Camera.PictureSourceType;

/*
 * Camera popover options for iOS.
 */
CameraPopoverOptions = function(x, y, width, height, arrowDirection) {
    // information of rectangle that popover should be anchored to
    this.x = x || 0;
    this.y = y || 32;
    this.width = width || 320;
    this.height = height || 480;
    // The direction of the popover arrow
    this.arrowDir = arrowDir || Camera.PopoverArrowDirection.ARROW_ANY;
};

/*
 * Camera popover arrow direction for PopOver
 */
Camera.PopoverArrowDirection = {
        ARROW_UP : 1,        // matches iOS UIPopoverArrowDirection constants
        ARROW_DOWN : 2,
        ARROW_LEFT : 4,
        ARROW_RIGHT : 8,
        ARROW_ANY : 15
    };
Camera.prototype.PopoverArrowDirection = Camera.PopoverArrowDirection;

Camera.MediaType = { 
	    PICTURE: 0,             // allow selection of still pictures only. DEFAULT. Will return format specified via DestinationType
	    VIDEO: 1,               // allow selection of video only, WILL ALWAYS RETURN FILE_URI
	    ALLMEDIA : 2            // allow selection from all media types
};
Camera.prototype.MediaType = Camera.MediaType;

Camera.prototype.cleanup = function(successCallback, errorCallback) {
   	Cordova.exec(successCallback, errorCallback, "Camera", "cleanup");
};

/**
 * Gets a picture from source defined by "options.sourceType", and returns the
 * image as defined by the "options.destinationType" option.
 * 
 * The defaults are sourceType=CAMERA and destinationType=DATA_URL.
 * 
 * @param {Function}
 *            successCallback
 * @param {Function}
 *            errorCallback
 * @param {Object}
 *            options
 */
Camera.prototype.getPicture = function(successCallback, errorCallback, options) {

    // successCallback required
    if (typeof successCallback !== "function") {
        _consoleLog("Camera Error: successCallback is not a function");
        return;
    }

    // errorCallback optional
    if (errorCallback && (typeof errorCallback !== "function")) {
        _consoleLog("Camera Error: errorCallback is not a function");
        return;
    }

    this.options = options;
    var quality = 80;
    if (options.quality) {
        quality = this.options.quality;
    }
    
//    The following is not used
//    var maxResolution = 0;
//    if (options.maxResolution) {
//    	maxResolution = this.options.maxResolution;
//    }
    
    var destinationType = Camera.DestinationType.DATA_URL;
    if (this.options.destinationType) {
        destinationType = this.options.destinationType;
    }
    var sourceType = Camera.PictureSourceType.CAMERA;
    if (typeof this.options.sourceType === "number") {
        sourceType = this.options.sourceType;
    }
    var encodingType = Camera.EncodingType.JPEG;
    if (typeof options.encodingType == "number") {
        encodingType = this.options.encodingType;
    }
    
    var targetWidth = -1;
    if (typeof options.targetWidth == "number") {
        targetWidth = options.targetWidth;
    } else if (typeof options.targetWidth == "string") {
        var width = new Number(options.targetWidth);
        if (isNaN(width) === false) {
            targetWidth = width.valueOf();
        }
    }

    var targetHeight = -1;
    if (typeof options.targetHeight == "number") {
        targetHeight = options.targetHeight;
    } else if (typeof options.targetHeight == "string") {
        var height = new Number(options.targetHeight);
        if (isNaN(height) === false) {
            targetHeight = height.valueOf();
        }
    }
    
    var popoverOptions = null;
    if (options.popoverOptions instanceof CameraPopoverOptions) {
    	popoverOptions = options.popoverOptions;
    }
    
    Cordova.exec(successCallback, errorCallback, "Camera", "takePicture", [quality, destinationType, sourceType, targetWidth, targetHeight, encodingType, popoverOptions]);
};

Cordova.addConstructor(function() {
    navigator.camera = new Camera();
});
}());
}
