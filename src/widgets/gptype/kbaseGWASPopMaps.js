(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseGWASPopMaps",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            type: "KBaseGwasData.GwasPopulation",
            width: 1200
        },
        workspaceURL: "https://kbase.us/services/ws",

        init: function(options) {
            this._super(options);

            var self = this;

            var $mapDiv = $('<div/>')
            .addClass('gmap3')
            .attr({ id: 'mapElement'});
            self.$elem.append($mapDiv);

            var allMarkers = [];


            this.workspaceClient = new Workspace(this.workspaceURL);

            this.workspaceClient.get_objects([{name : this.options.id, workspace: this.options.ws}], 
                function(data){
                    
                    self.collection = data[0];
                    
                    
                    for (var i=0, cnt=0; i<self.collection.data.ecotype_details.length; i++) {
                        var marker = new Object();
                        var lat = parseFloat(self.collection.data.ecotype_details[i].latitude);
                        var lng = parseFloat(self.collection.data.ecotype_details[i].longitude);

                        if ( lat && lng) {
                            cnt++; 
                            marker.lat = lat;
                            marker.lng = lng;
                            marker.data = self.collection.data.ecotype_details[i].nativename;
                            allMarkers.push(marker);
                        }                                                
                    }

                    self.options.allMarkers = allMarkers;
                    self.options.markerCount = cnt;


                    return self.render();

                
                },

                self.rpcError
            );

            return this.render();
        },
        render: function(options) {

            var mrks = [];

            for (var i = 0; i < this.options.markerCount; i++) {

                mrks.push(this.options.allMarkers[i]);

            }


            $('#mapElement').width('1100px').height('450px').gmap3({
              map:{
                options:{
                  center:[46.578498,2.457275],
                  zoom: 2,
                  mapTypeId: google.maps.MapTypeId.TERRAIN
                }
              },
              marker:{
                values: mrks,
                cluster:{
                  radius: 100,
                    // This style will be used for clusters with more than 0 markers
                    0: {
                        content: '<div class="cluster cluster-1">CLUSTER_COUNT</div>',
                        width: 53,
                        height: 52
                    },
                    // This style will be used for clusters with more than 20 markers
                    20: {
                        content: '<div class="cluster cluster-2">CLUSTER_COUNT</div>',
                        width: 56,
                        height: 55
                    },
                    // This style will be used for clusters with more than 50 markers
                    50: {
                        content: '<div class="cluster cluster-3">CLUSTER_COUNT</div>',
                        width: 66,
                        height: 65
                    }
                }
              },
              options:{
                  draggable: false
              },
              events:{
                  mouseover: function(marker, event, context){
                    var map = $(this).gmap3("get"),
                    infowindow = $(this).gmap3({get:{name:"infowindow"}});
                    if (infowindow){
                      infowindow.open(map, marker);
                      infowindow.setContent(context.data);
                    } else {
                      $(this).gmap3({
                        infowindow:{
                          anchor:marker, 
                          options:{content: context.data}
                        }
                      });
                    }
                  },
                  mouseout: function(){
                    var infowindow = $(this).gmap3({get:{name:"infowindow"}});
                    if (infowindow){
                      infowindow.close();
                    }
                  }
                }

            });

            return this;
        },
        getData: function() {
            return {
                type:this.options.type,
                id: this.options.id,
                workspace: this.options.ws,
                title: "GWAS Population Distribution"
            };
        }
    });
})( jQuery )
