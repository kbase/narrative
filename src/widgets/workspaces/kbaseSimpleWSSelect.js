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
        var default_ws = options.defaultWS;

        var kbws = new workspaceService('http://kbase.us/services/workspace_service/');        

        this.show = function(options) {
            var modal = self.$elem.kbaseModal({title: "Select a Workspace"})
            var modal_body = modal.body('<p class="muted loader"> \
                    <img src="assets/img/ajax-loader.gif"> loading...</p>');
            modal.buttons([{text: 'Close'}, {text: 'Select', color: 'primary'}]);

            modal.show()

            var wsAJAX = kbws.list_workspaces({auth: token})
            $.when(wsAJAX).done(function(data){
                ws_selector_modal(modal_body, data);
            });
        }

        function ws_selector_modal(container, data) {
            container.find('.loader').remove();

            var form = $('<form>');
            var select = $('<select class="form-control simple-ws-select"></select>');
            for (var i in data) {
                if (data[i][0] == default_ws) {
                    select.append('<option selected="selected">'+data[i][0]+'</option>');
                } else {
                    select.append('<option>'+data[i][0]+'</option>');
                }
            }
            form.append(select)
            container.append(form)

            events();
        }

        function events(container) {
            $('.select-ws-btn').unbind('click');
            $('.select-ws-btn').click(function() {
                var ws = $('.simple-ws-select').val();
                self.trigger('selectedWS', {ws: ws});
            });
        }

        return this;
    }  //end init
})
}( jQuery ) );
