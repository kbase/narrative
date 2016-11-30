define([
    'jquery',
    'bluebird',
    'kbwidget',
    'narrativeConfig',
    'common/runtime',
    'dropzone',
    'handlebars',
    'text!kbase/templates/data_staging/dropzone_area.html',
    'text!kbase/templates/data_staging/dropped_file.html',
    'css!ext_components/dropzone/dist/dropzone.css',
], function(
    $,
    Promise,
    KBWidget,
    Config,
    Runtime,
    Dropzone,
    Handlebars,
    DropzoneAreaHtml,
    DropFileHtml
) {
    return new KBWidget({
        name: 'fileUploadWidget',

        init: function(options) {
            this._super(options);
            this.dropzoneTmpl = Handlebars.compile(DropzoneAreaHtml);
            this.dropFileTmpl = Handlebars.compile(DropFileHtml);
            this.path = options.path;
            this.ftpUrl = Config.url('ftp_api_url');
            this.userId = options.userId;
            this.render();
            return this;
        },

        render: function() {
            var $dropzoneElem = $(this.dropzoneTmpl({username: this.userId}));
            this.$elem.append($dropzoneElem);
            this.dropzone = new Dropzone($dropzoneElem.get(0), {
                url: this.ftpUrl + '/upload',
                accept: function(file, done) {
                    done();
                    this.fetchFtpFiles('');
                }.bind(this),
                headers: {'Authorization': Runtime.make().authToken()},
                paramName: 'uploads',
                previewTemplate: this.dropFileTmpl()
            });
            this.dropzone.on("totaluploadprogress", function(progress) {
                $dropzoneElem.find("#total-progress .progress-bar").style.width = progress + "%";
            }.bind(this));


            // dz.on("sending", function(file) {
            //     // Show the total progress bar when upload starts
            //     // document.querySelector("#total-progress").style.opacity = "1";
            //     // And disable the start button
            //     file.previewElement.querySelector(".start").setAttribute("disabled", "disabled");
            // });
        },

        setPath: function(path) {
            this.path = path;
            this.$elem.find('input[name="destPath"]').val(path);
        },

        getPath: function() {
            return this.path;
        },

    });
});
