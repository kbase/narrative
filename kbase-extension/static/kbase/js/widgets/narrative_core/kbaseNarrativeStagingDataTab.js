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
    FtpFileTableHtml
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
            this.ftpUrl = Config.url('ftp_api_url');
            this.path = '/' + Jupyter.narrative.userId;

            this.render();
            return this;
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
                this.fetchFtpFiles(this.path);
            }.bind(this));
            this.updateView();
        },

        updateView: function() {
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
                this.renderFiles(path, results);
            }.bind(this))
            .catch(function(error) {
                console.error(error);
            });
        },

        renderFiles: function(path, files) {
            this.$myFiles.empty();
            // files.forEach(function(file) {
            //     file.mtime = TimeFormat.getTimeStampStr(file.mtime);
            //     file.size = StringUtil.readableBytes(file.size);
            // }.bind(this));
            var $fileTable = $(this.ftpFileTableTmpl({path: path, files: files}));
            this.$myFiles.append($fileTable)
            this.$myFiles.find('table').dataTable({
                bLengthChange: false,
                aaSorting: [[3, 'asc']],
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
                }]
            });
            this.$myFiles.find('span.fa-refresh').click(function() { alert('what'); });
        }
    });
});
