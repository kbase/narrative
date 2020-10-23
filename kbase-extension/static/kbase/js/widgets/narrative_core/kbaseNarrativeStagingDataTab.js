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
        minRefreshTime: 1000,   // minimum ms required before letting updateView do its update
        lastRefresh: 0,         // the last time (in ms since epoch) that updateView was run
        updateTimeout: null,    // a Timeout that reconciles the above times (resets to null)

        init: function(options) {
            this._super(options);
            this.path = '/';
        },

        getUserInfo: function() {
            const auth = Auth.make({url: Config.url('auth')});
            let userInfo;
            return auth.getCurrentProfile(auth.getAuthToken())
                .then(info => {
                    userInfo = {
                        user: info.user,
                        globusLinked: info.idents && info.idents.some(ident => ident.provider.toLocaleLowerCase() === 'globus')
                    };
                    return userInfo;
                })
                .catch(() => {
                    console.error('An error occurred while determining whether the user account is linked to Globus. Continuing without links.');
                    userInfo = {
                        user: Jupyter.narrative.userId,
                        globusLinked: false
                    };
                    return userInfo;
                })
                .finally(() => {
                    return userInfo;
                });
        },

        activate: function() {
            this.stagingAreaViewer.activate();
        },

        deactivate: function() {
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
                    const $mainElem = $('<div>')
                        .addClass('kb-data-staging__container');
                    const $dropzoneElem = $('<div>');
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

                    this.uploadWidget.dropzone.on('complete', () => {
                        this.updateView();
                    });

                    this.stagingAreaViewer = new StagingAreaViewer(this.$myFiles, {
                        path: this.path,
                        updatePathFn: this.updatePath.bind(this),
                        userInfo: userInfo
                    });

                    this.updateView();
                });
        },

        /**
         * This updates the staging area viewer, and is called whenever an upload finishes.
         * In addition, this should only fire a refresh event once per second (or some interval)
         * to avoid spamming the staging area service and locking up the browser.
         *
         * So, when this is called the first time, it tracks the time it was called.
         * If the next time this is called is less than some minRefreshTime apart, this
         * makes a timeout with the time difference.
         */
        updateView: function() {
            // this does the staging area re-render, then tracks the time
            // it was last done.
            const renderStagingArea = () => {
                this.stagingAreaViewer.render();
                this.lastRefresh = new Date().getTime();
            };

            // See how long it's been since the last refresh.
            const refreshDiff = new Date().getTime() - this.lastRefresh;
            if (refreshDiff < this.minRefreshTime) {
                // if it's been under the minimum refresh time, and we're not already sitting on
                // a pending timeout, then make one.
                // If there IS a pending timeout, then do nothing, and it'll refresh when that fires.
                if (!this.updateTimeout) {
                    this.updateTimeout = setTimeout(() => {
                        renderStagingArea();
                        this.updateTimeout = null;
                    }, refreshDiff);
                }
            }
            else {
                renderStagingArea();
            }
        }
    });
});
