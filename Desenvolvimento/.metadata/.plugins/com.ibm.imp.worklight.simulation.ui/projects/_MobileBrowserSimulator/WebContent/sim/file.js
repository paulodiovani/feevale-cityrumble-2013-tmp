require([
         "dojo/dom",
        "dojo/dom-construct",
        "dojo/has",
        "dojo/_base/sniff"], function(dom, domConstruct, has){
	addService("File", function(){
	
		// Associative array of source windows to uuids (key is the uuid)
		var sources = new Array();
		
		// Public
		// Handle requests
		this.exec = function(action, args, callbackId, source, uuid){
			try {
				_consoleLog("cordovaFileApplet.exec( " + action + " " + JSON.stringify(args) + " " + callbackId + " " + uuid );
				sources[uuid]=source;
				document.cordovaFileApplet.exec(action, JSON.stringify(args), callbackId, uuid);
				return; // Nothing is returned as Plugin Results are sent from Java code invoking the Javascript postResult method.
			} catch (e) {
				_consoleLog("ERROR: " + e);
			}
		};
		
		this.postResult = function(resultString, uuid) {
			_consoleLog("Message recieved from File applet" + resultString);
			var source = sources[uuid];
			if ((source != null) && (typeof source !== "undefined")) {
				var result = null;
				try {
					result = JSON.parse(resultString);
				} catch (err) {
					_consoleLog(err.message);
					_consoleLog("Error occured while interpreting: " + resultString);
				}
				if (typeof result === 'object') {
					_consoleLog("posting...");
					try {
						source.postMessage(JSON.stringify(result), "*");
					} catch (err) {
						_consoleLog(err.message);
						_consoleLog("Error occured while stringifying: " + resultString);
					}
					_consoleLog("posted...");
				} else {
					source.postMessage(resultString, "*");
				}
			} else {
				_consoleLog("Error in postResult");
			}
		};
		
		this.refreshTree = function() {
			populateTree();
		};
	
		// Initialization
		{
			_consoleLog("File initialization");
	
			var n = _pg_sim_nls;
			sim_file_refresh_button.set("label", n.sim_file_refresh_button);
			// Populate tree widget if not already done within 3 sec of loading page
			populateTreeRun = false;
			setTimeout(function(){
				if (!populateTreeRun) {
					populateTree();
				}
			}, 3000);
	
			// Listen for file applet init complete
			// This may occur before we are initialized and add listener, so 2 sec
			// delay above will do it
			document.addEventListener("fileAppletInit", populateTree, false);
		}
	});
	
	// -----------------------------------------------------------------------------
	// Javascript for File UI
	// -----------------------------------------------------------------------------
	
	// File data for tree model
	filedata = null;
	
	/**
	 * Retrieve all files and populate tree control
	 */
	function populateTree(){
		_consoleLog("file.js: POPULATE TREE");
		populateTreeRun = true;
		var s = "[];";
	
		// Call applet to get entire filesystem content
		// MD add check
		var applet = document.cordovaFileApplet;
		
		var appletDisabled = function() {
				var parentNode = dom.byId("fileSection");
				domConstruct.empty(parentNode);
				var n = _pg_sim_nls;
				parentNode.innerHTML = n.sim_file_cannotLoadApplet;
				//disable capture
				var parentNodeCapture = dom.byId("capture"); 
				domConstruct.empty(parentNodeCapture);
				parentNodeCapture.innerHTML = n.sim_capture_cannotLoadApplet;
				//disable camera   
				var parentNodeCamera1 = dom.byId("cameraTable1"); 
				domConstruct.empty(parentNodeCamera1);
				parentNodeCamera1.innerHTML = n.sim_camera_cannotLoadApplet;
				var parentNodeCamera2 = dom.byId("cameraTable2"); 
				domConstruct.empty(parentNodeCamera2);
		};
		
		if (applet) {
				var runningOnIE = has("ie");
				if ((typeof applet.listFolderContent !== "function") && (typeof runningOnIE === "undefined")) {
					appletDisabled();
				} else {
					try {
						s = applet.listFolderContent("");
					} catch (err) {
						// in IE; applet.dir is always set as undefined even if the applet is properly loaded
						// we use this try/catch statement to detect if the applet is available.
						appletDisabled();
					}
				}
		} else {
			var xhReq = new XMLHttpRequest();
			var s1 = "File";
			var s2 = "getFreeDiskSpace";
			xhReq.open("GET", "/MobileBrowserSimulator/Cordova?s1=" + s1 + "&s2=" + s2, false);
			xhReq.send(); // "s1="+s1+"&s2="+s2);
			var serverResponse = xhReq.responseText;
			_consoleLog("response=" + serverResponse);
		}
		_consoleLog("Populate tree " + s);
	
		eval("var r = " + s);
	
		// Build data structure for tree widget
		filedata = [];
		var dirs = {};
		if (r.length == 1) {
			var f = r[0];
			var obj = {
				id : f.id
			};
			obj.children = [];
			obj.label = f.name;
			dirs[f.name] = obj;
			filedata.push(obj);
			
		} else {
			for ( var i = 0; i < r.length; i++) {
				var f = r[i];
				var obj = {
					id : f.id
				};
				if (f.type == 2) {
					obj.children = [];
					obj.label = f.name;
					dirs[f.name] = obj;
				}
				// If root, then push to first level
				var p = f.name.lastIndexOf("/");
				if (p == -1) {
					filedata.push(obj);
				} else {
					var parent = f.name.substring(0, p);
					obj.label = f.name.substring(p + 1);
					dirs[parent].children.push(obj);
				}
			}
		}
		
		
	
		// Delete existing tree widget
		if (dijit.byId("fileTree")) {
			dijit.byId("fileTree").destroyRecursive();
		}
	
		// Create tree widget
		var store = new dojo.data.ItemFileReadStore({
			data : {
			    identifier : 'id',
			    label : 'label',
			    items : filedata
			}
		});
		var treeModel = new dijit.tree.ForestStoreModel({
			store : store
		});
		var treeControl = new dijit.Tree({
		    model : treeModel,
		    showRoot : false,
		    autoExpand : true
		}, "fileTree");
	
		// Add tree widget to DOM
		var block = document.getElementById('fileTreeContainer');
		if (block) {
			block.innerHTML = "";
			block.appendChild(treeControl.domNode);
		}
		treeControl.startup();
	}

});
