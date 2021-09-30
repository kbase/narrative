define(['jquery', 'bootstrap'], ($) => {
    'use strict';

    /**
     * options:
     * {
     *     title: string,
     *     body: jquery node
     *     buttons: array of jquery nodes
     *     closeButton: boolean, default false
     *     enterToTrigger: boolean, default false,
     *     type: string, type of alert (from bootstrap text types: warning, error, etc.),
     *     alertOnly: create as an "alert" with a single "Close" button in the footer
     * }
     */
    const BootstrapDialog = function (options) {
        this.$modal = $('<div class="modal fade" role="dialog">');
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
        if (options.alertOnly) {
            options.closeButton = true;
            options.buttons = [
                $('<button type="button" class="btn btn-primary" data-dismiss="modal">').text(
                    'Close'
                ),
            ];
            options.enterToTrigger = true;
        }

        this.initialize(options);
    };

    BootstrapDialog.prototype.initialize = function (options) {
        if (!options) {
            return;
        }
        if (options.closeButton === true) {
            const $closeButton = $(
                '<button type="button" class="close" data-dismiss="modal" aria-label="Close">'
            ).append($('<span aria-hidden="true">').append('&times;'));
            this.$header.append($closeButton);
        }
        if (options.title) {
            this.setTitle(options.title);
        }
        if (options.type) {
            this.$headerTitle.addClass('text-' + options.type);
        }
        if (options.body) {
            this.setBody(options.body);
        }
        this.setButtons(options.buttons);
        this.$modal.append(
            this.$dialog.append(
                this.$dialogContent
                    .append(this.$header.append(this.$headerTitle))
                    .append(this.$dialogBody)
                    .append(this.$footer)
            )
        );
    };

    BootstrapDialog.prototype.setBody = function ($body) {
        this.$dialogBody.empty().append($body);
    };

    BootstrapDialog.prototype.getBody = function () {
        return this.$dialogBody.children();
    };

    BootstrapDialog.prototype.setButtons = function (buttonList) {
        this.$footer.empty();
        if (!buttonList || buttonList.length === 0) {
            this.$footer.css({ 'border-top': 0 });
            return;
        } else {
            this.$footer.css({ 'border-top': '' });
        }
        for (let i = 0; i < buttonList.length; i++) {
            const $btn = buttonList[i];
            this.$footer.append($btn);
        }
        if (this.enterToTrigger) {
            this.$modal.off('keypress').on('keypress', (e) => {
                if (e.keyCode === 13) {
                    e.stopPropagation();
                    e.preventDefault();
                    this.$footer.find('button:last').trigger('click');
                }
            });
        }
    };

    BootstrapDialog.prototype.getButtons = function () {
        return this.$footer.children();
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

    BootstrapDialog.prototype.hide = function () {
        this.$modal.modal('hide');
    };

    BootstrapDialog.prototype.onHidden = function (handler) {
        this.$modal.on('hidden.bs.modal', handler);
    };

    BootstrapDialog.prototype.onHide = function (handler) {
        this.$modal.on('hide.bs.modal', handler);
    };

    BootstrapDialog.prototype.getElement = function () {
        return this.$modal;
    };

    /**
     * Removes this modal from the DOM and removes any associated content.
     */
    BootstrapDialog.prototype.destroy = function () {
        this.$modal.remove();
        this.$modal = null;
        return null;
    };

    return BootstrapDialog;
});
