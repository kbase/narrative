(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseGWASTraitMaps",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            type: "KBaseGwasData.GwasPopulationTrait",
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

                    console.log(data[0]);

                    var id = self.collection.data.GwasPopulation_obj_id;

                    var traits = self.collection.data.trait_measurements;

                    var traitsKeys = {};                                                                                                        

                    var key = '6926';                                                                                                           

                    var values = [];
                    var maxValue = parseFloat(traits[0][1]);
                    var minValue = parseFloat(traits[0][1]);
                                  
                    traits.forEach(function(trait) {
                        if (trait[1] != 'NA') {
                            if ( parseFloat(trait[1]) > maxValue ) maxValue = parseFloat(trait[1]);
                            if ( parseFloat(trait[1]) < minValue ) minValue = parseFloat(trait[1]);
                        }
                        traitsKeys[trait[0]] = trait[1];
                    });

                    console.log(traitsKeys);
                    
                    console.log(traitsKeys[key]);
                    console.log(maxValue);
                    console.log(minValue);

                    var numBins = 10;
                    var bins = ['0.0', '0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1.0'];
                    var factor = ( maxValue - minValue ) / numBins;
                    console.log(factor);

                    var innerSelf = self;

                    self.workspaceClient.get_objects([{name: id, workspace: self.options.ws}], function(data2){

                        innerSelf.collection = data2[0];
                        var iconFile = 'NA';
                        var traitId, traitValue;
                        var printoing = '';

                        for (var i=0, cnt=0; i<innerSelf.collection.data.ecotype_details.length; i++) {
                            var marker = new Object();
                            var lat = parseFloat(innerSelf.collection.data.ecotype_details[i].latitude);
                            var lng = parseFloat(innerSelf.collection.data.ecotype_details[i].longitude);

                            if ( lat && lng) {
                                cnt++; 
                                marker.latLng = [ lat, lng ];

                                if (i == 0 ) console.log(innerSelf.collection.data.ecotype_details[i]);

                                traitId = innerSelf.collection.data.ecotype_details[i].ecotype_id;
                                traitValue = traitsKeys[traitId];

                                if ( traitValue != 'NA') {
                                    iconFile = bins[Math.round(((traitValue - minValue) / factor))];
                                    printoing = printoing + ', ' + iconFile;
                                    //console.log(iconFile);
                                }

                                marker.data = innerSelf.collection.data.ecotype_details[i].nativename;
                                marker.options = new Object();

                                marker.options.icon = '/landing-pages/assets/images/' + iconFile + '.svg';

                                allMarkers.push(marker);
                            }                                                
                        }

                        innerSelf.options.allMarkers = allMarkers;
                        innerSelf.options.markerCount = cnt;
                        console.log(printoing);

                        return innerSelf.render();
                    });

                    



                    //return self.render();

                
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
                  zoom: 2 
                }
              },
              marker:{
                values: mrks,
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
              }
            });


            return this;
        },
        getData: function() {
            return {
                type:this.options.type,
                id: this.options.id,
                workspace: this.options.ws,
                title: "GWAS Population Trait Distribution"
            };
        }
    });
})( jQuery )
