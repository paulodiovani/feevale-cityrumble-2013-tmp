/**
* @license
* Licensed Materials - Property of IBM
* 5725-G92 (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
* US Government Users Restricted Rights - Use, duplication or
* disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
*/

function wlCommonInit(){

    /*
     * Application is started in offline mode as defined by a connectOnStartup property in initOptions.js file.
     * In order to begin communicating with Worklight Server you need to either:
     * 
     * 1. Change connectOnStartup property in initOptions.js to true. 
     *    This will make Worklight framework automatically attempt to connect to Worklight Server as a part of application start-up.
     *    Keep in mind - this may increase application start-up time.
     *    
     * 2. Use WL.Client.connect() API once connectivity to a Worklight Server is required. 
     *    This API needs to be called only once, before any other WL.Client methods that communicate with the Worklight Server.
     *    Don't forget to specify and implement onSuccess and onFailure callback functions for WL.Client.connect(), e.g:
     *    
     *    WL.Client.connect({
     *          onSuccess: onConnectSuccess,
     *          onFailure: onConnectFailure
     *    });
     *     
     */
    
    
    // Common initialization code goes here
    $('#menu-user-info a').click(function() {
        Ta.connect(Ta.getUserData);
    });

    $('#menu-place-search a').click(function() {
        Ta.connect(Ta.searchForCategories);
    });
}

/**
 * "Classe estática" para encapsulamento dos
 * métodos da aplicação.
 */
Ta = {
    /**
     * Conecta ao Worklight server
     * @param {Function} onConnectSuccess método a executar quando conectado com sucesso
     */
    connect: function(onConnectSuccess) {
        WL.Client.connect({
            onSuccess: onConnectSuccess,
            onFailure: Ta._onFailure
        });
    },

    /**
     * Método executado quando ocorre falha numa requisição
     * @private
     * TODO: Fazer um tratamento de erros decente
     */
    _onFailure: function(response) {
        alert("Erro!");
        console.err(response);
    },

    /**
     * Obtém os dados do usuário a partir do server
     * @param {Object} connectionResponse
     */
    getUserData: function(connectionResponse) {
        /*
         * Invoca um método do adapter
         */
        WL.Client.invokeProcedure({
            adapter: "UserAdapter",
            procedure: "getUserData",
            parameters: ["silva"]   //username, fixo, por enquanto
        }, {
            /**
             * Sucesso na requisição, ou seja, retornou dados do usuário
             * @param {Object} response
             */
            onSuccess: function(response) {
                /*
                 * `response.invocationResult` contém o json retornado pelo adapter
                 * nosso `userdata` é uma propriedade deste objeto.
                 */
                var userData = response.invocationResult.userdata;

                /*
                 * Exibe os dados do usuário na tabela de visualização.
                 * Automagicamente, substitui o text dos elementos de acordo
                 * com o `data-property` destes (obtendo os dados do `userData`)
                 */
                $("#TaUser .userdata [data-property]").each(function() {
                    var $this    = $(this), 
                        property = $this.data("property");

                    $this.text( userData[property] );
                });

                /*
                 * Exibe a lista de deficiências
                 * Aqui o `data-repeat` indica um elemento HTML que será
                 * repetido de acordo com as ocorrências de um array.
                 */
                $("#TaUser .userdata [data-repeat]").each(function() {
                    var $this  = $(this), 
                        repeat = $this.data("repeat");

                    //primeiro, remove elementos antigos
                    $this.siblings().remove();

                    //então adiciona os novos
                    userData[repeat].forEach(function(value) {
                        $this.clone()
                            .removeAttr("data-repeat")
                            .text(value)
                            .appendTo( $this.parent() )
                            .show();
                    });

                    // após, oculta o elemento "modelo"
                    $this.hide();
                });

                //altera a exibição para a página do usuário
                $.mobile.changePage("#TaUser");
            },
            onFailure: Ta._onFailure,
            invocationContext: {}
        });
    },
    
    /**
     * Obtém a posição geogrática para busca por categorias.
     */
    searchForCategories: function(connectionResponse) {
        WL.Device.Geo.acquirePosition(
    		Ta.getCategoriesNearby, 
    		Ta._onFailure, 
    		{enableHighAccuracy: true, maximumAge: 30000}
		);    	
    },

    /**
     * Obtém as categorias dos estabelecimentos por perto
     * @param {Geoposition} geo
     */
    getCategoriesNearby: function(geo) {
        //primeiro, oculta todos os tiles
        $("#TaSearch .place").hide();
        
        var ll = [geo.coords.latitude, geo.coords.longitude].join(","); 
        	
        WL.Client.invokeProcedure({
            adapter: "PlaceAdapter",
            procedure: "searchCategories",
            parameters: [ll, "silva"]   //username fixo por hora
        }, {
            /**
             * Sucesso na requisição, ou seja, retornou dados do usuário
             * @param {Object} response
             */
            onSuccess: function(response) {
                /*
                 * `response.invocationResult` contém o json retornado pelo adapter
                 * nosso `userdata` é uma propriedade deste objeto.
                 */
                var userSearch = response.invocationResult.usersearch,
                    tiles      = userSearch.results;

                /**
                 * Função que Distribui os resultados nos "tiles"
                 */
                function add_tiles() {
                    var $this  = $(this),
                        t_data = (tiles) ? tiles.shift() : undefined;

                    if (t_data === undefined) {
                        return; //acabou :'(
                    }

                    $this
                        .show()
                        .find(".tile .title").text( t_data.name );
                }

                /*
                 * Fazemos para cada tamanho,
                 * começando pelos maiores (maior relevância).
                 * Note que, aqui, contamos que os resultados da busca,
                 * já estejam organizados (maior para menor relevância)
                 * pelo servidor.
                 */
                $("#TaSearch .place.large" ).each(add_tiles);
                $("#TaSearch .place.medium").each(add_tiles);
                $("#TaSearch .place.small" ).each(add_tiles);

                //altera a exibição para a página do usuário
                $.mobile.changePage("#TaSearch");
            },
            onFailure: Ta._onFailure,
            invocationContext: {}
        });        
    }
};