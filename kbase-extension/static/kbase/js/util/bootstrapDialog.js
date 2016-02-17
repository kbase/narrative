/*global define*/
/*jslint white: true*/
define(['jquery', 'bootstrap'], 
function ($) {
    'use strict';

    /**
     * options:
     * { 
     *     title: string,
     *     body: jquery node
     *     buttons: array of jquery nodes
     *     closeButton: boolean, default false
     *     enterToTrigger: boolean, default false
     * }
     */
    var BootstrapDialog = function (options) {
        this.$modal = $('<div class="modal fade" tabindex="-1", role="dialog">');
        this.$dialog = $('<div class="modal-dialog">');
        this.$dialogContent = $('<div class="modal-content">');
        this.$header = $('<div class="modal-header">');
        this.$headerTitle = $('<h4 class="modal-title">');

        this.$dialogBody = $('<div class="modal-body">');
        this.$footer = $('<div class="modal-footer">');

        this.$buttonList = $('<div>');

        this.enterToTrigger = false;
        if (options.enterToTrigger) {
            this.enterToTrigger = options.enterToTrigger;
        }

        this.initialize(options);
    };

    BootstrapDialog.prototype.initialize = function (options) {
        if (!options) {
            return;
        }
        if (options.closeButton === true) {
            var $closeButton = $('<button type="button" class="close" data-dismiss="modal" aria-label="Close">')
                              .append($('<span aria-hidden="true">')
                                      .append('&times;'));
            this.$header.append($closeButton);
        }
        if (options.title) {
            this.setTitle(options.title);
        }
        if (options.body) {
            this.setBody(options.body);
        }
        if (options.buttons) {
            this.setButtons(options.buttons);
        }
        this.$modal.append(
            this.$dialog.append(
                this.$dialogContent.append(this.$header.append(this.$headerTitle))
                                   .append(this.$dialogBody)
                                   .append(this.$footer)));
    };

    BootstrapDialog.prototype.setBody = function ($body) {
        this.$dialogBody.empty().append($body);
    };

    BootstrapDialog.prototype.getBody = function () {
        return this.$dialogBody.children();
    };

    BootstrapDialog.prototype.setButtons = function (buttonList) {
        this.$footer.empty();
        for (var i=0; i<buttonList.length; i++) {
            var $btn = buttonList[i];
            $btn.addClass('btn btn-default btn-sm');
            this.$footer.append($btn);
        }
        if (this.enterToTrigger) {
            this.$modal
            .off('keypress')
            .on('keypress', (function(e) {
                if (e.keyCode === 13) {
                    e.stopPropagation();
                    e.preventDefault();

                    this.$footer.find('.btn:last').trigger('click');
                }
            }.bind(this)));
        }
    };

    BootstrapDialog.prototype.getButtons = function () {
        console.log("get buttons");
    };

    BootstrapDialog.prototype.getTitle = function () {
        return this.$headerTitle.text();
    };

    BootstrapDialog.prototype.setTitle = function (title) {
        this.$headerTitle.empty().append(title);
    };

    BootstrapDialog.prototype.show = function () {
        this.$modal.modal('show');
    };

    BootstrapDialog.prototype.hide = function() {
        this.$modal.modal('hide');
    };

    BootstrapDialog.prototype.getElement = function() {
        return this.$modal;
    };

    return BootstrapDialog;
});