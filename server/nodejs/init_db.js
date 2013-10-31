/*
 * Script para inicialização do banco de dados,
 * cria as collections (tabelas) e inicializa com dados
 */

/*
 * Primeiro vamos obter o módulo MongoDB e conectar à base,
 * o servidor é local, e o nome da base é tenho_acesso.
 */
var MongoClient = require('mongodb').MongoClient;

MongoClient.connect('mongodb://127.0.0.1:27017/tenho_acesso', function(err, db) {
    if(err) throw err;

    var User  = require('./init_db/users');
    var Place = require('./init_db/places');

    /*
     * ATENÇÃO:
     * As funções abaixo são encadeadas, para inicializar as diversas tabelas 
     * da base utilizando a mesma conexção.
     */

    init_user();

    function init_user() {
        User.init(db, init_places);
    }

    function init_places() {
        Place.init(db, init_user_searches);
    }

    function init_user_searches() {
        Place.init_user_searches(db, init_categories);
    }

    function init_categories() {
        Place.init_categories(db, close_db);
    }

    function close_db() {
        db.close(); //fechar a conexão deve ser a última ação, ou seja estar dentro do último nível de callback
    }
});
