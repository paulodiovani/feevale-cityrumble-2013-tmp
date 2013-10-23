require(
		[ "dojo/dom", "dijit/registry" ],
		function(dom, registry) {

			addService(
					"Camera",
					function() {
						var cameraDir = "";
						var curCameraImage = "";
						var curAlbumImage = "";
						// Public
						// Set image to return for camera
						this.setCameraImage = function(image) {
							curCameraImage = image;
							dom.byId("cameraSelectedId").src = cameraDir
									+ curCameraImage;
							dom.byId("cameraSizeId").innerHTML = image;
						};

						// Public
						// Set image to return for library
						this.setAlbumImage = function(image) {
							curAlbumImage = image;
							dom.byId("albumSelectedId").src = cameraDir
									+ curAlbumImage;
							dom.byId("albumSizeId").innerHTML = image;
						};

						// Get image for camera or library
						var getImage = function(destinationType, source, encodingType) {
							var cameraURL;
							if (source == 1)
								cameraURL = cameraDir + curCameraImage;
							else
								cameraURL = cameraDir + curAlbumImage;
							

							if (encodingType == 1) { // Camera.EncodingType.PNG
								if (cameraURL.substring(cameraURL.length - 4, cameraURL.length) === ".jpg") {
										cameraURL = cameraURL.substring(0, cameraURL.length - 4) + ".png";
								} else if (cameraURL.substring(cameraURL.length - 5, cameraURL.length) === ".jpeg") {
									cameraURL = cameraURL.substring(0, cameraURL.length - 5) + ".png";
								}
							}
							else if ((encodingType == 0)  // Camera.EncodingType.JPEG
								&& (cameraURL.substring(cameraURL.length - 4, cameraURL.length) === ".png"))
								cameraURL = cameraURL.substring(0, cameraURL.length - 4) + ".jpg";

							var ret = cameraURL;

							var applet = document.cordovaFileApplet;
							if (destinationType == 0) { // Camera.DestinationType.DATA_URL
								if (applet) {
									try {
										ret = applet.base64Encode(cameraURL);
										return ret;
									} catch (err) {
										_consoleLog("Cannot encode " + cameraURL);
									}
								}
							}
							if (applet) {
								try {
									ret = applet.mapURLToFile(cameraURL);
									if(destinationType == 2) {
										_consoleLog("Cannot simulate native file system. Returning file URI.");
									}
								} catch (err) {
									_consoleLog("Cannot map " + cameraURL);
								}
							}
							return ret; // Camera.DestinationType.FILE_URI
						};

						// Public
						// Handle requests
						this.exec = function(action, args, callbackId, uuid) {
							// [quality, destinationType, sourceType,
							// targetWidth, targetHeight,
							// encodingType]
							if (action == 'takePicture') {
								var r = null;
								r = getImage(args[1], args[2], args[5]);
								return new PluginResult(callbackId,
										PluginResultStatus.OK, r, false);
							}
							if (action == 'cleanup') {
								var platformID = getSimByUUID(uuid).device.platformID;
								var isiOS = platformID.toString().indexOf(
										".ios.") != -1;
								if (isiOS)
									return new PluginResult(callbackId,
											PluginResultStatus.OK, "", false);
								else
									return new PluginResult(callbackId,
											PluginResultStatus.INVALID_ACTION,
											"", false);
							}
							return new PluginResult(callbackId,
									PluginResultStatus.INVALID_ACTION);
						};

						// Initialization
						{
							var n = _pg_sim_nls;

							var td;
							td = dom.byId('sim_camera_choose_image_camera');
							td.innerHTML = n.sim_camera_choose_image_camera;
							td = dom
									.byId('sim_camera_currently_selected_camera');
							td.innerHTML = n.sim_camera_currently_selected_camera;
							td = dom.byId('sim_camera_choose_image_album_library');
							td.innerHTML = n.sim_camera_choose_image_album_library;
							td = dom
									.byId('sim_camera_currently_selected_album_library');
							td.innerHTML = n.sim_camera_currently_selected_album_library;

							sim_camera_imagexs_button.set("label",
									n.sim_camera_xs);
							sim_camera_images_button.set("label",
									n.sim_camera_s);
							sim_camera_imagem_button.set("label",
									n.sim_camera_m);
							sim_camera_imagel_button.set("label",
									n.sim_camera_l);;

							sim_camera2_imagexs_button.set("label",
									n.sim_camera_xs);
							sim_camera2_images_button.set("label",
									n.sim_camera_s);
							sim_camera2_imagem_button.set("label",
									n.sim_camera_m);
							sim_camera2_imagel_button.set("label",
									n.sim_camera_l);

							sim_camera_albumxs_button.set("label",
									n.sim_camera_xs);
							sim_camera_albums_button.set("label",
									n.sim_camera_s);
							sim_camera_albumm_button.set("label",
									n.sim_camera_m);
							sim_camera_albuml_button.set("label",
									n.sim_camera_l);

							sim_camera2_albumxs_button.set("label",
									n.sim_camera_xs);
							sim_camera2_albums_button.set("label",
									n.sim_camera_s);
							sim_camera2_albumm_button.set("label",
									n.sim_camera_m);
							sim_camera2_albuml_button.set("label",
									n.sim_camera_l);
							// Determine base URL for this JS file
							cameraDir = getScriptBase("camera.js") + "camera/";

							this.setCameraImage("camera1_m.jpg");
							this.setAlbumImage("album1_m.jpg");
						}
					});
		});