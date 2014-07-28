/**
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */

(function( $, undefined ) {
    $.KBWidget({
        name: "rastGenomeImportInput",
        parent: "kbaseNarrativeInput",
        version: "1.0.0",
        options: {
            loadingImage: "../images/ajax-loader.gif",
        },

        /**
         * Renders an input div specialized for the "Import RAST Genomes" function.
         * This includes two blocks:
         * The first is an extendable list of genome IDs. It starts with one available,
         * with a [+] button next to it. Clicking that button will add an additional row.
         *
         * The second block is a username/password block. When the widget's state get saved,
         * this stores the username, but NOT the password.
         *
         * Builds the input div for a function cell, based on the given method object.
         * @param {Object} method - the method being constructed around.
         * @returns {String} an HTML string describing the available parameters for the cell.
         * @private
         */
        init: function(options) {
            this._super(options);

            // figure out all types from the method
            var method = this.options.method;
            var params = method.properties.parameters;

            this.$genomeIdTable = this.makeGenomeIdTable();
            this.addGenomeIdRow();

            this.$rastCreds = this.makeRastCredsBlock();

            var $inputDiv = $('<div>').addClass('kb-cell-params')
                                     .append('<p><b>RAST Genome Ids:</b></p>')
                                     .append(this.$genomeIdTable)
                                     .append(this.$rastCreds);


            this.$elem.append($inputDiv);

            return this;
        },

        makeGenomeIdTable: function() {
            var $table = $('<form class="form-horizontal">');
            return $table;
        },

        addGenomeIdRow: function(id) {
            var $newRowBtn = this.makeAddIdButton(id ? true : false);
            var $row = $('<div class="form-group" style="margin-bottom:5px">')
                       .append($('<div class="col-sm-10">')
                               .append($('<input>')
                                       .addClass('form-control')
                                       .attr('placeholder', 'Genome Id')
                                       .attr('value', (id ? id : ''))))
                       .append($('<div class="col-sm-2">')
                               .append($newRowBtn));

            this.$genomeIdTable.append($row);
            return $row;
        },

        makeAddIdButton: function(trashOnly) {
            var self = this;

            var deleteRow = function(event) {
                event.preventDefault();
                $(event.currentTarget).closest(".form-group").remove();
            };

            var addRow = function(event) {
                event.preventDefault();
                var $newRow = self.addGenomeIdRow();

                $(event.currentTarget).find("span")
                                      .addClass("glyphicon-trash")
                                      .removeClass("glyphicon-plus");

                $(event.currentTarget).off("click")
                                      .click(deleteRow);

                $newRow.find('input').focus();
            };

            var $button = $("<button>")
                          .addClass("btn")
                          .append($("<span>")
                                  .addClass("glyphicon")
                                  .addClass(trashOnly ? "glyphicon-trash" : "glyphicon-plus"));

            if (trashOnly)
                $button.click(deleteRow);
            else
                $button.click(addRow);

            return $button;
        },

        refreshIdTable: function(ids) {
            if (!(ids instanceof Array) || ids.length < 1)
                return;

            this.$genomeIdTable.empty();
            for (var i=0; i<ids.length; i++) {
                this.addGenomeIdRow(ids[i]);
            }
            this.addGenomeIdRow();
        },

        /**
         * Creates and returns a jQuery node with a user id and password field.
         * @return {} a jQuery node with user id and password input fields.
         * @private
         */
        makeRastCredsBlock: function() {
            return $('<div>')
                   .append($('<div>').append('Rast Login:'))
                   .append($('<div>')
                           .append($('<form class="form-inline" role="form">')
                                .append($('<div class="form-group">')
                                   .append($('<input>')
                                           .attr('id', 'rast-id')
                                           .attr('placeholder', 'RAST username')
                                           .addClass('form-control')
                                           .attr('type', 'text')
                                           ).css({'padding-right' : '10px'}))
                                .append($('<div class="form-group">')
                                   .append($('<input>')
                                           .attr('id', 'rast-pw')
                                           .attr('placeholder', 'RAST password')
                                           .attr('type', 'password')
                                           .addClass('form-control')))));
        },

        /**
         * Returns a list of parameters in the order in which the given method
         * requires them.
         * @return {Array} an array of strings - one for each parameter
         * @public
         */
        getParameters: function() {
            // First, the genome ids.
            var idList = [];
            
            this.$genomeIdTable.find('input').each(function(idx, elem) {
                var id = $(elem).val().trim();
                if (id)
                    idList.push(id);
            });

            var genomeIds = idList.join(',');

            var user = this.$elem.find('#rast-id').val();
            var pw = this.$elem.find('#rast-pw').val();
            return [genomeIds, user, pw];
        },

        /**
         * Returns an object representing the state of this widget.
         * In this particular case, it is a list of key-value pairs, like this:
         * { 
         *   'param0' : 'parameter value',
         *   'param1' : 'parameter value'
         * }
         * with one key/value for each parameter in the defined method.
         */
        getState: function() {
            var paramsList = this.getParameters();

            return { idList : paramsList[0],
                     user : paramsList[1] };
        },

        /**
         * Adjusts the current set of parameters based on the given state.
         * Doesn't really do a whole lot of type checking yet, but it's assumed that
         * a state will be loaded from an object generated by getState.
         */
        loadState: function(state) {
            if (!state)
                return;

            if (state.hasOwnProperty('idList')) {
                var ids = state['idList'].split(',');
                this.refreshIdTable(ids);
            }

            if (state.hasOwnProperty('user')) {
                $(this.$elem.find('#rast-id')).val(state['user']);
            }
        },

        refresh: function() { },

    });

})( jQuery );