
define(['jquery', 
        'ContigBrowserPanel', 
        'kbwidget', 
        'kbaseAuthenticatedWidget', 
        'kbaseTabs',
        'jquery-dataTables',
        'jquery-dataTables-bootstrap'], 
function( $, ContigBrowserPanel) {
    $.KBWidget({
        name: "kbaseBlastOutput",
        parent: "kbaseAuthenticatedWidget",
        version: "1.0.0",
        ws_id: null,
        ws_name: null,
        token: null,
        width: 1150,
        options: {
        ws_id: null,
        ws_name: null
        },
        loadingImage: "static/kbase/images/ajax-loader.gif",
        wsUrl: window.kbconfig.urls.workspace,
        timer: null, 
        lastElemTabNum: 0,

        init: function(options) {
            this._super(options);

            this.ws_id = options.blast_output_name;
            this.ws_name = options.workspaceName;
   
            return this;
        },


      tabData : function () {

        return {
                    names : ['Overview', 'Hits', 'Input Sequences', 'Alignments'],
                    ids : ['overview', 'contigs', 'genes', 'alignments']
                };

      }, 

    
        render: function() {
            var self = this;
            var pref = this.uuid();	
            var container = this.$elem;
            if (self.token == null) {
                container.empty();
                container.append("<div>[Error] You're not logged in</div>");
                return;
            }

            var kbws = new Workspace(self.wsUrl, {'token': self.token});
           

            var ready = function(data) {
                        container.empty();
                        var tabPane = $('<div id="'+pref+'tab-content">');
                        container.append(tabPane);
                        tabPane.kbaseTabs({canDelete : true, tabs : []});


            var tabData = self.tabData();
            var tabNames = tabData.names;
            var tabIds = tabData.ids;
    
            for (var i=0; i<tabIds.length; i++) {
                    var tabDiv = $('<div id="'+pref+tabIds[i]+'"> ');
                    tabPane.kbaseTabs('addTab', {tab: tabNames[i], content: tabDiv, canDelete : false, show: (i == 0)});
                }


        

           hits=data[0].data.hits;



       ////////////////////////////// Overview Tab //////////////////////////////
                    $('#'+pref+'overview').append('<table class="table table-striped table-bordered" \
                            style="margin-left: auto; margin-right: auto;" id="'+pref+'overview-table"/>');
                    var overviewLabels = ["Input Sequence ids", "Input Genome id(s)", "Total number of hits", "Arguements" ];
                    var overviewData = ["seq1, seq2", "Athaliana.Tair10, Ptrichocarpa.V3", hits.length, "blastall -p blastp -e 1e-10"];


                    var overviewTable = $('#'+pref+'overview-table');
                    for (var i=0; i<overviewData.length; i++) {
                            overviewTable.append('<tr><td>'+overviewLabels[i]+'</td> \
                                    <td>'+overviewData[i]+'</td></tr>');
                    }




function geneEvents() {
                 //   $('.'+pref+'gene-click').unbind('click');
                  //  $('.'+pref+'gene-click').click(function() {
//get geneID and pass it to the next step
                    //    var geneId = [$(this).data('geneid')];
                       // showGene(geneId);
                    //});
                }



      ////////////////////////////////Hits tab////////////////////
      $('#'+pref+'contigs').append('<table class="table table-striped table-bordered" \
                            style="margin-left: auto; margin-right: auto;" id="'+pref+'contigs-table"/>');


            var genesData = [];
                for (var i=0; i<hits.length; i++) {
                genesData.push({gene_id: hits[i]["gene_id"] , evalue: hits[i]["e-value"],  gene_annotation: hits[i]["gene_annotation"],  identity: hits[i].identity, score: hits[i].score});
        }

                var genesSettings = {
                        "sPaginationType": "full_numbers",
                        "iDisplayLength": 10,
                        "aaSorting": [[ 1, "asc" ], [2, "asc"]],
                        "aoColumns": [
                                      {sTitle: "GeneID", mData: "gene_id"},
                                      {sTitle: "e-value", mData: "evalue"},
                                      {sTitle: "Identity", mData: "identity"},
                                      {sTitle: "Score", mData: "score"},
                                      {sTitle: "function", mData: "gene_annotation"},
                                      ],
                                      "aaData": [],
                                      "oLanguage": {
                                          "sSearch": "Search Hits:",
                                          "sEmptyTable": "No Hits found."
                                      },
                                      "fnDrawCallback": geneEvents
                };
      var contigsDiv = $('#'+pref+'contigs-table').dataTable(genesSettings);
      contigsDiv.fnAddData(genesData);



            //contigsDiv.append("<div><img src=\""+self.loadingImage+"\">&nbsp;&nbsp;loading Blast results ...</div>");

        
                //contigsDiv.append('<tr><td>' + Gene_id + '</td>' + '<td>'+Identity+'</td>' + '<td>'+Sscore+'</td> </tr>')

  //              contigsDiv.append('<tr><td>' + "Gene_id" + '</td> <td>' + "e-value"+ '</td> <td>'+"Identity"+'</td><td>'+"Score"+'</td> </tr>')


    //    for (var i=0; i<hits.length; i++) {

      //          contigsDiv.append('<tr><td>' + hits[i]["gene_id"] + '</td> <td>' + hits[i]["e-value"] + '</td> <td>'+hits[i].identity+'</td><td>'+hits[i].score+'</td> </tr>')

      //  }


                    var genesDiv = $('#'+pref+'genes');
       
 var str = JSON.stringify(data, undefined, 2);
        genesDiv.append('<pre>'+ str + '</pre>');



          }; 




    	    container.empty();
    	    container.append("<div><img src=\""+self.loading_image+"\">&nbsp;&nbsp;loading data...</div>");


            kbws.get_objects([{ref: self.ws_name+"/"+self.ws_id}], function(data) {
                ready(data)
            },
            function(data) {
                container.empty();
                container.append('<p>[Error] ' + data.error.message + '</p>');
            });
            return this;
        },

        

 getData: function() {
                return {
                        type: "NarrativeTempCard",
                        id: this.ws_name + "." + this.ws_id,
                        workspace: this.ws_name,
                        title: "Temp Widget"
                };
        },


        loggedInCallback: function(event, auth) {
            this.token = auth.token;
            this.render();
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.token = null;
            this.render();
            return this;
        },
uuid: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
                function(c) {
                    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                });
        }

    });
});
