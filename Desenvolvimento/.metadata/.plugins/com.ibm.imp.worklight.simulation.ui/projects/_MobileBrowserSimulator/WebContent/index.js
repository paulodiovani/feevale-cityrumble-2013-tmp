/*******************************************************************************
 * Licensed Materials - Property of IBM
 * Mobile Browser Simulator
 * © Copyright IBM Corporation 2012, 2013. All Rights Reserved.
 *
 * U.S. Government Users Restricted Rights - Use, duplication or 
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 *******************************************************************************/

require([
        "dojo/_base/kernel",
        "dijit/dijit",
        "dojo/ready",
        "dojo/has",
        "dojo/_base/sniff",
        "dojo/dom",
        "dojo/window",
        "dojo/_base/html",
        "dojo/_base/connect",
        "dojo/_base/array",
        "dijit/registry",
        "dojo/_base/xhr",
        "dojo/_base/lang",
        "dojo/_base/json",
        "dojo/_base/window",
        "dojo/_base/fx",
        "dojo/query",
        "dojo/number",
        "dojo/parser",
        "dojo/on",
        "dojo/dom-style",
        "dojo/dom-construct",
        "dojo/dom-geometry",
        "dijit/form/CheckBox",
        "dijit/Dialog",
        "dijit/MenuItem",
        "dijit/Menu",
        "dijit/form/DropDownButton",
        "dijit/popup",
        "dojox/widget/Toaster",
        "dojo/data/ItemFileWriteStore"
        ], function(dojo, dijit, ready, has, sniff, dom, win, html, connect, arr,
        		WidgetRegistry, xhr, lang, json, bwin, baseFx, query, number, parser, on, domStyle,
        		domConstruct, domGeom, CheckBox, Dialog, MenuItem, Menu, DropDownButton, popup, toaster){

	/** the name of the cookie that stores the calibrated screen PPI */
	var PPI_COOKIE_NAME = 'mbsScreenPPI';

	/**
	 * the default platform default layout width to use if one is not specified
	 */
	var DEFAULT_PLATFORM_DEFAULT_LAYOUT_WIDTH = 800;

	/** locales that need to be right to left (RTL) */
	var RTL_LOCALES = ['ar'];

	// some browsers (*coff coff* IE) do not have KeyEvent defined
	if (typeof KeyEvent == 'undefined') {
		KeyEvent = {
		    'DOM_VK_UP' : 38,
		    'DOM_VK_DOWN' : 40
		};
	}

	// the mobile browser simulator container
	var grid = null;

	/** used to keep application filling the window */
	var resizePage = function(){
		var heading = dom.byId("heading");
		var headingBounds = domGeom.position(heading);

		var bodyBounds = win.getBox();

		var borderContainer = WidgetRegistry.byId("_borderContainer");
		borderContainer.resize({
		    h : bodyBounds.h - headingBounds.h,
		    w : '100%'
		});
	};

	/** Functions to deal with Cordova support * */

	/**
	 * Attach callbacks to the cordova button (show / hide Cordova interface)
	 */
	var initCordovaButton = function(mode){

		var cordovaBtn = dijit.byId('_cordovaEnablementBtn');
		var cordovaNode = cordovaBtn.domNode;
		var cordovaLbl = dojo.byId("_cordovaEnablementLbl");

		if (mode) {
			setSplashScreenStatus("Cordova button initialized.");
			dojo.connect(cordovaBtn, 'onClick', function(event){

				var simControls = dijit.byId('simControls');
				var simControlsNode = simControls.domNode;

				var c = cordovaBtn.get('checked');
				if (c) {
					dojo.style(simControlsNode, {
						display : "inline"
					});
				} else {
					dojo.style(simControlsNode, {
						display : "none"
					});
				}

				var bc = dijit.byId("_borderContainer");
				bc.layout();
				bc.resize();
			});
		} else {
			setSplashScreenStatus("Cordova button hidden.");
			dojo.style(cordovaNode, {
				display : "none"
			});
			dojo.style(cordovaLbl, {
				display : "none"
			});
		}
	};

	var isBrowserCordovaCapable = function(){
		var hasFF = has("ff") || (typeof window.navigator.originalUserAgent !== "undefined");
		var hasIE = has("ie");
		if (typeof hasIE !== "undefined") {
			if (hasIE < 9)
				hasIE = false;
		}
		return has("chrome") || has("safari") ||hasFF || hasIE;
	};

	var isEnvCordovaCapable = function(){
		return (defaultPlatform == "android")
				|| (defaultPlatform == "ios.iphone")
				|| (defaultPlatform == "ios.ipad")
				|| (defaultPlatform == "windows8")
				|| (defaultPlatform == "windowsphone")
				|| (defaultPlatform == "windowsphone8")
				|| (defaultPlatform == "blackberry10");
	};
	
	var enableSimplePreviewBtn = function() {
		return ((typeof has("chrome") !== 'undefined')
				&& (defaultPlatform != null)
				&& (defaultPlatform.indexOf("blackberry") != -1));
	};

	var getCordovaCapableBrowsersStrings = function(){
		var nls = dojo.i18n.getLocalization("ibm_mobile", "mobile");
		return [nls.Google_Chrome, nls.Safari, nls.Mozilla_Firefox, nls.Internet_Explorer];
	};

	var cordovaSupported = function(enabled){
		var cordovaEnablementBtn = dijit.byId('_cordovaEnablementBtn');
		/*
		 * if browser supports Cordova simulation set up the needed boilerplate
		 * else supply a tool-tip explaining the current browser does not
		 * support this function
		 */
		if (enabled) {
			setSplashScreenStatus("Cordova simulation enabled.");
			if (!isBrowserCordovaCapable()
					|| !isEnvCordovaCapable()) {
				// if an unsupported browser disable the button
				cordovaEnablementBtn.set('disabled', true);
				dojo.addClass('_cordovaEnablementBtn', 'disabled');
				dojo.addClass('_cordovaEnablementLbl', 'disabled');
			}
		} else {
			setSplashScreenStatus("Cordova simulation disnabled.");
			initCordovaButton(false);
		}

		// deal with cordova enablement tip

		var nls = dojo.i18n.getLocalization("ibm_mobile", "mobile");
		var cordovaTipLbl = '<div style="width: 300px"><p>' + nls.index_cordova_enable_desc + "</p><p>" + nls.index_cordova_support + '</p><ul>';
		var browsers = getCordovaCapableBrowsersStrings();
		dojo.forEach(browsers, function(browser){
			cordovaTipLbl += '<li>' + browser + '</li>';
		});
		cordovaTipLbl += '</ul></div>';
		new dijit.Tooltip({
		    'connectId' : [cordovaEnablementBtn.domNode, '_cordovaEnablementLbl'],
		    'label' : cordovaTipLbl,
		    'position' : ['below']
		});
	};

	/**
	 * Connect MBS device to Cordova Device box
	 */
	var wirePGDevice = function() {
		setSplashScreenStatus("Connecting MBS device to Cordova simulator");
		if (grid != null) {
			for ( var i in grid.sims)
				grid.sims[i].publishDeviceChange();
		}
	};
	
	
	var checkBrowserVersion = function() {
		var message = null;
		var nls = dojo.i18n.getLocalization("ibm_mobile", "mobile");
		dojo.html.set('_title', nls.index_title);
		var hasFF = has("ff");
		if (typeof hasFF !== "undefined") {
			if (hasFF >= 17)
				message = nls.IncorrectBrowser + '<br>' + nls.Downgrade + ' ' + nls.Mozilla_Firefox + ' 16.</li>';
		}
		var hasIE = has("ie");
		if (typeof hasIE !== "undefined") {
			if (hasIE < 9)
				message = nls.IncorrectBrowser + '<br>' + nls.Upgrade + ' ' + nls.Internet_Explorer + ' 9 ' + nls.OrLater + '.</li>';
		}
				
		if (message != null) {
			var toaster = dijit.byId("version_toaster");
			toaster.setContent(message, 'fatal');
			dojo.style(toaster.contentNode, "background", "#fff0b4");
			dojo.style(toaster.contentNode, "font-weight", "normal");
			dojo.style(toaster.contentNode, "fontWeight", "normal");
			dojo.style(toaster.contentNode, "color", "black");
			dojo.style(toaster.contentNode, "font-size", "12px");
			dojo.style(toaster.contentNode, "border", "4px ridge ");
			var style = dojo.getAttr(toaster.contentNode, "style");
			dojo.setAttr(toaster.contentNode, "style", style + "; border-radius: 8px; -webkit-border-radius: 8px; -moz-border-radius: 8px; z-index: 102;");
			
			dojo.style(toaster.containerNode, "z-index", "102");
			
		    toaster.show();
		}
	};
	
	/**
	 * Remove splash screen
	 */
	 var fadeOutSplashScreen = function() {
		var splash = dojo.byId("splash");
		baseFx.animateProperty({
		        node: splash,
		        properties: {
		            opacity: { start: 1, end: 0 }
		        },
		        duration: 500,
		        onEnd: dojo.hitch(this, function() {dojo.byId("splash").style.display = "none"; checkBrowserVersion();})
    	}).play();
    	
		var backSplash = dojo.byId("backSplash");
		baseFx.animateProperty({
		        node: backSplash,
		        properties: {
		            opacity: { start: 0.7, end: 0 }
		        },
		        duration: 500,
		        onEnd: function() {dojo.byId("backSplash").style.display = "none";}
    	}).play();
	};
	
	/**
	 * Set splash screen status
	 */
	 var setSplashScreenStatus = function(message) {
		if ((mbsLogLevel == "splash") || (mbsLogLevel == "all")) {
			dojo.attr(dojo.byId("splashStatus"), 'innerHTML', dojo.byId("splashStatus").innerHTML + "<br>" + message);
		}
	};

	/**
	 * Utility function to load a script sync or async mode
	 */
	function loadScript(url, sync, successCb, errorCb){
		if (sync) {
			xhrArgs = {
			    url : url,
			    handleAs : "text",
			    sync : true,
			    load : function(data){
				    dojo.create('script', {
				        type : 'text/javascript',
				        text : data
				    }, query('head')[0], 'last');
				    if (successCb)
					    successCb();
			    },
			    error : function(code){
				    if (errorCb)
					    errorCb(code);
			    }
			};
			xhr.get(xhrArgs);
		} else {
			var script = dojo.create("script");
			script.type = "text/javascript";

			if (script.readyState) { // IE
				script.onreadystatechange = function(){
					if (script.readyState == "loaded" || script.readyState == "complete") {
						script.onreadystatechange = null;
						if (successCb)
							successCb();
					}
				};
			} else { // Others
				if (successCb)
					script.onload = successCb;
				if (errorCb)
					script.onerror = errorCb;
			}
			script.src = url;
			dojo.place(script, query('head')[0], 'last');
		}
	}

	

	/** the default page to load in the simulator */
	var defaultWebpage = null;

	/** the default platform */
	var defaultPlatform = null;

	/** the log level */
	mbsLogLevel = null;

	/** the list of IPs */
	ips = null;

	/** the deviceStore */
	var deviceStore = null;
	
	var createGrid = function() {
		// create add button
		var mobileDeviceTree = new ibm_mobile.MobileDeviceTree({
			'deviceStore' : deviceStore
		});
		var nls = dojo.i18n.getLocalization("ibm_mobile", "mobile"); 
		var addBtn = new dijit.form.DropDownButton({
		    'label' : nls.index_add_device,
		    'dropDown' : mobileDeviceTree,
		    'maxHeight' : dojo.window.getBox().h - dojo.position('_centerPane').y - 15
		});
		addBtn.placeAt('addDeviceBlock', 'before');

		// need to reset max height of drop down on a window resize
		dojo.connect(window, "onresize", function(){
			addBtn.set('maxHeight', dojo.window.getBox().h - dojo.position('_centerPane').y - 15);
		});

		// set the parent button for the tree for
		// resizing purposes
		mobileDeviceTree.parentDropDownButton = addBtn;

		fadeOutSplashScreen();
		
		// create the grid for placing simulators
		grid = new ibm_mobile.MobileBrowserSimulatorContainer({
		    'deviceStore' : deviceStore,
		    'webpage' : defaultWebpage,
		    'defaultPlatform' : defaultPlatform,
			'__DEBUG_ENABLED' : ((mbsLogLevel == "mbs") || (mbsLogLevel == "all"))
		});

		grid.placeAt('_centerPane', 'first');

		// connect add button to grid
		dojo.connect(mobileDeviceTree, 'onClick', function(device){
			addBtn.closeDropDown();
			grid.addDevice(device);
		});
	};

	/**
	 * If Cordova Simulation is enabled, ensure that the SimJS Plugins
	 * are loaded and that the deviceStore has been retreived before
	 * creating the grid
	 */
	var onSimPluginsReady = function() {
		createGrid();
	};
	dojo.subscribe('/mbs/simpluginsready', onSimPluginsReady);

	var onDeviceStoreReady = function() {
		// deal with config file and enable Cordova support according to the
		// content of 'options.json'
		setSplashScreenStatus("Device store OK");
		configFile();
	};

	/**
	 * Enable of disable Cordova support mode == false : Cordova disabled mode !=
	 * false : Cordova enabled
	 */
	var enableCordova = function(mode){
		if (mode) {
			setSplashScreenStatus("Enabling Cordova simulation.");
			
			var initWithoutMap = function() {
				setSplashScreenStatus("OpenLayers loading failed.");
					window.mbsOpenLayersAvailable = false;
					// openlayers did not load
					require(["dijit/TitlePane", 
							 "dijit/form/HorizontalSlider", 
							 "dijit/form/HorizontalRule", 
							 "dijit/form/HorizontalRuleLabels",
							 "widgets/Compass"], function(){
						setSplashScreenStatus("Loading sim/sim.js...");
						loadScript("sim/sim.js", false, function(){
							wirePGDevice();
							initCordovaButton(true);
							loadPGInterface();
							loadApplets();
						});
				});
			};
			
			var initWithMap = function() {
				// load sim.js in async mode
				loadScript("http://openlayers.org/api/2.10/OpenLayers.js", false,
				function(){
					require(["dijit/TitlePane", 
							 "dijit/form/HorizontalSlider", 
							 "dijit/form/HorizontalRule", 
							 "dijit/form/HorizontalRuleLabels",
							 "dojox/geo/openlayers/widget/Map", 
							 "widgets/Compass"], function(){
						setSplashScreenStatus("Loading sim/sim.js...");
						window.mbsOpenLayersAvailable = true;
						loadScript("sim/sim.js", false, function(){
							setSplashScreenStatus("OpenLayers loaded.");
							wirePGDevice();
							initCordovaButton(true);
							loadPGInterface();
							loadApplets();
						});
					});
				},
				initWithoutMap);
			};
			
			// We must ping http://openlayers.org to check if we can add a map widget.
			var ping = {
				dummyImg:null,
				timer:null,
				over: false,
				successCB : initWithMap,
				errorCB : initWithoutMap
			};
			ping.dummyImg = new Image();
			ping.dummyImg.onload = function() {
				if (ping.over == false) {
					ping.over = true;
					clearTimeout(ping.timer);
					ping.successCB();
				}
			};
			ping.dummyImg.onerror = function() {
				if (ping.over == false) {
					ping.over = true;
					clearTimeout(ping.timer);
					ping.successCB();
				}
			};
			ping.dummyImg.src = "http://openlayers.org/?preventCache="+new Date().getTime();
			ping.timer = setTimeout(function() {
					if (ping.over == false) {
						ping.over = true;
						ping.errorCB();
					}
				},  3000);
			
		} else {
			initCordovaButton(false);
			createGrid();
		}
	};
	/**
	 * read config file enable Cordova support accordingly
	 */
	var configFile = function(){
		var xhrArgs = {
		    url : "options.json",
		    handleAs : "json",
		    failOk : true,
		    load : function(data){
				setSplashScreenStatus("options.json loaded.");
			    var enabled = data && (data.enableHybridSupport == true);
				if (enabled == true) {
					var cordovaEnablementBtnWidget = dijit.byId('_cordovaEnablementBtn');
					dojo.style(cordovaEnablementBtnWidget.domNode, {
						display : "inline"
					});
					var cordovaEnablementBtn = dojo.byId('_cordovaEnablementBtn');
					dojo.style(cordovaEnablementBtn, {
						display : "inline"
					});
					var cordovaEnablementLbl = dojo.byId('_cordovaEnablementLbl');
					dojo.style(cordovaEnablementLbl, {
						display : "inline"
					});
				} 
			    if (isBrowserCordovaCapable() && isEnvCordovaCapable())
				    enableCordova(enabled);
			    else {
				    cordovaSupported(enabled);
					createGrid();
			    }
		    },
		    error : function(error){
				setSplashScreenStatus("options.json not present.");
			    // not enabled
			    enableCordova(false);
		    }
		};
		try {
			/* var deferred = */xhr.get(xhrArgs);
		} catch (error) {
			setSplashScreenStatus("error reading options.json.");
			// not enabled
			enableCordova(false);
		}
	};

	/**
	 * Dynamically load applets so that they will not be loaded if Cordova
	 * support is disabled
	 */
	var loadApplets = function(mode){

		setSplashScreenStatus("Loading applets...");
		/* var a = */domConstruct.create('applet', {
		    id : "cordovaFileApplet",
		    name : "cordovaFileApplet",
		    code : "org.apache.cordova.applet.FileApplet",
		    archive : "sim/cordovaApplet.jar",
		    MAYSCRIPT : true, // ??
		    width : 1,
		    height : 1
		}, bwin.body());

		/* a = */domConstruct.create('applet', {
		    id : "cordovaFileTransferApplet",
		    name : "cordovaFileTransferApplet",
		    code : "org.apache.cordova.applet.FileTransferApplet",
		    archive : "sim/cordovaApplet.jar",
		    MAYSCRIPT : true, // ??
		    width : 1,
		    height : 1
		}, bwin.body());
		setSplashScreenStatus("Applets loaded...");
	};

	/**
	 * Load Cordova interface Add sensors and controls to interface.
	 */
	var loadPGInterface = function(cb){
		setSplashScreenStatus("Loading cordova.html...");
		var xhrArgs = {
		    url : "cordova.html",
		    handleAs : "text",
		    load : function(data){
				setSplashScreenStatus("cordova.html OK.");
			    try {
				    var bc = dijit.byId('_borderContainer');
				    var dc = domConstruct.toDom(data);
				    parser.parse(dc);
				    var w = WidgetRegistry.byId('simControls');
				    bc.addChild(w);
				    bc.layout();
				    bc.resize();

				    /* has to be loaded manually 
				     * because there is no associated UI 
				     * (See how other modules are loaded)
				     */
				    loadJavascript('sim/filetransfer.js');
				    loadJavascript('sim/media.js');
				    
				    var simControls = dijit.byId('simControls');
				    var simControlsNode = simControls.domNode;

				    var cordovaBtn = dijit.byId('_cordovaEnablementBtn');

				    cordovaBtn.set('checked', true);
				    dojo.style(simControlsNode, {
					    display : "auto"
				    });
			    } finally {
				    cordovaSupported(true);
			    }
		    },
		    error : function(error){

		    }
		};
		try {
			/* var deferred = */xhr.get(xhrArgs);
		} catch (error) {
			cordovaSupported(true);
		}
	};

	var wireQRCode = function() {
		
		var qrCodeDialog = new ibm_mobile.QRCodeDialog();
		qrCodeDialog.placeAt(query('body')[0], 'last');
		dojo.style(qrCodeDialog.id, "display", "none");
		
		var ipArray = new Array();
		if ((window.location.hostname !== "localhost")
		    && (window.location.hostname !== "127.0.0.1"))
		    ipArray.push(window.location.hostname);
		
		if (ips != null) {
			//parse the IPList
			var tempString = ips;
			while (tempString.indexOf(',') != -1) {
			    var currentIP = tempString.substring(0, tempString.indexOf(','));
				if (currentIP !== window.location.hostname)
				    ipArray.push(currentIP);
				tempString = tempString.substring(tempString.indexOf(',') + 1);
			}
			if (tempString !== window.location.hostname)
				ipArray.push(tempString);
		}
		qrCodeDialog.setIPList(ipArray);
		
		connect.connect(qrcodeButton, "onFocus", function() {
			qrCodeDialog.autoUpdate(true);
			qrCodeDialog.updateQRCode();
			popup.open({
				parent : this,
				popup : qrCodeDialog,
				around : this.domNode,
				orient : {
					'BR' : 'TR',
					'BL' : 'TL',
					'TR' : 'BR',
					'TL' : 'BL'
				},
				onExecute : function() {
					popup.close(qrCodeDialog);
					qrCodeDialog.autoUpdate(false);
				},
				onCancel : function() {
					popup.close(qrCodeDialog);
					qrCodeDialog.autoUpdate(false);
				},
				onClose : function() {
					qrCodeDialog.autoUpdate(false);
				}
			});
		});
		connect.connect(qrcodeButton, "onBlur", function() {
			popup.close(qrCodeDialog);
			qrCodeDialog.autoUpdate(false);
		});

	};

	ready(function(){		
		
		// deal with RTL locales
		if (dojo.indexOf(RTL_LOCALES, dojo.locale) != -1) {
			dojo.attr(dojo.body(), 'dir', 'rtl');

			dojo.addClass(dojo.body(), "rtl");

			var headNode = dojo.query("head")[0];
			dojo.create("link", {
			    rel : "stylesheet",
			    type : "text/css",
			    href : "dojo/dijit/themes/dijit_rtl.css"
			}, headNode, "first");

			dojo.create("link", {
			    rel : "stylesheet",
			    type : "text/css",
			    href : "dojo/dijit/themes/claro/claro.css"
			}, headNode, "first");

			dojo.create("link", {
			    rel : "stylesheet",
			    type : "text/css",
			    href : "dojo/ibm_mobile/themes/MobileBrowserSimulator_rtl.css"
			}, headNode, "first");
		}

		/** whether the user has calibrated their screen ppi */
		var screenPPICalibrated = false;

		/** the file containing the device profiles */
		var devicesFilePath = "defaultDevices.json";

		/** the default scale type */
		var scaleType = "pixelPerfect";

		// NLS
		var nls = dojo.i18n.getLocalization("ibm_mobile", "mobile");
		dojo.html.set('_title', nls.index_title);
		dojo.doc.title = nls.index_title;
		dojo.html.set('_description', nls.index_desc);
		dojo.html.set('_webpageLbl', nls.index_webpage);
		WidgetRegistry.byId('_goBtn').set('label', nls.index_go);
		WidgetRegistry.byId('_goSimplePreviewBtn').set('label', nls.index_go_simple_preview);
		dojo.html.set('_scaleLbl', nls.index_scale);
		dojo.html.set('_calibrateLink', nls.index_calibrate);
		WidgetRegistry.byId('_calibrateDialog').set('title', nls.index_calibrate_dialog_title);
		dojo.html.set('_useragentSwitchingEnablementLbl', nls.index_enable_useragent_switching);
		dojo.html.set('_cordovaEnablementLbl', nls.index_enable_cordova);
		WidgetRegistry.byId('_extensionInstallDialog').set('title', nls.index_useragent_extension_install_title);
		dojo.html.set('_extensionInstallInstructions', '<p>' + nls.index_useragent_extension_install_instructions_1 + '</p><p>' + nls.index_useragent_extension_install_instructions_2 + '</p>');
		dojo.html.set('_extensionInstallLink', nls.index_useragent_extension_install_btn);
		dojo.html.set('splashTitle', nls.index_splash_title);
		dojo.html.set('splashStatus', nls.index_splash_status);

		if (has("chrome")) {
			dojo.html.set('_extensionInstallInstructionsBrowserSpecific', '<p>'
							+ nls.index_useragent_extension_install_instructions_chrome1 
							+ '<ul><li>' 
							+ nls.index_useragent_extension_install_instructions_chrome2
							+ '<li>' 
							+ nls.index_useragent_extension_install_instructions_chrome3 
							+ '<li>' 
							+ nls.index_useragent_extension_install_instructions_chrome4 
							+ '</ul></p>');
		}		

		// add scale options
		dijit.byId('_scaleCombo').addOption([{
		    'value' : 'pixelPerfect',
		    'label' : nls.index_scale_pp,
		    'selected' : 'selected'
		}, {
		    'value' : 'fitToWindow',
		    'label' : nls.index_scale_fit
		}, {
		    'value' : 'deviceSize',
		    'label' : nls.index_scale_physical
		}]);

		// check location query for options
		if (window.location.search) {
			var quary = dojo.queryToObject(window.location.search.slice(1));

			if (quary['devicesFilePath']) {
				devicesFilePath = quary['devicesFilePath'];
			}

			if (quary['webpage']) {
				defaultWebpage = quary['webpage'];
				dijit.byId('_webpageBox').set('value', defaultWebpage);
			}

			if (quary['platform']) {
				defaultPlatform = quary['platform'];
			}

			if (quary['log']) {
				mbsLogLevel = quary['log'];
			}

			if (quary['ips']) {
				ips = quary['ips'];
			}
		}
				
		if (enableSimplePreviewBtn() == false) {
			dijit.byId("_goSimplePreviewBtn").destroy(); 
			dijit.byId("_goSimplePreviewBtnSeparator").destroy(); 
		}

		// set validator for the webpage box
		var webpageSameDomain = true;
		dijit.byId('_webpageBox').validator = function(value){
			var isValid = true;

			/*
			 * if the webpage is not on the same domain display validation
			 * message else if the webpage looks like a remote address but does
			 * not start with http:// then display validation message
			 */
			if (!webpageSameDomain) {
				dijit.byId('_webpageBox').set('invalidMessage', nls.index_xdomain_warning + "<br />" + nls.xdomain_reduced_func);
				isValid = false;
			} else {
				var value = dijit.byId('_webpageBox').get('value');
				var splits = value.split('/');
				if ((splits.length > 0) && (splits[0].search(/\./) != -1) && (splits[0] != "..") && (splits[0] != ".")) {
					dijit.byId('_webpageBox').set('invalidMessage', nls.index_need_http);
					isValid = false;
				}
			}

			return isValid;
		};

		dijit.byId('_webpageBox').validate();

		/*
		 * if screen ppi cookie defined use that value and mark as calibrated
		 * else calculate a default screen ppi and user will be prompted on
		 * first use to calibrate
		 */
		var cookiePPI = dojo.cookie(PPI_COOKIE_NAME);
		if (!(cookiePPI == null)) {
			dijit.byId('ppiCalculator').setScreenPPI(cookiePPI);
			screenPPICalibrated = true;
		} else {
			var ppiDiv = dojo.create('div', {
				style : {
				    'width' : '1in',
				    'position' : 'fixed',
				    'top' : '0px',
				    'left' : '0px',
				    'visibility' : 'hidden'
				}
			}, dojo.body());
			dijit.byId('ppiCalculator').setScreenPPI(dojo.position(ppiDiv).w);
			dojo.destroy(ppiDiv);
		}

		// connect website box up to publish
		dojo.connect(dijit.byId('_webpageBox'), 'onKeyPress', function(event){
			// on enter key send change event
			if (event.keyCode == 13) {
				var box = dijit.byId('_webpageBox');
				connect.publish('/mbs/webpage', [{
					'webpage' : box.get('value')
				}]);
			}

			// when the webpage changes it maybe valid now
			webpageSameDomain = true;
		});
		dojo.connect(dijit.byId('_goBtn'), 'onClick', function(){
			var box = dijit.byId('_webpageBox');

			connect.publish('/mbs/webpage', [{
				'webpage' : box.get('value')
			}]);
		});
		
		if (enableSimplePreviewBtn() == true) {
			dojo.connect(dijit.byId('_goSimplePreviewBtn'), 'onClick', function(){
				var box = dijit.byId('_webpageBox');
				var url = box.get('value');
				if (url.indexOf("http://") == 0) {
					url = url.substring(7);
					url = url.substring(url.indexOf("/"));				
				} else if (url.indexOf("https://") == 0) {
					url = url.substring(8);
					url = url.substring(url.indexOf("/"));				
				} else if (url.indexOf("../") == 0) {
					url = url.substring(2);
					url = url.substring(url.indexOf("/"));				
				}
				
				// open the simple preview
				var previewURL = window.location.protocol + "//" 
								+ window.location.host
								+ url;
				window.open(previewURL);
			});
		}

		// wire scale options up
		dojo.connect(dijit.byId('_scaleCombo'), "onChange", function(){
			scaleType = dijit.byId('_scaleCombo').attr('value');
			connect.publish('/mbs/changeScale', [{
			    'scale' : scaleType,
			    'screenPPI' : dijit.byId('ppiCalculator').getScreenPPI()
			}]);

			if (scaleType == "deviceSize") {
				// put up a link to calibrate the
				// monitor
				dojo.style("_calibrateLink", 'display', 'inline');

				// if screen ppi has not been calibrated
				// yet then prompt user to calibrate
				if (!screenPPICalibrated) {
					dijit.byId("_calibrateDialog").show();
				}
			} else {
				dojo.style("_calibrateLink", 'display', 'none');
			}
		});
		
		var deviceLoad = function(response, ioArgs){
		    // create parent store
		    var storeData = {
		        "label" : "name",
		        "identifier" : "id",
		        "items" : []
		    };

		    /*
			 * for each platform create a platform item and a platformName
			 * item there is a difference because more then one 'platform'
			 * can have the same name. Ex: iOS on iPhone and iOS on iPad
			 */
		    var platforms = {};
		    var platformID = ((defaultPlatform == null) || (defaultPlatform == "mobilewebapp")) ? 
		    						null : 
		    						"platform." + defaultPlatform;
		    if (platformID != null) {
				if (platformID.indexOf("blackberry") != -1)
		    		platformID = "platform.blackberry";
				else if (platformID.indexOf("windowsphone") != -1)
		    		platformID = "platform.windowsphone";
			}
		    dojo.forEach(response['platforms'], function(platform){
		    	if ((platform.id == platformID) || (platformID == null)) {
				    // create platform
				    // item
				    platforms[platform.id] = {
				        "type" : "platform",
				        "id" : platform.id,
				        "name" : platform.name,
				        "defaultLayoutWidth" : platform.defaultLayoutWidth,
				        "children" : []
				    };

				    // push to store
				    storeData.items.push(platforms[platform.id]);
		    	}
		    });

		    // for each device in platform
		    var resolutionItems = {};
		    dojo.forEach(response['devices'], function(device){
		    	if ((platformID == device.platformID) || (platformID == null)) {
				    var resolution = device.width + "x" + device.height;

				    // if this is an unseen resolution
				    // create a new store item for it
				    if (!resolutionItems[resolution]) {
					    resolutionItems[resolution] = {
					        "type" : "resolution",
					        "id" : resolution,
					        "name" : resolution,
					        "children" : []
					    };
					    storeData.items.push(resolutionItems[resolution]);
				    }

				    // create the device item
				    var deviceItem = {
				        "type" : "device",
				        "id" : device.name,
				        "name" : device.name,
				        "agentID" : device.agentID,
				        "width" : parseInt(device.width),
				        "height" : parseInt(device.height),
				        "ppi" : parseInt(device.ppi),
				        "resolution" : resolution,
				        "platformID" : device.platformID,
				        "viewportDeviceWidth" : device.viewportDeviceWidth
				    };

				    // deal with if device specified platform does not exist in
				    // platform list
				    if (!platforms[device.platformID]) {
					    platforms[device.platformID] = {
					        "type" : "platform",
					        "id" : device.platformID,
					        "name" : device.platformID,
					        "defaultLayoutWidth" : DEFAULT_PLATFORM_DEFAULT_LAYOUT_WIDTH,
					        "children" : []
					    };
					    storeData.items.push(platforms[device.platformID]);

					    console.error("Could not find the devices specified platform, '" + device.platformID
					            + "', in the list of defined platforms. A new platform will be created using default values.");
				    }

				    // add reference to this device to its corresponding
				    // platform
				    platforms[device.platformID].children.push({
					    "_reference" : device.name
				    });

				    // add reference to this device to its corresponding
				    // resolution
				    resolutionItems[resolution].children.push({
					    "_reference" : device.name
				    });

				    // add the device item itself to the store
				    storeData.items.push(deviceItem);
		    	}
		    });

		    // create read store from data
		    deviceStore = new dojo.data.ItemFileReadStore({
			    data : storeData
		    });

		    // clean up some processing stuff
		    delete resolutionItems;
		    delete platforms;

		    return response;
	    };

		// build the device store
		var deviceStoreDeferred = dojo.xhrGet({
		    url : devicesFilePath,
		    handleAs : "json",
		    preventCache : true,
		    load : deviceLoad,
		    error : function(response, ioArgs){
			    console.error("Could not retreive devices listing from '" + this.url + "': " + response);
			    devicesFilePath = "defaultDevices.json";
			    deviceStoreDeferred = dojo.xhrGet({
				    url : devicesFilePath,
				    handleAs : "json",
				    preventCache : true,
				    load : deviceLoad,
				    error : function(response, ioArgs){
					    console.error("Could not retreive devices listing from '" + this.url + "': " + response);
					    return response;
				    }
				});
				// add items dependent on dataStore
				deviceStoreDeferred.addCallback(onDeviceStoreReady);
			    return response;
		    }
		});

		// add items dependent on dataStore
		deviceStoreDeferred.addCallback(onDeviceStoreReady);

		// wire up the calibrate link
		dojo.connect(dojo.byId("_calibrateLink"), "onclick", function(event){
			dijit.byId("_calibrateDialog").show();
		});

		// wire up PPI set event to publish
		dojo.connect(dijit.byId("ppiCalculator"), 'onScreenPPISet', function(newScreenPPI){
			connect.publish('/mbs/changeScale', [{
			    'scale' : scaleType,
			    'screenPPI' : newScreenPPI
			}]);
		});

		// assume if the calibrate dialog is opened then calibration took place
		dojo.connect(dijit.byId("_calibrateDialog"), 'onShow', function(){
			screenPPICalibrated = true;
		});

		// when the calibrate dialog is hidden save a cookie
		dojo.connect(dijit.byId("_calibrateDialog"), 'onHide', function(){
			dojo.cookie(PPI_COOKIE_NAME, dijit.byId('ppiCalculator').getScreenPPI());
		});

		// hook up xdomain warning message
		dojo.subscribe("/mbs/webpage/xdomain", function(data){

			var webpageBox = dijit.byId('_webpageBox');
			var currWebpage = webpageBox.get('value');

			// to indexOf rather then == because only really
			// need to match on domain anyways
			if (data.webpage.indexOf(currWebpage) == 0) {
				webpageSameDomain = false;
			}

			webpageBox.validate();
		});

		var communicator = dijit.byId('_communicator');
		var useragentSwitchingBtn = dijit.byId('_useragentSwitchingEnablementBtn');
		/*
		 * if browser supports user agent switch set up the needed boilerplate
		 * else supply a tooltip explaining the current browser does not support
		 * this function
		 */
		if (communicator.isBrowserSupported()) {
			// what to do when the useragent switcher extension
			// is installed
			dojo.connect(communicator, 'onInstall', function(){
				communicator.setInstalled();
			});

			// deal with click event on useragent switching
			// enablment button
			dojo.connect(useragentSwitchingBtn, 'onClick', function(event){
				if (useragentSwitchingBtn.checked) {
					if (communicator.isSwitchingInstalled()) {
						communicator.setSwitchingEnabled(true);
					} else {
						// the button should not be marked as checked
						// because extension is not yet installed
						dojo.stopEvent(event);
						useragentSwitchingBtn.set('checked', false);

						// set up the link to install extension and
						// display the dialog
						var link = dojo.byId('_extensionInstallLink');
						dojo.attr(link, 'href', communicator.getExtensionURL());

						// show the dialog
						dijit.byId('_extensionInstallDialog').show();
					}
				} else {
					communicator.setSwitchingEnabled(false);
				}
			});
		} else {
			// if an unsported browser disable the button and add a tooltip
			useragentSwitchingBtn.set('disabled', true);
			dojo.addClass('_useragentSwitchingEnablementLbl', 'disabled');
		}

		// deal with useragent swtiching enablement tip
		var useragentTipLbl = '<div style="width: 300px"><p>' + nls.index_useragent_switching_desc + "</p><p>" + nls.index_useragent_switching_support + '</p><ul>';
		dojo.forEach(communicator.getSupportedBrowserStrings(), function(browser){
			useragentTipLbl += '<li>' + browser + '</li>';
		});
		useragentTipLbl += '</ul></div>';
		new dijit.Tooltip({
		    'connectId' : [useragentSwitchingBtn.domNode, '_useragentSwitchingEnablementLbl'],
		    'label' : useragentTipLbl,
		    'position' : ['below']
		});

		wireQRCode();

		// keep the boarder container sized correctly
		dojo.connect(window, "onresize", resizePage);
		resizePage();
		var bc = dijit.byId("_borderContainer");
		// bc.layout();
		bc.resize();
	});
});