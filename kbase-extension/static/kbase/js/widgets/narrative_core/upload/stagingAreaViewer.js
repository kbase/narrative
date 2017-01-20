define([
    'jquery',
    'bluebird',
    'kbwidget',
    'narrativeConfig',
    'common/runtime',
    'base/js/namespace',
    'handlebars',
    'util/string',
    'util/timeFormat',
    'kbase-client-api',
    './uploadTour',
    'text!kbase/templates/data_staging/ftp_file_table.html',
    'text!kbase/templates/data_staging/ftp_file_header.html',
    'text!kbase/templates/data_staging/file_path.html',
    'jquery-dataTables',
    'select2'
], function(
    $,
    Promise,
    KBWidget,
    Config,
    Runtime,
    Jupyter,
    Handlebars,
    StringUtil,
    TimeFormat,
    KBaseClients,
    UploadTour,
    FtpFileTableHtml,
    FtpFileHeaderHtml,
    FilePathHtml
) {
    return new KBWidget({
        name: 'StagingAreaViewer',

        init: function(options) {
            this._super(options);
            this.ftpFileTableTmpl = Handlebars.compile(FtpFileTableHtml);
            this.ftpFileHeaderTmpl = Handlebars.compile(FtpFileHeaderHtml);
            this.filePathTmpl = Handlebars.compile(FilePathHtml);
            this.ftpUrl = Config.url('ftp_api_url');
            this.updatePathFn = options.updatePathFn || this.setPath;
            this.path = options.path;
            this.uploaders = Config.get('uploaders');

            return this;
        },

        render: function() {
            this.updateView();
        },

        updateView: function() {
            this.fetchFtpFiles()
            .then(function(files) {
                this.$elem.empty();
                this.renderFileHeader();
                this.renderFiles(files);
            }.bind(this))
            .catch(function(error) {
                console.error(error);
            });
        },

        setPath: function(path) {
            this.path = path;
            this.updateView();
        },

        fetchFtpFiles: function() {
            var token = Runtime.make().authToken();
            return Promise.resolve($.ajax({
                url: this.ftpUrl + '/list' + this.path,
                headers: {
                    'Authorization': token
                }
            }))
            .then(function(files) {
                return Promise.try(function() {
                    files.forEach(function(file) {
                        if (file.isFolder) {
                            return;
                        }
                        file.imported = {
                            narName: 'narrative',
                            narUrl: '/narrative/ws.123.obj.456',
                            objUrl: '/#dataview/123/objectName',
                            objName: 'myObject',
                            reportRef: 'reportRef'
                        }
                    });
                    return files;
                });
            });
        },

        renderFileHeader: function() {
            this.$elem.append(this.ftpFileHeaderTmpl());
            this.$elem.find('button#help').click(function() {
                this.startTour();
            }.bind(this));
        },

        renderPath: function() {
            var splitPath = this.path;
            if (splitPath.startsWith('/')) {
                splitPath = splitPath.substring(1);
            }
            splitPath = splitPath.split('/');
            var pathTerms = [];
            for (var i=0; i<splitPath.length; i++) {
                var prevPath = '';
                if (i > 0) {
                    prevPath = pathTerms[i-1].subpath;
                }
                pathTerms[i] = {
                    term: splitPath[i],
                    subpath: prevPath + '/' + splitPath[i]
                };
            }
            this.$elem.find('div.file-path').append(this.filePathTmpl({path: pathTerms}));
            this.$elem.find('div.file-path a').click(function(e) {
                this.updatePathFn($(e.currentTarget).data().element);
            }.bind(this));
            this.$elem.find('button#refresh').click(function() {
                this.updateView();
            }.bind(this));
        },

        renderFiles: function(files) {
            var $fileTable = $(this.ftpFileTableTmpl({files: files, uploaders: this.uploaders.dropdown_order}));
            this.$elem.append($fileTable)
            this.$elem.find('table').dataTable({
                dom: '<"file-path pull-left">frtip',
                bAutoWidth: false,
                aaSorting: [[3, 'desc']],
                aoColumnDefs: [{
                    aTargets: [ 0 ],
                    mRender: function(data, type, full) {
                        if (type === 'display') {
                            var isFolder = data === 'true' ? true : false;
                            var icon = isFolder ? "folder" : "file-o";
                            var disp = "<span><i class='fa fa-" + icon + "'></i></span>";
                            if (isFolder) {
                                disp = "<button data-name='" + full[1] + "' class='btn btn-xs btn-default'>" + disp + "</button>";
                            }
                            return disp;
                        } else {
                            return data;
                        }
                    }
                }, {
                    aTargets: [ 1 ],
                    sClass: 'staging-name',
                    mRender: function(data, type, full) {
                        if (type === 'display') {
                            return "<div class='kb-data-staging-table-name'>" + data + "</div>";
                        }
                        return data;
                    }
                }, {
                    aTargets: [ 2 ],
                    mRender: function(data, type) {
                        if (type === 'display') {
                            return StringUtil.readableBytes(Number(data));
                        } else {
                            return Number(data);
                        }
                    },
                    sType: 'numeric'
                }, {
                    aTargets: [ 3 ],
                    mRender: function(data, type) {
                        if (type === 'display') {
                            return TimeFormat.getTimeStampStr(Number(data));
                        } else {
                            return data;
                        }
                    },
                    sType: 'numeric'
                }
            ]
            });
            this.$elem.find('table button[data-name]').on('click', function(e) {
                this.updatePathFn(this.path += '/' + $(e.currentTarget).data().name);
            }.bind(this));
            this.$elem.find('table button[data-report]').on('click', function(e) {
                alert("Show report for reference '" + $(e.currentTarget).data().report + "'");
            });
            this.$elem.find('table select').select2({
                placeholder: 'Select a format'
            });
            this.$elem.find('table button[data-import]').on('click', function(e) {
                var importType = $(e.currentTarget).prevAll('#import-type').val();
                var importFile = $(e.currentTarget).data().import;
                this.initImportApp(importType, importFile);
            }.bind(this));
            this.renderPath();
        },

        initImportApp: function(type, file) {
            //TODO = move this to configuration.
            var appIds = {
                'se_reads': 'genome_transform/reads_to_assembly',
                'pe_reads': 'genome_transform/reads_to_assembly',
                'sra_reads': 'genome_transform/sra_reads_to_assembly',
                'genbank_genome': 'genome_transform/narrative_genbank_to_genome'
            };

            var appId = appIds[type];
            if (appId) {
                var nms = new NarrativeMethodStore(Config.url('narrative_method_store'));
                Promise.resolve(nms.get_method_spec({tag: 'dev', ids: [appId]}))
                .then(function(spec) {
                    spec = spec[0];
                    var newCell = Jupyter.narrative.narrController.buildAppCodeCell(spec, 'dev');
                    var meta = newCell.metadata;
                    switch(type) {
                        case 'se_reads':
                            meta.kbase.appCell.params.file_path_list = ['/data/bulk' + this.path + '/' + file];
                            meta.kbase.appCell.params.reads_type = 'SingleEndLibrary';
                            meta.kbase.appCell.params.reads_id = file.replace(/\s/g, '_') + '_reads';
                            break;
                        case 'pe_reads':
                            meta.kbase.appCell.params.file_path_list = ['/data/bulk' + this.path + '/' + file];
                            meta.kbase.appCell.params.reads_type = 'PairedEndLibrary';
                            meta.kbase.appCell.params.reads_id = file.replace(/\s/g, '_') + '_reads';
                            break;
                        case 'sra_reads':
                            meta.kbase.appCell.params.file_path_list = ['/data/bulk' + this.path + '/' + file];
                            meta.kbase.appCell.params.reads_id = file.replace(/\s/g, '_') + '_reads';
                            break;
                        case 'genbank_genome':
                        default:
                            break;
                    }
                    newCell.metadata = meta;
                    Jupyter.narrative.scrollToCell(newCell);
                    Jupyter.narrative.hideOverlay();
                }.bind(this))
                .catch(function(err) {
                    console.error(err);
                });
            }
        },

        startTour: function() {
            if (!this.tour) {
                this.tour = new UploadTour.Tour(this.$elem.parent());
            }
            this.tour.start();
        }
    });
});
