/*
 * Cordova is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010-2011, IBM Corporation
 */
_consoleLog("===========++++++++++++ START OF FILE.JS ++++++++++++");
if (!Cordova.hasResource("file")) {
	Cordova.addResource("file");
	/**
	 * This class provides some useful information about a file. This is the
	 * fields returned when navigator.fileMgr.getFileProperties() is called.
	 * 
	 * @constructor
	 */
	var FileProperties = function(filePath) {
		this.filePath = filePath;
		this.size = 0;
		this.lastModifiedDate = null;
	};

	/**
	 * Represents a single file.
	 * 
	 * @constructor
	 * @param name
	 *            {DOMString} name of the file, without path information
	 * @param fullPath
	 *            {DOMString} the full path of the file, including the name
	 * @param type
	 *            {DOMString} mime type
	 * @param lastModifiedDate
	 *            {Date} last modified date
	 * @param size
	 *            {Number} size of the file in bytes
	 */
	var File = function(name, fullPath, type, lastModifiedDate, size) {
		this.name = name || null;
		this.fullPath = fullPath || null;
		this.type = type || null;
		this.lastModifiedDate = lastModifiedDate || null;
		this.size = size || 0;
	};

	/** @constructor */
	var FileError = function(error) {
		  this.code = error || null;
	};

	// File error codes
	// Found in DOMException
	FileError.NOT_FOUND_ERR = 1;
	FileError.SECURITY_ERR = 2;
	FileError.ABORT_ERR = 3;

	// Added by File API specification
	FileError.NOT_READABLE_ERR = 4;
	FileError.ENCODING_ERR = 5;
	FileError.NO_MODIFICATION_ALLOWED_ERR = 6;
	FileError.INVALID_STATE_ERR = 7;
	FileError.SYNTAX_ERR = 8;
	FileError.INVALID_MODIFICATION_ERR = 9;
	FileError.QUOTA_EXCEEDED_ERR = 10;
	FileError.TYPE_MISMATCH_ERR = 11;
	FileError.PATH_EXISTS_ERR = 12;

	// -----------------------------------------------------------------------------
	// File manager
	// -----------------------------------------------------------------------------

	/** @constructor */
	var FileMgr = function() {
	};

	FileMgr.prototype.getFileProperties = function(filePath) {
		return Cordova.exec(null, null, "File", "getFileProperties",
				[ filePath ]);
	};

	FileMgr.prototype.getFileBasePaths = function() {
	};

	FileMgr.prototype.testSaveLocationExists = function(successCallback,
			errorCallback) {
		return Cordova.exec(successCallback, errorCallback, "File",
				"testSaveLocationExists", []);
	};

	FileMgr.prototype.testFileExists = function(fileName, successCallback,
			errorCallback) {
		return Cordova.exec(successCallback, errorCallback, "File",
				"testFileExists", [ fileName ]);
	};

	FileMgr.prototype.testDirectoryExists = function(dirName, successCallback,
			errorCallback) {
		return Cordova.exec(successCallback, errorCallback, "File",
				"testDirectoryExists", [ dirName ]);
	};

	FileMgr.prototype.getFreeDiskSpace = function(successCallback,
			errorCallback) {
		return Cordova.exec(successCallback, errorCallback, "File",
				"getFreeDiskSpace", []);
	};

	FileMgr.prototype.write = function(fileName, data, position,
			successCallback, errorCallback) {
		Cordova.exec(successCallback, errorCallback, "File", "write", [
				fileName, data, position ]);
	};

	FileMgr.prototype.truncate = function(fileName, size, successCallback,
			errorCallback) {
		Cordova.exec(successCallback, errorCallback, "File", "truncate", [
				fileName, size ]);
	};

	FileMgr.prototype.readAsText = function(fileName, encoding,
			successCallback, errorCallback) {
		Cordova.exec(successCallback, errorCallback, "File", "readAsText", [
				fileName, encoding ]);
	};

	FileMgr.prototype.readAsDataURL = function(fileName, successCallback,
			errorCallback) {
		Cordova.exec(successCallback, errorCallback, "File", "readAsDataURL",
				[ fileName ]);
	};

	Cordova.addConstructor(function() {
		if (typeof navigator.fileMgr === "undefined") {
			navigator.fileMgr = new FileMgr();
		}
	});
	// -----------------------------------------------------------------------------
	// ProgressEvent
	// -----------------------------------------------------------------------------
	var ProgressEvent = function(type, dict) {
        this.type = type;
        this.bubbles = false;
        this.cancelBubble = false;
        this.cancelable = false;
        this.lengthComputable = false;
        this.loaded = dict && dict.loaded ? dict.loaded : 0;
        this.total = dict && dict.total ? dict.total : 0;
        this.target = dict && dict.target ? dict.target : null;
    };

	// -----------------------------------------------------------------------------
	// File Reader
	// -----------------------------------------------------------------------------
	// TODO: All other FileMgr function operate on the SD card as root. However,
	// for FileReader & FileWriter the root is not SD card. Should this be
	// changed?

	/**
	 * This class reads the mobile device file system.
	 *
	 * For Android:
	 *      The root directory is the root of the file system.
	 *      To read from the SD card, the file name is "sdcard/my_file.txt"
	 * @constructor
	 */
	var FileReader = function() {
		this.fileName = "";

		this.readyState = 0; // FileReader.EMPTY

		// File data
		this.result = null;

		// Error
		this.error = null;

		// Event handlers
		this.onloadstart = null; // When the read starts.
		this.onprogress = null; // While reading (and decoding) file or fileBlob data, and reporting partial file data (progess.loaded/progress.total)
		this.onload = null; // When the read has successfully completed.
		this.onerror = null; // When the read has failed (see errors).
		this.onloadend = null; // When the request has completed (either in success or failure).
		this.onabort = null; // When the read has been aborted. For instance, by invoking the abort() method.
	};

	// States
	FileReader.EMPTY = 0;
	FileReader.LOADING = 1;
	FileReader.DONE = 2;

	/**
	 * Abort reading file.
	 */
	FileReader.prototype.abort = function() {
		this.result = null;

		if (this.readyState == FileReader.DONE
				|| this.readyState == FileReader.EMPTY) {
			return;
		}

		this.readyState = FileReader.DONE;

		// If abort callback
		if (typeof this.onabort === 'function') {
			this.onabort(new ProgressEvent('abort', {
				target : this
			}));
		}
		// If load end callback
		if (typeof this.onloadend === 'function') {
			this.onloadend(new ProgressEvent('loadend', {
				target : this
			}));
		}
	};

	/**
	 * Read text file.
	 *
	 * @param file          {File} File object containing file properties
	 * @param encoding      [Optional] (see http://www.iana.org/assignments/character-sets)
	 */
	FileReader.prototype.readAsText = function(file, encoding) {
		// Figure out pathing
		this.fileName = '';
		if (typeof file.fullPath === 'undefined') {
			this.fileName = file;
		} else {
			this.fileName = file.fullPath;
		}

		// Already loading something
		if (this.readyState == FileReader.LOADING) {
			throw new FileError(FileError.INVALID_STATE_ERR);
		}

		// LOADING state
		this.readyState = FileReader.LOADING;

		// If loadstart callback
		if (typeof this.onloadstart === "function") {
			this.onloadstart(new ProgressEvent("loadstart", {
				target : this
			}));
		}

		// Default encoding is UTF-8
		var enc = encoding ? encoding : "UTF-8";

		var me = this;

		// Read file
		Cordova.exec(
		// Success callback
		function(r) {
			// If DONE (cancelled), then don't do anything
			if (me.readyState === FileReader.DONE) {
				return;
			}

			// Save result
			me.result = r;

			// If onload callback
			if (typeof me.onload === "function") {
				me.onload(new ProgressEvent("load", {
					target : me
				}));
			}

			// DONE state
			me.readyState = FileReader.DONE;

			// If onloadend callback
			if (typeof me.onloadend === "function") {
				me.onloadend(new ProgressEvent("loadend", {
					target : me
				}));
			}
		},
		// Error callback
		function(e) {
			// If DONE (cancelled), then don't do anything
			if (me.readyState === FileReader.DONE) {
				return;
			}

			// DONE state
			me.readyState = FileReader.DONE;

			// null result
			me.result = null;

			// Save error
			me.error = new FileError(e);

			// If onerror callback
			if (typeof me.onerror === "function") {
				me.onerror(new ProgressEvent("error", {
					target : me
				}));
			}

			// If onloadend callback
			if (typeof me.onloadend === "function") {
				me.onloadend(new ProgressEvent("loadend", {
					target : me
				}));
			}
		}, "File", "readAsText", [ this.fileName, enc ]);
	};

	/**
	 * Read file and return data as a base64 encoded data url.
	 * A data url is of the form:
	 *      data:[<mediatype>][;base64],<data>
	 *
	 * @param file          {File} File object containing file properties
	 */
	FileReader.prototype.readAsDataURL = function(file) {
		this.fileName = "";
		if (typeof file.fullPath === "undefined") {
			this.fileName = file;
		} else {
			this.fileName = file.fullPath;
		}

		// Already loading something
		if (this.readyState == FileReader.LOADING) {
			throw new FileError(FileError.INVALID_STATE_ERR);
		}

		// LOADING state
		this.readyState = FileReader.LOADING;

		// If loadstart callback
		if (typeof this.onloadstart === "function") {
			this.onloadstart(new ProgressEvent("loadstart", {
				target : this
			}));
		}

		var me = this;

		// Read file
		Cordova.exec(
		// Success callback
		function(r) {
			// If DONE (cancelled), then don't do anything
			if (me.readyState === FileReader.DONE) {
				return;
			}

			// DONE state
			me.readyState = FileReader.DONE;

			// Save result
			me.result = r;

			// If onload callback
			if (typeof me.onload === "function") {
				me.onload(new ProgressEvent("load", {
					target : me
				}));
			}

			// If onloadend callback
			if (typeof me.onloadend === "function") {
				me.onloadend(new ProgressEvent("loadend", {
					target : me
				}));
			}
		},
		// Error callback
		function(e) {
			// If DONE (cancelled), then don't do anything
			if (me.readyState === FileReader.DONE) {
				return;
			}

			// DONE state
			me.readyState = FileReader.DONE;

			me.result = null;

			// Save error
			me.error = new FileError(e);

			// If onerror callback
			if (typeof me.onerror === "function") {
				me.onerror(new ProgressEvent("error", {
					target : me
				}));
			}

			// If onloadend callback
			if (typeof me.onloadend === "function") {
				me.onloadend(new ProgressEvent("loadend", {
					target : me
				}));
			}
		}, "File", "readAsDataURL", [ this.fileName ]);
	};

	/**
	 * Read file and return data as a binary data.
	 *
	 * @param file          {File} File object containing file properties
	 */
	FileReader.prototype.readAsBinaryString = function(file) {
		// TODO - Can't return binary data to browser.
		console.log('method "readAsBinaryString" is not supported at this time.');
	};

	/**
	 * Read file and return data as a binary data.
	 *
	 * @param file          {File} File object containing file properties
	 */
	FileReader.prototype.readAsArrayBuffer = function(file) {
		// TODO - Can't return binary data to browser.
		console.log('This method is not supported at this time.');
	};

	// -----------------------------------------------------------------------------
	// File Writer
	// -----------------------------------------------------------------------------

	/**
	 * This class writes to the mobile device file system.
	 *
	 * For Android:
	 *      The root directory is the root of the file system.
	 *      To write to the SD card, the file name is "sdcard/my_file.txt"
	 *
	 * @constructor
	 * @param file {File} File object containing file properties
	 * @param append if true write to the end of the file, otherwise overwrite the file
	 */
	var FileWriter = function(file) {
		this.fileName = "";
		this.length = 0;
		if (file) {
			this.fileName = file.fullPath || file;
			this.length = file.size || 0;
		}
		// default is to write at the beginning of the file
		this.position = 0;

		this.readyState = 0; // EMPTY

		this.result = null;

		// Error
		this.error = null;

		// Event handlers
		this.onwritestart = null; // When writing starts
		this.onprogress = null; // While writing the file, and reporting partial file data
		this.onwrite = null; // When the write has successfully completed.
		this.onwriteend = null; // When the request has completed (either in success or failure).
		this.onabort = null; // When the write has been aborted. For instance, by invoking the abort() method.
		this.onerror = null; // When the write has failed (see errors).
	};

	// States
	FileWriter.INIT = 0;
	FileWriter.WRITING = 1;
	FileWriter.DONE = 2;

	/**
	 * Abort writing file.
	 */
	FileWriter.prototype.abort = function() {
		// check for invalid state
		if (this.readyState === FileWriter.DONE
				|| this.readyState === FileWriter.INIT) {
			throw new FileError(FileError.INVALID_STATE_ERR);
		}

		// set error
		this.error = new FileError(FileError.ABORT_ERR);

		this.readyState = FileWriter.DONE;

		// If abort callback
		if (typeof this.onabort === "function") {
			this.onabort(new ProgressEvent("abort", {
				"target" : this
			}));
		}

		// If write end callback
		if (typeof this.onwriteend === "function") {
			this.onwriteend(new ProgressEvent("writeend", {
				"target" : this
			}));
		}
	};

	/**
	 * Writes data to the file
	 *
	 * @param text to be written
	 */
	FileWriter.prototype.write = function(text) {
		// Throw an exception if we are already writing a file
		if (this.readyState === FileWriter.WRITING) {
			throw new FileError(FileError.INVALID_STATE_ERR);
		}

		// WRITING state
		this.readyState = FileWriter.WRITING;

		var me = this;

		// If onwritestart callback
		if (typeof me.onwritestart === "function") {
			me.onwritestart(new ProgressEvent("writestart", {
				"target" : me
			}));
		}

		// Write file
		Cordova.exec(
		// Success callback
		function(r) {
			// If DONE (cancelled), then don't do anything
			if (me.readyState === FileWriter.DONE) {
				return;
			}

			// position always increases by bytes written because file would be extended
			me.position += r;
			// The length of the file is now where we are done writing.

			me.length = me.position;

			// DONE state
			me.readyState = FileWriter.DONE;

			// If onwrite callback
			if (typeof me.onwrite === "function") {
				me.onwrite(new ProgressEvent("write", {
					"target" : me
				}));
			}

			// If onwriteend callback
			if (typeof me.onwriteend === "function") {
				me.onwriteend(new ProgressEvent("writeend", {
					"target" : me
				}));
			}
		},
		// Error callback
		function(e) {
			// If DONE (cancelled), then don't do anything
			if (me.readyState === FileWriter.DONE) {
				return;
			}

			// DONE state
			me.readyState = FileWriter.DONE;

			// Save error
			me.error = new FileError(e);

			// If onerror callback
			if (typeof me.onerror === "function") {
				me.onerror(new ProgressEvent("error", {
					"target" : me
				}));
			}

			// If onwriteend callback
			if (typeof me.onwriteend === "function") {
				me.onwriteend(new ProgressEvent("writeend", {
					"target" : me
				}));
			}
		}, "File", "write", [ this.fileName, text, this.position ]);
	};

	/**
	 * Moves the file pointer to the location specified.
	 *
	 * If the offset is a negative number the position of the file
	 * pointer is rewound.  If the offset is greater than the file
	 * size the position is set to the end of the file.
	 *
	 * @param offset is the location to move the file pointer to.
	 */
	FileWriter.prototype.seek = function(offset) {
		// Throw an exception if we are already writing a file
		if (this.readyState === FileWriter.WRITING) {
			throw new FileError(FileError.INVALID_STATE_ERR);
		}

		if (!offset && offset !== 0) {
			return;
		}

		// See back from end of file.
		if (offset < 0) {
			this.position = Math.max(offset + this.length, 0);
		}
		// Offset is bigger than file size so set position
		// to the end of the file.
		else if (offset > this.length) {
			this.position = this.length;
		}
		// Offset is between 0 and file size so set the position
		// to start writing.
		else {
			this.position = offset;
		}
	};

	/**
	 * Truncates the file to the size specified.
	 *
	 * @param size to chop the file at.
	 */
	FileWriter.prototype.truncate = function(size) {
		// Throw an exception if we are already writing a file
		if (this.readyState === FileWriter.WRITING) {
			throw new FileError(FileError.INVALID_STATE_ERR);
		}

		// WRITING state
		this.readyState = FileWriter.WRITING;

		var me = this;

		// If onwritestart callback
		if (typeof me.onwritestart === "function") {
			me.onwritestart(new ProgressEvent("writestart", {
				"target" : this
			}));
		}

		// Write file
		Cordova.exec(
		// Success callback
		function(r) {
			// If DONE (cancelled), then don't do anything
			if (me.readyState === FileWriter.DONE) {
				return;
			}

			// DONE state
			me.readyState = FileWriter.DONE;

			// Update the length of the file
			me.length = r;
			me.position = Math.min(me.position, r);

			// If onwrite callback
			if (typeof me.onwrite === "function") {
				me.onwrite(new ProgressEvent("write", {
					"target" : me
				}));
			}

			// If onwriteend callback
			if (typeof me.onwriteend === "function") {
				me.onwriteend(new ProgressEvent("writeend", {
					"target" : me
				}));
			}
		},
		// Error callback
		function(e) {
			// If DONE (cancelled), then don't do anything
			if (me.readyState === FileWriter.DONE) {
				return;
			}

			// DONE state
			me.readyState = FileWriter.DONE;

			// Save error
			me.error = new FileError(e);

			// If onerror callback
			if (typeof me.onerror === "function") {
				me.onerror(new ProgressEvent("error", {
					"target" : me
				}));
			}

			// If onwriteend callback
			if (typeof me.onwriteend === "function") {
				me.onwriteend(new ProgressEvent("writeend", {
					"target" : me
				}));
			}
		}, "File", "truncate", [ this.fileName, size ]);
	};

	/**
	 * Information about the state of the file or directory
	 *
	 * {Date} modificationTime (readonly)
	 */
	var Metadata = function(time) {
		this.modificationTime = (typeof time != 'undefined' ? new Date(time)
				: null);
	};

	/**
	 * Supplies arguments to methods that lookup or create files and directories
	 * 
	 * @constructor
	 * @param {boolean}
	 *            create file or directory if it doesn't exist
	 * @param {boolean}
	 *            exclusive if true the command will fail if the file or
	 *            directory exists
	 */
	var Flags = function(create, exclusive) {
		this.create = create || false;
		this.exclusive = exclusive || false;
	};

	/**
	 * An interface representing a file system
	 *
	 * @constructor
	 * {DOMString} name the unique name of the file system (readonly)
	 * {DirectoryEntry} root directory of the file system (readonly)
	 */
	var FileSystem = function(name, root) {
		this.name = name || null;
		if (root) {
			this.root = new DirectoryEntry(root.name, root.fullPath);
		}
	};

	/**
	 * An interface that lists the files and directories in a directory.
	 */
	function DirectoryReader(path) {
		this.path = path || null;
	}

	/**
	 * Returns a list of entries from a directory.
	 *
	 * @param {Function} successCallback is called with a list of entries
	 * @param {Function} errorCallback is called with a FileError
	 */
	DirectoryReader.prototype.readEntries = function(successCallback,
			errorCallback) {
		var win = typeof successCallback !== 'function' ? null : function(
				result) {
			var retVal = [];
			for ( var i = 0; i < result.length; i++) {
				var entry = null;
				if (result[i].isDirectory) {
					entry = new DirectoryEntry();
				} else if (result[i].isFile) {
					entry = new FileEntry();
				}
				entry.isDirectory = result[i].isDirectory;
				entry.isFile = result[i].isFile;
				entry.name = result[i].name;
				entry.fullPath = result[i].fullPath;
				retVal.push(entry);
			}
			successCallback(retVal);
		};
		var fail = typeof errorCallback !== 'function' ? null : function(code) {
			errorCallback(new FileError(code));
		};
		Cordova.exec(win, fail, "File", "readEntries", [ this.path ]);
	};

	/**
	 * Represents a file or directory on the local file system.
	 *
	 * @param isFile
	 *            {boolean} true if DirectoryEntry is a file (readonly)
	 * @param isDirectory
	 *            {boolean} true if DirectoryEntry is a directory (readonly)
	 * @param name
	 *            {DOMString} name of the file or directory, excluding the path
	 *            leading to it (readonly)
	 * @param fullPath
	 *            {DOMString} the absolute full path to the file or directory
	 *            (readonly)
	 */
	function DirectoryEntry(name, fullPath, fileSystem) {
		this.isFile = false;
		this.isDirectory = true;
		this.name = name || '';
		this.fullPath = fullPath || '';
		this.filesystem = fileSystem || null;
	}

	/**
	 * Look up the metadata of the entry.
	 *
	 * @param successCallback
	 *            {Function} is called with a Metadata object
	 * @param errorCallback
	 *            {Function} is called with a FileError
	 */
	DirectoryEntry.prototype.getMetadata = function(successCallback,
			errorCallback) {
		var success = typeof successCallback !== 'function' ? null : function(
				lastModified) {
			var metadata = new Metadata(lastModified);
			successCallback(metadata);
		};
		var fail = typeof errorCallback !== 'function' ? null : function(code) {
			errorCallback(new FileError(code));
		};

		Cordova.exec(success, fail, "File", "getMetadata", [ this.fullPath ]);
	};

	/**
	 * Set the metadata of the entry.
	 *
	 * @param successCallback
	 *            {Function} is called with a Metadata object
	 * @param errorCallback
	 *            {Function} is called with a FileError
	 * @param metadataObject
	 *            {Object} keys and values to set
	 */
	DirectoryEntry.prototype.setMetadata = function(successCallback,
			errorCallback, metadataObject) {

		Cordova.exec(successCallback, errorCallback, "File", "setMetadata", [
				this.fullPath, metadataObject ]);
	};

	/**
	 * Move a file or directory to a new location.
	 *
	 * @param parent
	 *            {DirectoryEntry} the directory to which to move this entry
	 * @param newName
	 *            {DOMString} new name of the entry, defaults to the current name
	 * @param successCallback
	 *            {Function} called with the new DirectoryEntry object
	 * @param errorCallback
	 *            {Function} called with a FileError
	 */
	DirectoryEntry.prototype.moveTo = function(parent, newName,
			successCallback, errorCallback) {
		var fail = function(code) {
			if (typeof errorCallback === 'function') {
				errorCallback(new FileError(code));
			}
		};
		// user must specify parent DirectoryEntry
		if (!parent) {
			fail(FileError.NOT_FOUND_ERR);
			return;
		}
		// source path
		var srcPath = this.fullPath,
		// entry name
		name = newName || this.name, success = function(entry) {
			if (entry) {
				if (typeof successCallback === 'function') {
					// create appropriate DirectoryEntry object
					var result = (entry.isDirectory) ? new DirectoryEntry(
							entry.name, entry.fullPath) : new FileEntry(
							entry.name, entry.fullPath);
					try {
						successCallback(result);
					} catch (e) {
						console.log('Error invoking callback: ' + e);
					}
				}
			} else {
				// no DirectoryEntry object returned
				fail(FileError.NOT_FOUND_ERR);
			}
		};

		// copy
		Cordova.exec(success, fail, "File", "moveTo",
				[ srcPath, parent.fullPath, name ]);
	};

	/**
	 * Copy a directory to a different location.
	 *
	 * @param parent
	 *            {DirectoryEntry} the directory to which to copy the entry
	 * @param newName
	 *            {DOMString} new name of the entry, defaults to the current name
	 * @param successCallback
	 *            {Function} called with the new DirectoryEntry object
	 * @param errorCallback
	 *            {Function} called with a FileError
	 */
	DirectoryEntry.prototype.copyTo = function(parent, newName,
			successCallback, errorCallback) {
		var fail = function(code) {
			if (typeof errorCallback === 'function') {
				errorCallback(new FileError(code));
			}
		};

		// user must specify parent DirectoryEntry
		if (!parent) {
			fail(FileError.NOT_FOUND_ERR);
			return;
		}

		// source path
		var srcPath = this.fullPath,
		// entry name
		name = newName || this.name,
		// success callback
		success = function(entry) {
			if (entry) {
				if (typeof successCallback === 'function') {
					// create appropriate DirectoryEntry object
					var result = (entry.isDirectory) ? new DirectoryEntry(
							entry.name, entry.fullPath) : new FileEntry(
							entry.name, entry.fullPath);
					try {
						successCallback(result);
					} catch (e) {
						console.log('Error invoking callback: ' + e);
					}
				}
			} else {
				// no DirectoryEntry object returned
				fail(FileError.NOT_FOUND_ERR);
			}
		};

		// copy
		Cordova.exec(success, fail, "File", "copyTo",
				[ srcPath, parent.fullPath, name ]);
	};

	/**
	 * Return a URL that can be used to identify this entry.
	 */
	DirectoryEntry.prototype.toURL = function() {
		// fullPath attribute contains the full URL
		return this.fullPath;
	};

	/**
	 * Returns a URI that can be used to identify this entry.
	 *
	 * @param {DOMString} mimeType for a FileEntry, the mime type to be used to interpret the file, when loaded through this URI.
	 * @return uri
	 */
	DirectoryEntry.prototype.toURI = function(mimeType) {
		console.log("DEPRECATED: Update your code to use 'toURL'");
		// fullPath attribute contains the full URI
		return this.toURL();
	};

	/**
	 * Remove a file or directory. It is an error to attempt to delete a
	 * directory that is not empty. It is an error to attempt to delete a
	 * root directory of a file system.
	 *
	 * @param successCallback {Function} called with no parameters
	 * @param errorCallback {Function} called with a FileError
	 */
	DirectoryEntry.prototype.remove = function(successCallback, errorCallback) {
		var fail = typeof errorCallback !== 'function' ? null : function(code) {
			errorCallback(new FileError(code));
		};
		Cordova.exec(successCallback, fail, "File", "remove", [ this.fullPath ]);
	};

	/**
	 * Look up the parent DirectoryEntry of this entry.
	 *
	 * @param successCallback {Function} called with the parent DirectoryEntry object
	 * @param errorCallback {Function} called with a FileError
	 */
	DirectoryEntry.prototype.getParent = function(successCallback,
			errorCallback) {
		var win = typeof successCallback !== 'function' ? null : function(
				result) {
			var entry = new DirectoryEntry(result.name, result.fullPath);
			successCallback(entry);
		};
		var fail = typeof errorCallback !== 'function' ? null : function(code) {
			errorCallback(new FileError(code));
		};
		Cordova.exec(win, fail, "File", "getParent", [ this.fullPath ]);
	};

	/**
	 * Creates a new DirectoryReader to read entries from this directory
	 */
	DirectoryEntry.prototype.createReader = function() {
		return new DirectoryReader(this.fullPath);
	};

	/**
	 * Creates or looks up a directory
	 *
	 * @param {DOMString} path either a relative or absolute path from this directory in which to look up or create a directory
	 * @param {Flags} options to create or excluively create the directory
	 * @param {Function} successCallback is called with the new entry
	 * @param {Function} errorCallback is called with a FileError
	 */
	DirectoryEntry.prototype.getDirectory = function(path, options,
			successCallback, errorCallback) {
		var win = typeof successCallback !== 'function' ? null : function(
				result) {
			var entry = new DirectoryEntry(result.name, result.fullPath);
			successCallback(entry);
		};
		var fail = typeof errorCallback !== 'function' ? null : function(code) {
			errorCallback(new FileError(code));
		};
		Cordova.exec(win, fail, "File", "getDirectory",
				[ this.fullPath, path, options ]);
	};

	/**
	 * Deletes a directory and all of it's contents
	 *
	 * @param {Function} successCallback is called with no parameters
	 * @param {Function} errorCallback is called with a FileError
	 */
	DirectoryEntry.prototype.removeRecursively = function(successCallback,
			errorCallback) {
		var fail = typeof errorCallback !== 'function' ? null : function(code) {
			errorCallback(new FileError(code));
		};
		Cordova.exec(successCallback, fail, "File", "removeRecursively",
				[ this.fullPath ]);
	};

	/**
	 * Creates or looks up a file
	 *
	 * @param {DOMString} path either a relative or absolute path from this directory in which to look up or create a file
	 * @param {Flags} options to create or excluively create the file
	 * @param {Function} successCallback is called with the new entry
	 * @param {Function} errorCallback is called with a FileError
	 */
	DirectoryEntry.prototype.getFile = function(path, options, successCallback,
			errorCallback) {
		var win = typeof successCallback !== 'function' ? null : function(
				result) {
			var entry = new FileEntry(result.name, result.fullPath);
			successCallback(entry);
		};
		var fail = typeof errorCallback !== 'function' ? null : function(code) {
			errorCallback(new FileError(code));
		};
		Cordova.exec(win, fail, "File", "getFile", [ this.fullPath, path, options ]);
	};

	/**
	 * Represents a file or directory on the local file system.
	 *
	 * @param isFile
	 *            {boolean} true if FileEntry is a file (readonly)
	 * @param isDirectory
	 *            {boolean} true if FileEntry is a directory (readonly)
	 * @param name
	 *            {DOMString} name of the file or directory, excluding the path
	 *            leading to it (readonly)
	 * @param fullPath
	 *            {DOMString} the absolute full path to the file or directory
	 *            (readonly)
	 */
	function FileEntry(name, fullPath, fileSystem) {
	    this.isFile = true;
	    this.isDirectory = false;
	    this.name = name || '';
	    this.fullPath = fullPath || '';
	    this.filesystem = fileSystem || null;
	}

	/**
	 * Look up the metadata of the entry.
	 *
	 * @param successCallback
	 *            {Function} is called with a Metadata object
	 * @param errorCallback
	 *            {Function} is called with a FileError
	 */
	FileEntry.prototype.getMetadata = function(successCallback, errorCallback) {
	  var success = typeof successCallback !== 'function' ? null : function(lastModified) {
	      var metadata = new Metadata(lastModified);
	      successCallback(metadata);
	  };
	  var fail = typeof errorCallback !== 'function' ? null : function(code) {
	      errorCallback(new FileError(code));
	  };

	  Cordova.exec(success, fail, "File", "getMetadata", [this.fullPath]);
	};

	/**
	 * Set the metadata of the entry.
	 *
	 * @param successCallback
	 *            {Function} is called with a Metadata object
	 * @param errorCallback
	 *            {Function} is called with a FileError
	 * @param metadataObject
	 *            {Object} keys and values to set
	 */
	FileEntry.prototype.setMetadata = function(successCallback, errorCallback, metadataObject) {

	  Cordova.exec(successCallback, errorCallback, "File", "setMetadata", [this.fullPath, metadataObject]);
	};

	/**
	 * Move a file or directory to a new location.
	 *
	 * @param parent
	 *            {DirectoryEntry} the directory to which to move this entry
	 * @param newName
	 *            {DOMString} new name of the entry, defaults to the current name
	 * @param successCallback
	 *            {Function} called with the new DirectoryEntry object
	 * @param errorCallback
	 *            {Function} called with a FileError
	 */
	FileEntry.prototype.moveTo = function(parent, newName, successCallback, errorCallback) {
	    var fail = function(code) {
	        if (typeof errorCallback === 'function') {
	            errorCallback(new FileError(code));
	        }
	    };
	    // user must specify parent FileEntry
	    if (!parent) {
	        fail(FileError.NOT_FOUND_ERR);
	        return;
	    }
	    // source path
	    var srcPath = this.fullPath,
	        // entry name
	        name = newName || this.name,
	        success = function(entry) {
	            if (entry) {
	                if (typeof successCallback === 'function') {
	                    // create appropriate FileEntry object
	                    var result = (entry.isDirectory) ? new DirectoryEntry(entry.name, entry.fullPath) : new FileEntry(entry.name, entry.fullPath);
	                    try {
	                        successCallback(result);
	                    }
	                    catch (e) {
	                        console.log('Error invoking callback: ' + e);
	                    }
	                }
	            }
	            else {
	                // no FileEntry object returned
	                fail(FileError.NOT_FOUND_ERR);
	            }
	        };

	    // copy
	    Cordova.exec(success, fail, "File", "moveTo", [srcPath, parent.fullPath, name]);
	};

	/**
	 * Copy a directory to a different location.
	 *
	 * @param parent
	 *            {DirectoryEntry} the directory to which to copy the entry
	 * @param newName
	 *            {DOMString} new name of the entry, defaults to the current name
	 * @param successCallback
	 *            {Function} called with the new FileEntry object
	 * @param errorCallback
	 *            {Function} called with a FileError
	 */
	FileEntry.prototype.copyTo = function(parent, newName, successCallback, errorCallback) {
	    var fail = function(code) {
	        if (typeof errorCallback === 'function') {
	            errorCallback(new FileError(code));
	        }
	    };

	    // user must specify parent FileEntry
	    if (!parent) {
	        fail(FileError.NOT_FOUND_ERR);
	        return;
	    }

	        // source path
	    var srcPath = this.fullPath,
	        // entry name
	        name = newName || this.name,
	        // success callback
	        success = function(entry) {
	            if (entry) {
	                if (typeof successCallback === 'function') {
	                    // create appropriate FileEntry object
	                    var result = (entry.isDirectory) ? new DirectoryEntry(entry.name, entry.fullPath) : new FileEntry(entry.name, entry.fullPath);
	                    try {
	                        successCallback(result);
	                    }
	                    catch (e) {
	                        console.log('Error invoking callback: ' + e);
	                    }
	                }
	            }
	            else {
	                // no FileEntry object returned
	                fail(FileError.NOT_FOUND_ERR);
	            }
	        };

	    // copy
	    Cordova.exec(success, fail, "File", "copyTo", [srcPath, parent.fullPath, name]);
	};

	/**
	 * Return a URL that can be used to identify this entry.
	 */
	FileEntry.prototype.toURL = function() {
	    // fullPath attribute contains the full URL
	    return this.fullPath;
	};

	/**
	 * Returns a URI that can be used to identify this entry.
	 *
	 * @param {DOMString} mimeType for a FileEntry, the mime type to be used to interpret the file, when loaded through this URI.
	 * @return uri
	 */
	FileEntry.prototype.toURI = function(mimeType) {
	    console.log("DEPRECATED: Update your code to use 'toURL'");
	    // fullPath attribute contains the full URI
	    return this.toURL();
	};

	/**
	 * Remove a file or directory. It is an error to attempt to delete a
	 * directory that is not empty. It is an error to attempt to delete a
	 * root directory of a file system.
	 *
	 * @param successCallback {Function} called with no parameters
	 * @param errorCallback {Function} called with a FileError
	 */
	FileEntry.prototype.remove = function(successCallback, errorCallback) {
	    var fail = typeof errorCallback !== 'function' ? null : function(code) {
	        errorCallback(new FileError(code));
	    };
	    Cordova.exec(successCallback, fail, "File", "remove", [this.fullPath]);
	};

	/**
	 * Look up the parent DirectoryEntry of this entry.
	 *
	 * @param successCallback {Function} called with the parent DirectoryEntry object
	 * @param errorCallback {Function} called with a FileError
	 */
	FileEntry.prototype.getParent = function(successCallback, errorCallback) {
	    var win = typeof successCallback !== 'function' ? null : function(result) {
	        var entry = new DirectoryEntry(result.name, result.fullPath);
	        successCallback(entry);
	    };
	    var fail = typeof errorCallback !== 'function' ? null : function(code) {
	        errorCallback(new FileError(code));
	    };
	    Cordova.exec(win, fail, "File", "getParent", [this.fullPath]);
	};

	/**
	 * Creates a new FileWriter associated with the file that this FileEntry represents.
	 *
	 * @param {Function} successCallback is called with the new FileWriter
	 * @param {Function} errorCallback is called with a FileError
	 */
	FileEntry.prototype.createWriter = function(successCallback, errorCallback) {
	    this.file(function(filePointer) {
	        var writer = new FileWriter(filePointer);

	        if (writer.fileName === null || writer.fileName === "") {
	            if (typeof errorCallback === "function") {
	                errorCallback(new FileError(FileError.INVALID_STATE_ERR));
	            }
	        } else {
	            if (typeof successCallback === "function") {
	                successCallback(writer);
	            }
	        }
	    }, errorCallback);
	};

	/**
	 * Returns a File that represents the current state of the file that this FileEntry represents.
	 *
	 * @param {Function} successCallback is called with the new File object
	 * @param {Function} errorCallback is called with a FileError
	 */
	FileEntry.prototype.file = function(successCallback, errorCallback) {
	    var win = typeof successCallback !== 'function' ? null : function(f) {
	        var file = new File(f.name, f.fullPath, f.type, f.lastModifiedDate, f.size);
	        successCallback(file);
	    };
	    var fail = typeof errorCallback !== 'function' ? null : function(code) {
	        errorCallback(new FileError(code));
	    };
	    Cordova.exec(win, fail, "File", "getFileMetadata", [this.fullPath]);
	};


	/** @constructor */
	var LocalFileSystem = function() {
	};

	// File error codes
	LocalFileSystem.TEMPORARY = 0;
	LocalFileSystem.PERSISTENT = 1;

	/**
	 * Request a file system in which to store application data.
	 * @param type  local file system type
	 * @param size  indicates how much storage space, in bytes, the application expects to need
	 * @param successCallback  invoked with a FileSystem object
	 * @param errorCallback  invoked if error occurs retrieving file system
	 */
	var requestFileSystem = function(type, size, successCallback, errorCallback) {
	    var fail = function(code) {
	        if (typeof errorCallback === 'function') {
	            errorCallback(new FileError(code));
	        }
	    };

	    if (type < 0 || type > 3) {
	        fail(FileError.SYNTAX_ERR);
	    } else {
	        // if successful, return a FileSystem object
	        var success = function(file_system) {
	            if (file_system) {
	                if (typeof successCallback === 'function') {
	                    // grab the name and root from the file system object
	                    var result = new FileSystem(file_system.name, file_system.root);
	                    successCallback(result);
	                }
	            }
	            else {
	                // no FileSystem object returned
	                fail(FileError.NOT_FOUND_ERR);
	            }
	        };
	        Cordova.exec(success, fail, "File", "requestFileSystem", [type, size]);
	    }
	};

	/**
	 * 
	 * @param {DOMString}
	 *            uri referring to a local file in a filesystem
	 * @param {Function}
	 *            successCallback is called with the new entry
	 * @param {Function}
	 *            errorCallback is called with a FileError
	 */
	LocalFileSystem.prototype.resolveLocalFileSystemURI = function(uri,
			successCallback, errorCallback) {
		 // error callback
	    var fail = function(error) {
	        if (typeof errorCallback === 'function') {
	            errorCallback(new FileError(error));
	        }
	    };
	    // sanity check for 'not:valid:filename'
	    if(!uri || uri.split(":").length > 2) {
	        setTimeout( function() {
	            fail(FileError.ENCODING_ERR);
	        },0);
	        return;
	    }
	    // if successful, return either a file or directory entry
	    var success = function(entry) {
	        var result;
	        if (entry) {
	            if (typeof successCallback === 'function') {
	                // create appropriate Entry object
	                result = (entry.isDirectory) ? new DirectoryEntry(entry.name, entry.fullPath) : new FileEntry(entry.name, entry.fullPath);
	                try {
	                    successCallback(result);
	                }
	                catch (e) {
	                    console.log('Error invoking callback: ' + e);
	                }
	            }
	        }
	        else {
	            // no Entry object returned
	            fail(FileError.NOT_FOUND_ERR);
	        }
	    };

	    Cordova.exec(success, fail, "File", "resolveLocalFileSystemURI", [uri]);
	};

	/**
	 * This function returns and array of contacts. It is required as we need to
	 * convert raw JSON objects into concrete Contact objects. Currently this
	 * method is called after navigator.service.contacts.find but before the
	 * find methods success call back.
	 * 
	 * @param a
	 *            JSON Objects that need to be converted to DirectoryEntry or
	 *            FileEntry objects.
	 * @returns an entry
	 */
	LocalFileSystem.prototype._castFS = function(pluginResult) {
		var entry = null;
		entry = new DirectoryEntry();
		entry.isDirectory = pluginResult.message.root.isDirectory;
		entry.isFile = pluginResult.message.root.isFile;
		entry.name = pluginResult.message.root.name;
		entry.fullPath = pluginResult.message.root.fullPath;
		pluginResult.message.root = entry;
		return pluginResult;
	};

	LocalFileSystem.prototype._castEntry = function(pluginResult) {
		var entry = null;
		if (pluginResult.message.isDirectory) {
			_consoleLog("This is a dir");
			entry = new DirectoryEntry();
		} else if (pluginResult.message.isFile) {
			_consoleLog("This is a file");
			entry = new FileEntry();
		}
		entry.isDirectory = pluginResult.message.isDirectory;
		entry.isFile = pluginResult.message.isFile;
		entry.name = pluginResult.message.name;
		entry.fullPath = pluginResult.message.fullPath;
		pluginResult.message = entry;
		return pluginResult;
	};

	LocalFileSystem.prototype._castEntries = function(pluginResult) {
		var entries = pluginResult.message;
		var retVal = [];
		for ( var i = 0; i < entries.length; i++) {
			retVal.push(window.localFileSystem._createEntry(entries[i]));
		}
		pluginResult.message = retVal;
		return pluginResult;
	};

	LocalFileSystem.prototype._createEntry = function(castMe) {
		var entry = null;
		if (castMe.isDirectory) {
			_consoleLog("This is a dir");
			entry = new DirectoryEntry();
		} else if (castMe.isFile) {
			_consoleLog("This is a file");
			entry = new FileEntry();
		}
		entry.isDirectory = castMe.isDirectory;
		entry.isFile = castMe.isFile;
		entry.name = castMe.name;
		entry.fullPath = castMe.fullPath;
		return entry;
	};

	LocalFileSystem.prototype._castDate = function(pluginResult) {
		if (pluginResult.message.modificationTime) {
			var modTime = new Date(pluginResult.message.modificationTime);
			pluginResult.message.modificationTime = modTime;
		} else if (pluginResult.message.lastModifiedDate) {
			var file = new File();
			file.size = pluginResult.message.size;
			file.type = pluginResult.message.type;
			file.name = pluginResult.message.name;
			file.fullPath = pluginResult.message.fullPath;
			file.lastModifiedDate = new Date(
					pluginResult.message.lastModifiedDate);
			pluginResult.message = file;
		}
		return pluginResult;
	};

	/**
	 * Add the FileSystem interface into the browser.
	 */
	_consoleLog("===========++++++++++++ ADDING CONSTRUCTOR FILE.JS ++++++++++++");
	Cordova
			.addConstructor(function() {
				_consoleLog("========================= FILE.JS ===============");
				var pgLocalFileSystem = new LocalFileSystem();
				// Needed for cast methods
				_consoleLog("***** typeof window.localFileSystem="
						+ typeof window.localFileSystem);
				if (typeof window.localFileSystem == "undefined") {
					window.localFileSystem = pgLocalFileSystem;
					_consoleLog("***** SETTING LFS.");
				}
				if (typeof window.requestFileSystem == "undefined")
					window.requestFileSystem = pgLocalFileSystem.requestFileSystem;
				if (typeof window.resolveLocalFileSystemURI == "undefined")
					window.resolveLocalFileSystemURI = pgLocalFileSystem.resolveLocalFileSystemURI;
			});
}
