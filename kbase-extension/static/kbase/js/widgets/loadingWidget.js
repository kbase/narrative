define([
    'jquery'  // just for the handy fadeOut thing.
], function ($) {
    'use strict';

    var LoadingWidget = function (config) {
        this.node = config.node;
        this.container = this.node ? this.node.querySelector('.progress-container') : null;
        this.progress = {
            data: false,
            jobs: false,
            apps: false,
            kernel: false,
            narrative: false
        };
        this.progressBar = this.node ? this.node.querySelector('.progress-bar') : null;
        this.totalDone = 0;
        this.totalSteps = Object.keys(this.progress).length;

        return this;
    };

    LoadingWidget.prototype.updateProgress = function(name, done, error) {
        var text = '<i class="fa fa-check" aria-hidden="true" style="color:green"></i>';
        if (error) {
            text = '<i class="fa fa-times" aria-hidden="true" style="color:red"></i> Error while loading.';
        }
        if (this.container) {
            var prog = this.container.querySelector('[data-element="' + name + '"] .kb-progress-stage');
            if (prog) {
                prog.innerHTML = text;
                this.totalDone++;
                this.progressBar.style.width = (this.totalDone / this.totalSteps * 100) + '%';
                console.log('TOTAL DONE THINGS', this.totalDone);
                if (this.totalDone >= this.totalSteps) {
                    this.remove();
                }
            }
        }
    };

    LoadingWidget.prototype.remove = function () {
        console.log('removing the node');
        if (this.node) {
            $(this.node).fadeOut('slow');
        }
    };

    return LoadingWidget;
});
