(function( $, undefined ) {

$.KBWidget("kbaseMediaModal", {
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;
        var token = options.auth;

        var fba = new fbaModelServices('https://kbase.us/services/fba_model_services/');
        var kbws = new workspaceService('http://kbase.us/services/workspace_service/');        

        this.show = function(options) {
            var media = options.media
            console.log(media)

            self.$elem.html('')
            self.$elem.append('<div id="media-modal-container" class="modal">\
                                   <div class="modal-dialog media-info-modal">\
                                      <div class="modal-content">\
                                        <div class="modal-header"></div>\
                                        <div class="modal-body"></div>\
                                        <div class="modal-footer">\
                                          <a href="#" class="btn btn-primary" data-dismiss="modal">Close</a>\
                                        </div>\
                                      </div>\
                                   </div>\
                                </div>');

            var container = $('#media-modal-container');
            var modal_body = container.find('.modal-body');
            modal_body.find('.modal-body').append('<p class="muted loader-rxn"> \
                    <img src="../common/img/ajax-loader.gif"> loading...</p>')

            container.modal();

            
            container.find('.modal-header')
                .html('<h3 class="modal-title">Media Info</h3>');   
            var mediaAJAX = fba.get_media({medias: [media], workspaces: ["KBaseMedia"]})
            $.when(mediaAJAX).done(function(data){
                media = data[0]; // only 1 media right now
                media_view(container, data[0]);
            })
        }

        function media_view(container, data) {
            $('.loader-rxn').remove();
            var modal_body = container.find('.modal-body');

            container.find('.modal-header').append('\
                <span><b>Id: </b>'+data.id+'</span>')

            modal_body.append('<b>Name: </b>'+data.id+'<br>')            
            modal_body.append('<b>pH: </b>'+data.pH+'<br>')            

            var table = $('<table class="table table-striped table-bordered">')
            table.append('<tr><th>Compound</th><th>Concentration</th></tr>')

            for (var i in data.compounds) {
                table.append('<tr><td>'+data.compounds[i]+'</td><td>'+data.concentrations[i]+'</td></tr>');
            }
            container.find('.modal-body').append(table)
        }


        function get_genome_id(ws_id) {
            var pos = ws_id.indexOf('.');
            var ws_id = ws_id.slice(0, ws_id.indexOf('.', pos+1));
            return ws_id;
        }

        $('#rxn-tabs a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        })

        //this._rewireIds(this.$elem, this);
        return this;
    }  //end init
})
}( jQuery ) );
