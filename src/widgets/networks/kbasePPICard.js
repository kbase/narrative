/**
   Create a card with a table showing a PPI dataset
 */
(function( $, undefined ) {
    $.KBWidget({
        name: "KBasePPICard",
        parent: "kbaseAuthenticatedWidget",
        version: "1.0.1",
        options: {
	    id: null,
	    ws: null,
	    auth: null,
	    userId: null,
            width: 700,
            height: 450
        },

        // wsServiceUrl: "http://140.221.84.209:7058/",
	wsServiceUrl: "https://kbase.us/services/ws",

        init: function(options) {
	    var self = this;
            this._super(options);

/*
            var testnet = JSON.stringify({
                nodes: [ { data: { id: "DsrA", label: "DsrA", color: "yellow" } },
                         { data: { id: "DsrB", label: "DsrB", color: "yellow" } },
                         { data: { id: "DsrC", label: "DsrC", color: "yellow" } },
                         { data: { id: "QmoA", label: "QmoA", color: "yellow" } },
                         { data: { id: "QmoB", label: "QmoB", color: "yellow" } },
                         { data: { id: "QmoC", label: "QmoC", color: "yellow" } },
                         { data: { id: "1", label: "1", color: "blue" } },
                         { data: { id: "2", label: "2", color: "blue" } },
                         { data: { id: "3", label: "3", color: "blue" } },
                         { data: { id: "4", label: "4", color: "blue" } },
                         { data: { id: "5", label: "5", color: "blue" } },
                         { data: { id: "6", label: "6", color: "blue" } },
                         { data: { id: "7", label: "7", color: "blue" } },
                         { data: { id: "8", label: "8", color: "blue" } },
                         { data: { id: "9", label: "9", color: "blue" } },
                         { data: { id: "10", label: "10", color: "blue" } },
                         { data: { id: "11", label: "11", color: "blue" } },
                         { data: { id: "12", label: "12", color: "blue" } },
                         { data: { id: "13", label: "13", color: "blue" } },
                         { data: { id: "14", label: "14", color: "blue" } },
                         { data: { id: "15", label: "15", color: "blue" } },
                         { data: { id: "16", label: "16", color: "blue" } },
                         { data: { id: "17", label: "17", color: "blue" } },
                         { data: { id: "18", label: "18", color: "blue" } },
                         { data: { id: "19", label: "19", color: "blue" } },
                         { data: { id: "20", label: "20", color: "blue" } },
                         { data: { id: "21", label: "21", color: "blue" } },
                         { data: { id: "22", label: "22", color: "blue" } },
                         { data: { id: "23", label: "23", color: "blue" } },
                         { data: { id: "24", label: "24", color: "blue" } },
                         { data: { id: "25", label: "25", color: "blue" } },
                         { data: { id: "26", label: "26", color: "blue" } },
                         { data: { id: "27", label: "27", color: "blue" } },
                         { data: { id: "28", label: "28", color: "blue" } },
                         { data: { id: "29", label: "29", color: "blue" } },
                         { data: { id: "30", label: "30", color: "blue" } },
                         { data: { id: "31", label: "31", color: "blue" } },
                         { data: { id: "32", label: "32", color: "blue" } },
                         { data: { id: "33", label: "33", color: "blue" } },
                         { data: { id: "34", label: "34", color: "blue" } },
                         { data: { id: "35", label: "35", color: "blue" } },
                         { data: { id: "36", label: "36", color: "blue" } },
                         { data: { id: "37", label: "37", color: "blue" } },
                         { data: { id: "38", label: "38", color: "blue" } },
                         { data: { id: "39", label: "39", color: "blue" } },
                         { data: { id: "40", label: "40", color: "blue" } },
                         { data: { id: "41", label: "41", color: "blue" } },
                         { data: { id: "42", label: "42", color: "blue" } },
                         { data: { id: "43", label: "43", color: "blue" } },
                         { data: { id: "44", label: "44", color: "blue" } },
                         { data: { id: "45", label: "45", color: "blue" } },
                         { data: { id: "46", label: "46", color: "blue" } },
                         { data: { id: "47", label: "47", color: "blue" } },
                         { data: { id: "48", label: "48", color: "blue" } },
                         { data: { id: "49", label: "49", color: "blue" } },
                         { data: { id: "50", label: "50", color: "blue" } },
                         { data: { id: "51", label: "51", color: "blue" } },
                         { data: { id: "52", label: "52", color: "blue" } },
                         { data: { id: "53", label: "53", color: "blue" } },
                         { data: { id: "54", label: "54", color: "blue" } },
                         { data: { id: "55", label: "55", color: "blue" } },
                         { data: { id: "56", label: "56", color: "blue" } },
                         { data: { id: "57", label: "57", color: "blue" } },
                         { data: { id: "58", label: "58", color: "blue" } },
                         { data: { id: "59", label: "59", color: "blue" } },
                         { data: { id: "60", label: "60", color: "blue" } },
                         { data: { id: "61", label: "61", color: "blue" } },
                         { data: { id: "62", label: "62", color: "blue" } },
                         { data: { id: "63", label: "63", color: "blue" } },
                         { data: { id: "64", label: "64", color: "blue" } },
                         { data: { id: "65", label: "65", color: "blue" } },
                         { data: { id: "66", label: "66", color: "blue" } },
                         { data: { id: "67", label: "67", color: "blue" } },
                         { data: { id: "68", label: "68", color: "blue" } },
                         { data: { id: "69", label: "69", color: "blue" } },
                         { data: { id: "70", label: "70", color: "blue" } },
                         { data: { id: "71", label: "71", color: "blue" } },
                         { data: { id: "72", label: "72", color: "blue" } },
                         { data: { id: "73", label: "73", color: "blue" } },
                         { data: { id: "74", label: "74", color: "blue" } },
                         { data: { id: "75", label: "75", color: "blue" } },
                         { data: { id: "76", label: "76", color: "blue" } },
                         { data: { id: "77", label: "77", color: "blue" } },
                         { data: { id: "78", label: "78", color: "blue" } },
                         { data: { id: "79", label: "79", color: "blue" } },
                         { data: { id: "80", label: "80", color: "blue" } },
                         { data: { id: "81", label: "81", color: "blue" } },
                         { data: { id: "82", label: "82", color: "blue" } },
                         { data: { id: "83", label: "83", color: "blue" } },
                         { data: { id: "84", label: "84", color: "blue" } },
                         { data: { id: "85", label: "85", color: "blue" } },
                         { data: { id: "86", label: "86", color: "blue" } },
                         { data: { id: "87", label: "87", color: "blue" } },
                         { data: { id: "88", label: "88", color: "blue" } },
                         { data: { id: "89", label: "89", color: "blue" } },
                         { data: { id: "90", label: "90", color: "blue" } },
                         { data: { id: "91", label: "91", color: "blue" } },
                         { data: { id: "92", label: "92", color: "blue" } },
                         { data: { id: "93", label: "93", color: "blue" } },
                         { data: { id: "94", label: "94", color: "blue" } },
                         { data: { id: "95", label: "95", color: "blue" } },
                         { data: { id: "96", label: "96", color: "blue" } },
                         { data: { id: "97", label: "97", color: "blue" } },
                         { data: { id: "98", label: "98", color: "blue" } },
                         { data: { id: "99", label: "99", color: "blue" } },
                         { data: { id: "100", label: "100", color: "blue" } },
                         { data: { id: "DVU0851", label: "DVU0851", color: "grey" } } ],  
                edges: [ { data: { id: "e1", source: "DsrA", target: "DsrB", weight: 3, color: "green" } },
                         { data: { id: "e2", source: "DsrA", target: "DsrC", weight: 3, color: "green" } },
                         { data: { id: "e3", source: "DsrB", target: "DsrC", weight: 3, color: "green" } },
                         { data: { id: "e4", source: "QmoA", target: "QmoB", weight: 2 } },
                         { data: { id: "e5", source: "QmoC", target: "QmoB", weight: 2 } },
                         { data: { id: "e6", source: "QmoA", target: "QmoC", weight: 3 } },
                         { data: { id: "e7", source: "QmoA", target: "DVU0851"} },
                         { data: { id: "e8", source: "QmoB", target: "DVU0851"} },
                         { data: { id: "e9", source: "DsrA", target: "DVU0851"} },
                         { data: { id: "ee1", source: "DsrA", target: "1", weight: 2, color: "blue" } },
                         { data: { id: "ee2", source: "DsrA", target: "2", weight: 2, color: "blue" } },
                         { data: { id: "ee3", source: "DsrA", target: "3", weight: 2, color: "blue" } },
                         { data: { id: "ee4", source: "DsrA", target: "4", weight: 2, color: "blue" } },
                         { data: { id: "ee5", source: "DsrA", target: "5", weight: 2, color: "blue" } },
                         { data: { id: "ee6", source: "DsrA", target: "6", weight: 2, color: "blue" } },
                         { data: { id: "ee7", source: "DsrA", target: "7", weight: 2, color: "blue" } },
                         { data: { id: "ee8", source: "DsrA", target: "8", weight: 2, color: "blue" } },
                         { data: { id: "ee9", source: "DsrA", target: "9", weight: 2, color: "blue" } },
                         { data: { id: "ee10", source: "DsrA", target: "10", weight: 2, color: "blue" } },
                         { data: { id: "ee11", source: "DsrA", target: "11", weight: 2, color: "blue" } },
                         { data: { id: "ee12", source: "DsrA", target: "12", weight: 2, color: "blue" } },
                         { data: { id: "ee13", source: "DsrA", target: "13", weight: 2, color: "blue" } },
                         { data: { id: "ee14", source: "DsrA", target: "14", weight: 2, color: "blue" } },
                         { data: { id: "ee15", source: "DsrA", target: "15", weight: 2, color: "blue" } },
                         { data: { id: "ee16", source: "DsrA", target: "16", weight: 2, color: "blue" } },
                         { data: { id: "ee17", source: "DsrA", target: "17", weight: 2, color: "blue" } },
                         { data: { id: "ee18", source: "DsrA", target: "18", weight: 2, color: "blue" } },
                         { data: { id: "ee19", source: "DsrA", target: "19", weight: 2, color: "blue" } },
                         { data: { id: "ee20", source: "DsrA", target: "20", weight: 2, color: "blue" } },
                         { data: { id: "ee21", source: "DsrA", target: "21", weight: 2, color: "blue" } },
                         { data: { id: "ee22", source: "DsrA", target: "22", weight: 2, color: "blue" } },
                         { data: { id: "ee23", source: "DsrA", target: "23", weight: 2, color: "blue" } },
                         { data: { id: "ee24", source: "DsrA", target: "24", weight: 2, color: "blue" } },
                         { data: { id: "ee25", source: "DsrA", target: "25", weight: 2, color: "blue" } },
                         { data: { id: "ee26", source: "DsrA", target: "26", weight: 2, color: "blue" } },
                         { data: { id: "ee27", source: "DsrA", target: "27", weight: 2, color: "blue" } },
                         { data: { id: "ee28", source: "DsrA", target: "28", weight: 2, color: "blue" } },
                         { data: { id: "ee29", source: "DsrA", target: "29", weight: 2, color: "blue" } },
                         { data: { id: "ee30", source: "DsrA", target: "30", weight: 2, color: "blue" } },
                         { data: { id: "ee31", source: "DsrA", target: "31", weight: 2, color: "blue" } },
                         { data: { id: "ee32", source: "DsrA", target: "32", weight: 2, color: "blue" } },
                         { data: { id: "ee33", source: "DsrA", target: "33", weight: 2, color: "blue" } },
                         { data: { id: "ee34", source: "DsrA", target: "34", weight: 2, color: "blue" } },
                         { data: { id: "ee35", source: "DsrA", target: "35", weight: 2, color: "blue" } },
                         { data: { id: "ee36", source: "DsrA", target: "36", weight: 2, color: "blue" } },
                         { data: { id: "ee37", source: "DsrA", target: "37", weight: 2, color: "blue" } },
                         { data: { id: "ee38", source: "DsrA", target: "38", weight: 2, color: "blue" } },
                         { data: { id: "ee39", source: "DsrA", target: "39", weight: 2, color: "blue" } },
                         { data: { id: "ee40", source: "DsrA", target: "40", weight: 2, color: "blue" } },
                         { data: { id: "ee41", source: "DsrA", target: "41", weight: 2, color: "blue" } },
                         { data: { id: "ee42", source: "DsrA", target: "42", weight: 2, color: "blue" } },
                         { data: { id: "ee43", source: "DsrA", target: "43", weight: 2, color: "blue" } },
                         { data: { id: "ee44", source: "DsrA", target: "44", weight: 2, color: "blue" } },
                         { data: { id: "ee45", source: "DsrA", target: "45", weight: 2, color: "blue" } },
                         { data: { id: "ee46", source: "DsrA", target: "46", weight: 2, color: "blue" } },
                         { data: { id: "ee47", source: "DsrA", target: "47", weight: 2, color: "blue" } },
                         { data: { id: "ee48", source: "DsrA", target: "48", weight: 2, color: "blue" } },
                         { data: { id: "ee49", source: "DsrA", target: "49", weight: 2, color: "blue" } },
                         { data: { id: "ee50", source: "DsrA", target: "50", weight: 2, color: "blue" } },
                         { data: { id: "ee51", source: "DsrA", target: "51", weight: 2, color: "blue" } },
                         { data: { id: "ee52", source: "DsrA", target: "52", weight: 2, color: "blue" } },
                         { data: { id: "ee53", source: "DsrA", target: "53", weight: 2, color: "blue" } },
                         { data: { id: "ee54", source: "DsrA", target: "54", weight: 2, color: "blue" } },
                         { data: { id: "ee55", source: "DsrA", target: "55", weight: 2, color: "blue" } },
                         { data: { id: "ee56", source: "DsrA", target: "56", weight: 2, color: "blue" } },
                         { data: { id: "ee57", source: "DsrA", target: "57", weight: 2, color: "blue" } },
                         { data: { id: "ee58", source: "DsrA", target: "58", weight: 2, color: "blue" } },
                         { data: { id: "ee59", source: "DsrA", target: "59", weight: 2, color: "blue" } },
                         { data: { id: "ee60", source: "DsrA", target: "60", weight: 2, color: "blue" } },
                         { data: { id: "ee61", source: "DsrA", target: "61", weight: 2, color: "blue" } },
                         { data: { id: "ee62", source: "DsrA", target: "62", weight: 2, color: "blue" } },
                         { data: { id: "ee63", source: "DsrA", target: "63", weight: 2, color: "blue" } },
                         { data: { id: "ee64", source: "DsrA", target: "64", weight: 2, color: "blue" } },
                         { data: { id: "ee65", source: "DsrA", target: "65", weight: 2, color: "blue" } },
                         { data: { id: "ee66", source: "DsrA", target: "66", weight: 2, color: "blue" } },
                         { data: { id: "ee67", source: "DsrA", target: "67", weight: 2, color: "blue" } },
                         { data: { id: "ee68", source: "DsrA", target: "68", weight: 2, color: "blue" } },
                         { data: { id: "ee69", source: "DsrA", target: "69", weight: 2, color: "blue" } },
                         { data: { id: "ee70", source: "DsrA", target: "70", weight: 2, color: "blue" } },
                         { data: { id: "ee71", source: "DsrA", target: "71", weight: 2, color: "blue" } },
                         { data: { id: "ee72", source: "DsrA", target: "72", weight: 2, color: "blue" } },
                         { data: { id: "ee73", source: "DsrA", target: "73", weight: 2, color: "blue" } },
                         { data: { id: "ee74", source: "DsrA", target: "74", weight: 2, color: "blue" } },
                         { data: { id: "ee75", source: "DsrA", target: "75", weight: 2, color: "blue" } },
                         { data: { id: "ee76", source: "DsrA", target: "76", weight: 2, color: "blue" } },
                         { data: { id: "ee77", source: "DsrA", target: "77", weight: 2, color: "blue" } },
                         { data: { id: "ee78", source: "DsrA", target: "78", weight: 2, color: "blue" } },
                         { data: { id: "ee79", source: "DsrA", target: "79", weight: 2, color: "blue" } },
                         { data: { id: "ee80", source: "DsrA", target: "80", weight: 2, color: "blue" } },
                         { data: { id: "ee81", source: "DsrA", target: "81", weight: 2, color: "blue" } },
                         { data: { id: "ee82", source: "DsrA", target: "82", weight: 2, color: "blue" } },
                         { data: { id: "ee83", source: "DsrA", target: "83", weight: 2, color: "blue" } },
                         { data: { id: "ee84", source: "DsrA", target: "84", weight: 2, color: "blue" } },
                         { data: { id: "ee85", source: "DsrA", target: "85", weight: 2, color: "blue" } },
                         { data: { id: "ee86", source: "DsrA", target: "86", weight: 2, color: "blue" } },
                         { data: { id: "ee87", source: "DsrA", target: "87", weight: 2, color: "blue" } },
                         { data: { id: "ee88", source: "DsrA", target: "88", weight: 2, color: "blue" } },
                         { data: { id: "ee89", source: "DsrA", target: "89", weight: 2, color: "blue" } },
                         { data: { id: "ee90", source: "DsrA", target: "90", weight: 2, color: "blue" } },
                         { data: { id: "ee91", source: "DsrA", target: "91", weight: 2, color: "blue" } },
                         { data: { id: "ee92", source: "DsrA", target: "92", weight: 2, color: "blue" } },
                         { data: { id: "ee93", source: "DsrA", target: "93", weight: 2, color: "blue" } },
                         { data: { id: "ee94", source: "DsrA", target: "94", weight: 2, color: "blue" } },
                         { data: { id: "ee95", source: "DsrA", target: "95", weight: 2, color: "blue" } },
                         { data: { id: "ee96", source: "DsrA", target: "96", weight: 2, color: "blue" } },
                         { data: { id: "ee97", source: "DsrA", target: "97", weight: 2, color: "blue" } },
                         { data: { id: "ee98", source: "DsrA", target: "98", weight: 2, color: "blue" } },
                         { data: { id: "ee99", source: "DsrA", target: "99", weight: 2, color: "blue" } },
                         { data: { id: "ee100", source: "DsrA", target: "100", weight: 2, color: "blue" } },
                         { data: { id: "e10", source: "DsrB", target: "DVU0851"}  }]
            });
*/

            this.wsClient = new Workspace(this.wsServiceUrl, { token: this.authToken(),
							       user_id: this.options.userId});

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

	    this.tableData = null;

	    this.table.dataTable({
		iDisplayLength: 10,
		aoColumns: [
                    { sTitle: "Interaction" },      
                    { sTitle: "Confidence" },
                    { sTitle: "Proteins" },
		],
		bSaveState : true,
		fnStateSave: function (oSettings, oData) {
		    self.tableData = JSON.stringify(oData);
		},
		fnStateLoad: function (oSettings) {
		    return JSON.parse( self.tableData );
		},
		fnDrawCallback: function() {
		    $('a.flink').unbind('click').bind('click',function(e) {
			self.trigger("showFeature", {featureID : this.innerHTML,
						     event : e });
		    });
		    $('a.ilink').unbind('click').bind('click',function(e) {
			var id = $(this).attr("id");
			self.trigger("showNetwork", { network: self.netdata[id].network,
						      netname: self.netdata[id].netname,
						      event: e });
		    });

		}
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
					      var description = '<a class="ilink" id="'+i+'">'+
						  ds.interactions[i].description+'</a>';
					      var conf = 0;
					      if (ds.interactions[i].hasOwnProperty('confidence'))
						  conf = ds.interactions[i].confidence;
					      if (ds.interactions[i].hasOwnProperty('url'))
						  description += ' (<a href="'+ds.interactions[i].url+'">link</a>)';
					      var proteins = '';
					      for (var j=0; j<ds.interactions[i].interaction_proteins.length; j++) {
						  var ip = ds.interactions[i].interaction_proteins[j];
						  if (j>0)
						      proteins += ', ';
						  proteins += '<a class="flink">'+ip.feature_id+'</a>';
						  self.featureLinks.push(ip.feature_id);
						  if ((ip.hasOwnProperty('stoichiometry')) &&
						      (ip.stoichiometry > 1))
						      proteins += " x "+ip.stoichiometry;
					      }
					      tableData.push([description,
							      conf,
							      proteins]);
					  }
					  self.table.fnAddData(tableData);
					  self.table.fnAdjustColumnSizing();

					  self.netdata = new Array();

					  // build network objects for each interaction
					  // and save as properties
					  for (var i=0; i<ds.interactions.length; i++) {
					      var cynet = new Object();
					      cynet.nodes = [];
					      cynet.edges = [];
					      var nNodes = ds.interactions[i].interaction_proteins.length;
					      var isDirectional = 0;
					      if ((ds.interactions[i].hasOwnProperty('directional')) &&
						  (ds.interactions[i].directional == 1))
						  isDirectional = 1;
					      for (var j=0; j<nNodes; j++) {
						  var ip = ds.interactions[i].interaction_proteins[j];
						  var nodeData = { data : { type: "node",
									    id: ""+j,
									    label: ip.feature_id,
									    color: "yellow",
									    width: 50 } };
						  cynet.nodes.push(nodeData);

						  // if homomer, add edge to self
						  if ((ip.hasOwnProperty('stoichiometry')) &&
						      (ip.stoichiometry > 1)) {
						      var edgeData = { data : { type: "edge",
										id: j+"_"+j,
										name: j+"_"+j,
										directed: isDirectional,
										source: ""+j,
										target: ""+j,
										color: "black",
										width: 1 } };
						      cynet.edges.push(edgeData);
						  }
						  
						  // add edges to all later nodes in complex
						  for (var k=j+1; k<nNodes; k++) {
						      var edgeData = { data : { type: "edge",
										id: j+"_"+k,
										name: j+"_"+k,
										directed: isDirectional,
										source: ""+j,
										target: ""+k,
										color: "black",
										width: 1 } };
						      cynet.edges.push(edgeData);
						  }
					      }
					      self.netdata[i] = new Object();
					      self.netdata[i].network = JSON.stringify(cynet);
					      self.netdata[i].netname = ds.description+"/"+ds.interactions[i].description;
					  }

					  self.loading(false);
				      },
				      function(data) {
					  self.tableDiv.remove();
					  self.loading(false);
					  self.$elem.append('<p>[Error] ' + data.error.message + '</p>');
/*
					  self.trigger("showNetwork", { network: testnet,
									netname: "test 100 nodes",
									event: null });
*/


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
                title: "PPI Dataset",
            }
        },

	getState: function() {
	    return {
		dataset: this.dataset,
		tableData: this.tableData,
	    }
	},

	loadState: function(state) {
	    self.dataset = state.dataset;
	    self.tableData = state.tableData;
	}
    });
})( jQuery )