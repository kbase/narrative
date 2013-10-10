(function( $, undefined ) {

$.KBWidget({
    name: "kbaseModelMetaNarrative",     
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        var self = this;
        this._super(options);
        var data = options.data;
        this.dbg(data);

        var container = this.$elem;

        var labels = ['ID','Type','Moddate','Instance',
                      'Command','Last Modifier','Owner','Workspace','Ref']

        var table = $('<table class="table table-striped table-bordered" \
                              style="margin-left: auto; margin-right: auto;"></table>');
        for (var i=0; i<data.length-2; i++) {
            table.append('<tr><td>'+labels[i]+'</td> \
                          <td>'+data[i]+'</td></tr>');
        }

        /**
         * Need to show:
         * 
         * ID
         * name
         * number compounds
         * number reactions
         * number genes
         * number compartments
         * workspace
         * link to landing page
         * link to GLAMM
         */


        container.append(table);

        return this;

    }  //end init

})
}( jQuery ) );
