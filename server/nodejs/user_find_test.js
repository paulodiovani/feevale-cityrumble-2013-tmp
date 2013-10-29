MongoClient = require('mongodb').MongoClient;

function getUserData() {
    MongoClient.connect('mongodb://127.0.0.1:27017/tenho_acesso', function(e, db) {
        if(e) {
            throw (e.err);
            return;
        }

        var user = db.collection('user');

        user.findOne({username: "silva"}, function(e, result){
            if(e) {
            throw (e.err);
                return;
            }

            console.log(result);
            db.close();
        });
    });
}

getUserData();  //just exec it