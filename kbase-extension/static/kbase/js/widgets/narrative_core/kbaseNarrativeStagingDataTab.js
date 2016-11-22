/**
 * TODO: Sortable file table
 * TODO: Navigable file table (click on folders, go back, etc)
 * TODO: Drag and drop folders
 * TODO: Style drag and drop
 */
define([
    'jquery',
    'bluebird',
    'dropzone',
    'kbwidget',
    'narrativeConfig',
    'common/runtime',
    'util/string',
    'util/timeFormat',
    'handlebars',
    'base/js/namespace',
    'text!kbase/templates/data_staging/dropzone_area.html',
    'text!kbase/templates/data_staging/dropped_file.html',
    'text!kbase/templates/data_staging/ftp_file_row.html',
    'text!kbase/templates/data_staging/ftp_file_table.html',
    'text!kbase/templates/data_staging/ftp_file_header.html',
    'css!ext_components/dropzone/dist/dropzone.css',
    'jquery-dataTables'
], function(
    $,
    Promise,
    Dropzone,
    KBWidget,
    Config,
    Runtime,
    StringUtil,
    TimeFormat,
    Handlebars,
    Jupyter,
    DropzoneAreaHtml,
    DropFileHtml,
    FtpFileRowHtml,
    FtpFileTableHtml,
    FtpFileHeaderHtml
) {
    return new KBWidget({
        name: 'kbaseNarrativeStagingDataTab',
        $myFiles: $('<div>'),

        init: function(options) {
            this._super(options);
            this.dropzoneTmpl = Handlebars.compile(DropzoneAreaHtml);
            this.dropFileTmpl = Handlebars.compile(DropFileHtml);
            this.ftpFileRowTmpl = Handlebars.compile(FtpFileRowHtml);
            this.ftpFileTableTmpl = Handlebars.compile(FtpFileTableHtml);
            this.ftpFileHeaderTmpl = Handlebars.compile(FtpFileHeaderHtml);
            this.ftpUrl = Config.url('ftp_api_url');
            this.path = '/' + Jupyter.narrative.userId;

            this.render();
            return this;
        },

        updatePath: function(newPath) {
            this.path = newPath;
            this.$elem.find('input[name="destPath"]').val(newPath);
        },

        render: function() {
            var $mainElem = $('<div>')
                .css({
                    'height': '604px',
                    'padding': '5px'
                });
            var $dropzoneElem = $(this.dropzoneTmpl({username: Jupyter.narrative.userId}));
            this.$elem
                .empty()
                .append($mainElem
                        .append($dropzoneElem)
                        .append(this.$myFiles));

            var dz = new Dropzone($dropzoneElem.get(0), {
                url: this.ftpUrl + '/upload',
                accept: function(file, done) {
                    done();
                    this.fetchFtpFiles('');
                }.bind(this),
                headers: {'Authorization': Runtime.make().authToken()},
                paramName: 'uploads',
                previewTemplate: this.dropFileTmpl()
            });
            dz.on('success', function() {
                // set green checkmark.
            });
            dz.on('canceled', function() {
                // remove loading row
            });
            dz.on('complete', function() {
                this.updateView();
            }.bind(this));
            this.updateView();
        },

        updateView: function() {
            this.$myFiles.empty();
            this.fetchFtpFiles(this.path);
        },

        fetchFtpFiles: function(path) {
            var token = Runtime.make().authToken();
            Promise.resolve($.ajax({
                url: this.ftpUrl + '/list' + path,
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
            this.$myFiles.append(this.ftpFileHeaderTmpl({path: pathTerms}));
            this.$myFiles.find('a').click(function(e) {
                this.updatePath($(e.currentTarget).data().element);
                this.updateView();
            }.bind(this));
            this.$myFiles.find('button#refresh').click(function() {
                this.updateView();
            }.bind(this));
        },

        renderFiles: function(files) {
            var $fileTable = $(this.ftpFileTableTmpl({files: files}));
            this.$myFiles.append($fileTable)
            this.$myFiles.find('table').dataTable({
                bLengthChange: false,
                aaSorting: [[3, 'desc']],
                aoColumnDefs: [{
                    aTargets: [ 2 ],
                    mRender: function(data, type, full) {
                        if (type === 'display') {
                            return StringUtil.readableBytes(Number(data));
                        } else {
                            return Number(data);
                        }
                    },
                    sType: 'numeric'
                }, {
                    aTargets: [ 3 ],
                    mRender: function(data, type, full) {
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
            this.$myFiles.find('table button').on('click', function(e) {
                this.updatePath(this.path += '/' + $(e.currentTarget).data().name);
                this.updateView();
            }.bind(this));
        },
    });
});
