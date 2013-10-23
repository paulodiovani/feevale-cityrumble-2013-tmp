/*
* Licensed Materials - Property of IBM
* 5725-G92 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
* US Government Users Restricted Rights - Use, duplication or
* disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
*/

/**
 * Encrypted cache is a mecahnsim for storing sensitive data on the client
 * (whether it's a mobile/desktop/browser environment).
 * 
 * The implementation uses HTML5's localStorage for encrypted data storage in
 * the form of a key/value storage.
 */
__EncryptedCache = function() {
	/**
	 * This method runs asynchronously because key creation is a lengthy process
	 * (more than 2 seconds on a fast computer, and more than twice that on a
	 * mobile device).
	 * 
	 * 
	 * 
	 * @param string_credentials
	 *            the credentials used to protect the stored information
	 * @param boolen_create_if_none
	 *            whether to create an encrypted storage if one doesn't already
	 *            exist.
	 * @param function_onCompleteHandler
	 *            the method that will be run when the Encrypted Cache is ready
	 *            for use
	 * 
	 * The method should accept a single parameter that is the status of the
	 * open method. Possible status values are:
	 * 
	 * WL.EncryptedCache.OK - Encrypted Cache is ready for use
	 * 
	 * WL.EncryptedCache.ERROR_CREDENTIALS_MISMATCH - when the Encrypted Cache
	 * has already been initialized with different credentials.
	 * 
	 * @throws WL.EncryptedCache.ERROR_NO_EOC
	 *             when create_if_none parameter is false and the Encrypted
	 *             Cache haven't been initialized before
	 * @throws WL.EncryptedCache.ERROR_LOCAL_STORAGE_NOT_SUPPORTED
	 *             when HTML5's localStorage interface is unavailable.
	 * @throws WL.EncryptedCache.ERROR_KEY_CREATION_IN_PROGRESS
	 *             when Encrypted Storage is processing an open or change
	 *             credentials request.
	 */
	this.open = functionfunction(credentials, create_if_none, onCompleteHandler, onErrorHandler) {
	};

	this.write = function(key, data, onCompleteHandler, onFailureHandler) {
	};

	this.read = function(key, onCompleteHandler, onFailureHandler) {
	};

	this.remove = function(key, onCompleteHandler, onFailureHandler) {
	};

	this.close = function(onCompleteHandler, onFailureHandler) {
	};

	this.changeCredentials = function(new_credentials, onCompleteHandler, onErrorHandler) {
	};

	this.destroy = function(onCompleteHandler, onFailureHandler) {
	};
	
	this.OK = 0;
	this.ERROR_NO_EOC = 1;
	this.ERROR_CREDENTIALS_MISMATCH = 2;
	this.ERROR_EOC_TO_BE_DELETED = 3;
	this.ERROR_EOC_DELETED = 4;
	this.ERROR_UNSAFE_CREDENTIALS = 5;
	this.ERROR_EOC_CLOSED = 6;
	this.ERROR_NO_SUCH_KEY = 7;
	this.ERROR_LOCAL_STORAGE_NOT_SUPPORTED = 8;
	this.ERROR_KEY_CREATION_IN_PROGRESS = 9;

};

__WL.prototype.EncryptedCache = new __EncryptedCache;
