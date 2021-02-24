

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'kbaseTable',
		'kbaseAuthenticatedWidget',
		'kbase-client-api',
		'jquery-dataTables',
        'kb_service/utils'
	], (
		KBWidget,
		bootstrap,
		$,
		kbaseTable,
		kbaseAuthenticatedWidget,
		kbase_client_api,
		jquery_dataTables,
        ServiceUtils
	) => {

    'use strict';

    return KBWidget({

	    name: "kbaseRNASeqAnalysisNew",
	    parent : kbaseAuthenticatedWidget,

        version: "1.0.0",
        options: {
            tableColumns : [ 'RNA-seq Sample Set','Sampleset Description', 'Platform', 'Library type', 'Reads', 'Domain', 'Source', 'Publication Details']
        },


        _accessors : [
            {name: 'dataset', setter: 'setDataset'},
            'workspace',
        ],



        loadAnalysis : function(ws, analysis) {

            const $rna = this;

            const all_promises = [ ];

            const external_ids = {};
            let num_sample_ids = 0;

            if (analysis.sample_ids) {

                $.each(
                    analysis.sample_ids,
                    (i, v) => {
                        num_sample_ids++;

                        if (v.match(/\//)) {
                          all_promises.push(
                              ws.get_object_info3({ objects : [
                                {ref : v}
                              ]})
                          )
                        }
                        else {

                          all_promises.push(
                              ws.get_object_info3({ objects : [
                                //{ref : v}
                                {
                                  workspace : $rna.options.workspace,
                                  name : v
                                }
                              ]})
                          )
                        }
                    }
                );
            }

            $.when.apply($, all_promises).then(function () {

                const extra_args = arguments;

                const info_keys = ['id', 'name', 'type', 'save_date', 'version', 'saved_by', 'ws_id', 'ws_name', 'chsum', 'size', 'meta'];

                const ref_map = {};
                const ref_map_by_id = {};
                $.each(
                  extra_args,
                  (eaIdx, extra_arg) => {
                    $.each(
                      extra_arg.infos,
                      (i, v) => {
                          const info_obj = {};
                          $.each(
                              info_keys,
                              (i,key) => {
                                  info_obj[key] = v[i];
                              }
                          );
                          ref_map_by_id[ [ v[6], v[0], v[4] ].join('/')] = info_obj;
                          ref_map[info_obj['name']] = info_obj;
                      }
                    )
                  }
                );

                if (analysis.sample_ids) {

                    const sample_id_data = [];
                    $.each(
                      analysis.sample_ids,
                      (i, v) => {
                        sample_id_data.push(
                          [
                            ref_map_by_id[v] ? ref_map_by_id[v].name : v,
                            analysis.condition[i]
                          ]
                        )
                      }
                    )

                    $rna.dataset().parsed_read_samples = $.jqElem('div');
                    const $sample_table = $.jqElem('table').addClass('display').css('width', '100%').css('border', '1px solid gray');
                    $rna.dataset().parsed_read_samples.append($sample_table);
                    const $tt = $sample_table.DataTable({
                        columns: [
                            {title: 'Reads'},
                            {title: 'Treatment Labels'}
                        ],
                    });

                    $tt.rows.add(sample_id_data).draw();

                    //$rna.dataset().parsed_read_samples = $rna.ulFromData(analysis.sample_ids, ref_map);
                }


                $rna.updateUI();
            })
            .fail((d) => {

                $rna.$elem.empty();
                $rna.$elem
                    .addClass('alert alert-danger')
                    .html("Could not load object : " + d.error.message);
            });

        },

        linkFromData : function(info_obj) {
          const $rna = this;

          const $v =
            $.jqElem('a')
              .append(info_obj.name)
              .on('click', (e) => {
                  const $cell = $rna.$elem.nearest('.cell');
                  const near_idx = IPython.notebook.find_cell_index($cell.data().cell);

                  $rna.trigger('createViewerCell.Narrative', {
                      'nearCellIdx': near_idx,
                      'widget': 'kbaseNarrativeDataCell',
                      'info' : info_obj
                  });
                  return false;
              })

          return $v;
        },

        ulFromData : function(ids, ref_map) {
            const $rna = this;
            const $ul = $.jqElem('ul').css('list-style-type', 'none');

            $.each(
                ids,
                (k, v) => {
                    const $li = $.jqElem('li');
                    if (ref_map[k]) {
                        $li.append(
                            $.jqElem('li')
                                .append(
                                    $.jqElem('a')
                                        .append(ref_map[k]['name'])
                                        .on('click', (e) => {
                                            const $cell = $rna.$elem.nearest('.cell');
                                            const near_idx = IPython.notebook.find_cell_index($cell.data().cell);

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
                                    .on('click', (e) => {
                                        const $cell = $rna.$elem.nearest('.cell');
                                        const near_idx = IPython.notebook.find_cell_index($cell.data().cell);

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

            const $rna = this;

            const ws = new Workspace(window.kbconfig.urls.workspace, {token : this.authToken()});

            if (this.options.SetupRNASeqAnalysis) {
                this.setDataset(this.options.SetupRNASeqAnalysis);
                this.loadAnalysis(ws, this.options.SetupRNASeqAnalysis);
            }
            else {

                ws.get_objects2(
                    {objects : [{
                        workspace : this.options.workspace,
                        name : this.options.output
                    }]}
                ).then((d) => {


                    $rna.setDataset(d.data[0].data);
                    if ($rna.dataset().tool_used) {

                      const promises = [];
                      const keys = ['alignmentSet_id', 'expressionSet_id', 'genome_id', 'sampleset_id'];
                      const vals = ['alignmentset', 'expressionset', 'genome', 'sampleset'];
                      $.each(
                        keys,
                        (i,v) => {
                          promises.push(
                            ws.get_object_info3({ objects : [{ref : $rna.dataset()[v]}] })
                          );
                        }
                      );

                      $.when.apply($, promises).then(function () {

                          const args = arguments;
                          $.each(
                            arguments,
                            (i, v) => {

                              $rna.dataset()[vals[i]] = v[0];
                            }
                          );


                          $rna.updateUI();
                      });

                    }
                    else {
                      $rna.loadAnalysis(ws, d.data[0].data);
                    }
                })
                .fail((d) => {

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

            if (this.dataset().tool_used) {

               new kbaseTable(this.data('tableElem'), {
                      structure : {
                          keys : ['Tool Used', 'Tool Version', 'File', 'Condition', 'Alignment Set', 'Expression Set', 'Genome', 'Sample Set'],
                          rows : {
                              'Tool Used' : this.dataset().tool_used,
                              'Tool Version' : this.dataset().tool_version,
                              'File' : $.jqElem('a')
                                .attr('href', window.kbconfig.urls.shock + '/node/' + this.dataset().file.id + '?download_raw')
                                .attr('target', '_blank')
                                .append('Download'),
                              'Condition' : this.dataset().condition.join('<br>'),
                              'Alignment Set' : this.linkFromData(ServiceUtils.objectInfoToObject(this.dataset().alignmentset)),
                              'Expression Set' : this.linkFromData(ServiceUtils.objectInfoToObject(this.dataset().expressionset)),
                              'Genome' : this.linkFromData(ServiceUtils.objectInfoToObject(this.dataset().genome)),
                              'Sample Set' : this.linkFromData(ServiceUtils.objectInfoToObject(this.dataset().sampleset)),
                          },
                      }
                  }
              );
            }
            else {
               new kbaseTable(this.data('tableElem'), {
                      structure : {
                          keys : this.options.tableColumns,
                          rows : {
                              'RNA-seq Sample Set' : this.dataset().sampleset_id,
                              'Sampleset Description' : this.dataset().sampleset_desc,
                              //'Experiment name' : this.dataset().experiment_id,
                              //'Title' : this.dataset().title,
                              //'Experiment Description' : this.dataset().experiment_desc,
                              //'Experiment design' : this.dataset().experiment_design,
                              'Platform' : this.dataset().platform,
                              'Library type' : this.dataset().Library_type,
                              //'Genome name' : this.dataset().genome_name,
                              //'Genome annotation' : this.dataset().genome_annotation,
                              //'Number of samples' : this.dataset().num_samples,
                              //'Number of replicates' : this.dataset().num_replicates,
                              'Reads': this.dataset().parsed_read_samples,
                              //'Condition' : this.dataset().condition ? this.dataset().condition.join(', ') : '',


                              //'Tissue' : this.dataset().tissue ? this.dataset().tissue.join(', ') : '',
                              'Domain' : this.dataset().domain,
                              'Source' : this.dataset().source,
                              'Publication Details' : this.dataset().publication_id,
                              //'Alignments'  : this.dataset().parsed_alignments,
                              //'Expression Values' : this.dataset().parsed_expression_values,
                              //'Cuffmerge Output' : this.dataset().parsed_transcriptome,
                              //'Cuffdiff Output' : this.dataset().parsed_cuffdiff,
                          },
                      }
                  }
              );
            }

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
