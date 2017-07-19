define([
    'kbwidget',
    'jquery',
    'd3',
    'narrativeConfig',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
    'underscore',
    'css!ext_components/jquery.tipsy/css/jquery.tipsy.css',
    'css!ext_components/bootstrap-slider/slider.css',
    'bootstrap',
    'bootstrap-slider',
    'tipsy',
    'jquery-dataTables-bootstrap'
  ],
  function (
    KBWidget,
    $,
    d3,
    Config,
    KBaseAuthenticatedWidget,
    KBaseTabs,
    _
  ) {
    return KBWidget({
      name          : "kbaseExpressionVolcanoPlot",
      parent        : KBaseAuthenticatedWidget,
      version       : "1.0.0",
      ws_id         : null,
      ws_name       : null,
      token         : null,
      width         : 800,
      wsUrl         : Config.url('workspace'),
      loading_image : Config.get('loading_gif'),

      init: function (options) {
        this._super(options);
        this.ws_id = options.volcano_plot_object;
        this.ws_name = options.workspace;
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
      },

     render: function () {
        var self = this;
        //login related error
        var $container = this.$elem;
        if (!self.token) {
          $container.empty();
          $container.append("<div>[Error] You're not logged in</div>");
          return;
        }

        var kbws = new Workspace(self.wsUrl, {'token': self.token});

        $container.empty();
        $container.append(
          $.jqElem('div')
            .append(
              $.jqElem('img')
                .attr('src', this.loading_image)
            )
            .append("&nbsp;&nbsp;loading data...")
        );

        kbws.get_objects([{ref: self.ws_name + "/" + self.ws_id}], function (text) {
          self.renderPlot(text)
        }, function (text) {
          $container.empty();
          $container.append('<p>[Error] ' + data.error.message + '</p>');
        });

        return this;
      },

      colorx : function (d, pv, fc) {

        var x = d.log2fc_f
        var y = d.p_value_f

        if ( Math.abs(x) > fc && Math.abs(y) > pv ) {
          if (d.significant  === 'yes'){
           return "red";
          }
        }
        return "grey";
      },

      renderPlot : function(text) {

        var self = this;

        var $container = this.$elem;

        $container.empty();
        text = text[0].data;

        var $tabPane = $.jqElem('div');
        $container.append($tabPane);

        var overviewTable = self.data('overview-table');


        var counter=0;
        for (i=0; i < text.condition_pairs.length; i++){
          c1 = text.condition_pairs[i].condition_1
          c2 = text.condition_pairs[i].condition_2
          if (c1 === this.options.sample1 && c2 === this.options.sample2 || c1 === this.options.sample2 && c2 === this.options.sample1){
            counter = i
          }
        }

        $tabPane.append(
          $.jqElem('table')
            .css({ margin : 'auto' })
            .append(
              $.jqElem('tr')
                .append(
                  $.jqElem('td')
                    .append('- Log10(q-value)')
                    .append('<br>')
                    .append(
                      $.jqElem('b')
                        .attr('id', 'pv1')
                        .append('0')
                    )
                    .append(
                      $.jqElem('input')
                        .attr('type', 'text')
                        .addClass('span2')
                        .attr('data-slider-step', '0.01')
                        .attr('id', 'pvalue')
                    )
                    .append(
                      $.jqElem('b')
                        .attr('id', 'pv2')
                        .append('1.0')
                    )
                  )
                  .append(
                    $.jqElem('td')
                      .append('Log2(Fold Change)')
                      .append('<br>')
                      .append(
                        $.jqElem('b')
                          .attr('id', 'fc1')
                          .append('0')
                      )
                      .append(
                        $.jqElem('input')
                          .attr('type', 'text')
                          .addClass('span2')
                          .attr('data-slider-step', '0.01')
                          .attr('id', 'fc')
                      )
                      .append(
                        $.jqElem('b')
                          .attr('id', 'fc2')
                          .append('1.0')
                      )
                  )
                  .append(
                    $.jqElem('td')
                      .append(
                        $.jqElem('button')
                          .addClass('btn btn-block btn-primary')
                          .append('Show Selected Genes')
                          .attr('id', 'showselectedgenes')
                      )
                  )
              )
          )
          .append(
            $.jqElem('table')
              .css({ margin : 'auto', marginTop : '10px' })
              .append(
                $.jqElem('tr')
                  .append( $.jqElem('th').append('Condition 1:') )
                  .append( $.jqElem('td').append('1').attr('id', 'cond1') )
                  .append( $.jqElem('th').append('Condition 2:') )
                  .append( $.jqElem('td').append('2').attr('id', 'cond2') )
              )
          )
          .append(
            $.jqElem('div')
              .attr('id', 'chart')
              .css({
                width         : '100%',
                borderBottom  : '1px solid #ccc',
                marginBottom  : '30px',
                textAlign     : 'center',
              })
          )
          .append('<br>')
          .append(
            $.jqElem('div')
              .css({ fontWeight : 'bold', textAlign : 'center' })
              .append('-Log10(q-value) = ')
              .append( $.jqElem('span').attr('id', 'selpval') )
              .append( '&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;' )
              .append('Log2(Fold Change) = ')
              .append( $.jqElem('span').attr('id', 'selfc') )
          )
          .append(
            $.jqElem('table')
              .attr('id', 'voltable')
              .addClass('table table-striped table-bordered')
              .append(
                $.jqElem('thead')
                  .append(
                    $.jqElem('tr')
                      .append( $.jqElem('th').append('Gene'))
                      .append( $.jqElem('th').append('Gene description'))
                      .append( $.jqElem('th').append('Log2(FPKM+1) Condition 1 '))
                      .append( $.jqElem('th').append('Log2(FPKM+1) Condition 2'))
                      .append( $.jqElem('th').append('Log2(Fold Change) '))
                      .append( $.jqElem('th').append('-Log10(q-value)'))
                  )
              )
              .append(
                $.jqElem('tfoot')
                  .append(
                    $.jqElem('tr')
                      .append( $.jqElem('th').append('Gene'))
                      .append( $.jqElem('th').append('Gene description'))
                      .append( $.jqElem('th').append('Log2(FPKM+1) Condition 1 '))
                      .append( $.jqElem('th').append('Log2(FPKM+1) Condition 2'))
                      .append( $.jqElem('th').append('Log2(Fold Change) '))
                      .append( $.jqElem('th').append('-Log10(q-value)'))
                  )
              )
          )
        ;

        this._rewireIds($tabPane, this);

        var pv,fc;

        var dtable = self.data("voltable").DataTable();

        this.data("voltable").hide();

        // Function to show selected genes, trigger for button
        self.data("showselectedgenes").click(function() {
          dtable.clear().draw();
          self.data("voltable").show();
          var redRows     = [];
          var seenCircles = 0;
          var numCircles  = svg.selectAll("circle").size();
          svg.selectAll("circle")
            .transition()
            .attr("fill", function(d) {
              var cc = self.colorx(d, pv, fc);
              if ( cc  ===  "red" ) {
                redRows.push([
                    d.gene,
                    d.gene_function,
                    d.value_1,
                    d.value_2,
                    d.log2fc_text,
                    d.p_value_f,
                ]);
              }
              return cc;
            })
            .each('end', function(d) {
              seenCircles++;
              if (seenCircles  ===  numCircles) {
                dtable.rows.add(redRows).draw();
              }
            });

          self.data("voltable").show();

          pv = self.data("pvalue").val();
          fc = self.data("fc").val();

          svg.selectAll("circle")
            .attr("fill", function(d) { return self.colorx(d, pv, fc); });
        });


        var svgWidth  = 800;
        var svgHeight = 350;
        var padding   = 100;

        var svg = d3.select(self.data('chart')[0])
          .append("svg")
          .attr("width", svgWidth)
          .attr("height", svgHeight);

        var highlightElement = null;

        // function to show info callouts
        var info = function(d) {
          //self.data("gene_name").html(d.gene);

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


        var data = text.condition_pairs[counter].voldata;
        self.data( "cond1").text(text.condition_pairs[counter].condition_1);
        self.data( "cond2").text(text.condition_pairs[counter].condition_2);

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

        self.data( "fc1").text("0.0");
        self.data( "fc2").text(fcmax.toFixed(2));
        self.data( "pv1").text((ymin).toFixed(2));
        self.data( "pv2").text((ymax).toFixed(2));

        var sliderUpdate = _.debounce(function() {
          fc = self.data( "fc").val();

          self.data('selfc').text(parseFloat(fc).toFixed(2));
          var numCircles = svg.selectAll("circle").size();
          var seenCircles = 0;
          svg.selectAll("circle")
            .transition()
            .attr("fill", function(d) {
              var cc = self.colorx(d, pv, fc);
              if ( cc  ===  "red" ) {
                cnt = cnt + 1;
              }
              return cc;
            }).each('end', function() {
              seenCircles++;
              if (numCircles  ===  seenCircles) {
                updateCnt()
              }
            });

        }, 300);

        self.data( "fc").slider({tooltip_position:'bottom', step: 0.01, min :0.0, precision: 2,max:fcmax.toFixed(2)}).on('slide', sliderUpdate);

        var cnt = 0;
        var updateCnt = function() {
          self.data('showselectedgenes').text("Show Selected (" + cnt + " Genes)");
          cnt = 0;
        }

        var slider2Update = _.debounce(function(){
          pv = self.data( "pvalue").val();
          self.data('selpval').text(parseFloat(pv).toFixed(2));
          var numCircles = svg.selectAll("circle").size();
          var seenCircles = 0;
          svg.selectAll("circle")
            .transition()
            .attr("fill", function(d) {
              var cc = self.colorx(d, pv, fc);
              if ( cc  ===  "red" ) {
                cnt = cnt + 1;
              }
              return cc;
            }).each('end', function() {
              seenCircles++;
              if (numCircles  ===  seenCircles) {
                updateCnt();
              }
            });
        });

        self.data( "pvalue").slider({tooltip_position:'bottom', step:0.01, precision: 2, min :ymin, max:ymax.toFixed(2)}).on('slide',slider2Update);

        self.data( "fc").slider('setValue', fcmax.toFixed(2));
        self.data( "pvalue").slider('setValue', ymax.toFixed(2));
        self.data('selpval').text(ymax.toFixed(2));
        self.data('selfc').text(fcmax.toFixed(2));

        pv = self.data( "pvalue").slider('getValue');
        fc = self.data( "fc").slider('getValue');

        var xScale = d3.scale.linear()
          .domain([xmin,xmax])
          .range([padding, svgWidth - padding]);

        var yScale = d3.scale.linear()
          .domain([ymin, ymax])
          .range([svgHeight - padding, 10]);


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
          .attr("fill", function(d) { return self.colorx(d, pv, fc); })
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





        // tipsy ain't working, and it's not yet clear what goes in there
        // this may be a library issue with tipsy or a local problem.
        /*$('svg circle').tipsy({
          gravity: 'w',
          Xtitle: function() {
            return this.__data__.gene;
          },
        });*/

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
          .attr("transform", "translate(0," + (svgHeight - padding + 20) + ")")
          .call(xAxis);

        svg.append("g")
          .attr("class", "axis")
          .attr("transform", "translate(" + (padding-10) + ",0)")
          .call(yAxis);

        svg.append("text")
          .attr("class", "xlabel")
          .attr("text-anchor", "end")
          .attr("x", svgWidth/2)
          .attr("y", svgHeight-40)
          .text("Log2(Fold change)");

        svg.append("text")
          .attr("class", "ylabel")
          .attr("text-anchor", "end")
          .attr("y", 40)
          .attr("x", -svgHeight/2+50)
          .attr("transform", "rotate(-90)")
          .text("-Log10(q-value)");

      },


    });
  });
