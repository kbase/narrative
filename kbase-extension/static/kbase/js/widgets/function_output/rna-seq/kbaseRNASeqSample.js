

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'kbaseTable',
		'kbaseAuthenticatedWidget'
	], function(
		KBWidget,
		bootstrap,
		$,
		kbaseTable,
		kbaseAuthenticatedWidget
	) {

    'use strict';

    return KBWidget({

	    name: "kbaseRNASeqSample",
	    parent : kbaseAuthenticatedWidget,

        version: "1.0.0",
        options: {

        },


        _accessors : [
            {name: 'dataset', setter: 'setDataset'},
            'workspace',
        ],

        init : function init(options) {

            this._super(options);

            this.setDataset(this.options.SetupRNASeqAnalysis);

            var $rna = this;

            this.appendUI(this.$elem);

            var ws = new Workspace(window.kbconfig.urls.workspace, {token : $rna.authToken()});

            var ws_params = {
                workspace : this.options.workspaceName || this.options.associateReads.workspace,
                name : this.options.ws_sample_id || this.options.associateReads.output
            };

            ws.get_objects([ws_params]).then(function (d) {

                $.when(
                    ws.get_objects([{ ref : d[0].data.analysis_id}]),
                    ws.get_objects([{ ref : d[0].data.metadata.genome_id}])
                ).then(function (analysis, genome) {

                    $rna.setDataset(
                        {
                            'SingleEnd Read' : 'MISSING',
                            'PairedEnd Read' : 'MISSING',
                            'RNASeq experiment name' : analysis[0].data.experiment_id,
                            'RNASeq sample label' : d[0].data.metadata.sample_id,
                            'RNASeq sample replicate id' : d[0].data.metadata.replicate_id,
                            'Platform type' : d[0].data.metadata.platform,
                            'Reference genome' : genome[0].data.scientific_name,
                            'Tissue' : d[0].data.metadata.tissue,
                            'Condition' : d[0].data.metadata.condition,
                            'Domain' : d[0].data.metadata.domain
                        }
                    );

                    $rna.updateUI();
                })
                .fail(function(d) {
                    $rna.$elem.empty();
                    $rna.$elem
                        .addClass('alert alert-danger')
                        .html("Could not load object : " + d.error.message);
                })

            })
            .fail(function(d) {

                $rna.$elem.empty();
                $rna.$elem
                    .addClass('alert alert-danger')
                    .html("Could not load object : " + d.error.message);
            })

            return this;
        },

        updateUI : function updateUI() {
             new kbaseTable(this.data('tableElem'), {
                    structure : {
                        keys : [/*'SingleEnd Read', 'PairedEnd Read',*/ 'RNASeq experiment name', 'RNASeq sample label',
                        'RNASeq sample replicate id', 'Platform type', 'Reference genome', 'Tissue',
                        'Condition','Domain'],
                        rows : {
                            "SingleEnd Read" : this.dataset()['SingleEnd Read'],
                            "PairedEnd Read" : this.dataset()['PairedEnd Read'],
                            'RNASeq experiment name' : this.dataset()['RNASeq experiment name'],
                            'RNASeq sample label' : this.dataset()['RNASeq sample label'],
                            'RNASeq sample replicate id' : this.dataset()['RNASeq sample replicate id'],
                            'Platform type' : this.dataset()['Platform type'],
                            'Reference genome' : this.dataset()['Reference genome'],
                            'Tissue' : this.dataset()['Tissue'],
                            'Condition' : this.dataset()['Condition'],
                            'Domain' : this.dataset()['Domain'],
                        },
                    }
                }
            );

               this.data('loader').hide();
            this.data('tableElem').show();
        },

        appendUI : function appendUI($elem) {

            $elem
                .append(
                    $.jqElem('div')
                        .attr('id', 'tableElem')
                        .attr('display', 'none')
                )
                .append(
                    $.jqElem('div')
                        .attr('id', 'loader')
                        .append('<br>&nbsp;Loading data...<br>&nbsp;please wait...')
                        .append($.jqElem('br'))
                        .append(
                            $.jqElem('div')
                                .attr('align', 'center')
                                .append($.jqElem('i').addClass('fa fa-spinner').addClass('fa fa-spin fa fa-4x'))
                        )
                )
            ;

            this._rewireIds($elem, this);

        },

    });

} );
