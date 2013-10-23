define(["dojo/_base/kernel", "dojo/_base/lang", "dojo/_base/array"], function(dojo, lang, array){

	var GMath = {
	    TRACKBALLSIZE : 100,

	    vzero : function(v){
		    v[0] = 0.0;
		    v[1] = 0.0;
		    v[2] = 0.0;
	    },

	    vset : function(v, x, y, z){
		    v[0] = x;
		    v[1] = y;
		    v[2] = z;
	    },

	    vsub : function(src1, src2, dst){
		    dst[0] = src1[0] - src2[0];
		    dst[1] = src1[1] - src2[1];
		    dst[2] = src1[2] - src2[2];
	    },

	    vcopy : function(v1, v2){
		    for ( var i = 0; i < 3; i++)
			    v2[i] = v1[i];
	    },

	    vcross : function(v1, v2, cross){
		    var temp = [0, 0, 0];

		    temp[0] = (v1[1] * v2[2]) - (v1[2] * v2[1]);
		    temp[1] = (v1[2] * v2[0]) - (v1[0] * v2[2]);
		    temp[2] = (v1[0] * v2[1]) - (v1[1] * v2[0]);
		    this.vcopy(temp, cross);
	    },

	    vlength : function(v){
		    return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	    },

	    vscale : function(v, div){
		    v[0] *= div;
		    v[1] *= div;
		    v[2] *= div;
	    },

	    vnormal : function(v){
		    this.vscale(v, 1.0 / this.vlength(v));
	    },

	    vdot : function(v1, v2){
		    return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
	    },

	    vadd : function(src1, src2, dst){
		    dst[0] = src1[0] + src2[0];
		    dst[1] = src1[1] + src2[1];
		    dst[2] = src1[2] + src2[2];
	    },

	    trackball : function(q, p1x, p1y, p2x, p2y){
		    var a = [0, 0, 0]; /* Axis of rotation */
		    var phi; /* how much to rotate about axis */
		    var p1 = [0, 0, 0];
		    var p2 = [0, 0, 0];
		    var d = [0, 0, 0];
		    var t;

		    if (p1x == p2x && p1y == p2y) {
			    /* Zero rotation */
			    this.vzero(q);
			    q[3] = 1.0;
			    return;
		    }
		    /*
			 * First, figure out z-coordinates for projection of P1 and P2 to
			 * deformed sphere
			 */
		    this.vset(p1, p1x, p1y, this.project_to_sphere(this.TRACKBALLSIZE, p1x, p1y));
		    this.vset(p2, p2x, p2y, this.project_to_sphere(this.TRACKBALLSIZE, p2x, p2y));

		    /*
			 * Now, we want the cross product of P1 and P2
			 */
		    this.vcross(p2, p1, a);

		    /*
			 * Figure out how much to rotate around that axis.
			 */
		    this.vsub(p1, p2, d);
		    t = this.vlength(d) / (2.0 * this.TRACKBALLSIZE);

		    /*
			 * Avoid problems with out-of-control values...
			 */
		    if (t > 1.0)
			    t = 1.0;
		    if (t < -1.0)
			    t = -1.0;
		    phi = 2.0 * Math.asin(t);

		    this.axis_to_quat(a, phi, q);
	    },

	    axis_to_quat : function(a, phi, q){
		    this.vnormal(a);
		    this.vcopy(a, q);
		    this.vscale(q, Math.sin(phi / 2.0));
		    q[3] = Math.cos(phi / 2.0);
	    },

	    project_to_sphere : function(r, x, y){
		    var d, t, z;

		    d = Math.sqrt(x * x + y * y);
		    if (d < r * 0.70710678118654752440) { /* Inside sphere */
			    z = Math.sqrt(r * r - d * d);
		    } else { /* On hyperbola */
			    t = r / 1.41421356237309504880;
			    z = t * t / d;
		    }
		    return z;
	    },

	    // var count = 0;
	    add_quats : function(q1, q2, dest){

		    var t1 = [0, 0, 0, 0];
		    var t2 = [0, 0, 0, 0];
		    var t3 = [0, 0, 0, 0];
		    var tf = [0, 0, 0, 0];

		    this.vcopy(q1, t1);
		    this.vscale(t1, q2[3]);

		    this.vcopy(q2, t2);
		    this.vscale(t2, q1[3]);

		    this.vcross(q2, q1, t3);
		    this.vadd(t1, t2, tf);
		    this.vadd(t3, tf, tf);
		    tf[3] = q1[3] * q2[3] - vdot(q1, q2);

		    dest[0] = tf[0];
		    dest[1] = tf[1];
		    dest[2] = tf[2];
		    dest[3] = tf[3];

		    // if (++count > RENORMCOUNT) {
		    // count = 0;
		    this.normalize_quat(dest);
		    // }
	    },

	    normalize_quat : function(q){
		    var i;
		    var mag;

		    mag = (q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3]);
		    for (i = 0; i < 4; i++)
			    q[i] /= mag;
	    },

	    build_rotmatrix : function(m, q){
		    m[0][0] = 1.0 - 2.0 * (q[1] * q[1] + q[2] * q[2]);
		    m[0][1] = 2.0 * (q[0] * q[1] - q[2] * q[3]);
		    m[0][2] = 2.0 * (q[2] * q[0] + q[1] * q[3]);
		    m[0][3] = 0.0;

		    m[1][0] = 2.0 * (q[0] * q[1] + q[2] * q[3]);
		    m[1][1] = 1.0 - 2.0 * (q[2] * q[2] + q[0] * q[0]);
		    m[1][2] = 2.0 * (q[1] * q[2] - q[0] * q[3]);
		    m[1][3] = 0.0;

		    m[2][0] = 2.0 * (q[2] * q[0] - q[1] * q[3]);
		    m[2][1] = 2.0 * (q[1] * q[2] + q[0] * q[3]);
		    m[2][2] = 1.0 - 2.0 * (q[1] * q[1] + q[0] * q[0]);
		    m[2][3] = 0.0;

		    m[3][0] = 0.0;
		    m[3][1] = 0.0;
		    m[3][2] = 0.0;
		    m[3][3] = 1.0;
	    },

	    applyMatrix : function(m, v1, v2){
		    v2[0] = m[0][0] * v1[0] + m[0][1] * v1[1] + m[0][2] * v1[2] + m[0][3] * v1[3];
		    v2[1] = m[1][0] * v1[0] + m[1][1] * v1[1] + m[1][2] * v1[2] + m[1][3] * v1[3];
		    v2[2] = m[2][0] * v1[0] + m[2][1] * v1[1] + m[2][2] * v1[2] + m[2][3] * v1[3];
		    v2[3] = m[3][0] * v1[0] + m[3][1] * v1[1] + m[3][2] * v1[2] + m[3][3] * v1[3];
	    }
	};
	return GMath;
});
