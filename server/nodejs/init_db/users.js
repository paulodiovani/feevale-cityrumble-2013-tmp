/**
 * Classe estática User
 */
var User = {
    /**
     * Inicializa a collection de usuários
     * @param {Db}
     */
    init: function(db) {
        var user = db.collection('user'),

            documents = [{
                username: 'silva',
                firstname: "João da",
                lastname: "Silva",
                email: "joaodasilva@example.com",
                disabilities: ["Cadeirante"]
            }];

        user.insert(documents, {w: -1}, function(err, result) {
            if (err) throw err;

            console.log("Inserido(s) usuário(s)");
        });
    }
}

// Exporta a classe User deste módulo
module.exports = User;