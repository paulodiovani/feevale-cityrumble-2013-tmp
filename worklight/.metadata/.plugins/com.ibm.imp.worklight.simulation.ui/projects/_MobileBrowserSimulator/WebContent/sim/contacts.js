require(["dojo/dom", "dojo/dom-construct"], 
		function(dom, domConstruct){
	addService("Contacts", function(){
	
		// Public
		// Handle requests
		this.exec = function(action, args, callbackId){
			_consoleLog("Contacts." + action + "()");
			alert("Contacts API not implemented yet");
			return new PluginResult(callbackId, PluginResultStatus.OK, "NOT IMPLEMENTED", false);
			// return new PluginResult(callbackId,
			// PluginResultStatus.INVALID_ACTION);
		};
	
		// Initialization
		{
			var n = _pg_sim_nls;
	
			var enabled = true;
			if (typeof window.openDatabase === "undefined") {
				enabled = false;
			} else {
				try {
					window.openDatabase("Contacts", "1.0", "Cordova SimJS", 500000);
				} catch(err) {
					enabled = false;
				}
			}
			if (enabled == false) {
				var parentNode = dom.byId("contacts");
				domConstruct.empty(parentNode);
				parentNode.innerHTML = n.sim_contacts_nowebsql;
			} else {
				sim_contacts_refresh_btn.set("label", n.sim_contacts_refresh_label);
				populateContacts();
			}
		}
	});
});

/**
 * Retrieve all contacts
 */
function populateContacts(){
	_consoleLog("contact.js: POPULATE CONTACTS");

	var searchDB = function(tx){
		tx
		        .executeSql(
		                'SELECT * FROM CONTACTS',
		                [],
		                function(tx, results){
			                var len = results.rows.length, i;
			                var s = "";
			                if (len == 0) {
				                s = "No contacts found";
			                } else {
				                s = "Number of contacts: "
				                        + len
				                        + "<br><table cellspacing=0 cellpadding=0 style='border: 1px solid #000000;' width='100%'><tr><th style='border: 1px solid #000000; text-align:center'>ID</th><th style='border: 1px solid #000000; text-align:center'>Name</th><th style='border: 1px solid #000000; text-align:center'>Action</th></tr>";
				                for ( var i = 0; i < len; i++) {
					                s = s + "<tr><td style='border: 1px solid #000000; text-align:center'>" + results.rows.item(i).id;
					                +"</td>";
					                s = s + "<td style='border: 1px solid #000000; text-align:center'>" + results.rows.item(i).displayName + "</td>";
					                s = s + "<td style='border: 1px solid #000000; text-align:center'><button type='button' onClick='delContact(" + results.rows.item(i).id
					                        + ");'>Delete</button></td></tr>";
				                }
				                s = s + "</table>";
			                }

			                // Add tree widget to DOM
			                var block = document.getElementById('contactsContainer');
			                block.innerHTML = s;
		                }, function(){
			                _consoleLog("We got an error");
			                var block = document.getElementById('contactsContainer');
			                block.innerHTML = "No contacts found";
		                });
	};

	var db = window.openDatabase("Contacts", "1.0", "Cordova SimJS", 500000);
	db.transaction(searchDB);
}

/**
 * Delete a contact
 */
function delContact(id){
	_consoleLog("contact.js: DELETE CONTACT WITH ID = " + id);

	var db = window.openDatabase("Contacts", "1.0", "Cordova SimJS", 500000);
	db.transaction(function(tx){
		tx.executeSql('DELETE FROM CONTACTS WHERE id="' + id + '"');
		tx.executeSql('DELETE FROM NAMES WHERE rawid="' + id + '"');
		tx.executeSql('DELETE FROM FIELDS WHERE rawid="' + id + '"');
		tx.executeSql('DELETE FROM ADDRESSES WHERE rawid="' + id + '"');
		tx.executeSql('DELETE FROM ORGANIZATIONS WHERE rawid="' + id + '"');
	}, function(){
		_consoleLog("We got an error");
	}, function(){
		_consoleLog("Successfully delete contact with ID = " + id);
		populateContacts();
	});
}