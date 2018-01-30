

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

	    name: "kbaseRNASeqAnalysis",
	    parent : kbaseAuthenticatedWidget,

        version: "1.0.0",
        options: {
            tableColumns : ['Experiment name', 'Title', 'Experiment Description', 'Experiment design', 'Platform', 'Library type',
                            'Genome name', 'Genome annotation', 'Number of samples', 'Reads Label', 'Number of replicates', 'Tissue', 'Condition',
                            'Domain', 'Source', 'Publication Details']
        },


        _accessors : [
            {name: 'dataset', setter: 'setDataset'},
            'workspace',
        ],


        /*setDataset : function setDataset(newDataset) {

                var $table =  new kbaseTable($tableElem, {
                        structure : {
                            keys : keys,
                            rows : overViewValues
                        }

                    }
                );

            this.data('loader').hide();
            this.data('tableElem').show();

            this.setValueForKey('dataset', newDataset);

        },

        setBarchartDataset : function setBarchartDataset(bars, xLabel, yLabel) {

        },*/

        loadAnalysis : function(ws, analysis) {

            var $rna = this;

            var all_promises = [
                ws.get_objects([{ ref : analysis.annotation_id}]),
                ws.get_objects([{ ref : analysis.genome_id}])
            ];

            var external_ids = {};
            var num_sample_ids = 0;

            if (analysis.sample_ids) {

                $.each(
                    analysis.sample_ids,
                    function (i, v) {
                        num_sample_ids++;
                        all_promises.push(
                            ws.get_object_info([{ref : v}])
                        )
                    }
                );
            }


            if (analysis.alignments) {

                this.options.tableColumns.push('Alignments');
                var alignment_ids = [];
                $.each(
                    analysis.alignments,
                    function (k,v) {

                        if (external_ids[k] == undefined) {

                            alignment_ids.push(k);
                            all_promises.push(
                                ws.get_object_info([{ref : k}])
                            )
                            external_ids[k] = 1;
                        }

                        if (external_ids[v] == undefined) {

                            alignment_ids.push(v);
                            all_promises.push(
                                ws.get_object_info([{ref : v}])
                            )
                            external_ids[v] = 1;
                        }
                    }
                );


            }

            if (analysis.expression_values) {

                this.options.tableColumns.push('Expression Values');
                var ev_ids = [];
                $.each(
                    analysis.expression_values,
                    function (k,v) {
                        if (external_ids[k] == undefined) {
                            ev_ids.push(k);
                            all_promises.push(
                                ws.get_object_info([{ref : k}])
                            )
                            external_ids[k] = 1;
                        }

                        if (external_ids[v] == undefined) {
                            ev_ids.push(v);
                            all_promises.push(
                                ws.get_object_info([{ref : v}])
                            )
                            external_ids[v] = 1;
                        }
                    }
                );

            }

            if (analysis.transcriptome_id) {
                this.options.tableColumns.push('Cuffmerge Output');
                all_promises.push(
                    ws.get_object_info([{ref : analysis.transcriptome_id}])
                );
            }

            if (analysis.cuffdiff_diff_exp_id) {
                this.options.tableColumns.push('Cuffdiff Output');
                all_promises.push(
                    ws.get_object_info([{ref : analysis.cuffdiff_diff_exp_id}])
                );
            }

            $.when.apply($, all_promises).then(function (annotation, genome) {
                var args = Array.prototype.slice.call(arguments);

                if (args.length > 2) {

                    var extra_args = args.slice(2, args.length);

                    var info_keys = ['id', 'name', 'type', 'save_date', 'version', 'saved_by', 'ws_id', 'ws_name', 'chsum', 'size', 'meta'];

                    var ref_map = {};
                    $.each(
                        extra_args,
                        function(i, v) {

                            var info_obj = {};
                            $.each(
                                info_keys,
                                function(i,key) {
                                    info_obj[key] = v[0][i];
                                }
                            );
                            ref_map[ [ v[0][6], v[0][0], v[0][4] ].join('/')] = info_obj;
                        }
                    );

                    if (analysis.sample_ids) {
                        $rna.dataset().parsed_read_samples = $rna.ulFromData(analysis.sample_ids, ref_map);
                    }

                    if (analysis.alignments) {
                        $rna.dataset().parsed_alignments = $rna.ulFromData(analysis.alignments, ref_map);
                    }

                    if (analysis.expression_values) {
                        $rna.dataset().parsed_expression_values = $rna.ulFromData(analysis.expression_values, ref_map);
                    }

                    if (analysis.transcriptome_id) {
                        $rna.dataset().parsed_transcriptome = $rna.ulFromData([analysis.transcriptome_id], ref_map);
                    }

                    if (analysis.cuffdiff_diff_exp_id) {
                        $rna.dataset().parsed_cuffdiff = $rna.ulFromData([analysis.cuffdiff_diff_exp_id], ref_map);
                    }

                }

                $rna.dataset().genome_annotation = annotation[0].data.handle.file_name;
                $rna.dataset().genome_name = genome[0].data.scientific_name;

                $rna.updateUI();
            })
            .fail(function(d) {

                $rna.$elem.empty();
                $rna.$elem
                    .addClass('alert alert-danger')
                    .html("Could not load object : " + d.error.message);
            });

        },

        ulFromData : function(ids, ref_map) {
            var $ul = $.jqElem('ul').css('list-style-type', 'none');

            $.each(
                ids,
                function(k, v) {
                    var $li = $.jqElem('li');
                    if (ref_map[k]) {
                        $li.append(
                            $.jqElem('li')
                                .append(
                                    $.jqElem('a')
                                        .append(ref_map[k]['name'])
                                        .on('click', function(e) {
                                            var $cell = $rna.$elem.nearest('.cell');
                                            var near_idx = IPython.notebook.find_cell_index($cell.data().cell);

                                            $rna.trigger('createViewerCell.Narrative', {
                                                'nearCellIdx': near_idx,
                                                'widget': 'kbaseNarrativeDataCell',
                                                'info' : ref_map[k]
                                            });
                                            return false;
                                        })
                                )
                        );
                    }

                    if (ref_map[k] && ref_map[v]) {
                        $li.append(' : ');
                    }

                    if (ref_map[v]) {
                        $li
                            .append(
                                $.jqElem('a')
                                    .append(ref_map[v]['name'])
                                    .on('click', function(e) {
                                        var $cell = $rna.$elem.nearest('.cell');
                                        var near_idx = IPython.notebook.find_cell_index($cell.data().cell);

                                        $rna.trigger('createViewerCell.Narrative', {
                                            'nearCellIdx': near_idx,
                                            'widget': 'kbaseNarrativeDataCell',
                                            'info' : ref_map[v]
                                        });
                                        return false;
                                    })
                            )
                    }

                    $ul.append($li);
                }
            );

            return $ul;

        },

        init : function init(options) {

            this._super(options);

            var $rna = this;

            var ws = new Workspace(window.kbconfig.urls.workspace, {token : this.authToken()});

            if (this.options.SetupRNASeqAnalysis) {
                this.setDataset(this.options.SetupRNASeqAnalysis);
                this.loadAnalysis(ws, this.options.SetupRNASeqAnalysis);
            }
            else {
                ws.get_objects(
                    [{
                        workspace : this.options.workspace,
                        name : this.options.output
                    }]
                ).then(function(d) {
                    $rna.setDataset(d[0].data);
                    $rna.loadAnalysis(ws, d[0].data);
                })
                .fail(function(d) {

                    $rna.$elem.empty();
                    $rna.$elem
                        .addClass('alert alert-danger')
                        .html("Could not load object : " + d.error.message);
                })
            }


            this.appendUI(this.$elem);




            return this;
        },

        updateUI : function updateUI() {

             new kbaseTable(this.data('tableElem'), {
                    structure : {
                        keys : this.options.tableColumns,
                        rows : {
                            'Experiment name' : this.dataset().experiment_id,
                            'Title' : this.dataset().title,
                            'Experiment Description' : this.dataset().experiment_desc,
                            'Experiment design' : this.dataset().experiment_design,
                            'Platform' : this.dataset().platform,
                            'Library type' : this.dataset().Library_type,
                            'Genome name' : this.dataset().genome_name,
                            'Genome annotation' : this.dataset().genome_annotation,
                            'Number of samples' : this.dataset().num_samples,
                            'Number of replicates' : this.dataset().num_replicates,
                            'Reads Label': this.dataset().parsed_read_samples,
                            'Condition' : this.dataset().condition ? this.dataset().condition.join(', ') : '',


                            'Tissue' : this.dataset().tissue ? this.dataset().tissue.join(', ') : '',
                            'Domain' : this.dataset().domain,
                            'Source' : this.dataset().source,
                            'Publication Details' : this.dataset().publication_id,
                            'Alignments'  : this.dataset().parsed_alignments,
                            'Expression Values' : this.dataset().parsed_expression_values,
                            'Cuffmerge Output' : this.dataset().parsed_transcriptome,
                            'Cuffdiff Output' : this.dataset().parsed_cuffdiff,
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
