define([
    'jquery',
    'bluebird',
    'kbwidget',
    'narrativeConfig',
    'common/runtime',
    'handlebars',
    'util/string',
    'util/timeFormat',
    'text!kbase/templates/data_staging/ftp_file_row.html',
    'text!kbase/templates/data_staging/ftp_file_table.html',
    'text!kbase/templates/data_staging/ftp_file_header.html',
    'jquery-dataTables'
], function(
    $,
    Promise,
    KBWidget,
    Config,
    Runtime,
    Handlebars,
    StringUtil,
    TimeFormat,
    FtpFileRowHtml,
    FtpFileTableHtml,
    FtpFileHeaderHtml
) {
    return new KBWidget({
        name: 'StagingAreaViewer',

        init: function(options) {
            this._super(options);
            this.ftpFileRowTmpl = Handlebars.compile(FtpFileRowHtml);
            this.ftpFileTableTmpl = Handlebars.compile(FtpFileTableHtml);
            this.ftpFileHeaderTmpl = Handlebars.compile(FtpFileHeaderHtml);
            this.ftpUrl = Config.url('ftp_api_url');
            this.updatePathFn = options.updatePathFn || this.setPath;
            this.path = options.path;

            return this;
        },

        render: function() {
            this.updateView();
        },

        updateView: function() {
            this.$elem.empty();
            this.fetchFtpFiles();
        },

        setPath: function(path) {
            this.path = path;
            this.updateView();
        },

        fetchFtpFiles: function() {
            var token = Runtime.make().authToken();
            Promise.resolve($.ajax({
                url: this.ftpUrl + '/list' + this.path,
                headers: {
                    'Authorization': token
                }
            }))
            .then(function(results) {
                this.renderFileHeader();
                this.renderFiles(results);
            }.bind(this))
            .catch(function(error) {
                console.error(error);
            });
        },

        renderFileHeader: function() {
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
            this.$elem.append(this.ftpFileHeaderTmpl({path: pathTerms}));
            this.$elem.find('a').click(function(e) {
                this.updatePathFn($(e.currentTarget).data().element);
            }.bind(this));
            this.$elem.find('button#refresh').click(function() {
                this.updateView();
            }.bind(this));
        },

        renderFiles: function(files) {
            var $fileTable = $(this.ftpFileTableTmpl({files: files}));
            this.$elem.append($fileTable)
            this.$elem.find('table').dataTable({
                bLengthChange: false,
                aaSorting: [[3, 'desc']],
                aoColumnDefs: [{
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
                }, {
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
                }]
            });
            this.$elem.find('table button').on('click', function(e) {
                this.updatePathFn(this.path += '/' + $(e.currentTarget).data().name);
            }.bind(this));

        }

    });
});
