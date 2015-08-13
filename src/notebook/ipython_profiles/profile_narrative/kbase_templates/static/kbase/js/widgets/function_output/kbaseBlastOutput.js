
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
names : ['Overview', 'Hits', 'Graphical Alignment', 'Sequence Alignment'],
        ids :   ['overview', 'contigs', 'genes', 'alignments']
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


//d3 json delete start
                d3.json("http://reseq.ornl.gov/kbase/data/blastoutput.json", function(data) {
//d3 json delete end
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



                        var hits=data.BlastOutput.BlastOutput_iterations.Iteration.Iteration_hits.Hit;
                        var db=data.BlastOutput.BlastOutput_db;
                        var query_info = data.BlastOutput["BlastOutput_query-def"];
                        var parameters = data.BlastOutput.BlastOutput_param.Parameters;

                        ////////////////////////////// Overview Tab //////////////////////////////
                        $('#'+pref+'overview').append('<table class="table table-striped table-bordered" \
                            style="margin-left: auto; margin-right: auto;" id="'+pref+'overview-table"/>');
                        var overviewLabels = ["Input Sequence ids", "Input Genome id(s)", "Total number of hits"];
                        var overviewData = [query_info, db, hits.length];


                        var overviewTable = $('#'+pref+'overview-table');
                        for (var i=0; i<overviewData.length; i++) {
                            overviewTable.append('<tr><td>'+overviewLabels[i]+'</td> \
                                    <td>'+overviewData[i]+'</td></tr>');
                        }

console.log(parameters);

                        for (var key in parameters) {
                            overviewTable.append('<tr><td>'+key + '</td> \
                                    <td>'+ parameters[key] +'</td></tr>');
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
                        /*

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
                         */


                        var counter=0;
                        var counterf = function (){
                            counter = counter +1;
                            return (counter);
                        }


                        var padding = 20;

                        var margin = {top: 20, right: 30, bottom: 30, left: 40},
                            width = 540 - margin.left - margin.right,
                            height = 500 - margin.top - margin.bottom;


                        var genex = $('#'+pref+'genes');
                        var id = pref + 'genes';

                        var genesDivdata = document.getElementById(id);






                        //svg--------------------------------------



                        var querylength=data.BlastOutput.BlastOutput_iterations.Iteration["Iteration_query-len"]
                        var hits=data.BlastOutput.BlastOutput_iterations.Iteration.Iteration_hits.Hit;

 var counter=0;
                  var counterf = function (){
                    counter = counter +1;
                    return (counter);
                  }


                     var margin = {top: 0, right: 0, bottom:0, left:10},
                      width = 540 - margin.left - margin.right,
                      height = 500 - margin.top - margin.bottom;

                       var padding = margin.left + margin.right;

                   var scaley = margin.top+20; 
                   var rect1 = margin.top+10;
                  var fullscalelength = (10 - Number(querylength) % 10) + Number(querylength);
                  console.log(querylength);

                  var gethitcolor = function (n){
                    n=Number(n);
                    var color = '#000000';
                    if (n < 40){
                      color='#000000';
                    }
                    if (n >= 40 && n < 50){
                      color='#0000FF';
                    }
                    if (n >= 50 && n < 80){
                      color='#66FF66';
                    }
                    if (n >=80 && n <200){
                      color='#FF3399';
                    }
                    if (n >=200){
                      color='#FF0000';
                    }
                    return (color);

                  }


var x = d3.scale.linear()
                    .domain([0, querylength])
                    .range([0, width-30]);



                        var xAxis = d3.svg.axis()
                            .scale(x)
                            .orient("bottom");
                        var svg = d3.select(genesDivdata).append("svg")
                            .attr("width", width  )
                    .attr("height", height )
                    .append("g")
                    .attr("transform", "translate(" + 10 + "," + margin.top + ")");










                             svg.append("rect")
                  .attr("x", 0)
                  .attr("fill","green")
                  .attr("y", 0)
                  .attr("width", x(querylength))
                  .attr("height",6)
                  .attr("transform", "translate(" + 10 + "," + margin.top + ")");


                  svg.selectAll("rect")
                    .data(hits)
                    .enter()
                    .append("rect")
                    .attr("fill", function (d){
                        return (gethitcolor (d["Hit_hsps"].Hsp["Hsp_bit-score"]));
                    })
                    .attr("y", function(d){
                        var begin = d["Hit_hsps"].Hsp["Hsp_query-from"]
                        console.log(begin); 
                        var f = counterf()*7  ;
                        return (f)
                        })
                  .attr("x", function(d){
                      var begin = d["Hit_hsps"].Hsp["Hsp_query-from"]
                      //console.log(begin + ' ' +  x(begin));
                      return x(begin);
                      })
                  .attr("width", function(d) {
                      var seqlength = d["Hit_hsps"].Hsp["Hsp_query-to"] - d["Hit_hsps"].Hsp["Hsp_query-from"]  
                      return x(Number(seqlength)) ;
                      })
                  .attr("height", function(){
                      return 4; 
                      })
                  .attr("transform", "translate(" + 10 + "," + 30 + ")");

                     svg.append("g")
                    .attr("class", "axis") //Assign "axis" class
                   .attr("transform", "translate(" + 10 + "," + 10 + ")")
                    .call(xAxis);


                    



                        var paddingx = function (n) {
                            var z = ' ' ;
                            n = n + '';
                            var width=8;
                            return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
                        }


                        var  formatter= function (d, al){

                            var hsp= d["Hit_hsps"].Hsp;

                            var align_len     = hsp["Hsp_align-len"];
                            var bit_score     = hsp["Hsp_bit-score"];
                            var evalue        = hsp["Hsp_evalue"];
                            var gaps          = hsp["Hsp_gaps "];
                            var hit_frame     = hsp["Hsp_hit-frame"];
                            var hit_from      = hsp["Hsp_hit-from"];
                            var hit_to        = hsp["Hsp_hit-to"];
                            var hseq          = hsp["Hsp_hseq"];
                            var identity      = hsp["Hsp_identity"];
                            var midline       = hsp["Hsp_midline"];
                            var num           = hsp["Hsp_num"];
                            var positive      = hsp["Hsp_positive"];
                            var qseq          = hsp["Hsp_qseq"];
                            var query_frame   = hsp["Hsp_query-frame"];
                            var query_from    = hsp["Hsp_query-from"];
                            var query_to      = hsp["Hsp_query-to"];
                            var score         = hsp["Hsp_score"];

                            if (gaps==null){
                                gaps=0;
                            }

                            var empty_space = new Array(10).join(' ');
                            var accession = d["Hit_accession"];
                            var hit_def = d["Hit_def"];
                            var hit_len = d["Hit_len"];

                            var pctid = (Number(identity) / Number(align_len)) *100;
                            var pctpositive = (Number(positive) / Number(align_len)) *100 ;
                            var pctgap = (Number(gaps) / Number(align_len) )*100;




                            var str  = '<div STYLE="font-family: monospace;  white-space: pre;">' +  '>' + accession + ' ' +  hit_def +  '</br>';
                            str += 'Length =' + hit_len + '</br>';
                            str += 'Score = ' + bit_score + '(' + score + '), ' + 'Expect = ' + evalue + '</br>';
                            str += 'Identities = ' + identity + '/' + align_len +  ' (' +  Math.round(pctid) + '%),';
                            str += 'Positives = ' + positive + '/' + align_len + ' ('+ Math.round(pctpositive) +'%), ';
                            str += 'Gaps = ' + gaps + '/' + align_len +  ' (' + Math.round(pctgap) + ')' ;
                                    str += '</br></br>';
                                    al.append(str)


                                    var q_start=0;
                                    var q_end = 0;
                                    var h_start =0;
                                    var h_end = 0;

                                    var i=0;
                                    while (i < hseq.length){
                                    start = i;
                                    end = i+60;
                                    var p1 = hseq.substring(start,end);
                                    var p2 = midline.substring(start,end);
                                    var p3 = qseq.substring(start,end);


                                    if (i==0){
                                    q_start = Number(hit_from);
                                    h_start = Number(hit_to);
                                    }
                                    else {
                                        h_start = h_end + 1;
                                        q_start = q_end + 1;
                                    }



                                    var c1=p1.replace(/-/g,"");
                                    var c3=p3.replace(/-/g,"");

                                    q_end = q_start + c3.length -1;
                                    h_end = h_start + c1.length -1;

                                    var alnstr = '<div STYLE="font-family: monospace;  white-space: pre;">';
                                    alnstr += paddingx(q_start) + ' ' +  p3 + ' ' + q_end + '</br>';
                                    alnstr += empty_space +   p2 + '</br>';
                                    alnstr += paddingx(h_start) + p1 + ' ' + h_end + '</br>';
                                    alnstr += '</font></div></br>';
                                    al.append (alnstr)
                                        i=end;
                                    }
                        }






                        var al  = $('#'+pref+'alignments');

                        d3.json("http://reseq.ornl.gov/kbase/data/blastoutput.json", function(data) {
                                var hits=data.BlastOutput.BlastOutput_iterations.Iteration.Iteration_hits.Hit;
                                for (var i = 0; i < hits.length; i++) {
                                formatter(hits[i], al);
                                }
                                });


                        //d3.json delete start
                }
                );
                //d3.json  delete end

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

