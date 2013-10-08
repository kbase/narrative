(function( $, undefined ) {

$.KBWidget({
    name: "kbaseFbaMeta",     
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        var self = this;
        this._super(options);
        var data = options.data;
        var container = this.$elem;

        var labels = ['ID','Type','Moddate','Instance',
                      'Command','Last Modifier','Owner','Workspace','Ref']

        var table = $('<table class="table table-striped table-bordered" \
                              style="margin-left: auto; margin-right: auto;"></table>');
        for (var i=0; i<data.length-2; i++) {
            table.append('<tr><td>'+labels[i]+'</td> \
                          <td>'+data[i]+'</td></tr>');
        }

        container.append(table);

        return this;

    }  //end init

})
}( jQuery ) );
