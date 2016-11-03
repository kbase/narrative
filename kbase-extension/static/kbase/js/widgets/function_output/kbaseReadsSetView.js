define (
    [
        'kbwidget',
        'bootstrap',
        'jquery',
        'SetAPI-client-api',
        'jquery-dataTables',
        'kbaseAuthenticatedWidget',
        'kbaseTable',
        'kbaseTabs',
        'narrativeConfig',
        'bluebird',
        'numeral',
    ], function(
        KBWidget,
        bootstrap,
        $,
        SetAPI_client_api,
        jquery_dataTables,
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
                this._super(options);

                if (options._obj_info) {
                    $self.obj_info = options._obj_info;
                    $self.obj_ref = $self.obj_info.ws_id + '/' +
                                    $self.obj_info.id + '/' +
                                    $self.obj_info.version;
                    $self.link_ref = $self.obj_info.ws_id + '/' +
                                     $self.obj_info.name + '/' +
                                     $self.obj_info.version;
                } else {
                    $self.obj_ref = $self.options.wsId + '/' +
                                    $self.options.objId;
                    $self.link_ref = $self.obj_ref;
                }

                this.setAPI = new SetAPI(Config.url('service_wizard'),
                                         {'token': this.authToken()},
                                         "dev");
                this.wsClient = new Workspace(Config.url('workspace'),
                                              {'token': this.authToken()});

                return Promise.resolve($self.setAPI.get_reads_set_v1({
                    'ref': $self.obj_ref,
                    'include_item_info': 1
                    }))
                    .then(function (results) {
                        var info = results.info,
                            refs = [],
                            i = 0;

                        $self.obj_info = info;
                        $self.link_ref = info[6] + '/' +
                                         info[1] + '/' +
                                         info[4];
                        $self.group_info = results.data;

                        // pull all reads objects to calculate summary stats
                        // and individual browse row contents
                        for (i = 0; i < $self.group_info.items.length; i++) {
                            refs.push({'ref':$self.group_info.items[i].ref});
                        }

                        return refs;
                    })
                    .then(function (refs) {
                        return Promise.resolve($self.wsClient.get_objects(refs));
                    })
                    .then(function (data) {
                        var i = 0;
                        $self.row_contents = data;
                        $self.group_stats = {'read_count': 0, 'bp_count': 0};
                        // calculate summary stats
                        for (i = 0; i < data.length; i++) {
                            if (data[i].data.hasOwnProperty('read_count')) {
                                $self.group_stats.read_count += data[i].data.read_count;
                                if (data[i].data.hasOwnProperty('read_size')) {
                                    $self.group_stats.bp_count += data[i].data.read_count * data[i].data.read_size;
                                }
                            }
                        }
                        $self.render();
                    })
                    .catch(function (err) {
                        console.error(err);
                    });
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
                              '<li><a data-toggle="tab" href="#' + tab_ids.browse + '">Browse</a></li>' +
                              '</ul>'),
                    $divs = $('<div class="tab-content">'),
                    $overviewTable = $('<table class="table table-striped table-bordered table-hover">'),
                    $browseTable = $('<table class="table table-striped table-bordered table-hover">'),
                    row = {'read_count': null, 'read_size': null, 'insert_size_mean': null};

                $overviewTable.append($('<tbody>'));
                $overviewTable.append('<tr>' +
                                          '<th>KBase Object Name</th>' +
                                          '<td><a href="/#dataview/' +
                                          $self.link_ref +
                                          '" target="_blank">' +
                                          $self.obj_info[1] +
                                          '</a>' +
                                          '</tr>');
                $overviewTable.append('<tr><th>Description</th><td>' +
                                      $self.group_info.description +
                                      '</td></tr>');
                $overviewTable.append('<tr><th>Read Libraries</th><td>' +
                                      $self.obj_info[10].item_count +
                                      '</td></tr>');
                $overviewTable.append(
                    '<tr><th>Total reads</th><td>' +
                    Numeral($self.group_stats.read_count).format('0,0') +
                    '</td></tr>');
                $overviewTable.append(
                    '<tr><th>Total base pairs</th><td>' +
                    Numeral($self.group_stats.bp_count).format('0,0') +
                    '</td></tr>');

                $divs.append($('<div id="' + tab_ids.overview + '" class="tab-pane active">')
                             .append($overviewTable));

                $browseTable.append('<thead><tr>' +
                                    '<th>Name</th>' +
                                    '<th># Reads</th>' +
                                    '<th>Read Length</th>' +
                                    '<th>Insert Size</th>' +
                                    '</tr></thead>');
                $browseTable.append($('<tbody>'));

                for (var i = 0; i < $self.row_contents.length; i++) {
                    row.read_count = $self.row_contents[i].data.read_count;
                    row.read_size = $self.row_contents[i].data.read_size;
                    row.insert_size_mean = $self.row_contents[i].data.insert_size_mean;

                    for (var k in row) {
                        if (row[k] !== null && row[k] !== undefined) {
                            row[k] = Numeral(row[k]).format('0,0');
                        } else {
                            row[k] = "Missing";
                        }
                    }

                    $browseTable.append(
                        '<tr>' +
                        '<td>' + $self.row_contents[i].info[1] + '</td>' +
                        '<td>' + row.read_count + '</td>' +
                        '<td>' + row.read_size + '</td>' +
                        '<td>' + row.insert_size_mean + '</td>' +
                        '</tr>');
                }

                $divs.append($('<div id="' + tab_ids.browse + '" class="tab-pane">').append($browseTable));
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
