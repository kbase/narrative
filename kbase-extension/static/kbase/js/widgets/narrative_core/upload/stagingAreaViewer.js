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
    './uploadTour',
    'util/kbaseApiUtil',
    'util/bootstrapDialog',
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
    UploadTour,
    APIUtil,
    BootstrapDialog,
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
            this.uploaders = Config.get('uploaders');
            this.setPath(options.path);

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
            // factor out the current subdirectory path into its own variable
            var subpath = path.split('/');
            var subpathTokens = subpath.length - 1;
            if (this.path.startsWith('/')) {
                subpathTokens--;
            }
            this.subpath = subpath.slice(subpath.length - subpathTokens).join('/');
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
                }],
                fnRowCallback: function(nRow, aData, iDisplayIndex, iDisplayIndexFull) {
                    $('td:eq(4)', nRow).find('select').select2({
                        placeholder: 'Select a format'
                    });
                    $('td:eq(4)', nRow).find('button[data-import]').on('click', function(e) {
                        var importType = $(e.currentTarget).prevAll('#import-type').val();
                        var importFile = $(e.currentTarget).data().import;
                        this.initImportApp(importType, importFile)
                        .then(function() {
                            this.updateView();
                        }.bind(this));
                    }.bind(this));
                    $('td:eq(0)', nRow).find('button[data-name]').on('click', function(e) {
                        this.updatePathFn(this.path += '/' + $(e.currentTarget).data().name);
                    }.bind(this));
                }.bind(this)
            });
            // this.$elem.find('table button[data-report]').on('click', function(e) {
            //     alert("Show report for reference '" + $(e.currentTarget).data().report + "'");
            // });
            this.renderPath();
        },

        initImportApp: function(type, file) {
            return Promise.try(function() {
                var appInfo = this.uploaders.app_info[type];
                if (appInfo) {
                    var tag = APIUtil.getAppVersionTag();
                    APIUtil.getAppSpec(appInfo.app_id)
                    .then(function(spec) {
                        var newCell = Jupyter.narrative.narrController.buildAppCodeCell(spec, tag);
                        var meta = newCell.metadata;
                        var fileParam = file;
                        if (this.subpath) {
                            fileParam = this.subpath + '/' + file;
                        }
                        if (appInfo.app_input_param_type === "list") {
                            fileParam = [fileParam];
                        }
                        meta.kbase.appCell.params[appInfo.app_input_param] = fileParam;
                        meta.kbase.appCell.params[appInfo.app_output_param] = file.replace(/\s/g, '_') + appInfo.app_output_suffix;
                        for (var p in appInfo.app_static_params) {
                            if (appInfo.app_static_params.hasOwnProperty(p)) {
                                meta.kbase.appCell.params[p] = appInfo.app_static_params[p];
                            }
                        }
                        newCell.metadata = meta;
                        Jupyter.narrative.scrollToCell(newCell);
                        Jupyter.narrative.hideOverlay();
                    }.bind(this))
                    .catch(function(err) {
                        new BootstrapDialog({
                            title: "Can't create uploader app!",
                            body: "Sorry, unable to create App Cell to start your upload. You may need to set your Apps panel to 'dev' or 'beta'.",
                            buttons: [ $('<button class="btn btn-primary" data-dismiss="modal">OK</button>') ],
                            closeButton: true,
                            enterToTrigger: true
                        }).show();
                        console.error(err);
                    });
                }
            }.bind(this));
        },

        startTour: function() {
            if (!this.tour) {
                this.tour = new UploadTour.Tour(this.$elem.parent());
            }
            this.tour.start();
        }
    });
});
