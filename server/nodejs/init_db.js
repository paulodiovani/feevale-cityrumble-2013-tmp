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

    var User = require('./init_db/users');

    //insere os registros iniciais, a partir dos modulos criados para cada collection
    User.init(db, function() {
        db.close(); //fechar a conexão deve ser a última ação, ou seja estar dentro do último nível de callback
    });
});
