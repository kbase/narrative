define (
    [
        'kbwidget',
        'jquery',
        'SetAPI-client-api',
        'jquery-dataTables',
        'jquery-dataTables-bootstrap',
        'kbaseAuthenticatedWidget',
        'kbaseTable',
        'kbaseTabs',
        'narrativeConfig',
        'bluebird',
        'numeral',
    ], function(
        KBWidget,
        $,
        SetAPI_client_api,
        jquery_dataTables,
        bootstrap,
        kbaseAuthenticatedWidget,
        kbaseTable,
        kbaseTabs,
        Config,
        Promise,
        Numeral
    ) {
        'use strict';

        return KBWidget({
            name: "kbaseReadsSetView.js",
            parent : kbaseAuthenticatedWidget,
            version: "1.0.0",
            options: {},
            loadingImage: Config.get('loading_gif'),
            init: function (options) {
                var $self = this;
                $self._super(options);

                /* Setup default data for the overview tab */
                $self.set_overview = {
                            'link_ref': '',
                            'name': '',
                            'description':'',
                            'n_read_libraries':'',
                            'total_reads':'',
                            'avg_reads_per_library':''
                        };
                $self.set_items = [];

                if (options._obj_info) {
                    $self.obj_info = options._obj_info;
                    $self.obj_ref = $self.obj_info.ws_id + '/' +
                                    $self.obj_info.id + '/' +
                                    $self.obj_info.version;
                    $self.link_ref = $self.obj_info.ws_id + '/' +
                                     $self.obj_info.name + '/' +
                                     $self.obj_info.version;
                    $self.update_overview_info_from_nar_info($self.obj_info);
                } else {
                    $self.obj_ref = $self.options.wsId + '/' +
                                    $self.options.objId;
                    $self.link_ref = $self.obj_ref;
                    $self.set_overview.name = $self.options.objId;
                    $self.set_overview.link_ref = $self.link_ref;
                }
                $self.render();

                $self.setAPI = new SetAPI(
                                    Config.url('service_wizard'),
                                    {'token': this.authToken()});

                return Promise.resolve($self.setAPI.get_reads_set_v1({
                        'ref': $self.obj_ref,
                        'include_item_info': 1
                    }))
                    .then(function (results) {
                        var info = results.info;
                        var data = results.data;
                        var items = results.data.items;
                        $self.update_overview_info_from_ws_info(info);

                        $self.set_items = [];

                        /* return null if not an int */
                        var asInt = function(string_number) {
                            if(string_number===null) return null;
                            var value = string_number.toString().match(/^\d+$/);
                            if(value) {
                                value = parseInt(value[0]);
                            }
                            return value;
                        }

                        var total_reads = 0;

                        // pull all reads objects to calculate summary stats
                        // and individual browse row contents
                        for (var i = 0; i < items.length; i++) {
                            var lib = items[i];

                            var readLibData = {
                                'ref': lib['ref'],
                                'label': lib['label'],
                                'n_reads': ''
                            };
                            readLibData['name'] = '<a href="/#dataview/' +lib['ref'] + '" target="_blank">' +
                                                    lib['info'][1] + '</a>';
                            var readMetadata = lib['info'][10];
                            if(readMetadata['read_count']){
                                if(asInt(readMetadata['read_count'])) {
                                    readLibData['n_reads'] = readMetadata['read_count'];
                                    if(asInt(total_reads)!==null) {
                                        total_reads += asInt(readLibData['n_reads']);
                                    } else {
                                    }
                                } else {
                                    total_reads = '';
                                }
                            }
                            $self.set_items.push(readLibData);
                        }
                        if(asInt(total_reads)) {
                            $self.set_overview['total_reads'] = total_reads;
                        }

                        $self.render();
                    })
                    .catch(function (error) {
                        console.error("READSSET VIEWER Render Function Error : ", error);
                        var errorMssg = '';
                        if (error && typeof error === 'object'){
                            if(error.error) {
                                errorMssg = JSON.stringify(error.error);
                                if(error.error.message){
                                    errorMssg = error.error.message;
                                    if(error.error.error){
                                        errorMssg += '<br><b>Error Trace:</b>:' + error.error.error;
                                    }
                                } else {
                                    errorMssg = JSON.stringify(error.error);
                                }
                            } else { errorMssg = error.message; }
                        }
                        else{ errorMssg = "Undefined error"; }
                        $self.$elem.append($('<div>').addClass('alert alert-danger').append(errorMssg));
                    });
            },

            /* the narrative provides info differently from WS, so we need two functions.
            these could be combined for cleaner code */
            update_overview_info_from_nar_info: function(info) {
                var $self = this;
                $self.set_overview.link_ref = info['ws_id'] + '/' + info['name'] + '/' + info['version'];
                $self.set_overview.name = info['name'];

                var metadata = info['meta'];
                if(metadata) {
                    if(metadata['description']) {
                        $self.set_overview.description = metadata['description'];
                    }
                    if(metadata['item_count']) {
                        $self.set_overview.n_read_libraries = metadata['item_count'];
                    }
                }
            },

            update_overview_info_from_ws_info: function(info) {
                var $self = this;
                $self.set_overview.link_ref = info[6] + '/' + info[1] + '/' + info[4];
                $self.set_overview.name = info[1];

                var metadata = info[10];
                if(metadata) {
                    if(metadata['description']) {
                        $self.set_overview.description = metadata['description'];
                    }
                    if(metadata['item_count']) {
                        $self.set_overview.n_read_libraries = metadata['item_count'];
                    }
                }
            },


            render: function () {
                var $self = this,
                    $container = this.$elem,
                    tab_ids = {
                        'overview': 'reads-set-overview-' + $self.get_uuid4(),
                        'browse': 'reads-set-browse-' + $self.get_uuid4()
                    },
                    $tabs = $('<ul class="nav nav-tabs">' +
                              '<li class="active"><a data-toggle="tab" href="#' + tab_ids.overview + '">Overview</a></li>' +
                              '<li><a data-toggle="tab" href="#' + tab_ids.browse + '">Browse Read Libraries</a></li>' +
                              '</ul>'),
                    $divs = $('<div class="tab-content">'),
                    row = {'read_count': null, 'read_size': null, 'insert_size_mean': null};

                $container.empty();
                var $overviewTable = $('<table>')
                                            .addClass('table table-striped table-bordered table-hover')
                                            .css({'margin-left':'auto', 'margin-right':'auto'})
                                            .css({'word-wrap':'break-word', 'table-layout':'fixed'})
                                            .append($('<colgroup>')
                                                        .append($('<col span="1" style="width: 25%;">')));

                $overviewTable.append($('<tbody>'));
                $overviewTable.append('<tr>' +
                                          '<th><b>KBase Object Name</b></th>' +
                                          '<td><a href="/#dataview/' +
                                          $self.set_overview.link_ref +
                                          '" target="_blank">' +
                                          $self.set_overview.name +
                                          '</a>' +
                                          '</tr>');
                $overviewTable.append('<tr><th><b>Description</b></th><td>' +
                                      $self.set_overview.description +
                                      '</td></tr>');
                $overviewTable.append('<tr><th><b>Read Libraries</b></th><td>' +
                                      $self.set_overview.n_read_libraries +
                                      '</td></tr>');
                $overviewTable.append(
                                      '<tr><th><b>Total reads</b></th><td>' +
                                      $self.set_overview.total_reads +
                                      '</td></tr>');

                $divs.append($('<div id="' + tab_ids.overview + '" class="tab-pane active">')
                             .append($('<div>').css('margin-top','15px')
                                .append($overviewTable)));

                var $browseTable = $('<table>')
                                            .addClass('table table-striped table-bordered table-hover')
                                            .css({'margin-left':'auto', 'margin-right':'auto', 'width':'100%', 'border': '1px solid #ddd'})
                                            .css({'word-wrap':'break-word'});

                $divs.append($('<div id="' + tab_ids.browse + '" class="tab-pane">')
                             .append($('<div>').css({'margin-top':'15px', 'margin-bottom':'20px'})
                                .append($browseTable)));

                var libsPerPage = 10;
                var sDom = 'lft<ip>';
                if($self.set_items.length<libsPerPage) {
                    sDom = 'fti';
                }

                var browseTableSettings = {
                        "bFilter": true,
                        "sPaginationType": "full_numbers",
                        "iDisplayLength": 10,
                        "sDom": sDom,
                        "aaSorting": [[ 0, "dsc" ]],
                        "columns": [
                            {sTitle: "<b>Label</b>", data: "label"},
                            {sTitle: '<b>Library Data Name</b>', data: "name"},
                            {sTitle: "<b>Number of Reads</b>", data: "n_reads"}
                        ],
                        "data": $self.set_items,
                        "language": {
                            "lengthMenu": "_MENU_ Read Libraries per page",
                            "zeroRecords": "No Matching Read Libraries Found",
                            "info": "Showing _START_ to _END_ of _TOTAL_ Read Libraries",
                            "infoEmpty": "No Read Libraries in set.",
                            "infoFiltered": "(filtered from _MAX_)",
                            "search" : "Search"
                        }
                    };
                $browseTable.DataTable(browseTableSettings);
                $browseTable.find('th').css('cursor','pointer');

                $container.append($tabs);
                $container.append($divs);
            },
            get_uuid4: function() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                     var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                     return v.toString(16);
                });
            }
        });
});
