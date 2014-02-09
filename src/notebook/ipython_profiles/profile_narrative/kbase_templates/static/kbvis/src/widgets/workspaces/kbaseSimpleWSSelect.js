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
        var selected;

        var kbws = new workspaceService('http://kbase.us/services/workspace_service/');        

        console.log('here1');
        this.show = function() {
            console.log('here2')
            $('body').append('<div id="save-to-ws-modal"></div>');
            var prompt = $('#save-to-ws-modal').kbasePrompt({
                title : 'Select a workspace',
                modalClass : '',
                controls : [
                    'okayButton',
                    {
                        name : 'Delete',
                        type : 'primary',
                        callback : function(e, $prompt) {

                        }
                    }
                ],
            });
            prompt.openPrompt();



            /*
            var wsAJAX = kbws.list_workspaces({auth: token});

            $.when(wsAJAX).done(function(data){
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
                        var selected = data[i][0]
                    } else {
                        select.append('<option>'+data[i][0]+'</option>');
                    }
                }
                form.append(newMediaName);
                form.append(select);
                self.$elem.append(form);
            });
            */
        }

        this.getSelected = function() {
            return selected;
        }

        return this;
    }  //end init
})
}( jQuery ) );
