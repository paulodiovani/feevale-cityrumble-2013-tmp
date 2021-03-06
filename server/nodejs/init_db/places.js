
var Q = require('q');
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

    init_4sq_categories: function(db, callback) {
        var foursquare_categories = db.collection('foursquare_categories');

        //adiciona um índice único ao campo id
        foursquare_categories.ensureIndex({id: 1}, {unique: true}, function(err, result) {
            if (err) throw err;
        
            foursquare.getCategories({}, function(err, result) {
                var documents = result.response.categories;

                foursquare_categories.insert(documents, {w: 1}, function(err, result) {
                    if (err && err.code == 11000) console.warn(err.err);    //indice duplicado
                    else if (err) throw err;
                    else console.log("Inserido(s) categorias(s)", result);

                    callback.call();
                });
            });
        });
    },

    /**
     * Cria a query para buscar a categoria de nivel superior, pelo id de qualquer nivel de categoria.
     * @param {String} foursquare_id
     * @return {Object}
     */
    foursquare_categories_query_top: function(foursquare_id) {
        var 
        query = {
            $or: [
                {id: foursquare_id},
                {categories: {$elemMatch: {id: foursquare_id} }},
                {categories: {$elemMatch: {categories: {$elemMatch: {id: foursquare_id} }} }}
            ]
        };

        return query;
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

                /*
                 * Usando o módulo Q, para garantir que todas consultas sejam realizadas,
                 * utilizando o conceito de promises
                 */
                Q.ninvoke(foursquare, "getVenues", fsq_params)
                    .then(function(result) {
                        /*
                         * Após a busca de locais no foursquare,
                         * extraímos as categorias destes locais.
                         */
                        var foursquare_categories = db.collection('foursquare_categories');
                        
                        var cat_loop_arr = [],
                            /**
                             * Função que busca a categoria de nível mais alto, baseado nas 
                             * categorias dos estabelecimentos.
                             * @param {Object} ven Foursquare venue
                             * @param {Object} cat Foursquare category
                             * @return {Promise}
                             */
                            cat_loop_fn = function(ven, cat) {
                                return Q.ninvoke(foursquare_categories, "findOne", Place.foursquare_categories_query_top(cat.id), {id: 1, name: 1})
                                    .then(function(foursquare_category) {
                                        //encontra a categoria no array de categorias e atualiza o peso da mesma
                                        if (res = _category_search(categories_result, foursquare_category.id)) {
                                            res.weight = (res.weight || 0) + 1;
                                            res.weight += Place.weight_has_option(ven, null);
                                            res.weight += Place.weight_1600(ven);
                                            res.weight += Place.weight_800(ven);
                                            res.weight += Place.weight_400(ven);
                                        }
                                    });
                            }

                        /*
                         * Varre os arrays de venues e categories (do retorno do 4sq),
                         * e executa a função cat_loop_fn(), adicionando o resultado (as prmises)
                         * a um array
                         */
                        result.response.venues.forEach(function(ven) {
                            ven.categories.forEach(function(cat) {

                                // Adiciona cada promise resultando ao array
                                cat_loop_arr.push( cat_loop_fn(ven, cat) );

                            });
                        });

                        /*
                         * O truque aqui é garantir que todas consultas em foursquare_categories
                         * sejam executadas antes de passar para o próximo bloco .then().
                         * Com uso do Q.all(), conseguimos fazer isso, passando todas as promises
                         * resultantes num array.
                         */
                        return Q.all(cat_loop_arr);
                    })
                    .fin(function() {
                        //reordena os resultados
                        categories_result.sort(function(a, b) {
                            if (a.weight > b.weight || a.weight && !b.weight) return -1;
                            if (b.weight > a.weight || b.weight && !a.weight) return 1;
                            return 0;
                        });

                        /*
                         * Terminada a construção da busca, salvamos os dados.
                         */
                        Place.user_search_save(db, ll, username, type, category_id, categories_result);
                    })
                    .fail(function(err) {
                        console.err(err);
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

    /*
     * Métodos responsáveis por calcular
     * o peso dos locais e categorias.
     */ 

    /**
     * Adiciona ao peso, se local for mais proximo de 1600m
     */
    weight_1600: function(venue) {
        return (venue.location.distance <= 1600) ? 1 : 0;
    },

    /**
     * Adiciona ao peso, se local for mais proximo de 800m
     */
    weight_800: function(venue) {
        return (venue.location.distance <= 800) ? 1 : 0;
    },

    /**
     * Adiciona ao peso, se local for mais proximo de 400m
     */
    weight_400: function(venue) {
        return (venue.location.distance <= 400) ? 1 : 0;
    },

    /**
     * Adiciona ao peso, se local tiver opções disponíveis para a acessibilidade do usuário
     * todo: implementar
     */
    weight_has_option: function(venue, option) {
        return 0;
    }
}

// Exporta a classe Place deste módulo
module.exports = Place;