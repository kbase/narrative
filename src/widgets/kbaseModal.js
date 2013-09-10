/* 
    kbaseMdale

    This is a helper widget for rendering modals using bootstrap v3.0.0

    API Example:
        var modal = this.$elem.kbaseModal({title: 'Model Details', 
                                           rightLabel: 'Super Workspace,
                                           subText: 'kb|g.super.genome '});
*/

(function( $, undefined ) {

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

        var container = $('<div class="modal">\
                              <div class="modal-dialog">\
                                  <div class="modal-content">\
                                    <div class="modal-header">\
                                        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>\
                                        <h3 class="modal-title"></h3>\
                                        <span class="modal-subtext"></span>\
                                    </div>\
                                    <div class="modal-body"></div>\
                                    <div class="modal-footer">\
                                      <a href="#" class="btn btn-default" data-dismiss="modal">Close</a>\
                                    </div>\
                                  </div>\
                              </div>\
                           </div>');

        var modal_header = container.find('.modal-header');
        var modal_title = container.find('.modal-title');
        var modal_subtext = container.find('.modal-subtext');
        var modal_body = container.find('.modal-body');
        var modal_footer = container.find('.modal-footer');        

        if (title) modal_title.append(title);
        if (subtext) modal_subtext.append(subtext);
        if (body) modal_body.append(body);
        if (buttons) this.buttons(buttons);
        
        // render modal
        self.$elem.append(container);

        this.header = function(data) {
            if (data) modal_header.html(data);
            return modal_header;
        }

        this.title = function(data) {
            if (data) modal_title.html(data);
            return modal_title;
        }        

        this.body = function(data) {
            if (data) modal_body.html(data);          
            return modal_body;
        }

        this.footer = function(data) {
            if (data) modal_footer.html(data);
            return modal_footer;
        }

        this.buttons = function(buttons) {
            modal_footer.html('')
            for (var i in buttons) {
                var btn = buttons[i];

                // make modal dismiss by default
                if (!btn.dismiss) {
                    var ele = $('<a class="btn" data-dismiss="modal">'+btn.text+'</a>');
                } else {
                    var ele = $('<a class="btn">'+btn.text+'</a>');
                } 

                // set button colors
                if (btn.color == 'primary') {
                    ele.addClass('btn-primary');
                } else {
                    ele.addClass('btn-default');                    
                }

                modal_footer.append(ele);
            }
        }

        this.show = function() {
            container.modal('show');
        }

        this.hide = function() {
            container.modal('hide');
        }

        return this;
    }  //end init
})
}( jQuery ) );
