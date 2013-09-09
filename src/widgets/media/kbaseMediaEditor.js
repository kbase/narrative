(function( $, undefined ) {

$.KBWidget({
    name: "kbaseMediaEditor",
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;
        var token = options.auth;
        var media = options.id;
        var ws = options.ws;        

        var fba = new fbaModelServices('http://140.221.85.73:4043/');
        var kbws = new workspaceService('http://kbase.us/services/workspace_service/');

        var container = $('<div id="kbase-media-editor"></div>')
        container.kbasePanel({title: '<h3 class="modal-title">Media Info</h3>'+media});


        self.$elem.append(container);

        var panel_body = container.find('.panel-body');
        panel_body.append('<p class="muted loader-rxn"> \
                <img src="assets/img/ajax-loader.gif"> loading...</p>')


        var mediaAJAX = fba.get_media({medias: [media], workspaces: [ws]})
        $.when(mediaAJAX).done(function(data){
            media = data[0]; // only 1 media right now
            container.find('.modal-header').append('\
                <span><b>Id: </b>'+media.id+'</span>')
            media_view(panel_body, media);
        })


        function media_view(container, data) {
            $('.loader-rxn').remove();

            container.append('<b>Name: </b>'+data.id+' <b>pH: </b>'+data.pH+
                '<button class="btn btn-default pull-right edit-media">Edit</button><br><br>');

            var table = $('<table class="table table-striped table-bordered">')
           
            table.append('<tr><th>Compound</th><th>Concentration</th><th>min_flux</th><th>max_flux</th></tr>')
            for (var i in data.media_compounds) {
                table.append('<tr><td>'+data.media_compounds[i].name+'</td>\
                    <td>'+data.media_compounds[i].concentration+'</td>\
                    <td>'+data.media_compounds[i].min_flux+'</td>\
                    <td>'+data.media_compounds[i].max_flux+'</td></tr>');
            }
            container.append(table);

            $('.edit-media').click(function() {
                container.html('');                
                media_view_editable(container, data)
            })
        }


        function media_view_editable(container, data) {
            $('.loader-rxn').remove();

            container.append('<b>Name: </b>'+data.id+' <b>pH: </b>'+data.pH+
                '<button class="btn btn-default pull-right cancel-edit-media">Cancel</button><br><br>');           

            var table = $('<table class="table table-striped table-bordered">')
           
            table.append('<tr><th>Compound</th><th>Concentration</th><th>min_flux</th><th>max_flux</th><th>Delete/Add</th></tr>')
            for (var i in data.media_compounds) {
                table.append('<tr><td><input id="cmpds'+i+'" class="form-control" value='+data.media_compounds[i].name+'></input></td>\
                    <td><input id="conc'+i+'" class="form-control" value='+data.media_compounds[i].concentration+'></input></td>\
                    <td><input id="minflux'+i+'" class="form-control" value='+data.media_compounds[i].min_flux+'></input></td>\
                    <td><input id="maxflux'+i+'" class="form-control" value='+data.media_compounds[i].max_flux+'></input></td>\
                    <td><button id="del'+i+'" onclick="$(this).closest(&#39;tr&#39).remove()" class="form-control"><span class="glyphicon glyphicon-trash"></span></button></tr>');
            }

            table.append('<tr><td><input id="addCmpds" class="form-control" placeholder="add Compound"></input></td>\
                    <td><input id="addConc" class="form-control" ></input></td>\
                    <td><input id="addMinflux" class="form-control"></input></td>\
                    <td><input id="addMaxflux" class="form-control"></input></td>\
                    <td><button id="addRow" class="form-control"><span class="glyphicon glyphicon-plus"></span></button></tr>');


            container.append(table)

            $("#addRow").click(function(e) {
                e.preventDefault();

                //var table = $('<table class="table table-striped table-bordered">')
                var newCmpd = $('#addCmpds').val();
                var newConc = $('#addConc').val();
                var newMinflux = $('#addMinflux').val();
                var newMaxflux = $('#addMaxflux').val();
                var last = $('[id^=cmpds]').length
                //alert ();
                var rowToAdd = '<tr><td><input id="cmpds'+last+'" class="form-control" value="'+newCmpd+'"></input></td>\
                        <td><input id="conc'+last+'" class="form-control" value="'+newConc+'"></input></td>\
                        <td><input id="minflux'+last+'" class="form-control" value="'+newMinflux+'"></input></td>\
                        <td><input id="maxflux'+last+'" class="form-control" value="'+newMaxflux+'"></input></td>\
                        <td><button id="del'+last+'" onclick="$(this).closest(&#39;tr&#39).remove()" class="form-control"><span class="glyphicon glyphicon-trash"></span></button></tr>'

                 table.append(rowToAdd)

                var row = $(this).closest('tr');
                row.next().after(row);


           });

            container.append('<a class="btn btn-primary save-to-ws-btn">Save to a workspace -></a>');
            events();

            $('.cancel-edit-media').click(function() {
                container.html('');                
                media_view(container, data)
            })            
        }

        function events() {
            $('.save-to-ws-btn').unbind('click');
            $('.save-to-ws-btn').click(function() {
                self.trigger('saveToWSClick');
            });
        }

        function saveEditedMedia(workspace) {
            var media_id=data.id;
            var name=data.id;
            var cmpds = $('[id^=cmpds]');
            var conc = $('[id^=conc]');
            var minflux = $('[id^=minflux]');
            var maxflux = $('[id^=maxflux]');


            fba.addmedia({
                media: media_id,
                workspace: workspace,
                name: name,
                isDefined: 0,
                isMinimal: 0,
                type: 'unknown',
                compounds: [cmpds],
                concentrations: [concentrations],
                maxflux: [minflux],
                minflux: [maxflux]
            });
        }
/*
        function saveMedia(workspace, data) {
            var media_id=data.id;
            var name=data.id;

            var cmpds =[];
            var conc =[];
            var minflux =[];
            var maxflux =[];
            for (var i in data.media_compounds) {
                cmpds.push(data.media_compounds[i].name);
                conc.push(data.media_compounds[i].concentrations);
                minflux.push(data.media_compounds[i].min_flux);
                maxflux.push(data.media_compounds[i].max_flux);
            }

            fba.addmedia({
                media: media_id,
                workspace: workspace,
                name: name,
                isDefined: 0,
                isMinimal: 0,
                type: 'unknown',
                compounds: [cmpds],
                concentrations: [concentrations],
                maxflux: [minflux],
                minflux: [maxflux]
            });
        }
*/


        function saveMedia(workspace, data) {
            var media_id=data.id;
            var name=data.id;

            var cmpds =[];
            var conc =[];
            var minflux =[];
            var maxflux =[];
            for (var i in data.media_compounds) {
                cmpds.push(data.media_compounds[i].name);
                conc.push(data.media_compounds[i].concentrations);
                minflux.push(data.media_compounds[i].min_flux);
                maxflux.push(data.media_compounds[i].max_flux);
            }

            fba.addmedia({
                media: media_id,
                workspace: workspace,
                name: name,
                isDefined: 0,
                isMinimal: 0,
                type: 'unknown',
                compounds: [cmpds],
                concentrations: [concentrations],
                maxflux: [minflux],
                minflux: [maxflux]
            });
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
