
define(['kbwidget', 'jquery', 'bootstrap', 'kbaseTabTableTabs'],
function(KBWidget, $, bootstrap, kbaseTabTableTabs) {
return KBWidget({
    name: "kbasePathways",
    version: "1.0.0",
    init: function(options) {
        var self = this;

        var imageWorkspace = 'nconrad:kegg',
            mapWorkspace = 'nconrad:pathwaysjson',
            container = this.$elem;

        var kbapi = new KBModeling().kbapi;

        var models = options.models,
            fbas = options.fbas;

        // add tabs
        var selectionTable = $('<table cellpadding="0" cellspacing="0" border="0" \
            class="table table-bordered table-striped">');
        var tabs = container.kbaseTabTableTabs({tabs: [
                                        {name: 'Selection', content: selectionTable, active: true}
                                    ]});

        this.load_map_list = function() {
            // load table for maps
            container.loading();
            kbapi('ws', 'list_objects', {workspaces: [mapWorkspace], includeMetadata: 1})
            .done(function(d){
                container.rmLoading();

                var tableSettings = {
                    "aaData": d,
                    "fnDrawCallback": events,
                    "aaSorting": [[ 1, "asc" ]],
                    "aoColumns": [
                        { sTitle: 'Name', mData: function(d) {
                            return '<a class="pathway-link" data-map_id="'+d[1]+'">'+d[10].name+'</a>';
                        }},
                        { sTitle: 'Map ID', mData: 1},
                        { sTitle: 'Rxn Count', sWidth: '10%', mData: function(d){
                            if ('reaction_ids' in d[10]){
                                return d[10].reaction_ids.split(',').length;
                            } else {
                                return 'N/A';
                            }
                        }},
                        { sTitle: 'Cpd Count', sWidth: '10%', mData: function(d) {
                            if ('compound_ids' in d[10]) {
                                return d[10].compound_ids.split(',').length;
                            } else {
                                return 'N/A';
                            }
                        }} ,
                        { sTitle: "Source","sWidth": "10%", mData: function(d) {
                            return "KEGG";
                        }},
                    ],
                    "oLanguage": {
                        "sEmptyTable": "No objects in workspace",
                        "sSearch": "Search:"
                    }
                }

                var table = selectionTable.dataTable(tableSettings);

            }).fail(function(e){
                container.prepend('<div class="alert alert-danger">'+
                            e.error.message+'</div>')
            });
        }

        this.load_map_list();



        function events() {
            // event for clicking on pathway link
            container.find('.pathway-link').unbind('click')
            container.find('.pathway-link').click(function() {
                var map_id = $(this).data('map_id');
                var name = $(this).text();

                var elemID = map_id+'-'+self.uuid();
                var container = $('<div id="path-container-'+elemID+'" style="position:relative;">');
                container.loading();
                tabs.addTab({name: name, removable: true, content: container});

                load_map(map_id, container, elemID);
                tabs.showTab(name);
            });

            // tooltip for hover on pathway name
            container.find('.pathway-link')
                     .tooltip({title: 'Open path tab',
                               placement: 'right',
                               delay: {show: 1000}});
        } // end events


        function load_map(map, container, elemID) {
            var p1 = kbapi('ws', 'get_objects', [{workspace: imageWorkspace, name: map+'.png'}]),
                p2 = kbapi('ws', 'get_objects', [{workspace: mapWorkspace, name: map}])
            $.when(p1, p2)
                .then(function(imgRes, mapRes) {
                    var image = imgRes[0].data.id,
                        mapData = mapRes[0].data;

                    // no need to decode...
                    container.append('<img src="data:image/png;base64,'+image+'" style="display: inline-block;">');
                    container.append('<div id="pathway-'+elemID+'" style="position:absolute; top:0;">');

                    container.rmLoading();
                    new ModelSeedPathway({elem: 'pathway-'+elemID,
                                          usingImage: true,
                                          mapData: mapData,
                                          models: models,
                                          fbas: fbas})
                })
        }

        return this;

    }  //end init

})
});



