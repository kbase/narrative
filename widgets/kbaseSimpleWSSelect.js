(function( $, undefined ) {

$.KBWidget({
    name: "kbaseSimpleWSSelect",      
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;
        var token = options.auth;

        var kbws = new workspaceService('http://kbase.us/services/workspace_service/');        

        this.show = function(options) {
            self.$elem.html('')
            self.$elem.append('<div id="ws-select-modal-container" class="modal">\
                                   <div class="modal-dialog">\
                                      <div class="modal-content">\
                                        <div class="modal-header"></div>\
                                        <div class="modal-body"></div>\
                                        <div class="modal-footer">\
                                          <a href="#" class="btn btn-default" data-dismiss="modal">Close</a>\
                                          <a href="#" class="btn btn-primary select-ws-btn" data-dismiss="modal">Select</a>\
                                        </div>\
                                      </div>\
                                   </div>\
                                </div>');

            var container = $('#ws-select-modal-container');
            var modal_body = container.find('.modal-body');
            modal_body.append('<p class="muted loader"> \
                    <img src="../common/img/ajax-loader.gif"> loading...</p>')

            container.modal();

            container.find('.modal-header')
                .html('<h3 class="modal-title">Select a Workspace</h3>');   
            var wsAJAX = kbws.list_workspaces({auth: token})
            $.when(wsAJAX).done(function(data){
                ws_selector_modal(container, data);
            });
        }

        function ws_selector_modal(container, data) {
            $('.loader').remove();
            var modal_body = container.find('.modal-body');

            var form = $('<form>');
            var select = $('<select class="form-control simple-ws-select"></select>');
            for (var i in data) {
                select.append('<option>'+data[i][0]+'</option>')
            }
            form.append(select)
            modal_body.append(form)

            events();
        }

        function events(container) {
            $('.select-ws-btn').unbind('click');
            $('.select-ws-btn').click(function() {
                var ws = $('.simple-ws-select').val();
                self.trigger('selectedWS', {ws: ws});
            });
        }



        //this._rewireIds(this.$elem, this);
        return this;
    }  //end init
})
}( jQuery ) );
