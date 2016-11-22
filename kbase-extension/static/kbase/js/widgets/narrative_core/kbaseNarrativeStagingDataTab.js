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
    'css!ext_components/dropzone/dist/dropzone.css'
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
    FtpFileRowHtml
) {
    return new KBWidget({
        name: 'kbaseNarrativeStagingDataTab',
        $myFiles: $('<div>'),

        init: function(options) {
            this._super(options);
            this.dropzoneTmpl = Handlebars.compile(DropzoneAreaHtml);
            this.dropFileTmpl = Handlebars.compile(DropFileHtml);
            this.ftpFileRowTmpl = Handlebars.compile(FtpFileRowHtml);
            this.ftpUrl = Config.url('ftp_api_url');

            this.render();
            return this;
        },

        render: function() {
            var $mainElem = $('<div>')
                .css({
                    'height': '604px'
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
            this.fetchFtpFiles('');
        },

        updateView: function() {
            this.fetchFtpFiles('');
        },

        fetchFtpFiles: function(path) {
            var token = Runtime.make().authToken();
            var userId = Jupyter.narrative.userId;
            Promise.resolve($.ajax({
                url: this.ftpUrl + '/list' + '/' + userId + '/' + path,
                headers: {
                    'Authorization': token
                }
            }))
            .then(function(results) {
                this.$myFiles.empty();
                results.forEach(function(file) {
                    file.mtime = TimeFormat.getTimeStampStr(file.mtime);
                    file.size = StringUtil.readableBytes(file.size);
                    this.$myFiles.append(this.renderFile(file));
                }.bind(this))
            }.bind(this))
            .catch(function(error) {
                console.log(error);
            });
        },

        renderFile: function(file) {
            if (file.isFolder) {
                return this.renderFolder(file);
            }
            //isFolder, mtime, name, path, size
            return $(this.ftpFileRowTmpl(file));
        },

        renderFolder: function(file) {
            return $(this.ftpFileRowTmpl(file));
        }
    });
});
