/**
 * Classe estática User
 */
var User = {
    /**
     * Inicializa a collection de usuários
     * @param {Db}
     */
    init: function(db, callback) {
        var user = db.collection('user'),

            documents = [{
                username: 'silva',
                firstname: "João da",
                lastname: "Silva",
                email: "joaodasilva@example.com",
                disabilities: ["Cadeirante"]
            }];

        //adiciona um índice único ao campo username
        user.ensureIndex({username:1}, {unique: true, sparse: true}, function(err, result) {
            if (err) throw err;

            //adiciona um índice único ao campo email
            user.ensureIndex({email:1}, {unique: true, sparse: true}, function(err, result) {
                if (err) throw err;
        
                //insere o usuário (sem duplicadas, como é garantido pelos indices)
                user.insert(documents, {w: 1}, function(err, result) {
                    if (err && err.code == 11000) console.warn(err.err);    //indice duplicado
                    else if (err) throw err;
                    else console.log("Inserido(s) usuário(s)", result);

                    callback.call();
                });
            });
        });
    }
}

// Exporta a classe User deste módulo
module.exports = User;