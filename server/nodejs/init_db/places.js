
var foursquare = (require('../foursquarevenues'))(
    'T3ULFN503MOA4EXXDE3PPFBDELAIAX1PYBNCG4HXFVI4QCRX', 
    '5MZ3R5UAI4CPXXXT220FPURG1Y45AXGGQXGVDGFBMEAYB45E'
);

/**
 * Classe estática Place
 */
var Place = {

    init: function(db, callback) {
        var places = db.collection('places');

        //adiciona um índice único ao campo foursquare_id
        places.ensureIndex({foursquare_id: 1}, {unique: true, sparse: true}, function(err, result) {
            if (err) throw err;

            callback.call();
        });
    },

    init_user_searches: function(db, callback) {
        var user_searches = db.collection('user_searches');

        //adiciona um índice único ao campo foursquare_id
        user_searches.ensureIndex({username: 1, type: 1, category_id: 1}, {unique: true}, function(err, result) {
            if (err) throw err;

            callback.call();
        });
    },


    init_categories: function(db, callback) {
        var categories = db.collection('categories'),
            documents = [
                { "foursquare_id": "4d4b7104d754a06370d81259", "name": "Arte & Entretenimento" },
                { "foursquare_id": "4d4b7105d754a06372d81259", "name": "Escolas & Universidades" },
                { "foursquare_id": "4d4b7105d754a06373d81259", "name": "Eventos" },
                { "foursquare_id": "4d4b7105d754a06374d81259", "name": "Alimentação" },
                { "foursquare_id": "4d4b7105d754a06376d81259", "name": "Vida Noturna" },
                { "foursquare_id": "4d4b7105d754a06377d81259", "name": "Ao Ar Livre & Recreação" },
                { "foursquare_id": "4d4b7105d754a06375d81259", "name": "Profissional & Outros Locais" },
                { "foursquare_id": "4e67e38e036454776db1fb3a", "name": "Residência" },
                { "foursquare_id": "4d4b7105d754a06378d81259", "name": "Lojas & Servicos" },
                { "foursquare_id": "4d4b7105d754a06379d81259", "name": "Viagem & Transporte" }
            ];

        //adiciona um índice único ao campo foursquare_id
        categories.ensureIndex({foursquare_id: 1}, {unique: true, sparse: true}, function(err, result) {
            if (err) throw err;

            //adiciona um índice único ao campo name
            categories.ensureIndex({name: 1}, {unique: true}, function(err, result) {
                if (err) throw err;
        
                //insere as categorias (sem duplicadas, como é garantido pelos indices)
                categories.insert(documents, {w: 1}, function(err, result) {
                    if (err && err.code == 11000) console.warn(err.err);    //indice duplicado
                    else if (err) throw err;
                    else console.log("Inserido(s) categorias(s)", result);

                    callback.call();
                });
            });
        });
    },

    /**
     * Busca pelas categorias disponíveis, de acordo com os locais aos redores
     *
     */
    search_categories: function(ll, username) {
        var MongoClient = require('mongodb').MongoClient;

        MongoClient.connect('mongodb://127.0.0.1:27017/tenho_acesso', function(err, db) {
            if (err)  throw err;

            Place.user_search_find(db, ll, username, "category", null);
        });
    },

    /**
     * Verifica se há uma busca salva a menos de dois minutos para o usuário e tipo 
     * solicitados.
     */
    user_search_find: function(db, ll, username, type, category_id) {
        var user_searches = db.collection('user_searches');

        user_searches.findOne({username: username, type: type, category_id: category_id}, function(err, result) {
            if (err) throw err;

            if (result) {
                //se o timestamp for menor que 2 minutos, retorna este resultado
                if (new Date().getTime() - result.timestamp <= 2*60*1000) {
                    console.log(result);

                    db.close(); /* Fecha a conexão com a base */
                    return;
                } else {
                    user_searches.remove(result, {w: 1}, function(err) {
                        if (err) throw err;
                        Place.user_search_refresh(db, ll, username, type, category_id);
                    });
                    return;
                }
            }
        
            Place.user_search_refresh(db, ll, username, type, category_id);
        });
    },

    /** 
     * Atualiza uma busca do usuário utilizando serviços (4sq)
     */
    user_search_refresh: function(db, ll, username, type, category_id) {
        if (type == "category") {
            var categories = db.collection('categories');

            function _category_search(arr, id) {
                var i;
                for (i = 0; i < arr.length; i++) {
                    if (arr[i].foursquare_id == id) {
                        return arr[i];
                    }
                }
                return null;
            }

            //busca as categorias de nivel superior da base (todas elas)
            categories.find().toArray(function(err, categories_result) {
                if (err) throw err;

                var fsq_params = {
                    "intent": "browse",
                    "ll": ll,
                    // "categoryId": category_id,
                    "radius": 3600,
                    "limit": 15
                };

                //busca os locais (venues) por perto, via 4sq, e usa para
                //calcular o peso das categorias
                foursquare.getVenues(fsq_params, function(err, result) {
                    if (err)  throw err;

                    result.response.venues.forEach(function(ven) {
                        ven.categories.forEach(function(cat) {

                            //FIXME: venues não trazem, na maioria das vezes, a categoria de mais alto nível
                            if (res = _category_search(categories_result, cat.id)) {
                                res.weight = (res.weight || 0) + 1;
                                res.weight += Place.weight_has_option(ven, null);
                                res.weight += Place.weight_1600(ven);
                                res.weight += Place.weight_800(ven);
                                res.weight += Place.weight_400(ven);
                            }
                        });
                    });

                    //realizada a busca e ajustados os pesos, salva
                    Place.user_search_save(db, ll, username, type, category_id, categories_result);
                });
                
            });
        }
    },

    /**
     * Salva uma busca de usuário na base
     */
    user_search_save: function(db, ll, username, type, category_id, results) {
        var user_searches = db.collection('user_searches'),

            search = {
                username: username,
                type: type,
                category_id: category_id,
                ll: ll,
                timestamp: new Date().getTime(),
                results: results
            };

        //adiciona os resultados da busca
        user_searches.insert(search, {w: 1}, function(err, result) {
            if (err) throw err;

            console.log(result);
            db.close(); /* Fecha a conexão com a base */
        });
    },

    weight_1600: function(venue) {
        return (venue.location.distance <= 1600) ? 1 : 0;
    },

    weight_800: function(venue) {
        return (venue.location.distance <= 800) ? 1 : 0;
    },

    weight_400: function(venue) {
        return (venue.location.distance <= 400) ? 1 : 0;
    },

    weight_has_option: function(venue, option) {
        return 0;
    }
}

// Exporta a classe Place deste módulo
module.exports = Place;