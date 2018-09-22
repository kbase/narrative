define([
    'jquery',
    'kbwidget',
    'narrativeConfig',
    'api/auth',
    'kbase/js/widgets/narrative_core/upload/fileUploadWidget',
    'kbase/js/widgets/narrative_core/upload/stagingAreaViewer',
    'base/js/namespace'
], function(
    $,
    KBWidget,
    Config,
    Auth,
    FileUploadWidget,
    StagingAreaViewer,
    Jupyter
) {
    'use strict';
    return new KBWidget({
        name: 'kbaseNarrativeStagingDataTab',
        $myFiles: $('<div>'),

        init: function(options) {
            this._super(options);
            this.path = '/';
        },

        getUserInfo: () => {
            let auth = Auth.make({url: Config.url('auth')});
            var userInfo;
            return auth.getCurrentProfile(auth.getAuthToken())
                .then(info => {
                    userInfo = {
                        user: info.user,
                        globusLinked: info.idents && info.idents.some(ident => ident.provider.toLocaleLowerCase() === 'globus')
                    };
                    return userInfo;
                })
                .catch((err) => {
                    console.error('An error occurred while determining whether the user account is linked to Globus. Continuing without links.');
                    userInfo = {
                        user: Jupyter.narrative.userId,
                        globusLinked: false
                    }
                    return userInfo;
                })
                .finally(() => {
                    return userInfo;
                });
        },

        activate : function() {
            this.stagingAreaViewer.activate();
        },

        deactivate : function() {
            this.stagingAreaViewer.deactivate();
        },

        updatePath: function(newPath) {
            this.path = newPath;
            this.uploadWidget.setPath(newPath);
            this.stagingAreaViewer.setPath(newPath);
        },

        render: function() {
            return this.getUserInfo()
            .then(userInfo => {
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
                    userInfo: userInfo,
                    userId: Jupyter.narrative.userId
                });
                this.uploadWidget.dropzone.on('complete', function() {
                    this.updateView();
                }.bind(this));

                this.stagingAreaViewer = new StagingAreaViewer(this.$myFiles, {
                    path: this.path,
                    updatePathFn: this.updatePath.bind(this),
                    userInfo: userInfo
                });

                this.updateView();
            });
        },

        updateView: function() {
            this.stagingAreaViewer.render();
        }
    });
});
