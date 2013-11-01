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
    'getUserData': getUserData
});

var MongoClient = require('mongodb').MongoClient;

function getUserData(WL, username) {
    MongoClient.connect('mongodb://127.0.0.1:27017/tenho_acesso', function(err, db) {
        if(err) {
            WL.err(err.err);
            return;
        }

        var user = db.collection('users');

        //busca um único usuário a partir do username
        user.findOne({"username": username}, function(err, result){
            if(err) {
                WL.err(err.err);
                return;
            }

            //envia os dados para o client
            WL.success({userdata: result});
            db.close();
        });
    });
}