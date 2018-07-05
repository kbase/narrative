define([
    'kbwidget',
    'jquery',
    'd3',
    'narrativeConfig',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
    'underscore',
		'narrativeConfig',
		'kbase-generic-client-api',
		'common/runtime',
		'kb_service/client/workspace',
    'base/js/namespace',
    'css!ext_components/jquery.tipsy/css/jquery.tipsy.css',
    'css!ext_components/bootstrap-slider/slider.css',
    'bootstrap',
    'bootstrap-slider',
    'tipsy',
  ],
  function (
    KBWidget,
    $,
    d3,
    Config,
    KBaseAuthenticatedWidget,
    KBaseTabs,
    _,
    Config,
		GenericClient,
		Runtime,
		Workspace,
		Jupyter
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
        this.redRows = [];
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
        $container.empty();
        if (!self.token) {
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

        if (this.options.diffExprMatrixSet_ref) {

          // we need to hand in a name to create feature set, not a ref. Fun times.
          kbws.get_object_info_new({objects: [{'ref':this.options.diffExprMatrixSet_ref}], includeMetadata:1}, function(info) {
            self.diffExprMatrixSet_name = info[0][1];
          });

          this.genericClient = new GenericClient(
            Config.url('service_wizard'),
            { token: Runtime.make().authToken() }
          );
          this.genericClient.sync_call('ExpressionAPI.get_differentialExpressionMatrixSet', [{
            'diffExprMatrixSet_ref' : this.options.diffExprMatrixSet_ref,
          }])
          .then(function(results) {

            var volcano_data = results[0].volcano_plot_data[0];

            self.renderPlot({
              unique_conditions : [volcano_data.condition_1, volcano_data.condition_2],
              condition_pairs : [{
                condition_1 : volcano_data.condition_1,
                condition_2 : volcano_data.condition_2,
                voldata : volcano_data.voldata
              }]
            });

          })
          .catch(function(e) {
            self.$elem.empty();
            self.$elem.append("ERROR : " + e);
          });
        }
        else {
          kbws.get_objects([{ref: self.ws_name + "/" + self.ws_id}], function (text) {
            self.renderPlot(text[0].data)
          }, function (text) {
            $container.empty();
            $container.append('<p>[Error] ' + data.error.message + '</p>');
          });
        }

        return this;
      },

      colorx : function (d, pv, fc) {

        var x = d.log2fc_f
        var y = d.log_q_value

        if ( Math.abs(x) > fc && Math.abs(y) > pv ) {
          if (true || d.significant  === 'yes'){
           return "red";
          }
        }
        return "grey";
      },

      renderPlot : function(text) {

        var self = this;

        var $container = this.$elem;

        $container.empty();

        var $tabPane = $.jqElem('div');
        $container.append($tabPane);

        var overviewTable = self.data('overview-table');


        self.counter=0;
        for (i=0; i < text.condition_pairs.length; i++){
          c1 = text.condition_pairs[i].condition_1
          c2 = text.condition_pairs[i].condition_2
          if (c1 === this.options.sample1 && c2 === this.options.sample2 || c1 === this.options.sample2 && c2 === this.options.sample1){
            self.counter = i
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
                        .attr('id', 'log_q_value')
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
              .css({margin : 'auto'})
              .append(
                $.jqElem('tr')
                  .append(
                    $.jqElem('td').append('Min -Log10(q-value)').append(
                    $.jqElem('input')
                      .attr('id', 'minY')
                      .addClass('form-control')
                      .on('change', function(e) {
                        self.options.ymin = parseFloat(e.target.value);
                        self.renderSVG();
                      })
                  ))
                  .append(
                    $.jqElem('td').append('Max -Log10(q-value)').append(
                    $.jqElem('input')
                      .addClass('form-control')
                      .attr('id', 'maxY')
                      .on('change', function(e) {
                        self.options.ymax = parseFloat(e.target.value);
                        self.renderSVG();
                      })
                  ))
                  .append(
                    $.jqElem('td').append('Min Log2(Fold Change)').append(
                    $.jqElem('input')
                      .attr('id', 'minX')
                      .addClass('form-control')
                      .on('change', function(e) {
                        self.options.xmin = parseFloat(e.target.value);
                        self.renderSVG();
                      })
                  ))
                  .append(
                    $.jqElem('td').append('Max Log2(Fold Change)').append(
                    $.jqElem('input')
                      .attr('id', 'maxX')
                      .addClass('form-control')
                      .on('change', function(e) {
                        self.options.xmax = parseFloat(e.target.value);
                        self.renderSVG();
                      })
                  ))
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
            .css('display', self.options.diffExprMatrixSet_ref ? '' : 'none')
            .css('text-align', 'right')
            .append(
              $.jqElem('button')
                .addClass('btn btn-primary')
                .on('click', function(e) {
                  var fc = self.data('fc').val() || 0;
                  var log_q_value = self.data('log_q_value').val() || 0;

                  Jupyter.narrative.addAndPopulateApp('FeatureSetUtils/upload_featureset_from_diff_expr', 'dev',
                    {
                      'diff_expression_ref' : self.diffExprMatrixSet_name,
                      'q_cutoff'            : parseFloat(parseFloat(log_q_value, 10).toPrecision(4), 10),
                      'fold_change_cutoff'  : parseFloat(parseFloat(fc, 10).toPrecision(4), 10)
                    });
                })
                .append('Export as feature set')
            )
          )
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
                      .append( $.jqElem('th').append('p-value'))
                      .append( $.jqElem('th').append('q-value'))
                      .append( $.jqElem('th').append('Log2(Fold Change) '))
                      .append( $.jqElem('th').append('-Log10(q-value)'))
                  )
              )
              .append(
                $.jqElem('tfoot')
                  .append(
                    $.jqElem('tr')
                      .append( $.jqElem('th').append('Gene'))
                      .append( $.jqElem('th').append('p-value'))
                      .append( $.jqElem('th').append('q-value'))
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
          dtable.rows.add(self.redRows).draw();
        });

        self.text = text;

        self.svgWidth  = 800;
        self.svgHeight = 350;
        self.padding   = 100;

        var svg = self.svg = d3.select(self.data('chart')[0])
          .append("svg")
          .attr("width", self.svgWidth)
          .attr("height", self.svgHeight);

        self.svg.append("text")
          .attr("class", "xlabel")
          .attr("text-anchor", "end")
          .attr("x", self.svgWidth/2)
          .attr("y", self.svgHeight-40)
          .text("Log2(Fold change)");

        self.svg.append("text")
          .attr("class", "ylabel")
          .attr("text-anchor", "end")
          .attr("y", 40)
          .attr("x", -self.svgHeight/2+50)
          .attr("transform", "rotate(-90)")
          .text("-Log10(q-value)");

        self.svg.append("g")
          .attr("class", "xaxis axis")
          .attr("transform", "translate(0," + (self.svgHeight - self.padding + 20) + ")");

        self.svg.append("g")
          .attr("class", "yaxis axis")
          .attr("transform", "translate(" + (self.padding-10) + ",0)");

        self.renderSVG();
    },

    renderSVG : function() {

        var self = this;
        var text = self.text;
        var counter = self.counter;
        var padding = self.padding;

        var svg = self.svg

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

        // add in the -log_q_values.
        var min_log_q_value = Number.MAX_VALUE;
        data.forEach( function(d) {
          if (d.q_value === 0) {
            d.log_q_value = 'MIN';
          }
          else {
            d.log_q_value = - Math.log10(parseFloat(d.q_value)).toFixed(2);
            if (d.log_q_value < min_log_q_value) {
              min_log_q_value = d.log_q_value;
            }
          }

          if (!!d.log2fc_f) {
            d.log2fc_f = d.log2fc_f.toFixed(2);
          }
        });

        data.forEach( function(d) {
          if (d.log_q_value === 'MIN') {
            d.log_q_value = min_log_q_value;
          }
        });
        self.data( "cond1").text(text.condition_pairs[counter].condition_1);
        self.data( "cond2").text(text.condition_pairs[counter].condition_2);

        // Filter NO_TEST data

        // name = gene
        // f = significant
        // x = log2fc_fa
        // y = log_q_value

        // tables contents
        // Gene
        // Locus
        // Value1
        // Value2
        // Log2fc
        // Pvalue
        // Qvalue

        // Range slider


        var xmin = this.options.xmin || d3.min(data, function(d) { return parseFloat(d.log2fc_f); });
        var xmax = this.options.xmax || d3.max(data, function(d) { return parseFloat(d.log2fc_f); });

        var ymin = this.options.ymin || d3.min(data, function(d) { return parseFloat(d.log_q_value); });
        var ymax = this.options.ymax || d3.max(data, function(d) { return parseFloat(d.log_q_value); });

        self.data('minX').val(xmin);
        self.data('maxX').val(xmax);
        self.data('minY').val(ymin);
        self.data('maxY').val(ymax);


        data = data.filter( function(d) {
          if (    !Number.isNaN(parseFloat(d.log2fc_f)) && !Number.isNaN(parseFloat(d.log_q_value))
               && d.log2fc_f    >= xmin && d.log2fc_f    <= xmax
               && d.log_q_value >= ymin && d.log_q_value <= ymax ) {
                return true;
          }
          else {
            return false;
          }
        });

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
          self.redRows = [];
          svg.selectAll("circle")
            .transition()
            .attr("fill", function(d) {
              var cc = self.colorx(d, pv, fc);
              if ( cc  ===  "red" ) {
                cnt = cnt + 1;
                self.redRows.push([
                    d.gene           || '',
                    //d.gene_function  || '',
                    d.p_value_f        || '',
                    d.q_value        || '',
                    d.log2fc_f       || '',
                    d.log_q_value    || '',
                ]);
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
          pv = self.data( 'log_q_value').val();
          self.data('selpval').text(parseFloat(pv).toFixed(2));

          var numCircles = svg.selectAll("circle").size();
          var seenCircles = 0;
          self.redRows = [];
          svg.selectAll("circle")
            .transition()
            .attr("fill", function(d) {
              var cc = self.colorx(d, pv, fc);
              if ( cc  ===  "red" ) {
                cnt = cnt + 1;
                self.redRows.push([
                    d.gene           || '',
                    //d.gene_function  || '',
                    d.p_value_f        || '',
                    d.q_value        || '',
                    d.log2fc_f       || '',
                    d.log_q_value    || '',
                ]);
              }
              return cc;
            }).each('end', function() {
              seenCircles++;
              if (numCircles  ===  seenCircles) {
                updateCnt();
              }
            });
        });

        self.data( 'log_q_value').slider({tooltip_position:'bottom', step:0.01, precision: 2, min :ymin, max:ymax.toFixed(2)}).on('slide',slider2Update);

        self.data( "fc").slider('setValue', fcmax.toFixed(2));
        self.data( 'log_q_value').slider('setValue', ymax.toFixed(2));
        self.data('selpval').text(ymax.toFixed(2));
        self.data('selfc').text(fcmax.toFixed(2));

        pv = self.data( 'log_q_value').slider('getValue');
        fc = self.data( "fc").slider('getValue');

        var xScale = d3.scale.linear()
          .domain([xmin,xmax])
          .range([padding, self.svgWidth - padding]);

        var yScale = d3.scale.linear()
          .domain([ymin, ymax])
          .range([self.svgHeight - padding, 10]);

        svg.selectAll("circle")
          .data(data)
          .enter()
          .append("svg:circle");
        svg.selectAll("circle")
          .data(data)
          .attr("cx", function(d) {
            return xScale(parseFloat(d.log2fc_f));
          })
        .attr("cy", function(d) {
          return yScale(parseFloat(d.log_q_value));
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

        svg.selectAll("circle")
          .data(data)
          .exit().remove();





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


        svg.selectAll('.xaxis')
          .call(xAxis);

        svg.selectAll('.yaxis')
          .call(yAxis);


      },


    });
  });
