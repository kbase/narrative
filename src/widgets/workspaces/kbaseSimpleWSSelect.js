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
            var modal = self.$elem.kbaseModal({title: "Save to a Workspace"})
            var modal_body = modal.body('<p class="muted loader"> \
                    <img src="assets/img/ajax-loader.gif"> loading...</p>');
            modal.buttons([{text: 'Close'}, {text: 'Save', color: 'primary'}]);

            modal.show()

            var wsAJAX = kbws.list_workspaces({auth: token})
            $.when(wsAJAX).done(function(data){
                ws_selector_modal(modal_body, data);
            });
        }

        function ws_selector_modal(container, data) {
            container.find('.loader').remove();

            var form = $('<form>');
            var newMediaName = $('<div class="col-xs-6 col-md-4">\
                <p>Enter new name:</p>\
                <p><input class="form-control" placeholder="new name"></input>\
                <p>Enter new pH:</p><p><input class="form-control" placeholder="pH"></input></p>\
                <p>Save to Workspace:</p></div><br/>');
            var select = $('<select class="form-control simple-ws-select"></select>');
            for (var i in data) {
                if (data[i][0] == default_ws) {
                    select.append('<option selected="selected">'+data[i][0]+'</option>');
                } else {
                    select.append('<option>'+data[i][0]+'</option>');
                }
            }
            form.append(newMediaName);
            form.append(select);
            container.append(form);

            events();
        }

        function events(container) {
            $('.select-ws-btn').unbind('click');
            $('.select-ws-btn').click(function() {
                alert('yo');
                //console.log('why?');
                var ws = $('.simple-ws-select').val();
                var newMediaInfo = {ws: ws, name: newMediaName};
                self.trigger('selectedWS', newMediaInfo);
            });
        }

        return this;
    }  //end init
})
}( jQuery ) );
