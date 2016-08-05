/**
 * Output widget for visualization of genome annotation.
 * @author Roman Sutormin <rsutormin@lbl.gov>
 * @public
 */

define (
    [
        'kbwidget',
        'bootstrap',
        'jquery',
        'bluebird',
        'narrativeConfig',
        'ContigBrowserPanel',
        'util/string',
        'kbaseAuthenticatedWidget',
        'kbaseTabs',
        'jquery-dataTables',
        'jquery-dataTables-bootstrap',
        'GenomeAnnotationAPI-client-api',
        'kbaseTable'
    ], function(
        KBWidget,
        bootstrap,
        $,
        Promise,
        Config,
        ContigBrowserPanel,
        StringUtil,
        kbaseAuthenticatedWidget,
        kbaseTabs,
        jquery_dataTables,
        bootstrap,
        gaa,
        kbaseTable
    ) {
    return KBWidget({
        name: "kbaseGenomeAnnotationViewer",
        parent : kbaseAuthenticatedWidget,
        version: "1.0.0",
        ws_id: null,
        ws_name: null,
        token: null,
        width: 1150,
        options: {
            ws_id: null,
            ws_name: null
        },
        loadingImage: Config.get('loading_gif'),
        wsUrl: Config.url('workspace'),
        timer: null,
        lastElemTabNum: 0,

        init: function(options) {
            this._super(options);

            this.content = {};
            this.tableData = {};
            this.populated = {};
            this.contigMap = {};
            this.geneMap = {};

            if (this.options.wsNameOrId != undefined) {
              this.wsKey = this.options.wsNameOrId.match(/^\d+/)
                ? 'wsid'
                : 'workspace'
              ;
            }

            if (this.options.objNameOrId != undefined) {
              this.objKey = this.options.objNameOrId.match(/^\d+/)
                ? 'objid'
                : 'name'
              ;
            }


            var $self = this;

            var dictionary_params = {};
            dictionary_params[this.wsKey] = this.options.wsNameOrId;
            dictionary_params[this.objKey] = this.options.objNameOrId;

            this.dictionary_params = dictionary_params;

            this.ref = this.options.wsNameOrId + '/' + this.options.objNameOrId;
            this.genome_api = new GenomeAnnotationAPI(Config.url('service_wizard'), {token : this.authToken() });

            $self.ws = new Workspace(window.kbconfig.urls.workspace, {token : this.authToken()});

            this.appendUI(this.$elem);

            return this;
        },

        loaderElem : function () {
          return $.jqElem('div')
                .append('<br>&nbsp;Loading data...<br>&nbsp;please wait...<br>&nbsp;Data parsing may take upwards of 30 seconds, during which time this page may be unresponsive.')
                .append($.jqElem('br'))
                .append(
                    $.jqElem('div')
                    .attr('align', 'center')
                    .append($.jqElem('i').addClass('fa fa-spinner').addClass('fa fa-spin fa fa-4x'))
                    )
                ;
        },

        appendUI : function($elem) {

            var $self = this;

            var $loaderElem = $self.loaderElem();

            $self.data('loaderElem', $loaderElem);
            $elem.append($loaderElem);

            var $tabElem = $.jqElem('div').css('display', 'none');
            $self.data('tabElem', $tabElem);
            $elem.append($tabElem);

            var $tabObj = new kbaseTabs($tabElem, {canDelete : true});
            $self.data('tabObj', $tabObj);

            $.when(
              $self.genome_api.get_summary($self.ref),
              $self.ws.get_object_info_new({objects: [{'ref':$self.ref}], includeMetadata:1})
            ).then(function (d, info) {

              $self.summary = d;

              var object_name = info[0][2] + ', version ' + info[0][4];

              var $featureTableElem = $.jqElem('div');
              var $featureTable = new kbaseTable($featureTableElem, {
                allowNullRows : false,
                structure : {
                  keys : Object.keys($self.summary.annotation.feature_type_counts).sort($self.sortCaseInsensitively),
                  rows : $self.summary.annotation.feature_type_counts
                }
              });

              var $overviewTableElem = $.jqElem('div');
              var $overviewTable =  new kbaseTable($overviewTableElem, {
                      allowNullRows: false,
                      structure: {
                          keys: [
                            'KBase Object Name',
                            'Scientific name',
                            'Domain',
                            'Genetic Code',
                            'Source',
                            'Source ID',
                            'Source File name',
                            'Source Date',
                            'Source Release',
                            'GC',
                            'Taxonomy',
                            'Aliases',
                            'Size',
                            'Number of Contigs',
                            'Number of Features'
                          ],
                          rows: {
                            'KBase Object Name' : object_name,
                            'Scientific name' : d.taxonomy.scientific_name,
                            'Domain' : d.taxonomy.kingdom,
                            'Genetic Code' : d.taxonomy.genetic_code,
                            'Source' : d.annotation.external_source,
                            'Source ID' : d.assembly.assembly_source_id,
                            'Source File name' : d.annotation.original_source_filename,
                            'Source Date' : d.annotation.external_source_date,
                            'Source Release' : d.annotation.release,
                            'GC' : (Math.round(10000 * d.assembly.gc_content) / 100) + '%',
                            'Taxonomy lineage' : d.taxonomy.scientific_lineage.join('; '),
                            'Aliases' : d.taxonomy.organism_aliases.join('<br>'),
                            'Size' : d.assembly.dna_size,
                            'Number of Contigs' : d.assembly.contig_ids.length,
                            'Number of Features' : $featureTableElem,
                          }
                      }
                  }
              );

              $tabObj.addTab(
                { tab : 'Overview', content : $overviewTableElem, canDelete : false, show : true}
              );

              $tabObj.addTab(
                { tab : 'Contigs',  canDelete : false, show : false, dynamicContent : true, showContentCallback : function($tab) {
                  return $self.showContigContent($tab);
                }}
              );

              $tabObj.addTab(
                { tab : 'Features',canDelete : false, show : false, dynamicContent : true, showContentCallback : function($tab) {
                  return $self.showGeneContent($tab);
                }}
              );

              $loaderElem.hide();
              $tabElem.show();


            })
            .fail(function (d) {
              $self.$elem.empty();
              $self.$elem
                  .addClass('alert alert-danger')
                  .html("Summary object is empty : " + d.error.message);
            });


            return $elem;

        },

        settingsForType : function(type) {

          var $self = this;

          if (type == 'contigs') {

            var columns = [
              {title: "Contig name", data: "name"},
              {title: "Length", data: "length"},
              {title: "Genes", data: "genecount"}
            ];

            //for (type of Object.keys(this.summary.annotation.feature_type_counts).sort(this.sortCaseInsensitively)) {
            //  columns.push( { title: type + 's', data : type + 'count'} );
            //}



              return {
                      "pagingType": "full_numbers",
                      "displayLength": 20,
                      "sorting": [[ 1, "desc" ]],
                      "columns": columns,
                                    "data": [],
                                    "language": {
                                        "search": "Search contig:",
                                        "emptyTable": "No contigs found."
                                    },
                      "createdRow" : function (row, data, index) {

                        var $linkCell = $('td', row).eq(0);
                        $linkCell.empty();

                        $linkCell.append(
                         $.jqElem('a')
                          .on('click', function(e) {
                            $self.showContig(data.name);
                          })
                          .append(data.name)
                        );

                      },
              };
          }
          else {
            return {
              "pagingType": "full_numbers",
              "displayLength": 10,
              "sorting": [[ 1, "asc" ], [2, "asc"]],
              "columns": [
                            {title: "Feature ID", data: "id"},
                            {title: "Contig", data: "contig"},
                            {title: "Start", data: "start"},
                            {title: "Strand", data: "dir"},
                            {title: "Length", data: "len"},
                            {title: "Type", data: "type"},
                            {title: "Function", data: "func"}
                            ],
                            "data": [],
                            "language": {
                                "search": "Search gene:",
                                "emptyTable": "No genes found."
                            },
              "createdRow" : function (row, data, index) {

                if (data.type == 'gene') {
                  var $featureCell = $('td', row).eq(0);
                  $featureCell.empty();

                  $featureCell.append(
                   $.jqElem('a')
                    .on('click', function(e) {
                      $self.showGene(data.id);
                    })
                    .append(data.id)
                  );
                }

                var $contigCell = $('td', row).eq(1);
                $contigCell.empty();

                $contigCell.append(
                 $.jqElem('a')
                  .on('click', function(e) {
                    $self.showContig(data.contig);
                  })
                  .append(data.contig)
                );

              },
                            //"fnDrawCallback": function() { geneEvents(); contigEvents(); }
             };
          }
        },

        showContigContent : function($tab) {
          return this.showContent('contigs', $tab);
        },

        showGeneContent : function($tab) {

          var $self = this;

          var $target = $.jqElem('div').append($self.loaderElem());

          var $selector = $.jqElem('select')
            .on('change', function() {
              $self.showContent($selector.val(), $target);
            }
          );
          for (type of Object.keys(this.summary.annotation.feature_type_counts).sort(this.sortCaseInsensitively)) {
            $selector.append(
              $.jqElem('option')
                .attr('value', type)
                .attr('selected', type == 'gene' ? 'selected' : undefined)
                .append(type)
            );
          }


          var $container = $.jqElem('div')
            .append("Please select feature type:  ")
            .append($selector)
            .append('<br>')
            .append($target);

          $tab.append($container);

          $tab.hasContent = true;

          this.showContent('gene', $target);
          return;
        },

        showContent : function(type, $tab) {

          var $self = this;
          if (this.content[type] == undefined) {

            $self.genomeAnnotationData = {contigs : []};

            $self.genome_api.get_features($self.ref).then(function (features) {

              var contigMap = $self.contigMap;

              var cdsData = [] //XXX plants baloney. Extra tab for CDS data. See below on line 372 or so.
              var mrnaData = [] //XXX plants baloney. We throw away mrnaData. See below on line 372 or so.



              $self.content['contigs'] = $.jqElem('table').css('width', '100%');

              var genomeType = 'genome'; //self.genomeType(gnm); XXX THIS NEEDS TO BE FIXED TO IDENTIFY TRANSCRIPTOMES AGAIN!
var featurelist = {};
              var pref = 12345;

              $.each(
                features,
                function (feature_id, feature) {

                  $self.content[feature.feature_type] = $.jqElem('table').css('width', '100%');

                  if (feature.feature_locations != undefined) {

                    $.each(
                      feature.feature_locations,
                      function (i, contig) {
                        if (contigMap[contig.contig_id] == undefined) {
                          contigMap[contig.contig_id] = {name : contig.contig_id, length : contig.length, features : {}};
                          $.each(
                            $self.summary.annotation.feature_type_counts,
                            function(type, v) {
                              contigMap[contig.contig_id].features[type] = [];
                            }
                          )
                        }
                      }
                    );

                    contigName = feature.feature_locations[0].contig_id;


                    var dataArray = $self.genomeAnnotationData[feature.feature_type];
                    if (dataArray == undefined) {
                      dataArray = $self.genomeAnnotationData[feature.feature_type] = [];
                    }

                    $.each(
                      feature.feature_locations,
                      function (i, location) {
                        dataArray.push({
                          // id: '<a href="/#dataview/'+self.ws_name+'/'+self.ws_id+'?sub=Feature&subid='+geneId+'" target="_blank">'+geneId+'</a>',
                          //id: '<a class="'+pref+'gene-click" data-geneid="'+feature_id+'">'+feature_id+'</a>',
                          id : feature_id,
                          // contig: contigName,
                          contig : location.contig_id,
                          start: location.start,
                          dir: location.strand,
                          len: location.length,
                          type: feature.feature_type,
                          func: feature.function || '-'
                        });
                      }
                    );

                    $self.geneMap[feature_id] = feature;

                    var contig = contigMap[contigName];
                    if (contig != undefined) {
                      var geneStop = feature.feature_locations[0].start;

                      if (feature.feature_locations[0].strand == '+') {
                        geneStop += feature.feature_locations[0].length;
                      }
                      if (contig.length < geneStop) {
                        contig.length = geneStop;
                      }


                      if (contig.features[feature.feature_type] == undefined) {
                        contig.features[feature.feature_type] = [];
                      }
                      contig.features[feature.feature_type].push(feature);
                    }

                  }
                }
              );

              for (var key in contigMap) {
                  if (!contigMap.hasOwnProperty(key))
                      continue;
                  var contig = contigMap[key];

                  var contigRow = {
                    name: contig.name,
                    length: contig.length,
                  };

                  for (f in contig.features) {
                    contigRow[f + 'count'] = contig.features[f].length;
                  }

                  $self.genomeAnnotationData.contigs.push(contigRow);
              }

              $tab.empty();
              $tab.append($self.content[type]);
              $tab.hasContent = true;

              var table = $self.content[type].DataTable($self.settingsForType(type));
              table.rows.add($self.genomeAnnotationData[type]).draw();
              //table.fnAddData($self.genomeAnnotationData[type]);
              $self.populated[type] = true;


            })
            .fail(function (d) {
              $tab.empty();
              $tab
                  .addClass('alert alert-danger')
                  .html("Could not load features : " + d.error.message);
            });

            return $self.loaderElem();

          }

          if (0 && $self.populated[type] == true) {
            return this.content[type];
          }
          else {

            setTimeout( function() {
              $tab.empty();
              $tab.removeClass('alert alert-danger');

              var $tableElem = $.jqElem('table').css('width', '100%');

              $tab.append($tableElem);

              var table = $tableElem.dataTable($self.settingsForType(type));
              table.fnAddData($self.genomeAnnotationData[type]);
              $self.populated[type] = true;
            }, 0);
            return '';
          }

        },

        showGene : function(geneId) {
          var $self = this;

          var $tabObj = $self.data('tabObj');

          var $content = Date.now();

          if (! $tabObj.hasTab(geneId)) {

            var $content = $.jqElem('div');

            var gene = $self.geneMap[geneId];

            var contigName = null;
            var geneStart = null;
            var geneDir = null;
            var geneLen = null;
            if (gene.feature_locations && gene.feature_locations.length > 0) {
                contigName = gene.feature_locations[0][0];
                geneStart = gene.feature_locations[0][1];
                geneDir = gene.feature_locations[0][2];
                geneLen = gene.feature_locations[0][3];
            }
            var geneType = gene.feature_type;
            var geneFunc = gene['feature_function'];
            var geneAnn = '';
            if (gene['annotations'])
                geneAnn = gene['annotations'];

            var elemLabels = ['Gene ID', 'Contig name', 'Gene start', 'Strand', 'Gene length', "Gene type", "Function", "Annotations"];
            var elemData = ['<a href="/#dataview/'+$self.ref+'?sub=Feature&subid='+geneId+'" target="_blank">'+geneId+'</a>',
                            $.jqElem('a')
                              .on('click', function(e) {
                                $self.showContig(contigName);
                              })
                              .append(contigName)
                            ,
                            geneStart, geneDir, geneLen, geneType, geneFunc, geneAnn];
            var elemTable = $content.append('<table class="table table-striped table-bordered" \
                    style="margin-left: auto; margin-right: auto;>');
            for (var i=0; i<elemData.length; i++) {
                if (elemLabels[i] === 'Function') {
                    elemTable.append('<tr><td>' + elemLabels[i] + '</td> \
                            <td><textarea style="width:100%;" cols="2" rows="3" readonly>'+elemData[i]+'</textarea></td></tr>');
                } else if (elemLabels[i] === 'Annotations') {
                    elemTable.append('<tr><td>' + elemLabels[i] + '</td> \
                            <td><textarea style="width:100%;" cols="2" rows="3" readonly>'+elemData[i]+'</textarea></td></tr>');
                } else {
                    elemTable.append('<tr><td>'+elemLabels[i]+'</td> \
                            <td>'+elemData[i]+'</td></tr>');
                }
            }

            if (f.protein_translation) {
                elemTable.append('<tr><td>Protein Translation</td><td><div class="kb-ga-seq">' + f.protein_translation + '</div></td></tr>');
            }
            if (f.feature_dna_sequence) {
                elemTable.append('<tr><td>Nucleotide Sequence</td><td><div class="kb-ga-seq">' + f.feature_dna_sequence + '</div></td></tr>');
            }

            $tabObj.addTab({ tab : geneId, content : $content, canDelete : true, show : true});
          }
          else {
            $tabObj.showTab(geneId);
          }
        },

        showContig : function(contigId) {
          var $self = this;

          var $tabObj = $self.data('tabObj');

          var $content = Date.now();

          if (! $tabObj.hasTab(contigId)) {

            var $content = $.jqElem('div');
            var contig = $self.contigMap[contigName];
            var elemTable = $content.append('<table class="table table-striped table-bordered" \
                    style="margin-left: auto; margin-right: auto;">');
            var elemLabels = ['Contig name', 'Length', 'Gene count'];
            var elemData = [contigName, contig.length, contig.features['gene'].length];

            for (var i=0; i<elemData.length; i++) {
                elemTable.append('<tr><td>'+elemLabels[i]+'</td><td>'+elemData[i]+'</td></tr>');
            }
            var cgb = new ContigBrowserPanel();
            cgb.data.options.contig = contig;
            cgb.data.options.svgWidth = $self.width - 28;
            cgb.data.options.onClickFunction = function(svgElement, feature) {
                showGene(feature.feature_id);
            };
            cgb.data.options.token = $self.authToken();
            cgb.data.$elem = $('<div style="width:100%; height: 200px;"/>');
            cgb.data.$elem.show(function(){
                cgb.data.update();
            });
            $content.append(cgb.data.$elem);
            cgb.data.init();



            $tabObj.addTab({ tab : contigId, content : $content, canDelete : true, show : true});
          }
          else {
            $tabObj.showTab(contigId);
          }

        },

    });
});
