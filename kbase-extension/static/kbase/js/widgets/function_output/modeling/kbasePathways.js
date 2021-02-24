
define(['kbwidget', 'jquery', 'bootstrap', 'kbaseTabTableTabs'],
(KBWidget, $, bootstrap, kbaseTabTableTabs) => {
return KBWidget({
    name: "kbasePathways",
    version: "1.0.0",
    init: function(options) {
        const self = this;

        const imageWorkspace = 'nconrad:kegg',
            mapWorkspace = 'nconrad:pathwaysjson',
            container = $.jqElem('div');
        this.$elem.append(container);

        const kbapi = new KBModeling().kbapi;

        const models = options.models,
            fbas = options.fbas;

        // add tabs
        const selectionTable = $('<table cellpadding="0" cellspacing="0" border="0" \
            class="table table-bordered table-striped">');

        const tabs = new kbaseTabTableTabs(container, {tabs: [
                                        {name: 'Selection', content: selectionTable, active: true}
                                    ]});

//container.append(selectionTable);
        this.load_map_list = function() {
            // load table for maps
            this.$elem.loading();

            kbapi('ws', 'list_objects', {workspaces: [mapWorkspace], includeMetadata: 1})
            .done((d)=> {
                self.$elem.rmLoading();

                const tableSettings = {
                    "drawCallback": events,
                    "sorting": [[ 1, "asc" ]],
                    "columns": [
                        { title: 'Name', mData: function(d) {
                            return '<a class="pathway-link" data-map_id="'+d[1]+'">'+d[10].name+'</a>';
                        }},
                        { title: 'Map ID', mData: 1},
                        { title: 'Rxn Count', sWidth: '10%', mData: function(d){
                            if ('Number reactions' in d[10]){
                                return d[10]['Number reactions'];
                            } else {
                                return 'N/A';
                            }
                        }},
                        { title: 'Cpd Count', sWidth: '10%', mData: function(d) {
                            if ('Number compounds' in d[10]) {
                                return d[10]['Number compounds'];
                            } else {
                                return 'N/A';
                            }
                        }} ,
                        { title: "Source","sWidth": "10%", mData: function(d) {
                            return "KEGG";
                        }},
                    ],
                    "language": {
                        "emptyTable": "No objects in workspace",
                        "search": "Search:"
                    }
                }

                const table = selectionTable.DataTable(tableSettings);
                table.rows.add(d).draw();

            }).fail((e)=> {
                container.prepend('<div class="alert alert-danger">'+
                            e.error.message+'</div>')
            });
        }

        this.load_map_list();



        function events() {
            // event for clicking on pathway link
            container.find('.pathway-link').unbind('click')
            container.find('.pathway-link').click(function() {
                const map_id = $(this).data('map_id');
                const name = $(this).text();

                const elemID = map_id+'-'+self.uuid();
                const container = $('<div id="path-container-'+elemID+'" style="position:relative;">');
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
            const p1 = kbapi('ws', 'get_objects', [{workspace: imageWorkspace, name: map+'.png'}]),
                p2 = kbapi('ws', 'get_objects', [{workspace: mapWorkspace, name: map}])
            $.when(p1, p2)
                .then((imgRes, mapRes) => {
                    const image = imgRes[0].data.id,
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



