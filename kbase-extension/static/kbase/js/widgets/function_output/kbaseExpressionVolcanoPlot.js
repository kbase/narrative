define(['jquery',
    'util/string',
    'd3',
    'kbwidget',
    'css!ext_components/tipsy/src/stylesheets/tipsy.css',
    'css!ext_components/bootstrap-slider/slider.css',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
    'bootstrap',
/*    'jquery-dataTables',
    'jquery-tmpl',*/
    'bootstrap-slider',
    'tipsy'
  /*  'jquery-dataTables-bootstrap,'*/
],
    function ($, StringUtil) {
      $.KBWidget({
          name: "kbaseExpressionVolcanoPlot",
          parent: "kbaseAuthenticatedWidget",
          version: "1.0.0",
          ws_id: null,
          ws_name: null,
          token: null,
          width: 800,
          wsUrl: window.kbconfig.urls.workspace,
          loading_image: window.kbconfig.loading_gif,

          options: {
              ws_id: null,
              ws_name: null
          },

          init: function (options) {
              this._super(options);
              this.ws_id = options.volcano_plot_object;
              this.ws_name = options.workspace;
              return this;
          },
          //tabData is used to create tabs later on in the output widget
          tabData: function () {
              return {
                  names: ['Overview'],
                  ids: ['overview']
              };
          },

          render: function () {
              var self = this;
              var pref = StringUtil.uuid();

              //login related error
              var container = this.$elem;
              if (self.token == null) {
                  container.empty();
                  container.append("<div>[Error] You're not logged in</div>");
                  return;
              }

              var kbws = new Workspace(self.wsUrl, {'token': self.token});

            var ready = function (text) {
                container.empty();
                text = text[0].data;
                var tabPane = $('<div id="' + pref + 'tab-content">');
                container.append(tabPane);
                   ////////////////////////////// Overview Tab //////////////////////////////

                //Append table to overview tab and display contents

               // var parameters = data.BlastOutput_param.Parameters;
                //var db = data.BlastOutput_db;
                //var query_info = data.BlastOutput_iterations.Iteration[0]['Iteration_query-def'];
                //var hits = data.BlastOutput_iterations.Iteration[0].Iteration_hits.Hit;

var overviewTable = $('#' + pref + 'overview-table');

 tabPane.append('<div class="container"><div class="row"><div class="row"><div class="col-md-12 text-center"><div class="box"><div class="box-content"><div>');
 tabPane.append('<center> <table><tr class="text-center">' +
                '<td style="padding-right:20px;">- Log10(p-value)<br/>' +
                '<b id="' + pref + 'pv1">0</b> &nbsp; &nbsp;' +
                '<input id="' + pref + 'pvalue" type="text" class="span2" value="" data-slider-step="0.01" /> &nbsp; &nbsp;' +
                '<b id="' + pref + 'pv2">1.0</b></td><td style="padding-left:20px;border-left: 1px solid #ccc;">' +
                'Log2(Fold Change)<br/>' +
                '<b id="' + pref + 'fc1">-1.4</b> &nbsp; &nbsp;' + 
                '<input id="' + pref + 'fc" type="text" class="span2" value="" data-slider-step="0.01"  /> &nbsp; &nbsp;' +
                '<b id="' + pref + 'fc2">1.1</b></td></table> <br/>');
                    
tabPane.append('<table><td>' +
               '<button id="' + pref + 'showselectedgenes" class="btn btn-block btn-primary">Show Selected Genes</button>' +
                '</td></tr></table></center></div><hr /><center><div class="fig"><div><table id="' + 'info"><tr>' +
                '<td ><b>Condition 1: &nbsp; </b> </td> <td> <div id="' + pref + 'cond1"></div></td>' +
                '<td style="padding-left: 30px;"><b>Condition 2: &nbsp;  </b> </td> <td> <div id="' + pref + 'cond2"></div></td>' +
                '</tr></table><br/><br/></div>'); 

tabPane.append('<div class="chart" id="p' + pref + 'divchart" style="width:100%; border-bottom:1px solid #ccc;margin-bottom:30px;"> ' + 
               '</div><br/></div> <br/><div id="' + pref + 'voltablediv" style="width:80%;" > ' +
               '<table class="table table-striped table-bordered" cellspacing="0" width="100%" id="' + pref + 'voltable" >' +
               '<thead><tr><th>Gene</th><th>Locus</th><th>Value1</th><th>Value2</th><th>Fold Change</th> <th>p value</th></tr>' +
               '</thead><tfoot><tr><th>Gene</th><th>Locus</th><th>Value1</th><th>Value2</th><th>Fold Change</th><th>p value</th> </tr></tfoot>' +
               '<tbody id="' + pref + 'voltablebody">' +
               '</tbody></table></div> </center></div></div></div></div></div> </div>');
  
   $(function(){
    var pv,fc;
        
    var colorx = function (x,y) {
      /*
      console.log("fc = ", fc);
      console.log("pv = ", pv);
      */
       if ( Math.abs(x) > fc && Math.abs(y) > pv ) {
           return "red";
       }
       return "grey";
    };


    var dtable = $("#" + pref + "voltable").DataTable();

      $("#" + pref + "voltablediv").hide();
        $("#" + pref + "showselectedgenes").click(function() {
        dtable.clear().draw();
        $("#" + pref + "voltablediv").show();
        svg.selectAll("circle")
          .attr("fill", function(d) {
            var cc = colorx(d.log2fc_fa, d.p_value_f);
            if ( cc == "red" ) {
              dtable.row.add([
                d.gene,
                d.locus,
                d.value_1,
                d.value_2,
                d.log2fc_f,
                d.p_value,
                d.function
              ]).draw();
            }
            return cc;
          });

        $("#" + pref + "voltablediv").show();

        pv = $("#" + pref + "pvalue").val();
        fc = $("#" + pref + "fc").val();
        svg.selectAll("circle")
          .attr("fill", function(d) { return colorx(d.log2fc_fa, d.p_value_f); });

      });



    $("#" + pref + "pvalue").change(function() {
        console.log("pvalue changed");
        pv = $("#" + pref + "pvalue").val();
        svg.selectAll("circle")
          .attr("fill", function(d) { return colorx(d.log2fc_fa, d.p_value_f); });
      });

      $("#" + pref + "fc").change(function() {
        console.log("fc changed");
        fc = $("#" + pref + "fc").val();
        svg.selectAll("circle")
          .attr("fill", function(d) { return colorx(d.log2fc_fa, d.p_value_f); });
      });

    var w = 800;
    var h = 350;
    var padding = 100;
    //var pv1, pv2, fc1,fc2;
    divchart = "#p" + pref + "divchart"
  //  console.log(divchart)


    var svg = d3.select(divchart)
              .append("svg")
             .attr("width", w)
              .attr("height", h);

    var highlightElement = null;
    var info = function(d) {
        $("#" + pref + "gene_name").html(d.gene);
        $("#" + pref + "xval").html(parseFloat(d.log2fc_f).toPrecision(5));
        $("#" + pref + "yval").html(parseFloat(d.p_value_f).toPrecision(5));

        var element = d3.select(this);
        element.transition().duration(100)
            .attr("stroke", element.attr("fill"))
            .attr("stroke-width", 5);

        if (highlightElement) {
            highlightElement.transition().duration(100)
                .attr("stroke","none");
        }

        highlightElement = element;
    };




   var data = text.condition_pairs[0].voldata;
    $("#" + pref + "cond1").text(text.condition_pairs[0].condition_1);
    $("#" + pref + "cond2").text(text.condition_pairs[0].condition_2);

    // Filter NO_TEST data

    // name = gene
    // f = significant
    // x = log2fc_fa
    // y = p_value_f

    // tables contents
    // Gene
    // Locus
    // Value1
    // Value2
    // Log2fc
    // Pvalue
    // Qvalue

    // Range slider


    var xmin = d3.min(data, function(d) { return parseFloat(d.log2fc_f); });
    var xmax = d3.max(data, function(d) { return parseFloat(d.log2fc_f); });

    var ymin = d3.min(data, function(d) { return parseFloat(d.p_value_f); });
    var ymax = d3.max(data, function(d) { return parseFloat(d.p_value_f); });
   
    
    
    //$("#fc").slider({tooltip_position:'bottom', step: 0.01, min :xmin, max:xmax, value: [xmin.toFixed(2),xmax.toFixed(2)]});
    //$("#pvalue").slider({tooltip_position:'bottom', step:0.01, min :ymin, max:ymax, value: [ymin.toFixed(2),ymax.toFixed(2)]});
    //
    var fcmax = xmax;
    if (Math.abs(xmin) > xmax ) {
      fcmax = Math.abs(xmin)
    }

    $("#" + pref + "fc1").text("0.0");
    $("#" + pref + "fc2").text(fcmax.toFixed(2));
    $("#" + pref + "pv1").text((ymin).toFixed(2));
    $("#" + pref + "pv2").text((ymax).toFixed(2));

    $("#" + pref + "fc").slider({tooltip_position:'bottom', step: 0.01, min :0.0, max:fcmax});
    $("#" + pref + "pvalue").slider({tooltip_position:'bottom', step:0.01, min :ymin, max:ymax});

    $("#" + pref + "fc").val(fcmax);
    $("#" + pref + "pvalue").val(ymax);

    //$("#fc").slider('setValue', [xmin.toFixed(2),xmax.toFixed(2)]);
    //$("#pvalue").slider('setValue', [ymin.toFixed(2),ymax.toFixed(2)]);

    /*
    pv1 = $("#pvalue").slider('getValue')[0];
    pv2 = $("#pvalue").slider('getValue')[1];
    fc1 = $("#fc").slider('getValue')[0];
    fc2 = $("#fc").slider('getValue')[1];
    */

    /*
    pv1 = ymin.toFixed(2);
    pv2 = ymax.toFixed(2);
    fc1 = xmin.toFixed(2);
    fc2 = xmax.toFixed(2);
    */
    
    
    
    /*
    pv = $("#pvalue").slider('getValue');
    fc = $("#fc").slider('getValue');
    */
    /*
    pv = 1.0;
    fc = 1.0;
    */
    pv = $("#" + pref + "pvalue").val();
    fc = $("#" + pref + "fc").val();

    console.log(pv);
    console.log(fc);

    /*
    pv1 = ymin;
    pv2 = ymax;
    fc1 = xmin;
    fc2 = xmax;
    */
    
          var xScale = d3.scale.linear()
                .domain([xmin,xmax])
                .range([padding, w - padding]);

        var yScale = d3.scale.linear()
                .domain([ymin, ymax])
                .range([h - padding, 10]);


        svg.selectAll("circle")
                .data(data)
                .enter()
                .append("svg:circle")
                .attr("cx", function(d) {
                        return xScale(parseFloat(d.log2fc_f));
                })
                .attr("cy", function(d) {
                        return yScale(parseFloat(d.p_value_f));
                })
                .attr("r", 3)
      .attr("fill", function(d) { return colorx(d.log2fc_fa, d.p_value_f); })
      .on("mouseover", function() {
                        d3.select(this)
                                .transition().duration(100)
                                .attr("r", 7);
                })
                .on("mouseout", function() {
                        d3.select(this)
                                .transition().duration(100)
                                .attr("r", 3);
                })
                .on("click", info)
                .attr("id", function(d) { return d.significant; });
    


        $('svg circle').tipsy({
        gravity: 'w',
        title: function() {
          return this.__data__.gene;
        }
   });

        var xAxis = d3.svg.axis()
                .scale(xScale)
                .orient("bottom")
                .ticks(10);  //Set rough # of ticks

        var yAxis = d3.svg.axis()
                .scale(yScale)
                .orient("left")
                .ticks(10);
                
                
                
                   svg.append("g")
                .attr("class", "axis")
                .attr("transform", "translate(0," + (h - padding + 20) + ")")
                .call(xAxis);

        svg.append("g")
                .attr("class", "axis")
                .attr("transform", "translate(" + (padding-10) + ",0)")
                .call(yAxis);

        svg.append("text")
                .attr("class", "xlabel")
                .attr("text-anchor", "end")
                .attr("x", w/2)
                .attr("y", h-40)
                .text("Fold change");

        svg.append("text")
                .attr("class", "ylabel")
                .attr("text-anchor", "end")
                .attr("y", 40)
                .attr("x", -h/2+50)
                .attr("transform", "rotate(-90)")
                .text("-log10(p-value)");


;});

         
           
       
                  ////////////////////////////////Hits tab////////////////////

              };

              container.empty();
              container.append("<div><img src=\"" + self.loading_image + "\">&nbsp;&nbsp;loading data...</div>");

              kbws.get_objects([{ref: self.ws_name + "/" + self.ws_id}], function (text) {
                      ready(text)
                  },
                  function (text) {
                      container.empty();
                      container.append('<p>[Error] ' + data.error.message + '</p>');
                  });
              return this;
          },

          loggedInCallback: function (event, auth) {
              this.token = auth.token;
              this.render();
              return this;
          },

          loggedOutCallback: function (event, auth) {
              this.token = null;
              this.render();
              return this;
          }
      });
    });
