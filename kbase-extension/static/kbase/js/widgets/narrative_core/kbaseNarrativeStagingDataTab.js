define([
    'jquery',
    'bluebird',
    'dropzone',
    'kbwidget',
    'kbase/js/widgets/narrative_core/upload/fileUploadWidget',
    'kbase/js/widgets/narrative_core/upload/stagingAreaViewer',
    'base/js/namespace'
], function(
    $,
    Promise,
    Dropzone,
    KBWidget,
    FileUploadWidget,
    StagingAreaViewer,
    Jupyter
) {
    return new KBWidget({
        name: 'kbaseNarrativeStagingDataTab',
        $myFiles: $('<div>'),

        init: function(options) {
            this._super(options);
            this.path = '/' + Jupyter.narrative.userId;

            this.render();
            return this;
        },

        updatePath: function(newPath) {
            this.path = newPath;
            this.uploadWidget.setPath(newPath);
            this.stagingAreaViewer.setPath(newPath);
        },

        render: function() {
            var $mainElem = $('<div>')
                .css({
                    'height': '604px',
                    'padding': '5px',
                    'overflow-y': 'auto'
                });
            var $dropzoneElem = $('<div>');
            this.$elem
                .empty()
                .append($mainElem
                        .append($dropzoneElem)
                        .append(this.$myFiles));

            this.uploadWidget = new FileUploadWidget($dropzoneElem, {
                path: this.path,
                userId: Jupyter.narrative.userId
            });
            this.uploadWidget.dropzone.on('complete', function() {
                this.updateView();
            }.bind(this));

            this.stagingAreaViewer = new StagingAreaViewer(this.$myFiles, {
                path: this.path,
                updatePathFn: this.updatePath.bind(this)
            });

            this.updateView();
        },

        updateView: function() {
            this.stagingAreaViewer.render();
        }
    });
});
