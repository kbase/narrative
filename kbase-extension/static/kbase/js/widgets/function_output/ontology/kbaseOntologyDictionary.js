define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'colorbrewer',
    'kbase-client-api',
    'jquery-dataTables',
    'kbaseAuthenticatedWidget',
    'kbaseTable',
    'kbaseTabs',
], (
    KBWidget,
    bootstrap,
    $,
    colorbrewer,
    kbase_client_api,
    jquery_dataTables,
    kbaseAuthenticatedWidget,
    kbaseTable,
    kbaseTabs
) => {
    'use strict';

    return KBWidget({
        name: 'kbaseOntologyDictionary',
        parent: kbaseAuthenticatedWidget,
        version: '1.0.0',
        options: {
            //object_name: 'gene_ontology', //'plant_ontology', 'ncbi_taxon_ontology', 'gene_ontology'
            //workspace_name: 'KBaseOntology'

            dictionaryMap: {
                GO: 'gene_ontology',
                SSO: 'seed_subsystem_ontology',
            },

            isNarrativeWidget: true, // I honestly have no better idea how to do this.
        },
        extractLink: function (text) {
            if (text === undefined) {
                return text;
            }
            const mappings = {
                '(EC:([\\w.-]+))':
                    "<a target = '_blank' href = 'http://enzyme.expasy.org/EC/$2'>$1</a>",
                '(PMID:([\\w.-]+))':
                    "<a target = '_blank' href = 'http://www.ncbi.nlm.nih.gov/pubmed/$2'>$1</a>",
                '(GOC:([\\w.-]+))':
                    "<a target = '_blank' href = 'http://www.geneontology.org/doc/GO.curator_dbxrefs'>$1</a>",
                '(Wikipedia:([\\w.-]+))':
                    "<a target = '_blank' href = 'https://en.wikipedia.org/wiki/$2'>$1</a>",
                '(Reactome:([\\w.-]+))':
                    "<a target = '_blank' href = 'http://www.reactome.org/content/query?q=$2'>$1</a>",
                '(KEGG:([\\w.-]+))':
                    "<a target = '_blank' href = 'http://www.genome.jp/dbget-bin/www_bget?rn:$2'>$1</a>",
                '(RHEA:([\\w.-]+))':
                    "<a target = '_blank' href = 'http://www.rhea-db.org/reaction?id=$2'>$1</a>",
                '(MetaCyc:([\\w.-]+))':
                    "<a target = '_blank' href = 'http://biocyc.org/META/NEW-IMAGE?type=NIL&object=$2'>$1</a>",
                '(UM-BBD_reactionID:([\\w.-]+))':
                    "<a target = '_blank' href = 'http://eawag-bbd.ethz.ch/servlets/pageservlet?ptype=r&reacID=$2'>$1</a>",
                '(UM-BBD_enzymeID:([\\w.-]+))':
                    "<a target = '_blank' href = 'http://eawag-bbd.ethz.ch/servlets/pageservlet?ptype=ep&enzymeID=$2'>$1</a>",
                '(UM-BBD_pathwayID:([\\w.-]+))':
                    "<a target = '_blank' href = 'http://eawag-bbd.ethz.ch/$2/$2_map.html'>$1</a>",
                '(RESID:([\\w.-]+))':
                    "<a target = '_blank' href = 'http://pir.georgetown.edu/cgi-bin/resid?id=$2'>$1</a>",
                '(PO_GIT:([\\w.-]+))':
                    "<a target = '_blank' href = 'https://github.com/Planteome/plant-ontology/issues/$2'>$1</a>",
                '(TO_GIT:([\\w.-]+))':
                    "<a target = '_blank' href = 'https://github.com/Planteome/plant-trait-ontology/issues/$2'>$1</a>",
                '(GC_ID:([\\w.-]+))':
                    "<a target = '_blank' href = 'http://www.ncbi.nlm.nih.gov/Taxonomy/Utils/wprintgc.cgi#SG$2'>$1</a>",
            };

            for (const map in mappings) {
                const regex = new RegExp(map, 'g');
                text = text.replace(regex, mappings[map]);
            }

            return text;
        },
        init: function init(options) {
            this._super(options);

            if (this.options.wsNameOrId != undefined) {
                this.wsKey = this.options.wsNameOrId.match(/^\d+/) ? 'wsid' : 'workspace';
            }

            if (this.options.objNameOrId != undefined) {
                this.objKey = this.options.objNameOrId.match(/^\d+/) ? 'objid' : 'name';
            }

            if (this.options.objNameOrId == undefined && this.options.term_id != undefined) {
                this.wsKey = 'workspace';
                this.objKey = 'name';
                this.options.wsNameOrId = 'KBaseOntology';

                const m = this.options.term_id.match(/^([^:]+)/);
                if (m.length) {
                    this.options.objNameOrId = this.options.dictionaryMap[m[1]];
                }
            }

            this.colors = [
                '#66c2a5',
                '#fc8d62',
                '#8da0cb',
                '#e78ac3',
                '#a6d854',
                '#ffd92f',
                '#e5c494',
                '#b3b3b3',
            ];
            this.colorMap = {};
            this.termCache = {};

            const $self = this;

            $self.ws = new Workspace(window.kbconfig.urls.workspace, { token: this.authToken() });

            const dictionary_params = {
                //wsid: this.options.workspaceId,
                //objid: this.options.objectId,
                //workspace: this.options.workspace_name,
                //name: this.options.object_name,
                included: [
                    '/format_version',
                    '/data_version',
                    '/date',
                    '/saved_by',
                    '/auto_generated_by',
                    '/subsetdef',
                    '/synonymtypedef',
                    '/default_namespace',
                    '/treat_xrefs_as_differentia',
                    '/treat_xrefs_as_is_a',
                    '/ontology',
                    '/term_hash/*/id',
                    '/term_hash/*/name',
                    '/term_hash/*/namespace',
                    //                '/term_hash/*/def',
                    //                '/term_hash/*/synonym',
                    //                '/term_hash/*/xref',
                    //                '/term_hash/*/namespace',
                    //                '/term_hash/*/relationship',
                    '/typedef_hash/',
                ],
            };

            dictionary_params[this.wsKey] = this.options.wsNameOrId;
            dictionary_params[this.objKey] = this.options.objNameOrId;

            this.appendUI(this.$elem);

            //$self.ws.get_objects([dictionary_params]).then(function(data) {
            $self.ws
                .get_object_subset([dictionary_params])
                .then((data) => {
                    var data = data[0].data;

                    $self.dataset = data;

                    const $metaElem = $self.data('metaElem');

                    $metaElem.empty();

                    const $metaTable = new kbaseTable($.jqElem('div'), {
                        allowNullRows: false,
                        structure: {
                            keys: [
                                { value: 'format-version', label: 'Format version' },
                                { value: 'data-version', label: 'Data version' },
                                { value: 'date' },
                                { value: 'saved-by', label: 'Saved By' },
                                { value: 'auto-generated-by', label: 'Auto Generated By' },
                                //{value: 'subsetdef'},
                                //{value: 'synonymtypedef'},
                                { value: 'default-namespace', label: 'Default Namespace' },
                                //{value: 'treat-xrefs-as-genus-differentia', label: 'Treat XREFs as genus differentia'},
                                //{value: 'treat-xrefs-as-is_a', label: 'Treat XREFs as "is a"'},
                                { value: 'ontology', label: 'ontology' },
                            ],
                            rows: {
                                'format-version': data.format_version,
                                'data-version': data.data_version,
                                date: data.date,
                                'saved-by': data.saved_by,
                                'auto-generated-by': data.auto_generated_by,
                                //'subsetdef': $.isArray(data.subsetdef) ? data.subsetdef.join('<br>') : data.subsetdef,
                                //'synonymtypedef': $.isArray(data.synonymtypedef) ? data.synonymtypedef.join('<br>') : data.synonymtypedef,
                                'default-namespace': data.default_namespace,
                                //'treat-xrefs-as-genus-differentials': $.isArray(data.treat_xrefs_as_differentia) ? data.treat_xrefs_as_differentia.join('<br>') : data.treat_xrefs_as_differentia,
                                //'treat-xrefs-as-is_a': $.isArray(data.treat_xrefs_as_is_a) ? data.treat_xrefs_as_is_a.join('<br>') : data.treat_xrefs_as_is_a,
                                ontology: data.ontology,
                            },
                        },
                    });

                    $metaElem.append($metaTable.$elem);

                    const $typeDefElem = $self.data('typeDefElem');
                    const typedef_data = [];
                    $.each(data.typedef_hash || {}, (k, v) => {
                        const $subtable = new kbaseTable($.jqElem('div'), {
                            structure: {
                                keys: Object.keys(v)
                                    .sort()
                                    .map((v) => {
                                        return { value: v, label: v, style: 'width : 200px' };
                                    }),
                                rows: v,
                            },
                            striped: false,
                        });

                        typedef_data.push([v.name || '', $subtable.$elem.html()]);
                    });

                    const $tt = $typeDefElem.DataTable({
                        columns: [{ title: 'TypeDef', class: 'ontology-top' }, { title: 'Info' }],
                    });

                    $tt.rows.add(typedef_data).draw();

                    const table_data = [];

                    $.each(data.term_hash, (k, v) => {
                        table_data.push([
                            v,
                            //[v.name, $.isArray(v.synonym) ? v.synonym.join('<br>') : v.synonym, v.def].join('<br>')
                            v.name,
                            //[v.name, v.id, v.def, v.synonym, v.xref, v.namespace, v.relationship].join(',')
                            [v.id, v.name, v.namespace].join(','),
                        ]);
                    });

                    const $dt = $self.data('tableElem').DataTable({
                        columns: [
                            { title: 'Term ID', class: 'ontology-top' },
                            { title: 'Term name' },
                            { title: 'Search field', visible: false },
                        ],
                        createdRow: function (row, data, index) {
                            const $linkCell = $('td', row).eq(0);
                            $linkCell.empty();

                            $linkCell.append($self.termLink(data[0]));

                            const $nameCell = $('td', row).eq(1);

                            let color = $self.colorMap[data[0].namespace];
                            if (color === undefined) {
                                color = $self.colorMap[data[0].namespace] = $self.colors.shift();
                            }

                            $nameCell.css('color', color);
                        },
                    });

                    $dt.rows.add(table_data).draw();

                    $self.data('colorMapElem').append('Ontology namespace key: ');

                    $.each($self.colorMap, (k, v) => {
                        $self
                            .data('colorMapElem')
                            .append(
                                $.jqElem('span')
                                    .css('padding-left', '25px')
                                    .css('color', v)
                                    .append(k)
                            );
                    });

                    let m;

                    if ((m = location.href.match(/term_id=([^&]+)/))) {
                        $self.appendTerm(m[1]);
                    }

                    if ($self.options.term_id) {
                        $self.appendTerm($self.options.term_id);
                    }

                    $self.data('loaderElem').hide();
                    $self.data('globalContainerElem').show();
                })
                .fail((d) => {
                    $self.$elem.empty();
                    $self.$elem
                        .addClass('alert alert-danger')
                        .html('Could not load object : ' + d.error.message);
                });

            return this;
        },
        termLink: function (term, withName) {
            const $self = this;
            return $.jqElem('a')
                .append(term.id + (withName ? ' [' + term.name + ']' : ''))
                .on('click', (e) => {
                    e.preventDefault();
                    $self.appendTerm(term.id);
                });
        },
        getTerm: function (term_id) {
            return this.dataset.term_hash[term_id];
        },
        parseISA: function (isa) {
            const ids = [];

            $.each(isa, (i, v) => {
                const parts = v.split(/\s*!\s*/);
                ids.push(parts[0]);
            });

            return ids;
        },
        getLineage: function (term_id, recursive, circular_breaker) {
            const $self = this;

            if (circular_breaker === undefined) {
                circular_breaker = {};
            }

            if (circular_breaker[term_id]) {
                return undefined;
            }

            circular_breaker[term_id] = 1;

            const term = this.getTerm(term_id);

            const parents = {};
            if (term.is_a) {
                $.each(this.parseISA(term.is_a), (i, v) => {
                    parents[v] = undefined;
                });
            } else {
                return undefined;
            }

            $.each(parents, (k, v) => {
                parents[k] = $self.getLineage(k, true, circular_breaker);
            });

            if (!recursive) {
                //$self.reverseLineage(parents);
            }

            return parents;
        },
        buildLineageElem: function (lineage) {
            if (!lineage) {
                return '';
            }

            const $self = this;

            const $ul = $.jqElem('ul')
                .css('padding-left', '10px')
                .css('list-style-position', 'inside');
            //.css('list-style-type', 'none')
            let ret = { root: $ul, parent: $ul };

            $.each(lineage, (k, v) => {
                //if ($li.html().length) {
                //  $li.append(',')
                //}

                const $li = $.jqElem('li');
                $ul.append($li);

                const term = $self.getTerm(k);

                $li.append($self.termLink(term));
                $li.append(' ');
                $li.append(
                    $.jqElem('span').css('color', $self.colorMap[term.namespace]).append(term.name)
                );

                if (v !== undefined) {
                    ret = $self.buildLineageElem(v);
                    ret.parent.append($ul);
                    ret.parent = $ul;
                }
            });

            return ret;
        },
        lineageAsNodes: function (parent, lineage, nodes, edges, cache, depth) {
            const $self = this;
            if (nodes === undefined) {
                nodes = [];
            }
            if (edges === undefined) {
                edges = [];
            }
            if (cache === undefined) {
                cache = {};
            }

            if (depth === undefined) {
                depth = 0;
            }

            if (cache[parent] === undefined) {
                nodes.push({
                    node: parent,
                    tag: parent,
                    color: $self.colorMap[$self.getTerm(parent).namespace],
                });
                cache[parent] = nodes.length - 1;
            }
            $.each(lineage, (k, v) => {
                if (cache[k] === undefined) {
                    nodes.push({
                        name: k,
                        tag: k,
                        color: $self.colorMap[$self.getTerm(k).namespace],
                    });
                    cache[k] = nodes.length - 1;
                }

                edges.push({ source: cache[parent], target: cache[k], charge: -100 * depth });
                if (v !== undefined) {
                    $self.lineageAsNodes(k, v, nodes, edges, cache, depth + 1);
                }
            });
            return { nodes: nodes, edges: edges };
        },
        appendTerm: function (term_id) {
            const $self = this;

            const $termElem = $self.options.isNarrativeWidget
                ? $.jqElem('div')
                : $self.data('termElem');
            $termElem.empty();
            $self.data('termContainerElem').show();
            $self
                .data('metaContainerElem')
                .find('.panel-heading')
                .find('i')
                .removeClass('fa-rotate-90');
            $self.data('metaContainerElem').find('.panel-body').collapse('hide');
            $self
                .data('containerElem')
                .find('.panel-heading')
                .find('i')
                .removeClass('fa-rotate-90');
            $self.data('containerElem').find('.panel-body').collapse('hide');
            $self
                .data('typeDefContainerElem')
                .find('.panel-heading')
                .find('i')
                .removeClass('fa-rotate-90');
            $self.data('typeDefContainerElem').find('.panel-body').collapse('hide');

            if ($self.termCache[term_id] === undefined) {
                $termElem.append($self.data('loaderElem'));
                $self.data('loaderElem').show();

                const dictionary_params = {
                    //wsid: this.options.workspaceId,
                    //objid: this.options.objectId,
                    included: [
                        '/term_hash/' + term_id + '/*',
                        //'/term_hash/'
                    ],
                };

                dictionary_params[this.wsKey] = this.options.wsNameOrId;
                dictionary_params[this.objKey] = this.options.objNameOrId;

                $self.ws
                    .get_object_subset([dictionary_params])
                    .then((data) => {
                        const term = data[0].data.term_hash[term_id];

                        $self.termCache[term_id] = term;

                        $self.data('loaderElem').hide();
                        $termElem.empty();

                        $self.reallyAppendTerm(term);
                    })
                    .fail((d) => {
                        console.error(d);
                        let message;
                        if (d.message) {
                            message = d.message;
                        } else if (d.error) {
                            message = d.error.message;
                        }
                        $self.$elem.empty();
                        $self.$elem
                            .addClass('alert alert-danger')
                            .html('Could not load object : ' + message);
                    });
            } else {
                $self.reallyAppendTerm($self.termCache[term_id]);
            }
        },
        reallyAppendTerm: function (term) {
            const $self = this;

            const $termElem = $self.options.isNarrativeWidget
                ? $.jqElem('div')
                : $self.data('termElem');

            const lineage = $self.getLineage(term.id);

            let $lineageElem;
            let $force;

            if (($lineageElem = $self.buildLineageElem(lineage))) {
                $lineageElem.root.css('padding-left', '0px');

                const dataset = $self.lineageAsNodes(term.id, lineage);
                dataset.nodes[0].stroke = 'yellow';

                $force = new kbaseForcedNetwork(
                    $.jqElem('div').css({ width: '500px', height: '500px' }),
                    {
                        linkDistance: 150,
                        dataset: dataset,
                    }
                );
            }

            let $closureElem = undefined;
            if (term.relationship_closure !== undefined) {
                $closureElem = $.jqElem('ul').css('style', 'float : left');

                /*  var closure_data = [];
                 var term_headers = [];

                 $.each(
                 Object.keys(term.relationship_closure).sort(),
                 function (i, k) {

                 closure_headers.push({'title' : k});

                 var v = term.relationship_closure[k];

                 $.each(
                 v,
                 function (i, elem) {

                 }
                 )

                 table_data.push(
                 [
                 v,
                 //[v.name, $.isArray(v.synonym) ? v.synonym.join('<br>') : v.synonym, v.def].join('<br>')
                 v.name,
                 [v.name, v.id, v.def, v.synonym, v.xref, v.namespace, v.relationship].join(',')
                 ]
                 )
                 }
                 );

                 var $dt = $self.data('tableElem').DataTable({
                 columns : [
                 { title : 'Term ID', 'class' : 'ontology-top'},
                 { title : 'Term name'},
                 { title : 'Search field', 'visible' : false }
                 ],
                 createdRow : function(row, data, index) {

                 var $linkCell = $('td', row).eq(0);
                 $linkCell.empty();

                 $linkCell.append( $self.termLink(data[0]) )

                 var $nameCell = $('td', row).eq(1);

                 var color = $self.colorMap[data[0].namespace];
                 if (color === undefined) {
                 color = $self.colorMap[data[0].namespace] = $self.colors.shift();
                 }

                 $nameCell.css('color', color)

                 }
                 });*/

                for (const type in term.relationship_closure) {
                    $closureElem.append($.jqElem('li').append(type + ' relationships'));

                    var $subUL = $.jqElem('ul');
                    $closureElem.append($subUL);

                    $.each(term.relationship_closure[type], (i, elem) => {
                        const term = $self.getTerm(elem[0]);

                        $subUL.append(
                            $.jqElem('li')
                                .append(elem[1] + ' away - ')
                                .append($self.termLink(term))
                                .append(' - ')
                                .append(
                                    $.jqElem('span')
                                        .css('color', $self.colorMap[term.namespace])
                                        .append(term.name)
                                )
                        );
                    });
                }
            }

            const $relationship = $.jqElem('div');

            if (term.relationship !== undefined) {
                $.each(term.relationship, (i, rel) => {
                    const parts = rel.split(/ ! /);
                    $self.extractLink(parts[0]);
                    $relationship.append(parts[0]).append(' ! ').append(parts[1]).append('<br>');
                });
            }

            const $table = new kbaseTable($.jqElem('div'), {
                allowNullRows: false,
                structure: {
                    keys: [
                        { value: 'id', label: 'ID' },
                        'name',
                        'def',
                        'namespace',
                        'synonym',
                        'comment',
                        { value: 'is_a', label: 'Is A' },
                        'relationship',
                        'xref',
                    ],
                    rows: {
                        id: term.id,
                        name: term.name,
                        def: $self.extractLink(
                            $.isArray(term.def) ? term.def.join('<br>') : term.def
                        ),
                        namespace: term.namespace,
                        synonym: $.isArray(term.synonym) ? term.synonym.join('<br>') : term.synonym,
                        comment: term.comment,
                        is_a: $closureElem ? $.jqElem('div').append($closureElem) : undefined, //$lineageElem.root, // or $force.$elem
                        relationship: term.relationship ? $relationship : undefined,
                        xref: $self.extractLink(
                            $.isArray(term.xref) ? term.xref.join('<br>') : term.xref
                        ),
                    },
                },
            });

            $termElem.append($table.$elem);

            if ($self.options.isNarrativeWidget) {
                $self.globalTabs.addTab({
                    tab: 'Term ' + term.id,
                    content: $table.$elem,
                    show: true,
                    canDelete: true,
                });
            }
        },
        appendUI: function appendUI($elem) {
            $elem.css({
                width: '95%',
                'padding-left': '10px',
            });

            $elem.append($.jqElem('style').text('.ontology-top { vertical-align : top }'));

            const $self = this;

            const $loaderElem = $.jqElem('div')
                .append(
                    '<br>&nbsp;Loading data...<br>&nbsp;please wait...<br>&nbsp;Data parsing may take upwards of 30 seconds, during which time this page may be unresponsive.'
                )
                .append($.jqElem('br'))
                .append(
                    $.jqElem('div')
                        .attr('align', 'center')
                        .append(
                            $.jqElem('i').addClass('fa fa-spinner').addClass('fa fa-spin fa fa-4x')
                        )
                );
            $self.data('loaderElem', $loaderElem);
            $elem.append($loaderElem);

            const $globalContainer = $self.data(
                'globalContainerElem',
                $.jqElem('div').css('display', 'none')
            );
            $elem.append($globalContainer);

            if (this.options.isNarrativeWidget) {
                this.globalTabs = new kbaseTabs($globalContainer);
            }

            const $metaElem = $self.data('metaElem', $.jqElem('div'));

            const $metaContainerElem = $self.createContainerElem('Overview', [$metaElem]);

            $self.data('metaContainerElem', $metaContainerElem);
            if (this.options.isNarrativeWidget) {
                this.globalTabs.addTab({
                    tab: 'Overview',
                    content: $metaContainerElem,
                });
            } else {
                $globalContainer.append($metaContainerElem);
            }

            const $tableElem = $.jqElem('table')
                .addClass('display')
                .css({ width: '100%', border: '1px solid #ddd' });
            $self.data('tableElem', $tableElem);
            const $colorMapElem = $self.data('colorMapElem', $.jqElem('div'));

            const $containerElem = $self.createContainerElem('Term Dictionary', [
                $tableElem,
                $colorMapElem,
            ]);

            $self.data('containerElem', $containerElem);
            if (this.options.isNarrativeWidget) {
                this.globalTabs.addTab({
                    tab: 'Term Dictionary',
                    content: $containerElem,
                });
            } else {
                $globalContainer.append($containerElem);
            }

            const $termElem = $self.data('termElem', $.jqElem('div'));

            const $termContainerElem = $self.createContainerElem('Term', [$termElem], 'none');

            $self.data('termContainerElem', $termContainerElem);

            if (!this.options.isNarrativeWidget) {
                $globalContainer.append($termContainerElem);
            }

            const $typeDefElem = $self
                .data('typeDefElem', $.jqElem('table').addClass('display'))
                .css({ width: '100%', border: '1px solid #ddd' });

            const $typeDefContainerElem = $self
                .createContainerElem('Type Definitions', [$typeDefElem])
                .css('display', 'none');

            $self.data('typeDefContainerElem', $typeDefContainerElem);
            $globalContainer.append($typeDefContainerElem);

            return $elem;
        },
        createContainerElem: function (name, content, display) {
            const $panelBody = $.jqElem('div');

            $.each(content, (i, v) => {
                $panelBody.append(v);
            });

            let $containerElem;

            if (this.options.isNarrativeWidget) {
                $containerElem = $panelBody.css('display', display);
            } else {
                $panelBody.addClass('panel-body collapse in');

                $containerElem = $.jqElem('div')
                    .addClass('panel panel-default')
                    .css('display', display)
                    .append(
                        $.jqElem('div')
                            .addClass('panel-heading')
                            .on('click', function (e) {
                                $(this).next().collapse('toggle');
                                $(this).find('i').toggleClass('fa-rotate-90');
                            })
                            .append(
                                $.jqElem('div')
                                    .addClass('panel-title')
                                    .append(
                                        $.jqElem('i')
                                            .addClass('fa fa-chevron-right fa-rotate-90')
                                            .css('color', 'lightgray')
                                    )
                                    .append('&nbsp; ' + name)
                            )
                    )
                    .append($panelBody);
            }

            return $containerElem;
        },
    });
});
