/**
 * Spawns a loading widget that ticks off a few loading tasks.
 * Requires a config object. This config should have the following attributes:
 * node - a DOM node for the loader's location.
 * timeout - if any given update takes longer than this (in ms), a message will be put up.
 */
define([
    'jquery'  // just for the handy fadeOut thing.
], function ($) {
    'use strict';

    var LoadingWidget = function (config) {
        this.config = config;
        this.timeout = config.timeout ? config.timeout : 20000;
        this.container = config.node ? config.node.querySelector('.progress-container') : null;
        this.progress = {
            data: false,
            jobs: false,
            apps: false,
            kernel: false,
            narrative: false
        };
        this.progressBar = config.node ? config.node.querySelector('.progress-bar') : null;
        this.totalDone = 0;
        this.totalSteps = Object.keys(this.progress).length;
        this.timeoutShown = false;
        this.initializeTimeout();

        return this;
    };

    LoadingWidget.prototype.initializeTimeout = function () {
        this.clearTimeout();
        this.timer = setTimeout(function () {
            this.showTimeoutWarning();
        }.bind(this), this.timeout);
    };

    LoadingWidget.prototype.showTimeoutWarning = function () {
        if (this.timeoutShown) {
            return;
        }
        $(this.config.node).find('.loading-warning').fadeIn('fast');
        this.timeoutShown = true;
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
                this.initializeTimeout();  // reset the timer for another round.
                if (this.totalDone >= this.totalSteps) {
                    this.remove();
                }
            }
        }
    };

    LoadingWidget.prototype.clearTimeout = function () {
        if (this.timer) {
            clearTimeout(this.timer);
        }
    };

    LoadingWidget.prototype.remove = function () {
        this.clearTimeout();
        if (this.config.node) {
            $(this.config.node).fadeOut('slow');
        }
    };

    return LoadingWidget;
});
