/*global define*/
/*jslint white: true*/
/**
 * @author Harry Yoo <hsyoo@anl.gov>
 * @public
 */

define(['jquery',
        'narrativeConfig',
        'kbwidget',
        'kbaseNarrativeMethodInput',
        'kbaseNarrativeParameterAjaxTextSubdataInput'
],
function ($, Config) {
    'use strict';
    $.KBWidget({
        name: "kbaseHomologySearch",
        parent: "kbaseNarrativeMethodInput",

        constSequenceNA: 'nucleotide',
        constSequenceAA: 'protein',
        constDatabaseNA: ['kbase_nr.ffn', 'kbase.fna'],
        constDatabaseAA: ['kbase_nr.faa'],
        constDatabaseEmpty: 'selected_genomes',
        constSearchForNA: ["contigs", "features"],
        constSearchForAA: ["features"],

        init: function (options) {
            this._super(options);

            return this;
        },

        render: function () {
            this._super();

            // bind validator
            $('#sequence').on('change', {self: this}, this.onSequenceChange);
            $('#database').on('change', {self: this}, this.onDatabaseChange);
            $('#genome_ids').on('change', {self: this}, this.onGenomeIdsChange);
            $('#program').on('change', {self: this}, this.onProgramChange);

            console.log(Config);
        },

        ajaxConfig: {
            ajax: {
                url: Config.url('search'),
                dataType: 'json',
                delay: 250,
                data: function (keyword) {
                    return {
                        category: 'genomes',
                        itemsPerPage: 20,
                        page: 1,
                        q: keyword + '*'

                    }
                },
                processResults: function (data, params) {
                    //console.log('processingResults:', data, params);
                    var genomeNames = [];
                    data.items.map(function (genome) {
                        genomeNames.push({
                            text: genome.scientific_name + ' (' + genome.genome_id + ')',
                            id: genome.genome_id
                        });
                    });

                    return {
                        results: genomeNames,
                        pagination: {}
                    };
                },
                cache: true
            },
            multiple: "multiple",
            minimumInputLength: 4
        },

        getFastaSequenceType: function (sequence) {
            var patternFastaHeader = /^>.*\n/gi;
            var patternDnaSequence = /[atcgn\n\s]/gi;

            if (sequence.replace(patternFastaHeader, '').replace(patternDnaSequence, '').length === 0) {
                return this.constSequenceNA;
            } else {
                return this.constSequenceAA;
            }
        },

        validateDatabaseProgramWithSequenceType: function (sequence_type, database, program) {
            var isValid = false;
            switch (program) {
                case "blastn":
                    // Search a nucleotide database using a nucleotide query
                    isValid = (sequence_type === this.constSequenceNA && this.constDatabaseNA.indexOf(database) > -1);
                    break;
                case "blastp":
                    // Search protein database using a protein query
                    isValid = (sequence_type === this.constSequenceAA && this.constDatabaseAA.indexOf(database) > -1);
                    break;
                case "blastx":
                    // Search protein database using a translated nucleotide query
                    isValid = (sequence_type === this.constSequenceNA && this.constDatabaseAA.indexOf(database) > -1);
                    break;
                case "tblastn":
                    // Search translated nucleotide database using a protein query
                    isValid = (sequence_type === this.constSequenceAA && database === '');
                    break;
                case "tblastx":
                    // Search translated nucleotide database using a translated nucleotide query
                    isValid = (sequence_type === this.constSequenceNA && database === '');
                    break;
                default:
                    break;
            }
            return isValid;
        },

        validateSearchForProgramWithSequenceType: function (sequence_type, search_for, program) {
            var isValid = false;
            switch (program) {
                case "blastn":
                case "tblastx":
                    isValid = (sequence_type === this.constSequenceNA && this.constSearchForNA.indexOf(search_for) > -1);
                    break;
                case "blastp":
                    isValid = (sequence_type === this.constSequenceAA && this.constSearchForAA.indexOf(search_for) > -1);
                    break;
                case "blastx":
                    isValid = (sequence_type === this.constSequenceNA && this.constSearchForAA.indexOf(search_for) > -1);
                    break;
                case "tblastn":
                    isValid = (sequence_type === this.constSequenceAA && this.constSearchForNA.indexOf(search_for) > -1);
                default:
                    break;
            }
            return isValid;
        },

        validateSearchFor: function (sequence_type, search_for, program) {
            var isValid = this.validateSearchForProgramWithSequenceType(sequence_type, search_for, program)
            var isInValidGenomicSequence = false;
            switch (program) {
                case "blastp":
                case "blastx":
                    if (!isValid && search_for === 'contigs') {
                        isInValidGenomicSequence = true;
                    }
                    break;
                default:
                    break;
            }
            return !isInValidGenomicSequence;
        },

        onSequenceChange: function (event) {
            var self = event.data.self;
            var sequence = this.value;
            if (sequence === undefined) return;
            console.log(self);

            var sequence_type = self.getFastaSequenceType(sequence);
            //console.log("onSequenceChange, seq_type:", sequence_type, sequence);
            if (sequence_type === self.constSequenceNA) {
                self.parameterIdLookup.database.setParameterValue('kbase_nr.ffn');
                self.parameterIdLookup.program.setParameterValue('blastn');
            } else {
                self.parameterIdLookup.database.setParameterValue('kbase_nr.faa');
                self.parameterIdLookup.program.setParameterValue('blastp');
            }
        },

        onDatabaseChange: function (event) {
            var self = event.data.self;
            var database = this.value;
            //console.log('onDatabaseChange: ', database);
            if (database === self.constDatabaseEmpty) {
                self.$advancedOptionsDiv.show();
            }
        },

        onGenomeIdsChange: function (event) {
            // TODO: implement to check whether "selected_genomes" is selected but no genome is selected
            //console.log(this.value);
        },

        onProgramChange: function (event) {
            var self = event.data.self;
            var program = this.value;
            var database = self.parameterIdLookup.database.getParameterValue();
            if (database != self.constDatabaseEmpty && ['tblastn', 'tblastx'].indexOf(program) > -1) {
                // not supported. display as error with proper message
                var msg = self.parameterIdLookup.program.rowDivs[0];

                msg.$row.addClass("kb-method-parameter-row-error");
                msg.$error.html('tblastx and tblastn are supported only against select genome(s).');
                msg.$error.show();
                msg.$feedback.removeClass();
            }
        },

        refresh: function () {
        },

        getState: function () {
            return this.getParameterValue();
        },

        loadState: function (state) {
            if (!state)
                return;
            this.setParameterValue(state);
        },

        /*
         * This is called when this method is run to allow you to check if the parameters
         * that the user has entered is correct.  You need to return an object that indicates
         * if the input is valid, or if not, if there are any error messages.  When this is
         * called, you should visually indicate which parameters are invalid by marking them
         * red (see kbaseNarrativeMethodInput for default styles).
         */
        isValid: function () {

            var errorDetected = false;
            var errorMessages = [];

            // collect sequence, database, and program and check whether input combination is valid
            var sequence = this.parameterIdLookup.sequence.getParameterValue();
            var sequence_type = this.getFastaSequenceType(sequence);
            var database = this.parameterIdLookup.database.getParameterValue();
            var program = this.parameterIdLookup.program.getParameterValue();

            if (database === this.constDatabaseEmpty) {
                // use selected genome to search
                var search_for = this.parameterIdLookup.search_type.getParameterValue();

                if (this.validateSearchFor(sequence_type, search_for, program)) {
                    // pass
                } else {
                    errorDetected = true;
                    errorMessages.push('Genomic sequences (contigs) is available only for nucleotide databases.');
                    var msg = this.parameterIdLookup.search_type.rowDivs[0];

                    msg.$row.addClass("kb-method-parameter-row-error");
                    msg.$error.show();
                    msg.$feedback.removeClass();
                }

                if (this.validateSearchForProgramWithSequenceType(sequence_type, search_for, program)) {
                    // pass
                } else {
                    errorDetected = true;
                    errorMessages.push('Program does not match to the query sequence type.');

                    var msg = this.parameterIdLookup.program.rowDivs[0];

                    msg.$row.addClass("kb-method-parameter-row-error");
                    msg.$error.show();
                    msg.$feedback.removeClass();
                }

            } else {
                // user database
                var validCombo = this.validateDatabaseProgramWithSequenceType(sequence_type, database, program);

                if (!validCombo) {
                    //this.$advancedOptionsDiv.show();

                    errorDetected = true;
                    errorMessages.push('Database or program selection does not match to the query sequence type.');

                    var msg = this.parameterIdLookup.database.rowDivs[0];

                    msg.$row.addClass("kb-method-parameter-row-error");
                    msg.$error.show();
                    msg.$feedback.removeClass();
                }
                else {
                    // reset database, program error marks if any
                }
            }

            return {isValid: !errorDetected, errormssgs: errorMessages};
        },

        /*
         * Necessary for Apps to disable editing parameters that are automatically filled
         * from a previous step.  Returns nothing.
         */
        disableParameterEditing: function () {

        },

        /*
         * Allows those parameters to be renabled, which may be an option for advanced users.
         */
        enableParameterEditing: function () {

        },

        /*
         * An App (or a narrative that needs to auto populate certain fields) needs to set
         * specific parameter values based on the App spec, so we need a way to do this.
         */
        setParameterValue: function (value) {

        },

        /*
         * We need to be able to retrieve any parameter value from this method.  Valid parameter
         * values may be strings, numbers, objects, or lists, but must match what is declared
         * in the method spec.  If the parameter is not valid.
         */
        getParameterValue: function () {
            return "";
        },

        /*
         * This function is invoked every time we run app or method. This is the difference between it
         * and getParameterValue() which could be invoked many times before running (e.g. when widget
         * is rendered).
         */
        prepareValueBeforeRun: function (methodSpec) {

        }

    });
});