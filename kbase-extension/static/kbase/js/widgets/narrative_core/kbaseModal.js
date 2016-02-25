/**
 *  kbaseModal.js -- used for all modeling related modals
 *
 *  Authors:
 *      nconrad@anl.gov
 *
 *   This is a helper widget for rendering modals using bootstrap v3.0.0+
 *   The aim here is to have the simplest and maintainable API.
 *
 *   API
 *
 *   Basic Modal:
 *
 *      var modal = $('<div>').kbaseModal({
 *         title: 'Model Details',
 *         subText: 'some subtext under title'
 *      });
 *
 *   See public methods below for rest of API.  It is self-documenting.
 *
*/

define(['jquery', 'kbwidget'], function($) {
    $.KBWidget({
        name: "kbaseModal",
        version: "1.0.0",
        options: {
        },
        init: function(options) {
            this._super(options);
            var self = this;

            var title = options.title;
            var subtext = options.subText;
            var right_label = options.rightLabel;
            var body = options.body;
            var buttons = options.buttons;
            var width = options.width;

            var modal = $('<div class="modal">'+
                                '<div class="modal-dialog" ' + (width ? 'style="width: '+width+';"' : '') + '>'+
                                    '<div class="modal-content">'+
                                        '<div class="modal-header">'+
                                            '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>'+
                                            '<h3 class="modal-title"></h3>'+
                                            '<span class="modal-subtext"></span>'+
                                        '</div>'+
                                        '<div class="modal-body"></div>'+
                                        '<div class="modal-footer">'+
                                            '<a href="#" class="btn btn-default" data-dismiss="modal">Close</a>'+
                                        '</div>'+
                                    '</div>'+
                                '</div>'+
                          '</div>');

            var modalHeader = modal.find('.modal-header'),
                modalTitle = modal.find('.modal-title'),
                modalSubtext = modal.find('.modal-subtext'),
                modalBody = modal.find('.modal-body'),
                modalFooter = modal.find('.modal-footer');

            if (title) modalTitle.append(title);
            if (subtext) modalSubtext.append(subtext);
            if (body) modalBody.append(body);

            // destroy every time, unless specified otherwise
            if (!options.noDestroy) {
                modal.on('hidden.bs.modal', function(){
                    $(this).remove();
                });
            }

            this.header = function(data) {
                if (data) modalHeader.html(data);
                return modalHeader;
            }

            this.title = function(data) {
                if (data) modalTitle.html(data);
                return modalTitle;
            }

            this.body = function(data) {
                if (data) modalBody.html(data);
                return modalBody;
            }

            this.footer = function(data) {
                if (data) modalFooter.html(data);
                return modalFooter;
            }

            this.buttons = function(buttons) {
                modalFooter.html('')
                buttons.forEach(function(btn) {
                    var text = btn.text;

                    // make modal dismiss by default
                    if (!btn.dismiss) {
                        var ele = $('<a class="btn" data-name="'+text+'"'+
                                                ' data-dismiss="modal">'+text+'</a>')
                    } else {
                        var ele = $('<a class="btn" data-name="'+text+'">'+text+'</a>')
                    }

                    // set button colors
                    if (btn.kind == 'primary') {
                        ele.addClass('btn-primary');
                    } else {
                        ele.addClass('btn-default');
                    }

                    modalFooter.append(ele);
                })
            }

            this.button = function(name) {
                return modalFooter.find('[data-name="'+name+'"]');
            }

            this.show = function() {
                modal.modal('show');
            }

            this.hide = function() {
                modal.modal('hide');
            }


            // do any other options
            if (buttons) this.buttons(buttons);
            if (options.show) this.show();

            return this;
        }  //end init
    })
})
