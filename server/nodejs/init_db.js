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

    //insere os registros iniciais, a partir dos modulos criados para cada collection
    require('./init_db/users').init(db);

    db.close();
});
