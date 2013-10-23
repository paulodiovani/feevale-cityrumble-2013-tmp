define(["dojo/_base/kernel", "dojo/_base/lang", "dojo/_base/declare", "dojo/_base/html", "dojo/_base/array", "dojo/_base/connect", "dojo/dom-geometry", "dojox/gfx", "dijit/_Widget", "widgets/GMath"],
        function(dojo, lang, declare, html, array, connect, domGeom, gfx, Widget, GMath){

	        return declare("widgets.Gyro", Widget, {
	            _surface : null,
	            focalLength : 300,

	            constructor : function(/* Object */options, /* HtmlNode */div){
		            var d = 50;
		            this._R = 100;
		            var z = 0;
		            this.pointsArray = [
		                    this.make3DPoint(-d, -d, -d + z),
		                    this.make3DPoint(d, -d, -d + z),
		                    this.make3DPoint(d, -d, d + z),
		                    this.make3DPoint(-d, -d, d + z),
		                    this.make3DPoint(-d, d, -d + z),
		                    this.make3DPoint(d, d, -d + z),
		                    this.make3DPoint(d, d, d + z),
		                    this.make3DPoint(-d, d, d + z)];
		            this.cubeAxisRotations = this.make3DPoint(0, 0, 0);
	            },

	            startup : function(){
		            this.inherited(arguments);
	            },

	            _repere : {

	            },

	            autoRun : function(){
		            var x = 0;
		            var y = 0;
		            var z = 0;
		            setInterval(dojo.hitch(this, function(){
			            x += (Math.random() - 0.5) / 10;
			            y += (Math.random() - 0.5) / 10;
			            z += (Math.random() - 0.5) / 10;
			            this.rotateCubeBy(x, y, z);
			            this.cube();
		            }), 100);
	            },

	            makeReperePoint : function(s, x, y, z){
		            var r = this._repere;
		            var p = r[s];
		            if (!p) {
			            p = this.make3DPoint(x, y, z);
			            r[s] = p;
		            }
		            var res = this.transform3DPoints([p]);
		            return res;
	            },

	            repere : function(){
		            var node = this.domNode;
		            var b = domGeom.position(node);
		            var cx = b.w / 2;
		            var cy = b.h / 2;

		            var o = this.makeReperePoint("o", 0, 0, 0);
		            var px = this.makeReperePoint("px", 100, 0, 0);
		            var py = this.makeReperePoint("py", 0, 100, 0);
		            var pz = this.makeReperePoint("pz", 0, 0, 100);

		            var sx = {
		                x1 : o.x + cx,
		                y1 : o.y + cy,
		                x2 : px.x + cx,
		                y2 : px.y + cy
		            };

		            var x = this._repere.x;
		            if (!x) {
			            x = this._group.createLine(sx).setStroke("#ff0000");
			            this._repere.x = x;
		            } else {
			            x.setShape(sx);
		            }

		            var sy = {
		                x1 : o.x + cx,
		                y1 : o.y + cy,
		                x2 : py.x + cx,
		                y2 : py.y + cy
		            };
		            var y = this._repere.y;
		            if (!y) {
			            y = this._group.createLine(sy).setStroke("#00ff00");
			            this._repere.y = y;
		            } else {
			            y.setShape(sy);
		            }

		            var sz = {
		                x1 : o.x + cx,
		                y1 : o.y + cy,
		                x2 : pz.x + cx,
		                y2 : pz.y + cy
		            };
		            var z = this._repere.z;
		            if (!z) {
			            z = this._group.createLine(sz).setStroke("#0000ff");
			            this._repere.z = z;
		            } else {
			            z.setShape(sz);
		            }

	            },

	            _msg : undefined,
	            msg : function(m){
		            var t = this._msg;
		            if (!t) {
			            t = this._group.createText({
			                x : 15,
			                y : 62,
			                align : "left"
			            });
			            this._msg = t;
		            }
		            var s = t.getShape();
		            s.text = m;
		            t.setShape(s);
	            },

	            text : function(){
		            var s1 = {
		                x : 15,
		                y : 22,
		                align : "left"
		            };
		            var t1 = this._group.createText(s1);

		            var s2 = {
		                x : 15,
		                y : 32,
		                align : "left"
		            };
		            var t2 = this._group.createText(s2);

		            var s3 = {
		                x : 15,
		                y : 42,
		                align : "left"
		            };
		            var t3 = this._group.createText(s3);

		            var s4 = {
		                x : 15,
		                y : 52,
		                align : "left"
		            };
		            var t4 = this._group.createText(s4);

		            t1.setFill("black");
		            t1.setFont({
		                family : "calibri",
		                size : 10
		            });
		            t2.setFill("black");
		            t2.setFont({
		                family : "calibri",
		                size : 10
		            });
		            t3.setFill("black");
		            t3.setFont({
		                family : "calibri",
		                size : 10
		            });
		            t4.setFill("black");
		            t4.setFont({
		                family : "calibri",
		                size : 10
		            });

		            var cookAngle = function(a){
			            return (a * 180 / Math.PI).toFixed(10);
		            };

		            connect.connect(this, "cubeRotated", this, function(a){
			            s1.text = cookAngle(a.x);
			            t1.setShape(s1);
			            s2.text = cookAngle(a.y);
			            t2.setShape(s2);
			            s3.text = cookAngle(a.z);
			            t3.setShape(s3);
			            s4.text = a.pv;
			            t4.setShape(s4);
		            });

	            },

	            deco : function(){
		            var node = this.domNode;
		            var b = domGeom.position(node);
		            var cx = b.w / 2;
		            var cy = b.h / 2;
		            var r = this._R;
		            var c = this._group.createCircle({
		                cx : cx,
		                cy : cy,
		                r : r
		            }).setStroke({
		                color : "#000000",
		                width : 1
		            });
		            return c;
	            },

	            _c1Line : undefined,
	            _c2Line : undefined,

	            drawXAB : function(c1, c2){

		            var node = this.domNode;
		            var b = domGeom.position(node);
		            var cx = b.w / 2;
		            var cy = b.h / 2;

		            var s1 = {
		                x1 : cx,
		                y1 : cy,
		                x2 : cx + c1.x,
		                y2 : cy + c1.y
		            };
		            var l = this._c1Line;
		            if (!l) {
			            l = this._group.createLine(s1).setStroke("black");
			            this._c1Line = l;
		            } else {
			            l.setShape(s1);
		            }

		            var s2 = {
		                x1 : cx,
		                y1 : cy,
		                x2 : cx + c2.x,
		                y2 : cy + c2.y
		            };
		            var l = this._c2Line;
		            if (!l) {
			            l = this._group.createLine(s2).setStroke("black");
			            this._c2Line = l;
		            } else {
			            l.setShape(s2);
		            }
	            },

	            mousePoint : function(x, y){
		            var s = {
		                cx : x,
		                cy : y,
		                r : 3
		            };
		            if (this._mousePoint == null)
			            this._mousePoint = this._group.createCircle(s).setStroke({
				            color : "#000000"
			            });
		            else
			            this._mousePoint.setShape(s);
	            },

	            cookMousePoint : function(e){
		            var mouseCoords = function(ev){
			            var px, py;
			            ev = ev || window.event;
			            if (ev.pageX || ev.pageY) {
				            px = ev.pageX;
				            py = ev.pageY;
			            } else {
				            px = ev.clientX + dojo.body().scrollLeft - dojo.body().clientLeft;
				            py = ev.clientY + dojo.body().scrollTop - dojo.body().clientTop;
			            }
			            return {
			                x : px,
			                y : py
			            };
		            };

		            var node = this.domNode;
		            var b = domGeom.position(node, true);
		            var R = this._R;

		            var cx = b.w / 2;
		            var cy = b.h / 2;

		            var c = mouseCoords(e);
		            var x = c.x - cx - b.x;
		            var y = c.y - cy - b.y;
		            var d = Math.sqrt(x * x + y * y);
		            var out = (d >= R);
		            if (out) {
			            x = x * R / d;
			            y = y * R / d;
		            }
		            if (x > 100 || x < -100 || y > 100 || y < -100) {
			            debugger;
		            }
		            return {
		                x : x,
		                y : y
		            };
	            },

	            getAngles : function(e1, e2){
		            var c1 = this.cookMousePoint(e1);
		            var c2 = this.cookMousePoint(e2);
		            this.drawXAB(c1, c2);
		            var xa = c1.x;
		            var ya = c1.y;
		            var xb = c2.x;
		            var yb = c2.y;
		            var r = this._R;
		            var r2 = r * r;
		            var xa2 = xa * xa;
		            var ya2 = ya * ya;
		            var xb2 = xb * xb;
		            var yb2 = yb * yb;
		            var ra = Math.sqrt(xa2 + ya2);
		            var rb = Math.sqrt(xb2 + yb2);
		            var t = (xa * ya + xb * yb) / (ra * rb);
		            if (t > 1) {
		            	this.msg("" + t);
			            t = 1;
		            }
		            if (t < -1) {
		            	this.msg("" + t);
			            t = -1;
		            }
		            var az = Math.acos(t);

		            // var pv = Math.asin((xa * yb - xb * ya) / (ra * rb));
		            if (isNaN(az))
			            debugger;
		            var za = -r + Math.sqrt(r2 - xa2 - ya2);
		            var zb = -r + Math.sqrt(r2 - xb2 - yb2);
		            var ay = Math.acos((xa * za + xb * zb) / r2);
		            var ax = Math.acos((ya * za + yb * zb) / r2);

		            return {
		                x : 0,
		                y : 0,
		                z : az
//		                pv : pv
		            };

	            },

	            buildRendering : function(){
		            this.inherited(arguments);

		            var node = this.domNode;
		            var b = domGeom.position(node);
		            var s = gfx.createSurface(node, b.w, b.h);
		            this._surface = s;

		            this._group = s.createGroup();
		            this._group.createRect({
		                x : 0,
		                y : 0,
		                width : b.w,
		                height : b.h
		            }).setStroke({
		                color : "blue",
		                width : 2
		            });
		            this.deco();
		            this.text();
		            this.cube();

		            var connectId = null;
		            var eventSource = s.getEventSource();

		            connect.connect(eventSource, 'mousedown', this, function(evt){
			            if (connectId)
				            connect.disconnect(connectId);

			            var start = evt;

			            connectId = connect.connect(eventSource, 'mousemove', this, function(e){
				            a = this.getAngles(start, e);
				            if (!a)
					            return;

				            this.rotateCubeBy(a);

			            });

			            dojo.connect(eventSource, 'mouseup', this, function(e){
				            if (connectId) {
					            connect.disconnect(connectId);
					            connectId = null;
				            }
			            });
		            });
	            },

	            vertices : [],

	            vertex : function(p, i){
		            var c;
		            var x = p.x;
		            var y = p.y;
		            var pos = domGeom.position(this.domNode);

		            var s = {
		                cx : x + pos.w / 2,
		                cy : y + pos.h / 2,
		                r : 5 * p.scaleFactor * p.scaleFactor
		            };
		            c = this.vertices[i];
		            var fill = {
		                type : 'radial',
		                cx : s.cx,
		                cy : s.cy,
		                r : s.r,
		                colors : [{
		                    offset : 0,
		                    color : "#ffffff"
		                }, {
		                    offset : 1,
		                    color : "#000000"
		                }]
		            };
		            if (c) {
			            c.setShape(s).setFill(fill).setStroke("000000");;
		            } else {
			            // c =
			            // this._group.createCircle(s).setFill("#ff0000").setStroke("000000");
			            c = this._group.createCircle(s).setFill(fill).setStroke("000000");
			            this.vertices[i] = c;
		            }
		            return c;
	            },

	            edges : [],

	            edge : function(p1, p2, i){
		            var pos = domGeom.position(this.domNode);
		            var x1 = p1.x + pos.w / 2;
		            var y1 = p1.y + pos.h / 2;
		            var x2 = p2.x + pos.w / 2;
		            var y2 = p2.y + pos.h / 2;
		            var s = {
		                x1 : x1,
		                y1 : y1,
		                x2 : x2,
		                y2 : y2
		            };
		            l = this.edges[i];
		            if (l)
			            l.setShape(s);
		            else {
			            l = this._group.createLine(s).setStroke("#0000ff");
			            this.edges[i] = l;
		            }
		            return l;
	            },

	            make2DPoint : function(x, y, depth, scaleFactor){
		            var point = {
		                x : x,
		                y : y,
		                depth : depth,
		                scaleFactor : scaleFactor
		            };
		            return point;
	            },

	            make3DPoint : function(x, y, z){
		            var point = {};
		            point.x = x;
		            point.y = y;
		            point.z = z;
		            return point;
	            },

	            transform3DPoints : function(pts){
		            var ret = [];
		            var axisRotations = this.cubeAxisRotations;

		            var sx = Math.sin(axisRotations.x);
		            var cx = Math.cos(axisRotations.x);
		            var sy = Math.sin(axisRotations.y);
		            var cy = Math.cos(axisRotations.y);
		            var sz = Math.sin(axisRotations.z);
		            var cz = Math.cos(axisRotations.z);

		            var x, y, z, xy, xz, yx, yz, zx, zy;
		            var points;
		            if (pts)
			            points = pts;
		            else
			            points = this.pointsArray;
		            var i = points.length;
		            while (i--) {
			            var p = points[i];
			            x = p.x;
			            y = p.y;
			            z = p.z;
			            if (true) {
				            // rotation around x
				            xy = cx * y - sx * z;
				            xz = sx * y + cx * z;
				            // rotation around y
				            yz = cy * xz - sy * x;
				            yx = sy * xz + cy * x;
				            // rotation around z
				            zx = cz * yx - sz * xy;
				            zy = sz * yx + cz * xy;
			            } else {
				            // x
				            xy = cx * y - sx * z;
				            xz = sx * y + cx * z;
				            // y
				            yz = cy * z - sy * x;
				            yx = sy * z + cy * x;
				            // z
				            zx = cz * x - sz * y;
				            zy = sz * x + cz * y;
			            }
			            ret.push({
			                x : zx,
			                y : zy,
			                z : yz
			            });
		            }
		            return ret;
	            },

	            to2DPoints : function(pts){
		            var tr = [];
		            var i = pts.length;
		            while (i--) {
			            var p = pts[i];
			            scaleFactor = this.focalLength / (this.focalLength + p.z);
			            x = p.x * scaleFactor;
			            y = p.y * scaleFactor;
			            z = p.z;
			            tr.push(this.make2DPoint(x, y, z, scaleFactor));
		            }
		            return tr;
	            },

	            fromXY : function(xa, ya, xb, yb){

	            },

	            rotateCubeBy : function(a){
		            this.cubeAxisRotations.x = a.x;
		            this.cubeAxisRotations.y = a.y;
		            this.cubeAxisRotations.z = a.z;
		            this.cube();
		            this.cubeRotated(a);
	            },

	            cubeRotated : function(a){
		            // hook
	            },

	            cube : function(){
		            // this.repere();

		            var tdp = this.transform3DPoints();

		            var sp = this.to2DPoints(tdp);

		            this.edge(sp[0], sp[1], 0);
		            this.edge(sp[1], sp[5], 1);
		            this.edge(sp[5], sp[4], 2);
		            this.edge(sp[4], sp[0], 3);

		            this.edge(sp[2], sp[3], 4);
		            this.edge(sp[3], sp[7], 5);
		            this.edge(sp[7], sp[6], 6);
		            this.edge(sp[6], sp[2], 7);

		            this.edge(sp[0], sp[3], 8);
		            this.edge(sp[1], sp[2], 9);
		            this.edge(sp[5], sp[6], 10);
		            this.edge(sp[4], sp[7], 11);

		            sp.sort(function(p1, p2){
			            if (p1.depth == p2.depth)
				            return 0;
			            return p2.depth > p1.depth ? 1 : 0;
		            });
		            for ( var i = 0; i < sp.length; i++)
			            this.vertex(sp[i], i);

	            },

	            resize : function(b){
		            var box;
		            switch (arguments.length) {
			            case 0 :
				            // case 0, do not resize the div, just the surface
				            var node = this.domNode;
				            var pos = domGeom.position(node, true);
				            this.surface.setDimensions(pos.w, pos.h);
				            break;
			            case 1 :
				            // argument, override node box
				            box = lang.mixin({}, b);
				            domGeom.getMarginBox(this.domNode, box);
				            break;
			            case 2 :
				            // two argument, width, height
				            box = {
				                w : arguments[0],
				                h : arguments[1]
				            };
				            domGeom.getMarginBox(this.domNode, box);
				            break;
		            }

	            }
	        });
        });
