
/* JavaScript content from wlclient/js/deviceSensors/geoUtilities.js in Common Resources */
/**
 * @license
 * Licensed Materials - Property of IBM
 * 5725-G92 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */
/**
 * Geo utility functions
 */
function GeoUtilities() {
	var self = this;
	
	/**
	 * Degrees to radians
	 * 
	 * @param degrees
	 * @returns {Number}
	 */
	function radians(degrees) {
		return degrees * Math.PI / 180;
	}
	
	/**
	 * Radians to meters The function doesn't take into account the differences
	 * in radiuses over the earth surface
	 * 
	 * @param radians
	 * @returns distance in meters
	 */
	function radiansToMeters(radians) {
		var radius = 6371000; // Radius of the earth (m)
		return radians * radius;
	}
	
	/**
	 * 
	 * @param x
	 * @returns {Number}
	 */
	function sqr(x) {
		return x * x;
	}
	
	/**
	 * 
	 * @param meters
	 * @returns {Number}
	 */
	function metersToRadians(meters) {
		var radius = 6371000; // Radius of the earth (m)
		return meters / radius;
	}
	
	/**
	 * Calculates nearest point on line segment The function assumes that no
	 * longitude transformation is needed
	 * 
	 * @param pLon -
	 *            Lon of the point
	 * @param pLat -
	 *            Lat of the point
	 * @param l1Lon -
	 *            Lon of the first point on line segment
	 * @param l1Lat -
	 *            Lat of the first point on line segment
	 * @param l2Lon -
	 *            Lon of the second point on line segment
	 * @param l2Lat -
	 *            Lat of the second point on line segment Assumption l1 and l2
	 *            are different points
	 * @returns {Lon: nearestLon, Lat: nearestLat}
	 */
	this.nearestPointOnLineSegment = function(pLon, pLat, l1Lon, l1Lat, l2Lon, l2Lat) {
		var nearestLat = l1Lat;
		var nearestLon = l1Lon;
		
		var point = {
				longitude : pLon,
				latitude : pLat					
		};

		var point1 = {
				longitude : l1Lon,
				latitude : l1Lat					
		};
		var x1 = 0;
		var y1 = WL.Geo.getDistanceBetweenCoordinates(point, point1);
		
		var point2 = {
				longitude : l2Lon,
				latitude : l2Lat					
		};
		var x2 = 1;
		var y2 = WL.Geo.getDistanceBetweenCoordinates(point, point2);
		
		var point3 = {
				longitude: (l1Lon + l2Lon) / 2,
				latitude: (l1Lat + l2Lat) / 2
		};
		var x3 = 0.5;
		var y3 = WL.Geo.getDistanceBetweenCoordinates(point, point3);
				
		
		var closestEndPointIs1 = (y1 < y2);
		
		for (var i = 0; i < 30; i++) {
			if (y2 < y1) {
				var temp = x1;
				x1 = x2;
				x2 = temp;
				
				temp = y1;
				y1 = y2;
				y2 = temp;
			}
			// 1 <= 2 at this point
			
			if (y3 < y2) {
				var temp = x2;
				x2 = x3;
				x3 = temp;
				
				temp = y2;
				y2 = y3;
				y3 = temp;
				// 1 <= 3 and 2 <= 3 at this point			
				if (y2 < y1) {
					var temp = x1;
					x1 = x2;
					x2 = temp;
					
					temp = y1;
					y1 = y2;
					y2 = temp;
				}
			}
			// 1 <= 2 <= 3 at this point
			nearestLon = l1Lon + x1 * (l2Lon - l1Lon),
			nearestLat = l1Lat + x1 * (l2Lat - l1Lat);

			if (x1 == x2 || x1 == x3 || x2 == x3)
				break;
			
			
			var minX = Math.min(x1,x2,x3);
			var maxX = Math.max(x1,x2,x3);
			
			if (maxX - minX < 0.001) {
				var minY = Math.min(y1,y2,y3);
				var maxY = Math.max(y1,y2,y3);
				if (maxY - minY < 0.5) {
					// resolution is fine enough
					break;
				}
			}		
			
			// solve for y = alpha*x^2 + beta*x + gamma (gamma is not needed)
			
			var betaConst = (y2 - y1) / (x2 - x1);
			var alpha = ((y3 - y2) - betaConst * (x3 - x2)) / ( (x3 - x2) * (x3 - x1) );
			var beta = betaConst - alpha * (x2 + x1);
			
			var x4;
			
			if (alpha != 0)
				x4 = -beta / (2*alpha); // minimum is here
			else {
				// degenerate case, switch to golden section for next point selection:
				var midX = x1;
				if (midX == minX || midX == maxX)
					midX = x2;
				if (midX == minX || midX == maxX)
					midX = x3;

				if (maxX - midX > midX - minX)
					x4 = Math.min(1, midX + 0.382 * (maxX - midX));
				else x4 = Math.max(0, midX - 0.382 * (midX - minX));
			}
			
			var point4 = {
					longitude : l1Lon + x4 * (l2Lon - l1Lon),
					latitude : l1Lat + x4 * (l2Lat - l1Lat)									
			};
			var y4 = WL.Geo.getDistanceBetweenCoordinates(point, point4);
			
			// substitute out the weakest point
			x3 = x4;
			y3 = y4;			
		}

		if (y3 < y1) {
			x1 = x3;
			y1 = y3;
			nearestLon = l1Lon + x1 * (l2Lon - l1Lon),
			nearestLat = l1Lat + x1 * (l2Lat - l1Lat);
		}
		
		// Finally, test against Cartesian projection (important when very close to the line):
		var x4 = ((pLon - l1Lon) * (l2Lon - l1Lon) + (pLat - l1Lat)
				* (l2Lat - l1Lat))
				/ ((l2Lon - l1Lon) * (l2Lon - l1Lon) + (l2Lat - l1Lat)
						* (l2Lat - l1Lat));
		
		if (x4 >= 0 && x4 <= 1) {
			var point4 = {
					longitude : l1Lon + x4 * (l2Lon - l1Lon),
					latitude : l1Lat + x4 * (l2Lat - l1Lat)									
			};
			var y4 = WL.Geo.getDistanceBetweenCoordinates(point, point4);
			
			if (y4 < y1) {
				nearestLon = l1Lon + x4 * (l2Lon - l1Lon),
				nearestLat = l1Lat + x4 * (l2Lat - l1Lat);						
			}
		}
		
		
		if (sign(nearestLat - l1Lat) == sign(nearestLat - l2Lat) && 
				sign(nearestLon - l1Lon) == sign(nearestLon - l2Lon)) {

			// Nearest point is outside the segment
			if (closestEndPointIs1) {
				nearestLon = l1Lon;
				nearestLat = l1Lat;
			} else {
				nearestLon = l2Lon;
				nearestLat = l2Lat;
			}
		}
	
		return {
			longitude : nearestLon,
			latitude : nearestLat
		};
	}
	
	/**
	 * Calculates distance between point and line segment The
	 * function assumes that no longitude transformation is needed
	 * 
	 * @param pLon -
	 *            Lon of the point
	 * @param pLat -
	 *            Lat of the point
	 * @param l1Lon -
	 *            Lon of the first point on line segment
	 * @param l1Lat -
	 *            Lat of the first point on line segment
	 * @param l2Lon -
	 *            Lon of the second point on line segment
	 * @param l2Lat -
	 *            Lat of the second point on line segment
	 */
	function diastanceFromLineSegment(pLon, pLat, l1Lon, l1Lat, l2Lon, l2Lat) {
		var nearestPoint = self.nearestPointOnLineSegment(pLon, pLat, l1Lon, l1Lat,
				l2Lon, l2Lat);
		var distance = self.getDistanceBetweenCoordinates({longitude : pLon, latitude : pLat},
				nearestPoint);
		return distance;
	}
	
	
	/**
	 * Checks if the location within the polygon with the given level of
	 * confidence
	 * 
	 * @param polygon: [ {
	 *            longitude: The longitude as a decimal number, latitude: The
	 *            latitude as a decimal number }, { longitude: The longitude as
	 *            a decimal number, latitude: The latitude as a decimal number },
	 *            ... ]
	 * @return boundary { minLon: longitude, minLat: latitude, maxLon:
	 *         longitude, maxLat: latitude}, }
	 */
	function getPolygonBoundary(polygon) {
		var boundary = {
			minLon : Number.MAX_VALUE,
			minLat : Number.MAX_VALUE,
			maxLon : Number.MIN_VALUE,
			maxLat : Number.MIN_VALUE
		};
		for ( var i = 0; i < polygon.length; i++) {
			if (polygon[i].longitude < boundary.minLon)
				boundary.minLon = polygon[i].longitude;
			if (polygon[i].longitude> boundary.maxLon)
				boundary.maxLon = polygon[i].longitude;
			if (polygon[i].latitude < boundary.minLat)
				boundary.minLat = polygon[i].latitude;
			if (polygon[i].latitude > boundary.maxLat)
				boundary.maxLat = polygon[i].latitude;
		}
		return boundary;
	}
	
	/*
	 * Rotates the Longitude coordinate to address the 180 meridian as 0
	 */
	function transformLongitude(lon) {
		return lon > 0 ? lon - 180 : lon + 180;
	}
	
	/**
	 * Returns math sign of the x
	 */
	function sign(x) {
		if (x > 0)
			return 1;
		if (x < 0)
			return -1;
		return 0;
	}
	
	/**
	 * Checks if the location within the polygon with the given level of
	 * confidence
	 * 
	 * @param coordinate: {
	 *            longitude : The longitude as a decimal number latitude : The
	 *            latitude as a decimal number accuracy : The accuracy of
	 *            position }
	 * @param polygon: [ {
	 *            longitude: The longitude as a decimal number, latitude: The
	 *            latitude as a decimal number }, { longitude: The longitude as
	 *            a decimal number, latitude: The latitude as a decimal number },
	 *            ... ]
	 * @param polygonInfo - provided by the getPolygonInfo function           
	 */
	function isInsidePolygonBoundary (coordinate, polygon, polygonInfo) {
		var pLon = coordinate.longitude;
		var pLat = coordinate.latitude;
		var boundary = polygonInfo.boundary;;
		if (polygonInfo.needLongitudeTransformation) {
			pLon = transformLongitude(pLon);
			boundary = polygonInfo.transformedBoundary;
			polygon = polygonInfo.transformedPolygon;
		}
		if ((pLon < boundary.minLon || pLon > boundary.maxLon)
				|| (pLat < boundary.minLat || pLat > boundary.maxLat)) {
			return false; // outside the polygon boundary
		}
	
		// Get slope that will not intersect any coordinate of the polygon
		var slopes = new Array();
		var slopeAngleInterval = 180 / (polygon.length + 1);
		for ( var i = 0; i < polygon.length; i++) {
			var cLon = polygon[i].longitude;
			var cLat = polygon[i].latitude;
			if (cLon - pLon == 0) {
				// Vertical slope
				slopes[0] = 1;
			} else {
				var angle = 90 + Math.atan((cLat - pLat) / (cLon - pLon));
				var slopeId = Math.floor(angle / slopeAngleInterval);
				slopes[slopeId] = 1;
			}
		}
	
		var slope = 1;
		for (i = 0; i <= polygon.length; i++) {
			if (slopes[i] != 1) {
				slope = Math.tan((i + 0.5) * slopeAngleInterval - 90);
				break;
			}
		}
	
		// Calculate number of crossing
		var numCrossing = 0;
		var intercept = pLat - slope * pLon;
		for (i = 0; i < polygon.length; i++) {
			var j = (i + 1) % polygon.length;
			var pt1 = polygon[i];
			var pt2 = polygon[j];
			if (pt1.longitude> pt2.longitude) {
				pt1 = polygon[j];
				pt2 = polygon[i];
			}
			// pt2 is the right-most point
	
			if (pLon > pt2.longitude)
				continue; // our ray "points" to lon=infinity
	
			var lat1 = slope * pt1.longitude+ intercept;
			var lat2 = slope * pt2.longitude+ intercept;
	
			var s1 = sign(pt1.latitude - lat1);
			var s2 = sign(pt2.latitude - lat2);
	
			if (s1 == s2 && s2 == 0 && pLon >= pt1.longitude)
				// extremely low probability, pos is on the edge and our
				// ray is incident to this edge
				return true;
	
			if (s1 == s2 || s1 + s2 > 0)
				// doesn't intersect, or on the "wrong side" of our line
				// see Fig. 6 in http://alienryderflex.com/polygon/ for
				// a corner case where this second test is necessary
				continue;
	
			// need to validate that intersection occurs to the right of pos
	
			if (pLon <= pt1.longitude|| s2 == 0) {
				numCrossing++;
				continue;
			}
	
			var dlon = pt2.longitude- pt1.longitude;
			if (dlon == 0)
				// vertical line, our ray intersects it; this is for safety
				// as the previous check should have caught it
				numCrossing++;
			else {
				var s3 = sign(dlon * (pLat - pt1.latitude) - (pt2.latitude - pt1.latitude)
						* (pLon - pt1.longitude))
						* sign(dlon);
				// s3 is the sign of change in lat when moving from the edge to
				// pos.
				// it should be the same as s2 which is the sign of change when
				// moving from our ray to pt2
				if (s3 == s2)
					numCrossing++;
			}
			;
		}
		;
		return (numCrossing % 2 == 1);
	}
	
	
	/**
	 * 
	 * @param polygon
	 * @returns information that can be used to optimize multiple call to the polygon related functions
	 */
	function getPolygonInfo(polygon, options) {
		if(options && options.polygonInfo){
			return options.polygonInfo;
		}
		var polygonInfo = {
			boundary : getPolygonBoundary(polygon),
			needLongitudeTransformation : false
		};
		if (polygonInfo.boundary.maxLon - polygonInfo.boundary.minLon > 180) {
			polygonInfo.needLongitudeTransformation = true;
			polygonInfo.transformedBoundary = {
				minLon : Number.MAX_VALUE,
				minLat : polygonInfo.boundary.minLat,
				maxLon : Number.MIN_VALUE,
				maxLat : polygonInfo.boundary.maxLat
			};
			polygonInfo.transformedPolygon = new Array();
			for ( var i = 0; i < polygon.length; i++) {
				polygonInfo.transformedPolygon[i] = {
					longitude: transformLongitude(polygon[i].longitude),
					latitude : polygon[i].latitude
				};
				if (polygonInfo.transformedPolygon[i].longitude< polygonInfo.transformedBoundary.minLon) {
					polygonInfo.transformedBoundary.minLon = polygonInfo.transformedPolygon[i].longitude;
				} else if (polygonInfo.transformedPolygon[i].longitude> polygonInfo.transformedBoundary.maxLon) {
					polygonInfo.transformedBoundary.maxLon = polygonInfo.transformedPolygon[i].longitude;
				}
			}
		}
		
		if(options && options.polygonInfo===null) // This is a hidden functionality to be used by WL internal only
			options.polygonInfo = polygonInfo; // Save the polygonInfo for future reuse
			
		return polygonInfo;
	}
	
	/**
	 * 
	 * @param distanceToBoundary
	 * @param confidenceLevel
	 * @param coordinateAccuracy
	 * @returns {Boolean}
	 */
	function isDistanceWithinConfidenceLevel(distanceToBoundary, confidenceLevel,
			coordinateAccuracy) {
		return (confidenceLevel == "low")
				|| (confidenceLevel == "medium" && distanceToBoundary > 0.5 * coordinateAccuracy)
				|| (confidenceLevel == "high" && distanceToBoundary > 2.05 * coordinateAccuracy);
	}
	
	/**
	 * Returns true if the coordinate inside the area with specified level of
	 * confidance and buffer
	 * 
	 * @param distanceToBoundary :
	 *            [meters] absolute distance to real border
	 * @param confidenceLevel : "low", "medium",
	 *            "high". Take into account the accuracy of the coordinate
	 *            Default value is "low". 
	 * @param accuracy : The accuracy of coordinate [meters]
	 */
	function isInsideArea(distanceToBoundary, confidenceLevel, coordinateAccuracy) {
		if(	distanceToBoundary<=0 && 
			isDistanceWithinConfidenceLevel(-distanceToBoundary, confidenceLevel, coordinateAccuracy))
			return true;
		return false;
	}
	
	/**
	 * Returns true if the coordinate outside the area with specified level of
	 * confidance and buffer
	 * 
	 * @param distanceToBoundary :
	 *            [meters] absolute distance to real border
	 * @param confidenceLevel : "low", "medium",
	 *            "high". Take into account the accuracy of the coordinate
	 *            Default value is "low". 
	 * @param accuracy : The accuracy of coordinate [meters]
	 */
	function isOutsideArea(distanceToBoundary, confidenceLevel, coordinateAccuracy) {
		if(	distanceToBoundary>0 && 
			isDistanceWithinConfidenceLevel(distanceToBoundary, confidenceLevel, coordinateAccuracy))
			return true;
		return false;
	}
	
	/**
	 * returns buffer zone specified in options or the default value - 0;
	 */
	function getBufferZoneWidth(options){
		var bufferZoneWidth = 0;
		if(options && options.bufferZoneWidth)
			bufferZoneWidth = options.bufferZoneWidth;
		return bufferZoneWidth;
	}
	
	/**
	 * returns confidenceLevel specified in options or the default value - "low";
	 */
	function getConfidenceLevel(options){
		var confidenceLevel = "low";
		if(options && (options.confidenceLevel === "medium" || options.confidenceLevel === "high"))
			confidenceLevel = options.confidenceLevel;
		return confidenceLevel;
	}
	
	/**
	 * returns accuracy of the coordinate or the default value - 0;
	 */
	function getAccuracy(coordinate){
		var accuracy = 0;
		if(coordinate && coordinate.accuracy)
			accuracy = coordinate.accuracy;
		return accuracy;
	}
	
	/************************************************************************************
	** Public API ***********************************************************************
	*************************************************************************************/
	
	/**
	 * Calculate spherical distance between two coordinates, result in meters
	 * 
	 * @param coordinate1: {
	 *            longitude : The longitude as a decimal number, latitude : The
	 *            latitude as a decimal number 
	 *            }
	 * @param coordinate2: {
	 *            longitude : The longitude as a decimal number, latitude : The
	 *            latitude as a decimal number 
	 *            }
	 */
	
	this.getDistanceBetweenCoordinates = function(coordinate1, coordinate2) {
		var lon1 = coordinate1.longitude;
		var lat1 = coordinate1.latitude;
		var lon2 = coordinate2.longitude;
		var lat2 = coordinate2.latitude;
		var dLon = lon2 - lon1;
		if (Math.abs(dLon) > 180) {
			dLon = transformLongitude(lon2) - transformLongitude(lon1);
		}
		dLon = radians(dLon);
		var dLat = radians(lat2 - lat1);
		var calc = Math.sin(dLat / 2) * Math.sin(dLat / 2)
				+ Math.cos(radians(lat1)) * Math.cos(radians(lat2))
				* Math.sin(dLon / 2) * Math.sin(dLon / 2);
		var c = 2 * Math.atan2(Math.sqrt(calc), Math.sqrt(1 - calc));
		return radiansToMeters(c); // Distance in meters
	};
	
	//-------------------------------------------------------------------------------------------
	// Circle related functions 
	
	/**
	 * Calculates the distance of the coordinate from the circle
	 * 
	 * @param circle: {
	 *            longitude: longitude, latitude: latitude, radius: in meters }
	 * 
	 * @param coordinate: {
	 *            longitude : The longitude as a decimal number latitude : The
	 *            latitude as a decimal number accuracy : The accuracy of
	 *            position }
	 * @param options:
	 *            optional parameter { bufferZoneWidth : [meters] Is the distance used
	 *            to increase or reduce the polygon area positive buffer zone
	 *            extends the size of the area negative buffer zone reduces the
	 *            size of the area Default value is 0. }
	 * @returns distance in [meters] to the circle taking into account buffer. The
	 *          distance is positive for coordinates outside the area The
	 *          distance is negative for coordinates inside the area
	 */
	
	 this.getDistanceToCircle = function(coordinate, circle, options) {
		var bufferZoneWidth = getBufferZoneWidth(options);
		var distanceFromCenter = self.getDistanceBetweenCoordinates(
				circle, coordinate);
		return distanceFromCenter - circle.radius - bufferZoneWidth;
	};
	
	/**
	 * Checks if the location within the circle with the given level of
	 * confidence taking into account the bufferZone 
	 * 
	 * @param coordinate: {
	 *            longitude : The longitude as a decimal number latitude : The
	 *            latitude as a decimal number accuracy : The accuracy of
	 *            position }
	 * @param circle: {
	 *            longitude: longitude,  latitude: latitude, radius: in meters }
	 * 
	 * @param options:
	 *            optional parameter { confidenceLevel : "low", "medium",
	 *            "high". Take into account the accuracy of the coordinate
	 *            Default value is "low" bufferZoneWidth : [meters] Is the
	 *            distance used to increase or reduce the polygon area
	 *            positive buffer zone extends the size of the area negative
	 *            buffer zone reduces the size of the area Default value is 0. }
	 * 
	 */
	
	this.isInsideCircle = function(coordinate, circle, options) {
		var distanceToBoundary = self.getDistanceToCircle(coordinate, circle, options);
		return isInsideArea(distanceToBoundary, getConfidenceLevel(options), getAccuracy(coordinate));	
	};
	
	/**
	 * Checks if the location outside the circle with the given level of
	 * confidence and border
	 * 
	 * @param coordinate: {
	 *            longitude : The longitude as a decimal number. latitude : The
	 *            latitude as a decimal number accuracy : The accuracy of
	 *            position }
	 * @param circle: {
	 *            longitude: longitude,  latitude: latitude, radius: in meters }
	 * 
	 * @param options:
	 *            optional parameter { confidenceLevel : "low", "medium",
	 *            "high". Take into account the accuracy of the coordinate
	 *            Default value is "low" bufferZoneWidth : [meters] Is the
	 *            distance used to increase or reduce the polygon area
	 *            positive buffer zone extends the size of the area negative
	 *            buffer zone reduces the size of the area Default value is 0. }
	 * 
	 */
	
	this.isOutsideCircle = function(coordinate, circle, options) {
		var distanceToBoundary = self.getDistanceToCircle(coordinate, circle, options);
		return isOutsideArea(distanceToBoundary, getConfidenceLevel(options), getAccuracy(coordinate));	
	};
	
	
	//-------------------------------------------------------------------------------------------
	// Polygon related functions 
	
	/**
	 * Checks if the location within the polygon with the given level of
	 * confidence
	 * 
	 * @param coordinate: {
	 *            longitude : The longitude as a decimal number latitude : The
	 *            latitude as a decimal number accuracy : The accuracy of
	 *            position }
	 * @param polygon: [ {
	 *            longitude: The longitude as a decimal number, latitude: The
	 *            latitude as a decimal number }, { longitude: The longitude as
	 *            a decimal number, latitude: The latitude as a decimal number },
	 *            ... ]
	 * @param options:
	 *            optional parameter { bufferZoneWidth : [meters] Is the distance used
	 *            to increase or reduce the polygon area positive buffer zone
	 *            extends the size of the area negative buffer zone reduces the
	 *            size of the area Default value is 0. }
	 * @returns distance in [meters] to the polygon taking into account buffer. The
	 *          distance is positive for coordinates outside the area The
	 *          distance is negative for coordinates inside the area
	 */
	this.getDistanceToPolygon = function(coordinate, polygon, options) {
		var polygonInfo = getPolygonInfo(polygon, options);
		var isInsideBoundary = isInsidePolygonBoundary(coordinate, polygon, polygonInfo);
		var bufferZoneWidth = getBufferZoneWidth(options);
		var pLon = coordinate.longitude;
		var pLat = coordinate.latitude;
		var distanceToBoundary = Number.MAX_VALUE;
	
		if (polygonInfo.needLongitudeTransformation) {
			pLon = transformLongitude(pLon);
			polygon = polygonInfo.transformedPolygon;
		}
	
		for ( var i = 0; i < polygon.length; i++) {
			var j = (i + 1) % polygon.length;
			var currentDistance = diastanceFromLineSegment(pLon, pLat, polygon[i].longitude,
					 polygon[i].latitude, polygon[j].longitude, polygon[j].latitude);
			if (currentDistance < distanceToBoundary) {
				distanceToBoundary = currentDistance;
			}
		}
		
		if (!isInsideBoundary) {
			distanceToBoundary -= bufferZoneWidth;
		} else {
			distanceToBoundary = -(distanceToBoundary + bufferZoneWidth);
		}	
		return distanceToBoundary;
	};
	
	/**
	 * Checks if the coordinate located inside the polygon with the given level
	 * of confidence and buffer
	 * 
	 * @param coordinate: {
	 *            longitude : The longitude as a decimal number latitude : The
	 *            latitude as a decimal number accuracy : The accuracy of
	 *            position }
	 * @param polygon: [ {
	 *            longitude: The longitude as a decimal number, latitude: The
	 *            latitude as a decimal number }, { longitude: The longitude as
	 *            a decimal number, latitude: The latitude as a decimal number },
	 *            ... ]
	 * @param options:
	 *            optional parameter { confidenceLevel : "low", "medium","high".
	 *            Take into account the accuracy of the coordinate Default value
	 *            is "low" bufferZoneWidth : [meters] Is the distance used
	 *            to increase or reduce the polygon area positive buffer zone
	 *            extends the size of the area negative buffer zone reduces the
	 *            size of the area Default value is 0. }
	 */
	
	this.isInsidePolygon = function(coordinate, polygon, options) {
		var distanceToBoundary = self.getDistanceToPolygon(coordinate, polygon, options);
		return isInsideArea(distanceToBoundary, getConfidenceLevel(options), getAccuracy(coordinate));	
	};
	
	/**
	 * Checks if the coordinate located outside the polygon with the given level
	 * of confidence and buffer
	 * 
	 * @param coordinate: {
	 *            longitude : The longitude as a decimal number latitude : The
	 *            latitude as a decimal number accuracy : The accuracy of
	 *            position }
	 * @param polygon: [ {
	 *            longitude: The longitude as a decimal number, latitude: The
	 *            latitude as a decimal number }, { longitude: The longitude as
	 *            a decimal number, latitude: The latitude as a decimal number },
	 *            ... ]
	 * @param options:
	 *            optional parameter { confidenceLevel : "low", "medium",
	 *            "high". Take into account the accuracy of the coordinate
	 *            Default value is "low" bufferZoneWidth : [meters] Is the
	 *            distance used to increase or reduce the polygon area
	 *            positive buffer zone extends the size of the area negative
	 *            buffer zone reduces the size of the area Default value is 0. }
	 */
	
	this.isOutsidePolygon = function(coordinate, polygon, options) {
		var distanceToBoundary = self.getDistanceToPolygon(coordinate, polygon, options);
		return isOutsideArea(distanceToBoundary, getConfidenceLevel(options), getAccuracy(coordinate));	
	};
};

var geoUtilities = new GeoUtilities();
WL.Geo = {};
WL.Geo.isInsidePolygon = geoUtilities.isInsidePolygon;
WL.Geo.isInsideCircle = geoUtilities.isInsideCircle;
WL.Geo.isOutsidePolygon = geoUtilities.isOutsidePolygon;
WL.Geo.isOutsideCircle =geoUtilities.isOutsideCircle;
WL.Geo.getDistanceToPolygon=geoUtilities.getDistanceToPolygon;
WL.Geo.getDistanceToCircle=geoUtilities.getDistanceToCircle;
WL.Geo.getDistanceBetweenCoordinates = geoUtilities.getDistanceBetweenCoordinates;

// for debug purposes:
WL.Geo.nearestPointOnLineSegment = geoUtilities.nearestPointOnLineSegment;




 
 
 


