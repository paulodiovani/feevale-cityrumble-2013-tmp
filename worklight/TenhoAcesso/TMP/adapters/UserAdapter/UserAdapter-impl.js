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
MongoClient = require('mongodb').MongoClient;
http = require("http");

require("wl")
.init({
    'getUserData': getUserData
});

function getUserData(WL, username) {
    MongoClient.connect('mongodb://127.0.0.1:27017/tenho_acesso', function(e, db) {
        if(e) {
            WL.err(e.err);
            return;
        }

        var user = db.collection('user');

        //busca um único usuário a partir do username
        user.findOne({"username": username}, function(e, result){
            if(e) {
                WL.err(e.err);
                return;
            }

            //envia os dados para o client
            WL.success({userdata: result});
            db.close();
        });
    });
}