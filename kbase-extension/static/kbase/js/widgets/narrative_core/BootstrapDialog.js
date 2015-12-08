/*global define*/
/*jslint white: true*/
define(['jquery', 'bootstrap'], 
function ($) {
    'use strict';

    /**
     * options:
     * { title: string,
     *   body: jquery node
     *   buttons: array of jquery nodes
     *   closeButton: boolean, default false
     *   }
     */
    var BootstrapDialog = function(options) {
        this.$modal = $('<div class="modal fade" tabindex="-1", role="dialog">');
        this.$dialog = $('<div class="modal-dialog">');
        this.$dialogContent = $('<div class="modal-content">');
        this.$header = $('<div class="modal-header">');
        this.$headerTitle = $('<h4 class="modal-title">');

        this.$dialogBody = $('<div class="modal-body">');
        this.$footer = $('<div class="modal-footer">');

        this.$buttonList = $('<div>');

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

// <div class="modal fade" tabindex="-1" role="dialog">
//   <div class="modal-dialog">
//     <div class="modal-content">
//       <div class="modal-header">
//         <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
//         <h4 class="modal-title">Modal title</h4>
//       </div>
//       <div class="modal-body">
//         <p>One fine body&hellip;</p>
//       </div>
//       <div class="modal-footer">
//         <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
//         <button type="button" class="btn btn-primary">Save changes</button>
//       </div>
//     </div><!-- /.modal-content -->
//   </div><!-- /.modal-dialog -->
// </div><!-- /.modal -->

    BootstrapDialog.prototype.setBody = function ($body) {
        this.$dialogBody.empty().append($body);
    };

    BootstrapDialog.prototype.getBody = function () {
        return this.$dialogBody;
    };

    BootstrapDialog.prototype.setButtons = function (buttonList) {
        this.$footer.empty();
        for (var i=0; i<buttonList.length; i++) {
            var $btn = buttonList[i];
            $btn.addClass('btn btn-default btn-sm');
            this.$footer.append($btn);
        }
    };

    BootstrapDialog.prototype.getButtons = function () {
        console.log("get buttons");
    };

    BootstrapDialog.prototype.getTitle = function () {
        return this.$headerTitle.text();
    };

    BootstrapDialog.prototype.setTitle = function (title) {
        this.$headerTitle.append(title);
    };

    BootstrapDialog.prototype.show = function () {
        this.$modal.modal('show');
    };

    BootstrapDialog.prototype.hide = function() {
        this.$modal.modal('hide');
    };

    return BootstrapDialog;
});