/*global define*/
/*jslint white: true*/
/**
 * Input widget for import NCBI genomes into workspace.
 * @author Roman Sutormin <rsutormin@lbl.gov>
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */
define(['kbwidget', 'bootstrap', 'jquery', 'narrativeConfig', 'kbaseNarrativeInput'], function (
    KBWidget,
    bootstrap,
    $,
    Config,
    kbaseNarrativeInput
) {
    return KBWidget({
        name: 'NcbiGenomeImportInput',
        parent: kbaseNarrativeInput,
        version: '1.0.0',
        options: {
            loadingImage: Config.get('loading_gif'),
        },

        init: function (options) {
            this._super(options);

            this.render();
            this.refresh();
            return this;
        },

        useSelect2: true,

        render: function () {
            var $inputDiv = $('<div>').addClass('kb-cell-params');
            var $inputGenome = $('<input>')
                .addClass('form-control')
                .css({ width: '95%' })
                .attr('name', 'param0')
                .attr('placeholder', 'Select an NCBI Genome')
                .attr('type', 'text');
            var $outputGenome = $('<input>')
                .addClass('form-control')
                .css({ width: '95%' })
                .attr('name', 'param1')
                .attr('placeholder', 'Select an output genome')
                .attr('type', 'text');

            var cellCss = { border: 'none', 'vertical-align': 'middle' };
            var thCss = { 'font-family': '"OxygenBold", sans-serif', 'font-weight': 'bold' };
            var inputCss = { width: '40%' };
            var descCss = { color: '#777' };
            $inputDiv.append(
                $('<table>')
                    .addClass('table')
                    .append(
                        $('<tr>')
                            .css(cellCss)
                            .append($('<th>').css(cellCss).css(thCss).append('NCBI Genome Name'))
                            .append($('<td>').css(cellCss).css(inputCss).append($inputGenome))
                            .append(
                                $('<td>')
                                    .css(cellCss)
                                    .append('Name of public genome accessible on NCBI FTP')
                            )
                    )
                    .append(
                        $('<tr>')
                            .css(cellCss)
                            .append($('<th>').css(cellCss).css(thCss).append('Output Genome Id'))
                            .append($('<td>').css(cellCss).css(inputCss).append($outputGenome))
                            .append(
                                $('<td>')
                                    .css(cellCss)
                                    .append(
                                        'Output Genome Id. If empty, an ID will be chosen automatically.'
                                    )
                            )
                    )
            );

            this.$elem.append($inputDiv);
        },

        /**
         * Returns a list of parameters in the order in which the given method
         * requires them.
         * @return {Array} an array of strings - one for each parameter
         * @public
         */
        getParameters: function () {
            var paramList = [];

            $(this.$elem)
                .find('[name^=param]')
                .filter(':input')
                .each(function (key, field) {
                    paramList.push(field.value.trim());
                });

            return paramList;
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
        getState: function () {
            var state = {};

            $(this.$elem)
                .find('[name^=param]')
                .filter(':input')
                .each(function (key, field) {
                    state[field.name] = field.value;
                });

            return state;
        },

        /**
         * Adjusts the current set of parameters based on the given state.
         * Doesn't really do a whole lot of type checking yet, but it's assumed that
         * a state will be loaded from an object generated by getState.
         */
        loadState: function (state) {
            if (!state) return;

            $(this.$elem)
                .find('[name^=param]')
                .filter(':input')
                .each(function (key, field) {
                    var $field = $(field);
                    var fieldName = $field.attr('name');

                    // If it's a text field, just dump the value in there.
                    if ($field.is('input') && $field.attr('type') === 'text') {
                        $field.val(state[fieldName]);
                    }

                    // If it's a select field, do the same... we'll have comboboxen or something,
                    // eventually, so I'm just leaving this open for that.
                    else if ($field.is('select')) {
                        $field.val(state[fieldName]);
                    }
                });
        },

        refresh: function () {
            this.fixGenomeNames();
            var type = 'KBaseGenomes.Genome';
            this.trigger('dataLoadedQuery.Narrative', [
                type,
                this.IGNORE_VERSION,
                $.proxy(function (objects) {
                    var $input = $($(this.$elem).find('[name=param1]'));
                    var objList = [];

                    if (objects[type] && objects[type].length > 0) {
                        objList = objects[type];
                        /*
                         * Sorting - by date, then alphabetically within dates.
                         */
                        objList.sort(function (a, b) {
                            if (a[3] > b[3]) return -1;
                            if (a[3] < b[3]) return 1;
                            if (a[1] < b[1]) return -1;
                            if (a[1] > b[1]) return 1;
                            return 0;
                        });
                    }
                    /* down to cases:
                     * 1. (simple) objList is empty, $input doesn't have a list attribute.
                     * -- don't do anything.
                     * 2. objList is empty, $input has a list attribute.
                     * -- no more data exists, so remove that list attribute and the associated datalist element
                     * 3. objList is not empty, $input doesn't have a list attribute.
                     * -- data exists, new datalist needs to be added and linked.
                     * 4. objList is not empty, $input has a list attribute.
                     * -- datalist needs to be cleared and updated.
                     */

                    // case 1 - no data, input is unchanged

                    // case 2 - no data, need to clear input
                    var datalistID = $input.attr('list');
                    if (objList.length == 0 && datalistID) {
                        $(this.$elem.find('#' + datalistID)).remove();
                        $input.removeAttr('list');
                        $input.val('');
                    }

                    // case 3 - data, need new datalist
                    // case 4 - data, need to update existing datalist
                    else if (objList.length > 0) {
                        var $datalist;
                        if (!datalistID) {
                            datalistID = this.genUUID();
                            $input.attr('list', datalistID);
                            $datalist = $('<datalist>').attr('id', datalistID);
                            $input.after($datalist);
                        } else {
                            $datalist = $(this.$elem.find('#' + datalistID));
                        }
                        $datalist.empty();
                        for (var j = 0; j < objList.length; j++) {
                            $datalist.append(
                                $('<option>').attr('value', objList[j][1]).append(objList[j][1])
                            );
                        }
                    }
                }, this),
            ]);
            return;
        },

        fixGenomeNames: function () {
            var pid = 'param0';
            var $input = $($(this.$elem).find('[name=' + pid + ']'));
            var self = this;

            var request = $.getJSON('static/kbase/js/widgets/function_input/ncbi_genome2ftp.json');

            //kbws.list_referencing_objects([objectIdentity], function(data) {
            $.when(request)
                .done(function (data) {
                    var objList = [];
                    for (var key in data) objList.push(key);
                    var datalistID = $input.attr('list');
                    var $datalist;
                    if (!datalistID) {
                        datalistID = self.genUUID();
                        $input.attr('list', datalistID);
                        $datalist = $('<datalist>').attr('id', datalistID);
                        $input.after($datalist);
                    } else {
                        $datalist = $(self.$elem.find('#' + datalistID));
                    }
                    $datalist.empty();
                    for (var j = 0; j < objList.length; j++) {
                        $datalist.append(
                            $('<option>').attr('value', objList[j]).append(objList[j])
                        );
                    }
                })
                .fail(function (err) {
                    console.error('Error loading ncbi genome names from JSON resource file:');
                    console.error(err);
                });
        },

        genUUID: function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (Math.random() * 16) | 0,
                    v = c == 'x' ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            });
        },
    });
});
