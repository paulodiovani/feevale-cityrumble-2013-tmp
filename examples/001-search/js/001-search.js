var Places = {
    /**
     * Inicializa o objeto
     */
    init: function() {
        this._cacheElements();
    },

    get small()  { return $('<div class="place small"> <div class="content"><div> <div>,');  },
    get medium() { return $('<div class="place medium"> <div class="content"><div> <div>,'); },
    get large()  { return $('<div class="place large"> <div class="content"><div> <div>,');  },

    /**
     * Faz cache dos elementos a serem criados/usados
     * @private
     */
    _cacheElements: function() {
        this.$container = $('#container')
    },

    /**
     * Adiciona um novo local (div.place)
     * @param {String/Integer} size (small, medium, large)
     * @return {Bool} true em caso de sucesso
     */
    add: function(size) {
        //verifica se o tamanho é válido, então prossegue
        switch(size) {
            case 'small':
            case 'medium':
            case 'large':
                break;
            default:
                return false;
                break;
        }

        //adiciona o elemento
        this.$container.append( this[size] );

        return true;
    }
}
