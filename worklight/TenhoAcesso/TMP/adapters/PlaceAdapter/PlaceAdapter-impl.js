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
	'searchCategories': searchCategories
});

var MongoClient = require('mongodb').MongoClient;
var Q = require('q');
var foursquare = (require('./foursquarevenues'))(
    'T3ULFN503MOA4EXXDE3PPFBDELAIAX1PYBNCG4HXFVI4QCRX', 
    '5MZ3R5UAI4CPXXXT220FPURG1Y45AXGGQXGVDGFBMEAYB45E'
);

function searchCategories(WL, ll, username) {
    var MongoClient = require('mongodb').MongoClient;

    MongoClient.connect('mongodb://127.0.0.1:27017/tenho_acesso', function(err, db) {
        if(err) { WL.err(err.err); return; }

        user_search_find(WL, db, ll, username, "category", null);
    });

}

/**
 * Cria a query para buscar a categoria de nivel superior, pelo id de qualquer nivel de categoria.
 * @param {String} foursquare_id
 * @return {Object}
 */
function foursquare_categories_query_top(foursquare_id) {
    var 
    query = {
        $or: [
            {id: foursquare_id},
            {categories: {$elemMatch: {id: foursquare_id} }},
            {categories: {$elemMatch: {categories: {$elemMatch: {id: foursquare_id} }} }}
        ]
    };

    return query;
}

/**
 * Verifica se há uma busca salva a menos de dois minutos para o usuário e tipo 
 * solicitados.
 */
function user_search_find(WL, db, ll, username, type, category_id) {
    var user_searches = db.collection('user_searches');

    user_searches.findOne({username: username, type: type, category_id: category_id}, function(err, result) {
        if(err) { WL.err(err.err); return; }

        if (result) {
            //se o timestamp for menor que 2 minutos, retorna este resultado
            if (new Date().getTime() - result.timestamp <= 2*60*1000) {
                WL.success({usersearch: result});

                db.close(); /* Fecha a conexão com a base */
                return;
            } else {
                user_searches.remove(result, {w: 1}, function(err) {
                    if(err) { WL.err(err.err); return; }
                    user_search_refresh(WL, db, ll, username, type, category_id);
                });
                return;
            }
        } else {
            user_search_refresh(WL, db, ll, username, type, category_id);
        }
    });
}

/** 
 * Atualiza uma busca do usuário utilizando serviços (4sq)
 */
function user_search_refresh(WL, db, ll, username, type, category_id) {
    if (type == "category") {
        var categories = db.collection('categories'),
        	/**
        	 * Função que busca uma das categorias presentes no array, pelo id,
        	 * Basicamente um array_search
        	 * @param {Array} arr
        	 * @param {String} id
        	 */
	        _category_search = function (arr, id) {
	            var i;
	            for (i = 0; i < arr.length; i++) {
	                if (arr[i].foursquare_id == id) {
	                    return arr[i];
	                }
	            }
	            return null;
	        };

        //busca as categorias de nivel superior da base (todas elas)
        categories.find().toArray(function(err, categories_result) {
            if(err) { WL.err(err.err); return; }

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
                            return Q.ninvoke(foursquare_categories, "findOne", foursquare_categories_query_top(cat.id), {id: 1, name: 1})
                                .then(function(foursquare_category) {
                                    //encontra a categoria no array de categorias e atualiza o peso da mesma
                                    if (res = _category_search(categories_result, foursquare_category.id)) {
                                        res.weight = (res.weight || 0) + 1;
                                        res.weight += weight_has_option(ven, null);
                                        res.weight += weight_1600(ven);
                                        res.weight += weight_800(ven);
                                        res.weight += weight_400(ven);
                                    }
                                });
                        };

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
                    user_search_save(WL, db, ll, username, type, category_id, categories_result);
                })
                .fail(function(err) {
                    if(err) { WL.err(err.err); return; }
                });
        });
    }
}

/**
 * Salva uma busca de usuário na base
 */
function user_search_save(WL, db, ll, username, type, category_id, results) {
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
        if(err) { WL.err(err.err); return; }

        WL.success({usersearch: result});
        db.close(); /* Fecha a conexão com a base */
    });
}

/*
 * Métodos responsáveis por calcular
 * o peso dos locais e categorias.
 */ 

/**
 * Adiciona ao peso, se local for mais proximo de 1600m
 */
function weight_1600(venue) {
    return (venue.location.distance <= 1600) ? 1 : 0;
}

/**
 * Adiciona ao peso, se local for mais proximo de 800m
 */
function weight_800(venue) {
    return (venue.location.distance <= 800) ? 1 : 0;
}

/**
 * Adiciona ao peso, se local for mais proximo de 400m
 */
function weight_400(venue) {
    return (venue.location.distance <= 400) ? 1 : 0;
}

/**
 * Adiciona ao peso, se local tiver opções disponíveis para a acessibilidade do usuário
 * todo: implementar
 */
function weight_has_option(venue, option) {
    return 0;
}
