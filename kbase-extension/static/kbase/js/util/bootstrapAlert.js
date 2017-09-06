/*global define*/
/*jslint white: true*/
define([
    'bootstrap',
    'jquery'
], function(
    bootstrap,
    $
) {
    'use strict';

    /**
     * options:
     * {
     *     title: string,
     *     body: jquery node
     * }
     */
    var BootstrapAlert = function(options) {
        this.$modal = $('<div class="modal kb-modal-alert fade" role="dialog">');
        this.$dialog = $('<div class="modal-dialog">');
        this.$dialogContent = $('<div class="modal-content">');
        this.$header = $('<div class="modal-header">');

        this.$title = $('<span>');

        this.$headerTitle = $('<span class="modal-title">').append(this.$title);

        this.$dialogBody = $('<div class="modal-body">');
        this.$footer = $('<div class="modal-footer">');

        this.$buttonList = $('<div>');

        this.enterToTrigger = false;
        if (options.enterToTrigger) {
            this.enterToTrigger = options.enterToTrigger;
        }

        this.$modal.append(
            this.$dialog.append(
                this.$dialogContent.append(this.$header.append(this.$headerTitle))
                .append(this.$dialogBody)
                .append(this.$footer)));

        this.initialize(options);
    };

    BootstrapAlert.prototype.initialize = function(options) {
        if (!options) {
            console.warn('BootstrapALert created with no arguments.');
            return;
        }
        var $closeButton = $('<button type="button" class="close" data-dismiss="modal" aria-label="Close">')
            .append($('<span aria-hidden="true">')
                .append('&times;'));
        this.$header.append($closeButton);
        if (options.title) {
            this.$title.html(options.title);
        }
        if (options.type) {
            this.$title.addClass('text-' + options.type);
        }
        if (options.body) {
            this.$dialogBody.html(options.body);
        }
        var $closeButton2 = $('<button type="button" class="btn btn-primary" data-dismiss="modal">')
            .text('Close');
        this.$footer.append($closeButton2);

        this.$modal.modal('show');
    };

    BootstrapAlert.prototype.setBody = function($body) {
        this.$dialogBody.empty().append($body);
    };

    BootstrapAlert.prototype.setTitle = function(title) {
        this.$headerTitle.empty().append(title);
    };

    /**
     * Removes this modal from the DOM and removes any associated content.
     */
    BootstrapAlert.prototype.destroy = function() {
        this.$modal.remove();
        this.$modal = null;
        return null;
    };

    return BootstrapAlert;
});