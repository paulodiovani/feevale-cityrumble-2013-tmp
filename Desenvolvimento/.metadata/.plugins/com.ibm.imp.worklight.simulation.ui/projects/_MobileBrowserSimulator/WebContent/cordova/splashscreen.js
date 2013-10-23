
if (!Cordova.hasResource("splashscreen")) {
	Cordova.addResource("splashscreen");
	
	navigator.splashscreen = {
    show:function() {
    	// In the simulator code, this method is only here to prevent the users code to break;
        //exec(null, null, "SplashScreen", "show", []);
    	console.log("navigator.splashscreen.show()");
    },
    hide:function() {
    	// In the simulator code, this method is only here to prevent the users code to break;
        //exec(null, null, "SplashScreen", "hide", []);
    	console.log("navigator.splashscreen.hide()");
    }
};
}
