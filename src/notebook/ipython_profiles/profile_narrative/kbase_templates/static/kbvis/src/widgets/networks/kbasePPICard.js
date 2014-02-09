/**
   Create a card with a table showing a PPI dataset
 */
(function( $, undefined ) {
    $.KBWidget({
        name: "KBasePPICard",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
	    id : null,
	    ws : null,
	    auth: null,
	    userId: null,
            width: 700,
            height: 450
        },

        wsServiceUrl: "https://kbase.us/services/ws/",

        init: function(options) {
	    var self = this;
            this._super(options);

            this.wsClient = new Workspace(this.wsServiceUrl, { 'token' : this.options.auth,
							       'user_id' : this.options.userId});

	    var container = $('<div id="container" />');
	    this.$elem.append(container);

            this.tableLoading = $('<div id="table-loading" style="text-align: center; margin-top: 60px;"><img src="assets/img/ajax-loader.gif" /><p class="text-muted">Loading...<p></div>');
            container.append(this.tableLoading);

            this.tableDiv = $('<div id="ppi-table-container" />');
            this.tableDiv.addClass('hide');                
            container.append(this.tableDiv);
	    
	    this.tableHeader = $('<div id="ppi-table-header" />');
	    this.tableDiv.append(this.tableHeader);

            this.table = $('<table width="100%" cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered">');
            this.tableDiv.append(this.table);

	    this.table.dataTable({
		iDisplayLength: 10,
		aoColumns: [
                    { "sTitle": "Interaction" },      
                    { "sTitle": "Confidence" },
                    { "sTitle": "Proteins" },
		],
	    });

	    this.wsClient.get_objects([{'workspace': this.options.ws,
					'name': this.options.id}],
				      function(data) {
					  self.dataset = data[0].data;
					  var ds = self.dataset;
					  var header = '<p>'+ds.description;
					  if (ds.hasOwnProperty('url'))
					      header = '<a href="'+ds.url+'">'+header+'</a>';
					  if (ds.hasOwnProperty('kb_id'))
					      header += ' (in CDS as '+ds.kb_id+')</p>';
					  // console.log(data);
					  self.tableHeader.html(header);
					  var tableData = [];
					  self.featureLinks = [];
					  for (var i=0; i<ds.interactions.length; i++) {
					      var description = '<a href="" id="ilink-'+i+'">'+
						  ds.interactions[i].description+'</a>';
					      var conf = 0;
					      if (ds.interactions[i].hasOwnProperty('confidence'))
						  conf = ds.interactions[i].confidence;
					      // if (ds.interactions[i].hasOwnProperty('url'))
					      // description = '<a href="'+ds.interactions[i].url+'">'+description+'</a>';
					      var proteins = '';
					      for (var j=0; j<ds.interactions[i].interaction_proteins.length; j++) {
						  var ip = ds.interactions[i].interaction_proteins[j];
						  if (j>0)
						      proteins += ', ';
						  // fixme:  link should be to landing page for feature
						  // in case card doesn't trigger correctly
						  proteins += '<a href="" id="flink-'+self.featureLinks.length+'">'+
						      ip.feature_id+'</a>';
						  self.featureLinks.push(ip.feature_id);
						  if (ip.hasOwnProperty('stoichiometry')) {
						      if (ip.stoichiometry > 1)
							  proteins += " x "+ip.stoichiometry;
						  }
					      }
					      tableData.push([description,
							      conf,
							      proteins]);
					  }
					  self.table.fnAddData(tableData);
					  self.table.fnAdjustColumnSizing();
					  // fixme: this doesn't work for links that aren't on 1st page
					  for (var i=0; i<self.featureLinks.length; i++) {
					      $("a#flink-"+i).click(function(e) {
						  e.preventDefault();
						  // console.log("want to open gene card for "+this.innerHTML);
						  self.trigger("showFeature", {'featureID' : this.innerHTML,
									       'event' : e });
					      });
					  }
					  // fixme: this doesn't work for links that aren't on 1st page
					  for (var i=0; i<ds.interactions.length; i++) {
					      var cynet = new Object();
					      cynet.nodes = [];
					      cynet.edges = [];
					      for (var j=0; j<ds.interactions[i].interaction_proteins.length; j++) {
						  var ip = ds.interactions[i].interaction_proteins[j];
						  var nodeData = { data : { "type" : "node",
									    "id" : ""+j,
									    "label" : ip.feature_id,
									    "color" : "yellow",
									    "width" : 50 } };
						  cynet.nodes.push(nodeData);
						  for (var k=j+1; k<ds.interactions[i].interaction_proteins.length; k++) {
						      var edgeData = { data : { "type" : "edge",
										"id" : j+"_"+k,
										"name" : j+"_"+k,
										"directed" : false,
										"source" : ""+j,
										"target" : ""+k,
										"color" : "black",
										"width": 1 } };
						      cynet.edges.push(edgeData);
						  }
					      }
					      $("a#ilink-"+i).attr("network",JSON.stringify(cynet));
					      $("a#ilink-"+i).attr("netname",ds.description+"/"+ds.interactions[i].description);
					      $("a#ilink-"+i).click(function(e) {
						  e.preventDefault();
						  console.log("showing network "+$(this).attr("network"));
						  self.trigger("showNetwork", { 'network': $(this).attr("network"),
										'netname': $(this).attr("netname"),
										'event': e });
					      });
					  }

					  self.loading(false);
				      },
				      function(data) {
					  self.tableDiv.remove();
					  self.loading(false);
					  self.$elem.append('<p>[Error] ' + data.error.message + '</p>');
					  return;
				      }
				     );
            return this;
        },

        loading: function(flag) {
            if (flag) {
                this.tableLoading.removeClass('hide');
                this.tableDiv.addClass('hide');                
            } else {
                this.tableDiv.removeClass('hide');
                this.tableLoading.addClass('hide');
            }
        },

        getData: function() {
            return {
                type: "KbasePPI",
                id: this.options.id,
                ws: this.options.ws,
                title: "PPI Dataset"
            };
        }

    });
})( jQuery )