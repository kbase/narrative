(function( $, undefined ) {

$.KBWidget({
    name: "kbaseModelMetaNarrative",     
    version: "1.0.0",
    options: {
    },

    glammURL: "http://140.221.84.217:7040/glamm/#",
    glammModelTag: "mod",
    glammWorkspaceTag: "ws",
    wsBrowserURL: "http://narrative.kbase.us/landing/#/cards/models/",

    init: function(options) {
        var self = this;
        this._super(options);
        var data = options.data;

        var table = $('<table/>')
                    .addClass('table table-striped table-bordered')
                    .css({'margin-left': 'auto', 'margin-right': 'auto'});

        var createTableRow = function(name, value) {
            return "<tr><td>" + name + "</td><td>" + value + "</td></tr>";
        };

        table.append(createTableRow("<b>ID</b>", "<b>" + data[0] + "</b>"));
        table.append(createTableRow("Genome", data[10].name));
        table.append(createTableRow("# Genes", data[10].number_genes));
        table.append(createTableRow("# Compounds", data[10].number_compounds));
        table.append(createTableRow("# Reactions", data[10].number_reactions));
        table.append(createTableRow("# Compartments", data[10].number_compartments));
        table.append(createTableRow("Workspace", data[7]));

        this.$elem.append(table);

        var wsBrowserLink = "<a href='" + this.wsBrowserURL + data[7] + "/" + data[0] + "' target='_blank' class='btn btn-primary' style='text-decoration:none; color: #fff'>View Model Details</a>";
        var glammLink = "<a href='" + this.glammURL + this.glammWorkspaceTag + "=" + data[7] + "&" + this.glammModelTag + "=" + data[0] + "' target='_blank' class='btn btn-primary' style='text-decoration:none; color: #fff'>View in GLAMM</a>";

        this.$elem.append(wsBrowserLink);
        this.$elem.append(" " + glammLink);

        return this;

    }  //end init

})
}( jQuery ) );
