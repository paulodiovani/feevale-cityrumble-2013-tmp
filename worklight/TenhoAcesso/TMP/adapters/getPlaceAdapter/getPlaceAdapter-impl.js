/*
 *  Licensed Materials - Property of IBM
 *  5725-G92 (C) Copyright IBM Corp. 2011, 2013. All Rights Reserved.
 *  US Government Users Restricted Rights - Use, duplication or
 *  disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

/*
 * "Requiring" necessary modules:
 * The "wl" module must be initialized in order for the Node.js adapter to work.
 * Init call starts the adapter's internal server, and performing necessary initialization.
 * Optional second parameter is a callback executed once the initialization is done.
 */
require("wl")
.init({
	'getPlace': getPlace
});


function getPlace(WL,PlaceId){
	var foursquare = (require('./foursquarevenues'))(
		    'T3ULFN503MOA4EXXDE3PPFBDELAIAX1PYBNCG4HXFVI4QCRX', 
		    '5MZ3R5UAI4CPXXXT220FPURG1Y45AXGGQXGVDGFBMEAYB45E'
		);
	var params = {
			    venue_id: PlaceId
			  };
	foursquare.getVenue(params, function(error, result) {
		if(err) {
            WL.err(err.err);
            return;
        }
		WL.success({place: result});
		
	});

}