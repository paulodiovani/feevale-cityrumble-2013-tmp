/*
 *  Licensed Materials - Property of IBM
 *  5725-G92 (C) Copyright IBM Corp. 2011, 2013. All Rights Reserved.
 *  US Government Users Restricted Rights - Use, duplication or
 *  disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

__JSONStore = function(){
 
	/**
	* Provision collections.
	* 
	* @param collections {object}
	*	collectionName (string [a-z, A-Z, 0-9])
	*	searchFields (object, default: {})
	*	additionalSearchFields (object, default: {})
	*	adapter (object, default: {})
	*	adapter.name (string) - Name of the Adapter
	*	adapter.add (string) - Name of the add procedure
	*	adapter.remove (string) - Name of remove procedure
	*	adapter.load (object)
	*	adapter.load.procedure (string) - Name of the load procedure
	*	adapter.load.params (array) - Parameters sent to the load procedure
	*	adapter.load.key (string) - Key in the response containing objects to add
	*	adapter.accept (function, returns: boolean) - Called after push with the response from the adapter.
	*	adapter.timeout (integer) - Timeout for the adapter call
	*
	* @param [options] {object} 
	*	username (string [a-z, A-Z, 0-9], default: 'jsonstore')
	*	password (string, default: none),
	*	clear (boolean, default: false) 
	*	localKeyGen (boolean, default: false)
	*
	* @return {promise} Resolved when all collections have been initialized. 
    * 	Rejected when there is a failure (no accessors created).
	*
	*/
	this.init = function (collections, options){ };
	
	/** 
	* Get accessors to collections.
	* @param collection {string} Name of the collection
	*
	* @return {accessor} Allows access to the collection by name
	*/
	this.get = function (collection){ };
		
	/**
	* Remove access to the accessors.
	* @param [options] {Object}
    * 	onSuccess (function, default: none, deprecated)
    * 	onFailure (function, default: none, deprecated)
	*
	* @return {Promise} Resolved when the operation succeeds. 
    * 	Rejected when there is a failure.
	*/
	this.closeAll = function (options) { };
	
	/** 
	* Build a JSONStore-style document with an id and a JavaScript object.
	* @param id {integer} _id for the Document
	* @param data {object} JSON data for the Document
	*
	* @return {object} JSONStore-style Document.
	*/
	this.documentify = function (id, data) { };
	
	/**
	* Change the password used for data encryption.
	* 
	* @param oldPassword {string}
    *	Must be alphanumeric ([a-z, A-Z, 0-9]) with at least 1 character.
	*
	* @param newPassword {string} The new password
    * 	Must be alphanumeric ([a-z, A-Z, 0-9]) with at least 1 character.
	*
	* @param username {string} (default: jsonstore)
    *	Must be an alphanumeric string ([a-z, A-Z, 0-9]) with length greater than 0.
	*
	* @param [options] {object}
    *	onSuccess (function, default: none, deprecated)
    *	onFailure (function, default: none, deprecated)
	*
	* @return {promise} Resolved when the operation succeeds. 
    *	Rejected when there is a failure.
	*/
	this.changePassword = function (oldPassword, newPassword, username) {};
	
	/**
	* Remove all stores, collections and metadata.
	* @param [options] {Object}
    *	onSuccess (function, default: none, deprecated)
    *	onFailure (function, default: none, deprecated)
	*
	* @return {promise} Resolved when the operation succeeds. 
    *	Rejected when there is a failure.
	*/
	this.destroy =  function (options) {};
	
	/**
	* Get the error message from a JSONStore error code.
	* @param errorCode {integer}
	*
	* @return {string} The Error Message associated with the status code or 'Not Found'
    *        if you pass an invalid value (non-integer) or a nonexistent status code.
	*/
	this.getErrorMessage = function (statusCode) {};
		
};

__WL.prototype.JSONStore = new __JSONStore;

