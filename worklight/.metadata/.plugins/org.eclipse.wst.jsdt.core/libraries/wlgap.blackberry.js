/*
* Licensed Materials - Property of IBM
* 5725-G92 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
* US Government Users Restricted Rights - Use, duplication or
* disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
*/

// add dynamicly meta tag for init scale of the widget
function setScaleMetaTag() {
	var meta = document.createElement('meta');
	meta.name = 'viewport';
	meta.content = 'initial-scale=1.0';
	document.getElementsByTagName('head')[0].appendChild(meta);
}
setScaleMetaTag();

/*
 * Class enable to save parameters to local database
 */
__WL.BlackBerryPersister = Class.create({
	_db : null,
	_PARAMS_TABLE : "Params",
	
	read : function (key) {
		try {
			WL.Logger.debug ("Enter read: " + key);
			this._openDatabase ();
			var rs = this._db.execute('select * from ' + this._PARAMS_TABLE + ' where Key="' + key + '"');
			var value = null;
			if (rs.isValidRow()) {
				value = rs.field(1);
			}
			rs.close();
			this._closeDatabase();
			WL.Logger.debug ("Exit read: " + key);
			return value;
		} catch (e) {
			WL.Logger.error ("Problem read from native database: " + e);
			return;
		}
	},
	
	store : function (key, value) {
		try {
			WL.Logger.debug ("Enter store: " + key);
			var oldValue = this.read(key);
			this._openDatabase ();
			if (oldValue == null){
				this._db.execute('insert into ' + this._PARAMS_TABLE + ' values (?, ?)', [key, value]);
			}
			else { 
				this._db.execute('update ' + this._PARAMS_TABLE + ' set Value=? where Key=?', [value, key]);
			}
			this._closeDatabase()
			WL.Logger.debug ("Exit store: " + key);
		} catch (e) {
			WL.Logger.error ("Problem store to native database: " + e);
		}
	},
	
	remove : function (key) {
		WL.Logger.debug ("Enter remove: " + key);
		this._openDatabase ();
		var sql = 'delete from Params where Key="' + key + '"';
		this._db.execute(sql);
		this._closeDatabase()
		WL.Logger.debug ("Exit remove: " + key);
	},
	
	initialize : function (){
    },

	_openDatabase : function () {
		this._db = google.gears.factory.create('beta.database');
		this._db.open('parameters-values');
  		this._db.execute('create table if not exists ' + this._PARAMS_TABLE + ' (Key text, Value text)');
	},
	
	_closeDatabase : function () {
		this._db.close();
	}
});

__WL.blackBerryPersister = new __WL.BlackBerryPersister ();