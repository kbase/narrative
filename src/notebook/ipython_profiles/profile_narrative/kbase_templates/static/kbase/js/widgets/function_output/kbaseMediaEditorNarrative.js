(function( $, undefined ) {

$.KBWidget({
    name: "kbaseMediaEditorNarrative",
    version: "1.0.0",
    options: {
        viewOnly: true,
        editOnly: false
    },
    init: function(options) {
        this._super(options);
        var self = this;
        var token = options.auth;
        var media = options.id;
        var ws = options.ws;
        var viewOnly = this.options.viewOnly;
        var editOnly = this.options.editOnly;

        var fba = new fbaModelServices('http://kbase.us/services/fba_model_services');
        var kbws = new workspaceService('http://kbase.us/services/workspace');

//      var panel = self.$elem.kbasePanel({title: 'Media Info', subText: media})

        var container = $("<div>"); //panel.body();
        self.$elem.append(container);

        container.append('<p class="muted loader-rxn"> \
                <img src="assets/img/ajax-loader.gif"> loading...</p>')

        /** Cases:
         * 1. viewOnly
         *    hide edit button, show media_view
         * 2. editOnly
         *    start in media_view_editable
         */
        // var $viewToggleBtn = $('<button/>')
        //                      .addClass('btn btn-default pull-right>');

        var randId = self._genRandId();


        var mediaData = [];
        if (options.mediaData)
            mediaData = options.mediaData[0];

        if (editOnly)
            media_view_editable(container, mediaData);
        else
            media_view(container, mediaData);


        function media_view(container, data) {
            container.find('.loader-rxn').remove();

            container.append('<b>Name: </b>'+data.id+'&nbsp;&nbsp;&nbsp;<b>pH: </b>'+data.pH);
            container.append('<br><br>');

            var table = $('<table class="table table-striped table-bordered" style="margin-left:auto; margin-right:auto">')
           
            table.append('<tr><th>Compound</th><th>Concentration</th><th>min_flux</th><th>max_flux</th></tr>')
            for (var i in data.media_compounds) {
                table.append('<tr><td>'+data.media_compounds[i].name+'</td>\
                    <td>'+data.media_compounds[i].concentration+'</td>\
                    <td>'+data.media_compounds[i].min_flux+'</td>\
                    <td>'+data.media_compounds[i].max_flux+'</td></tr>');
            }
            container.append(table);
        }


        function media_view_editable(container, data) {
            $('.loader-rxn').remove();


            var nameInput = "<input type='text' id='" + randId + "media-name' " + (data.id ? "value='" + data.id + "'" : "") + "/>";
            var pHInput = "<input type='text' id='" + randId + "media-ph' " + (data.pH ? "value='" + data.pH + "'" : "") + "/>";

            container.append('<b>Name: </b>'+nameInput+' <b>pH: </b>'+pHInput);
            container.append('<br><br>');

            var table = $('<table class="table table-striped table-bordered" style="margin-left:auto; margin-right:auto">')
           
            table.append('<tr><th>Compound</th><th>Concentration</th><th>min_flux</th><th>max_flux</th><th>Delete/Add</th></tr>')
            for (var i in data.media_compounds) {
                table.append('<tr><td><input id="' + randId + 'cmpds'+i+'" class="form-control" value='+data.media_compounds[i].name+'></input></td>\
                    <td><input id="' + randId + 'conc'+i+'" class="form-control" value='+data.media_compounds[i].concentration+'></input></td>\
                    <td><input id="' + randId + 'minflux'+i+'" class="form-control" value='+data.media_compounds[i].min_flux+'></input></td>\
                    <td><input id="' + randId + 'maxflux'+i+'" class="form-control" value='+data.media_compounds[i].max_flux+'></input></td>\
                    <td><button id="' + randId + 'del'+i+'" onclick="$(this).closest(&#39;tr&#39).remove()" class="form-control"><span class="glyphicon glyphicon-trash"></span></button></tr>');
            }

            table.append('<tr><td><input id="' + randId + 'addCmpds" class="form-control" placeholder="add Compound"></input></td>\
                    <td><input id="' + randId + 'addConc" class="form-control" placeholder="add Concentration"></input></td>\
                    <td><input id="' + randId + 'addMinflux" class="form-control" placeholder="add Minflux"></input></td>\
                    <td><input id="' + randId + 'addMaxflux" class="form-control" placeholder="add Maxflux"></input></td>\
                    <td><button id="' + randId + 'addRow" class="form-control"><span class="glyphicon glyphicon-plus"></span></button></tr>');


            container.append(table)

            $("#" + randId + "addRow").click(function(e) {
                e.preventDefault();

                //var table = $('<table class="table table-striped table-bordered">')
                var newCmpd = $('#' + randId + 'addCmpds').val();
                var newConc = $('#' + randId + 'addConc').val();
                var newMinflux = $('#' + randId + 'addMinflux').val();
                var newMaxflux = $('#' + randId + 'addMaxflux').val();
                var last = $('[id^=' + randId + 'cmpds]').length
                //alert ();
                var rowToAdd = '<tr><td><input id="' + randId + 'cmpds'+last+'" class="form-control" value="'+newCmpd+'"></input></td>\
                        <td><input id="' + randId + 'conc'+last+'" class="form-control" value="'+newConc+'"></input></td>\
                        <td><input id="' + randId + 'minflux'+last+'" class="form-control" value="'+newMinflux+'"></input></td>\
                        <td><input id="' + randId + 'maxflux'+last+'" class="form-control" value="'+newMaxflux+'"></input></td>\
                        <td><button id="' + randId + 'del'+last+'" onclick="$(this).closest(&#39;tr&#39).remove()" class="form-control"><span class="glyphicon glyphicon-trash"></span></button></tr>'

                 table.append(rowToAdd)

                var row = $(this).closest('tr');
                row.next().after(row);


            });
    
            var $errorPanel = $("<div/>")
                              .addClass("alert alert-danger")
                              .css({"display" : "none"});

            var $saveButton = $("<button>")
                              .addClass("btn btn-primary")
                              .append("Save media")
                              .click(function(event) {
                                  saveEditedMedia(ws, $errorPanel);
                              });

            container.append($saveButton);
            container.append($errorPanel);

//            container.append('<a class="btn btn-primary save-to-ws-btn">Save to a workspace -></a>');
//            events();
        }

        function saveEditedMedia(workspace, $errorPanel) {
            console.log("saving media to " + workspace);

            $errorPanel.css({"display" : "none"});
            $errorPanel.html("");

            var cmpds = $('[id^=' + randId + 'cmpds]');
            var conc = $('[id^=' + randId + 'conc]');
            var minflux = $('[id^=' + randId + 'minflux]');
            var maxflux = $('[id^=' + randId + 'maxflux]');
            var newMedia = {
                media: 'testSave',
                workspace: 'jko',
                name: 'testSave',
                isDefined: 0,
                isMinimal: 0,
                type: 'unknown',
                compounds: [cmpds],
                concentrations: [conc],
                maxflux: [minflux],
                minflux: [maxflux]

            };

            var mediaName = $("#" + randId + "media-name").val().trim().replace(/\s+/g, "_");
            var mediaPH = $("#" + randId + "media-ph").val().trim().replace(/\s+/g, "_");

            console.log("name: " + mediaName + " pH: " + mediaPH);

            var errorText = "";
            if (!mediaName) {
                errorText += "Please give your media a name."; 
            }
            if (!mediaPH) {
                errorText += " Please give your media a numerical pH.";
            }
            if (errorText) {
                $errorPanel.html(errorText);
                $errorPanel.css({"display" : "inline"});
            }

            console.log(newMedia);
        }


        function events() {

            $('.save-to-ws-btn').unbind('click');
            $('.save-to-ws-btn').click(function() {
                //var media_id=data.id;
                //var name=data.id;
                var cmpds = $('[id^=' + randId + 'cmpds]');
                var conc = $('[id^=' + randId + 'conc]');
                var minflux = $('[id^=' + randId + 'minflux]');
                var maxflux = $('[id^=' + randId + 'maxflux]');
                var newmedia = {
                    media: 'testSave',
                    workspace: 'jko',
                    name: 'testSave',
                    isDefined: 0,
                    isMinimal: 0,
                    type: 'unknown',
                    compounds: [cmpds],
                    concentrations: [conc],
                    maxflux: [minflux],
                    minflux: [maxflux]

                };
                container.append('<div id="save-to-ws"></div>')
                var test = $('#save-to-ws').kbaseSimpleWSSelect({defaultWS:ws, auth: token});
                test.show();


                self.trigger('saveToWSClick', newmedia);
            });
        }
/*
        function saveEditedMedia(workspace) {
            console.log('saving?')
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


        /*function saveMedia(workspace, data) {
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
        }*/
  
        function get_genome_id(ws_id) {
            var pos = ws_id.indexOf('.');
            var ws_id = ws_id.slice(0, ws_id.indexOf('.', pos+1));
            return ws_id;
        }

        $('#rxn-tabs a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        })

        return this;
    },  //end init

    _genRandId: function() {
        var randId = "";
        for (var i=0; i<15; i++) {
            randId += Math.floor(Math.random()*10);
        }
        return randId;
    }
})
}( jQuery ) );
