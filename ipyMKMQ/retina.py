#!/usr/bin/env python

import IPython.core.display
import json, sys
import ipyTools

class Retina(object):
    """For creating javascript visualizations through the Retina library"""
    def __init__(self, action='none', debug=False):
        self.action = action
        self.debug  = debug
        self.rjs    = ipyTools.Ipy.RETINA_URL+'/js/'
        self.rlibs  = [ self.rjs+'bootstrap.min.js',
                        self.rjs+'config.js',
                        self.rjs+'stm.js',
                        self.rjs+'retina.js',
                        self.rjs+'ipy.js' ]
        self.renderer_resource = ipyTools.Ipy.RETINA_URL+"/renderers/"
        self.widget_resource = ipyTools.Ipy.RETINA_URL+"/widgets/"
        src = """
            (function(){
			    Retina.init( { library_resource: '"""+self.rjs+"""'});
			    Retina.add_renderer({"name": "graph", "resource": '"""+self.renderer_resource+"""', "filename": "renderer.graph.js"});
			    Retina.add_renderer({"name": "plot", "resource": '"""+self.renderer_resource+"""', "filename": "renderer.plot.js"});
			    Retina.add_renderer({"name": "paragraph", "resource": '"""+self.renderer_resource+"""', "filename": 'renderer.paragraph.js'});
			    Retina.add_renderer({"name": "table", "resource": '"""+self.renderer_resource+"""', "filename": 'renderer.table.js'});
			    Retina.add_renderer({"name": "heatmap", "resource": '"""+self.renderer_resource+"""', "filename": 'renderer.heatmap.js'});
			    Retina.add_renderer({"name": "boxplot", "resource": '"""+self.renderer_resource+"""', "filename": 'renderer.boxplot.js'});
			    Retina.add_renderer({"name": "deviationplot", "resource": '"""+self.renderer_resource+"""', "filename": 'renderer.deviationplot.js'});
			    Retina.add_renderer({"name": "listselect", "resource": '"""+self.renderer_resource+"""', "filename": 'renderer.listselect.js'});
				Retina.add_widget({"name": "metagenome_overview", "resource": '"""+self.widget_resource+"""', "filename": "widget.metagenome_overview.js"});
				Retina.add_widget({"name": "collection_overview", "resource": '"""+self.widget_resource+"""', "filename": "widget.collection_overview.js"});
			})();
		"""
        IPython.core.display.display_javascript(IPython.core.display.Javascript(data=src, lib=self.rlibs))
    
    def metagenome(self, view='summary_chart', annotation='organism', level='domain', source='Subsystems', kmer='abundance', widget=None, arg_list=False, target=None):
        """Displays Metagenome Overview Widget visualizations in given target based on given widget function and name."""
        if not widget:
            sys.stderr.write("Error: No metagenome widget name provided\n")
            return
        function, viz_type = '', ''        
        sub_ann = ''
        if annotation == 'organism':
            annotation = 'taxonomy'
            sub_ann = level
        elif annotation == 'function':
            annotation = 'ontology'
            sub_ann = source
        
        if view == 'summary_chart':
            function, viz_type = 'summary_piechart('+widget+'.index)', 'graph'
        elif view == 'summary_stats':
            function, viz_type = 'analysis_statistics('+widget+'.index)', 'paragraph'
        elif view == 'annotation_chart':
            function, viz_type = 'annotation_piechart('+widget+'.index, '+annotation+', '+sub_ann+')', 'graph'
        elif view == 'bp_histogram':
            function, viz_type = 'bp_areagraph('+widget+'.index)', 'graph'
        elif (view == 'drisee') or (view == 'kmer') or (view == 'rarefaction'):
            function, viz_type = 'mg_plot('+widget+'.index, "'+view+'", "'+kmer+'")', 'plot'
        elif view == 'rank_abundance':
            function, viz_type = 'taxon_linegraph('+widget+'.index, "'+level+'", 50)', 'graph'
        elif view == 'mixs':
            function, viz_type = 'mixs_metadata('+widget+'.index, true)', 'paragraph'
        elif view == 'metadata':
            function, viz_type = 'metadata_table('+widget+'.index)', 'table'
        else:
            sys.stderr.write("No visualization available for type '%s'\n"%view)
            return
        
        html = None
        if not target:
            target = 'mg_'+view+'_'+ipyTools.random_str()
        if arg_list:
            clean_obj = ""
            if viz_type == 'graph':
                clean_obj = target+".btype = "+target+".type; delete "+target+".type;"
            elif viz_type == 'table':
                clean_obj = target+".issorted = "+target+".sorted; delete "+target+".sorted; "
                clean_obj += target+".filtertypes = "+target+".filter; delete "+target+".filter;"
            src = """
			    (function(){
			        var """+target+""" = """+widget+"""."""+function+"""; """+clean_obj+"""
			        var ipy_cmd = JSON.stringify("""+target+""").replace("true", "True").replace("false", "False");
			        var new_idx = ipy.add_cell(undefined, 'code', 'above');
			        ipy.write_cell(new_idx, '"""+target+""" = '+ipy_cmd);
			        ipy.execute_cell(new_idx);
                })();
		    """
        else:
            html = "<div id='%s'></div>"%(target)
            src = """
			    (function(){
			        var """+target+""" = """+widget+"""."""+function+""";
			        """+target+""".target = document.getElementById('"""+target+"""');
				    Retina.load_renderer(\""""+viz_type+"""\").then( function () { 
				        Retina.Renderer.create('"""+viz_type+"""', """+target+""").render();
				    });
                })();
		    """
        if self.debug:
            print src
        else:
            if html:
                IPython.core.display.display_html(IPython.core.display.HTML(data=html))
            IPython.core.display.display_javascript(IPython.core.display.Javascript(data=src))
    
    def collection(self, view='summary_chart', annotation='organism', level='domain', source='Subsystems', kmer='abundance', widget=None, arg_list=False, target=None):
        """Displays Metagenome Collection Widget visualizations in given target based on given widget function and metagenome objects."""
        if not widget:
            sys.stderr.write("Error: No collection widget name provided\n")
            return
        function, viz_type = '', ''
        sub_ann = ''
        if annotation == 'organism':
            annotation = 'taxonomy'
            sub_ann = level
        elif annotation == 'function':
            annotation = 'ontology'
            sub_ann = source    

        if view == 'summary_chart':
            function, viz_type = 'summary_stackcolumn('+widget+'.index)', 'graph'
        elif view == 'annotation_chart':
            function, viz_type = 'annotation_barchart('+widget+'.index, "'+annotation+'", "'+sub_ann+'")', 'graph'
        elif (view == 'summary_stats') or (view == 'mixs') or (view == 'metadata'):
            function, viz_type = 'build_table('+widget+'.index, "'+view+'")', 'table'
        elif (view == 'drisee') or (view == 'kmer') or (view == 'rarefaction'):
            function, viz_type = 'mgs_plot('+widget+'.index, "'+view+'", "'+kmer+'")', 'plot'
        else:
            sys.stderr.write("No visualization available for type '%s'\n"%view)
            return
        
        html = None
        if not target:
            target = 'col_'+view+'_'+ipyTools.random_str()
        if arg_list:
            clean_obj = ""
            if viz_type == 'graph':
                clean_obj = target+".btype = "+target+".type; delete "+target+".type;"
            elif viz_type == 'table':
                clean_obj = target+".issorted = "+target+".sorted; delete "+target+".sorted; "
                clean_obj += target+".filtertypes = "+target+".filter; delete "+target+".filter;"
            src = """
			    (function(){
			        var """+target+""" = """+widget+"""."""+function+"""; """+clean_obj+"""
			        var ipy_cmd = JSON.stringify("""+target+""").replace(/true/g, "True").replace(/false/g, "False");
			        var new_idx = ipy.add_cell(undefined, 'code', 'above');
			        ipy.write_cell(new_idx, '"""+target+""" = '+ipy_cmd);
			        ipy.execute_cell(new_idx);
                })();
		    """
        else:
            html = "<div id='%s'></div>"%(target)
            src = """
			    (function(){
			        var """+target+""" = """+widget+"""."""+function+""";
			        """+target+""".target = document.getElementById('"""+target+"""');
				    Retina.load_renderer(\""""+viz_type+"""\").then( function () { 
				        Retina.Renderer.create('"""+viz_type+"""', """+target+""").render();
				    });
                })();
		    """
        if self.debug:
            print src
        else:
            if html:
                IPython.core.display.display_html(IPython.core.display.HTML(data=html))
            IPython.core.display.display_javascript(IPython.core.display.Javascript(data=src))
    
    def graph(self, width=800, height=400, btype="column", target="", data=None, title="", x_labels=[], x_title="", y_title="", show_legend=False, legend_position='left', title_color="black", x_title_color="black", y_title_color="black", x_labels_rotation="0", x_tick_interval=0, y_tick_interval=30, x_labeled_tick_interval=1, y_labeled_tick_interval=5, default_line_color="black", default_line_width=1, chartArea=None, legendArea=None, onclick=None):
        """Graph Renderer
  
  Displays a graph of pie / bar charts with an optional legend.
  
  Options
  
  btype (STRING)
      Defines the display type of the graph, can be one of
        pie
        column
        stackedColumn
        row
        stackedRow
        line
      Default is column.
  
  title (STRING)
      Title string written at the top of the graph
  
  title_color (CSS Color Value)
      Color of the title text. Default is black.
  
  x_title (STRING)
      Title written below the x-axis.
  
  y_title (STRING)
      Title written to the left of the y-axis.
  
  x_title_color (CSS Color Value)
      Color of the x-axis title string. Default is black.
  
  y_title_color (CSS Color Value)
      Color of the y-axis title string. Default is black.
  
  x_labels (ARRAY of STRING)
      List of the labels at the ticks of the x-axis.
  
  x_labels_rotation (STRING)
      A string representing the number of degrees to rotate the labels on the x-axis. Default is 0.
  
  y_labels (ARRAY of STRING)
      List of the labels at the ticks of the y-axis. If no list is passed will use the y-valus.
  
  x_tick_interval (INT)
      Determines how many ticks are actually drawn on the x-axis. Default is 0.
  
  y_tick_interval (INT)
      Determines how many ticks are actually drawn on the y-axis. Default is 30.
  
  x_labeled_tick_interval (INT)
      Determines which ticks on the x-axis get labels. Default is 1.
  
  y_labeled_tick_interval (INT)
      The number of y-axis ticks that get labels. Default is 5.
  
  default_line_color (CSS Color Value)
      Determines the color of lines if not specified for an individual line. Default is black.
  
  default_line_width (INT)
      Number of pixels lines should be wide if not specified for an individual line. Default is 1.
  
  show_legend (BOOLEAN)
      Turns the display of the legend on / off. Default ist true.
  
  legend_position (STRING)
      Can be one of
        left
        right
        top
        bottom
  
  chartArea (ARRAY of FLOAT)
     The values passed correspond to the left, top, width and height margin of the chart area respectively. The position is relative to the top left corner of the containing div. Values less than 1 are interpreted as fractions. Values greater than 1 are interpreted as absolute pixel values.
  
  legendArea (ARRAY of FLOAT)
      If this parameter is set, the legend_position parameter will not be used. Instead pass an array of floats. The values correspond to the left, top, right and bottom margin of the legend area respectively. The position is relative to the top left corner of the containing div. Values less than 1 are interpreted as fractions. Values greater than 1 are interpreted as absolute pixel values.
  
  width (INT)
      The width of the graph in pixel (including legend).
  
  height (INT)
      The height of the graph in pixel (including legend).
  
  data (ARRAY of OBJECT)
      List of data series. Each series has a name and a data attribute. The data attribute is a list of y-values for the series.
  
  onclick (FUNCTION)
      The passed function will be called when a bar / pie slice is clicked. It will receive an object with the attributes
        series - the name of the series this bar belongs to
        value  - the value of the bar
        label  - the label of the bar
        item   - the svg element that was clicked
        index  - the zero based index of this bar within its series
        series_index - the zero based index of this series
        """
        if not target:
            target = 'div_graph_'+ipyTools.random_str()
        html = "<div id='%s'></div>"%(target)
        IPython.core.display.display_html(IPython.core.display.HTML(data=html))
        if len(x_labels) == 0:
            x_labels = [""]
        if data is None:
            title = "Browser Usage"
            x_labels = "['2005','2006','2007','2008']"
            data = "Retina.RendererInstances.graph[0].exampleData()"
            onclick = "'clickedCell = '+ JSON.stringify(params)"
        else:
            data = json.dumps(data)
            x_labels = json.dumps(x_labels)

        opt = "width: %d, height: %d, type: '%s', target: document.getElementById('%s'), data: %s, title: '%s', x_labels: %s, x_title: '%s', y_title: '%s', show_legend: %s, legend_position: '%s', title_color: '%s', x_title_color: '%s', y_title_color: '%s', x_labels_rotation: '%s', x_tick_interval: %f, y_tick_interval: %f, x_labeled_tick_interval: %f, y_labeled_tick_interval: %f, default_line_color: '%s', default_line_width: %d"%(width, height, btype, target, data, title, x_labels, x_title, y_title, self._bool(show_legend), legend_position, title_color, x_title_color, y_title_color, x_labels_rotation, x_tick_interval, y_tick_interval, x_labeled_tick_interval, y_labeled_tick_interval, default_line_color, default_line_width)
        
        if chartArea:
            opt += ", chartArea: "+json.dumps(chartArea)
        if legendArea:
            opt += ", legendArea: "+json.dumps(legendArea)
        if onclick:
            onclick = ", onclick: function(params){ipy.write_cell(ipy.add_cell(),'"+onclick+"');}"
        else:
            onclick = ""
        
        src = """
			(function(){
				Retina.load_renderer("graph").then( function () { Retina.Renderer.create('graph', {""" + opt + onclick + """}).render(); });
            })();
		"""
        if self.debug:
            print src
        else:
            IPython.core.display.display_javascript(IPython.core.display.Javascript(data=src))

    def plot(self, width=800, height=400, target="", data=None, title="", chartArea=None, legendArea=None, show_legend=True, legend_position='right', connected=True, show_dots=True, x_min=0, x_max=100, y_min=0, y_max=100, x_title="", y_title="", x_titleOffset=35, y_titleOffset=45, titleOffset=0, y_scale='linear', x_scale='linear'):
    	"""  Plot Renderer

      Displays a two dimensional plot.

      Options

      title (STRING)
          Title string written at the top of the plot

      title_color (CSS Color Value)
          Color of the title text. Default is black.

      default_line_color (CSS Color Value)
          Determines the color of lines if not specified for an individual line. Default is black.

      default_line_width (INT)
          Number of pixels lines should be wide if not specified for an individual line. Default is 1.

      width (INT)
          The width of the graph in pixel (including legend).

      height (INT)
          The height of the graph in pixel (including legend).

      show_dots (BOOLEAN)
          display circles at the data points (for connected mode only)

      connected (BOOLEAN)
          connect the dots. This will disable the shape attribute of the series.

      data (OBJECT)
          'series' (ARRAY of OBJECT)
              'name' (STRING) - name of the series
    	      'color' (CSS Color value) - color of the series
    	      'shape' [ 'cicrle', 'triangle', 'square' ] - shape of the points (connected==false only)
          'points' (ARRAY of OBJECT)
              'x' (FLOAT) - x coordinate
    	      'y' (FLOAT) - y coordinate

      show_legend (BOOLEAN)
          Turns the display of the legend on / off. Default ist true.

      legend_position (STRING)
          Can be one of
            left
            right
            top
            bottom

      x_min (FLOAT)
          minimum x value

      y_min (FLOAT)
          minimum y value

      x_max (FLOAT)
          maximim x value

      y_max (FLOAT)
          maximum y value

      x_title (STRING)
          title of the x axis

      y_title (STRING)
          title of the y axis
    	"""
        if not target:
            target = 'div_plot_'+ipyTools.random_str()
        html = "<div id='%s'></div>"%(target)
        IPython.core.display.display_html(IPython.core.display.HTML(data=html))
        if data is None:
            title = "Sine"
            data = "Retina.RendererInstances.plot[0].exampleData()"
        else:
            data = json.dumps(data)
        
        opt = "width: %d, height: %d, target: document.getElementById('%s'), data: %s, title: '%s', show_legend: %s, legend_position: '%s', connected: %s, show_dots: %s, x_min: %f, x_max: %f, y_min: %f, y_max: %f, x_title: '%s', y_title: '%s', x_titleOffset: %f, y_titleOffset: %f, titleOffset: %f, x_scale: '%s', y_scale: '%s'"%(width, height, target, data, title, self._bool(show_legend), legend_position, self._bool(connected), self._bool(show_dots), x_min, x_max, y_min, y_max, x_title, y_title, x_titleOffset, y_titleOffset, titleOffset, x_scale, y_scale)
        
        if chartArea:
            opt += ", chartArea: "+json.dumps(chartArea)
        if legendArea:
            opt += ", legendArea: "+json.dumps(legendArea)        
        src = """
			(function(){
				Retina.load_renderer("plot").then( function () { Retina.Renderer.create('plot', {""" + opt + """}).render(); });
            })();
		"""
        if self.debug:
            print src
        else:
            IPython.core.display.display_javascript(IPython.core.display.Javascript(data=src))
    
    def paragraph(self, width='940', target="", data=None, title_color='black', header_color='black', text_color='black', raw=False):
        if not target:
            target = 'div_para_'+ipyTools.random_str()
        html = "<div id='%s'></div>"%(target)
        IPython.core.display.display_html(IPython.core.display.HTML(data=html))
        if data is None:
            data = "Retina.RendererInstances.paragraph[0].exampleData()"
        else:
            data = json.dumps(data)
        
        opt = "width: '%s', target: document.getElementById('%s'), data: %s, title_color: '%s', header_color: '%s', text_color: '%s', raw: %s"%(width, target, data, title_color, header_color, text_color, self._bool(raw))
        src = """
			(function(){
				Retina.load_renderer('paragraph').then( function () { Retina.Renderer.create('paragraph', {""" + opt + """} ).render(); } );
			})();
		"""
        if self.debug:
            print src
        else:
            IPython.core.display.display_javascript(IPython.core.display.Javascript(data=src))
    
    def table(self, width=None, height=None, target="", data=None, rows_per_page=20, sortcol=0, sortdir="asc", sorttype={}, sort_autodetect=True, filter_autodetect=True, filter_autodetect_select_max=10, issorted=False, offset=0, invisible_columns={}, disable_sort={}, filtertypes={}, hide_options=False, editable={}):
        """Table Renderer

          Displays a browsable, filterable table with clickable cells / rows.

          Options

          target (HTML Container Element)
              Element to render the table in.

          width (INT)
              Width of the table.

          height (INT)
              Height of the table.

          rows_per_page (INT)
              The maximum number of table rows to be displayed at a time. Default is 10.

          sortcol (INT)
              Zero based index of the row the table should be sorted by. Default is 0.

          sorted (BOOLEAN)
              Enables / disabled initial sorting of the table by the sortcol. Default is false.

          offset (INT)
              Initial first row to display. Default is 0.

          invisible_columns (HASH)
              Hash of column indices pointing at 1. Columns in this hash are not displayed.

          disable_sort (HASH)
              Hash of column indices pointing at 1. Columns in this hash can not be sorted.

          sorttype (HASH)
              Hash of column indices pointing at a sorttype. A sorttype can be either string or number.

          filter_autodetect (BOOLEAN)
              If set to false will try to detect which filter type is most appropriate for each column. Default is false.

          filter_autodetect_select_max (INT)
              Maximum number of distinct entries in a column that will still autodetec the column filter as a select box. Default is 10.

          sort_autodetect (BOOLEAN)
              If set to true will try to detect which sorttype is appropriate for each column. Default is false.

          filter (HASH)
              Hash of column indices pointing at filter objects. A filter object has the properties
                searchword - the current entry in the search field
                case_sensitive - boolean to turn on / off case sensitivity in filtering
                operator - list of operators available in this filter
                active_operator - selected operator
                type - text or select

          hide_options (BOOLEAN)
              Turns display of the options button on and off. Default is false (the option button is visible).

          onclick (FUNCTION)
              The function to be called when the table is clicked. This function will be passed the parameters (as an ordered list)
                clicked_row - array of contents of the cells of the clicked row
                clicked_cell - content of the clicked cell
                clicked_row_index - zero based index of the clicked row
                clicked_cell_index - zero based index of the clicked cell
        """
        if not target:
            target = 'div_table_'+ipyTools.random_str()
        html = "<div id='%s'></div>"%(target)
        IPython.core.display.display_html(IPython.core.display.HTML(data=html))
        if data is None:
            data = "Retina.RendererInstances.table[0].exampleData()"
        else:
            data = json.dumps(data)
        
        invisible_columns = json.dumps(invisible_columns)
        disable_sort = json.dumps(disable_sort)
        sorttype = json.dumps(sorttype)
        editable = json.dumps(editable)
        width  = "null" if width is None else str(width)
        height = "null" if height is None else str(height)
        
        opt = "target: document.getElementById('%s'), width: %s, height: %s, rows_per_page: %s, sortcol: %s, sorted: %s, offset: %s, invisible_columns: %s, disable_sort: %s, sortdir: '%s', sorttype: %s, filter_autodetect: %s, filter_autodetect_select_max: %s, sort_autodetect: %s, filter: %s, hide_options: %s, editable: %s, data: %s"%(target, width, height, rows_per_page, sortcol, self._bool(issorted), offset, invisible_columns, disable_sort, sortdir, sorttype, self._bool(filter_autodetect), filter_autodetect_select_max, self._bool(sort_autodetect), filtertypes, self._bool(hide_options), editable, data)
        src = """
            (function(){
                Retina.load_renderer('table').then( function () { Retina.Renderer.create('table', {""" + opt + """} ).render(); } );
            })();
        """
        if self.debug:
            print src
        else:
            IPython.core.display.display_javascript(IPython.core.display.Javascript(data=src))

    def heatmap(self, width=700, height=600, target="", data=None, tree_height=50, tree_width=50, legend_height=250, legend_width=250, row_text_size=15, col_text_size=15, min_cell_height=19, selectedRows=[], onclick=None):
        """Heatmap Renderer

          Displays a heatmap.

          Options

          width (int)
             Number of pixels the resulting image is wide. Default is 700

          height (int)
             Number of pixels the resulting image is high. This will be adjusted to at least rows * min_cell_height + legend and tree heights. Default is 600.

          tree_height (int)
             Number of pixels the dendogram tree for the columns is high. Default is 50.

          tree_width (int)
             Number of pixels the dendogram tree for the rows is wide. Default is 50.

          legend_height (int)
             Number of pixels for the column names. Default is 250.

          legend_width (int)
             Number of pixels for the row names. Default is 250.

          row_text_size (int)
             Number of pixels of the row text font size. Default is 15.

          col_text_size (int)
             Number of pixels of the column text font size. Default is 15.

          min_cell_height (int)
             Minimum number of pixels a row is high. This may cause the defined height of the resulting image to be overwritten. Default is 19.

          selectedRows (array of boolean)
             Returns an array that has a value of true for all row indices that are currently selected.

          data (object)
             columns (array of string)
                names of the columns
             rows (array of string)
                names of the rows
             colindex (array of int)
                1 based indices of the original column order. This converts the original order (columns) into the one ordered by distance.
             rowindex (array of int)
                1 based indices of the original row order. This converts the original order (rows) into the one ordered by distance.
             coldend (array of array of float)
                distance matrix for the columns
             rowdend
                distance matrix for the rows
             data (array of array of float)
                normalized value matrix
        """
        if not target:
            target = 'div_heatmap_'+ipyTools.random_str()
        html = '<div id="%s"></div>\n'%(target)
        rows = "['']"
        if data is None:
            data = "Retina.RendererInstances.heatmap[0].exampleData()"
        else:
            rows = json.dumps(data['rows']).replace('"', "'")
            data = json.dumps(data)
        
        selectedRows = json.dumps(selectedRows)
        hname = 'heatmap_'+ipyTools.random_str()
        opt = "width: %d, height: %d, target: document.getElementById('%s'), data: %s, selectedRows: %s, tree_height: %d, tree_width: %d, legend_height: %d, legend_width: %d, row_text_size: %d, col_text_size: %d, min_cell_height: %d"%(width, height, target, data, selectedRows, tree_height, tree_width, legend_height, legend_width, row_text_size, col_text_size, min_cell_height)
        src = """
            (function(){
                Retina.load_renderer('heatmap').then( function () {
                    window."""+hname+""" = Retina.Renderer.create('heatmap', {""" + opt + """} );
                    window."""+hname+""".render();
                });
            })();
        """
        if onclick:
            click_func = """
            var sel_rows  = window."""+hname+""".selectedRows();
            var row_names = """+rows+""";
            var sel_names = [];
            for (var i=0; i<row_names.length; i++) {
                if (sel_rows[i]) {
                    sel_names.push(row_names[i]);
                }
            }
            ipy.write_cell(ipy.add_cell(),'"""+onclick+"');"
        if onclick:
            html += '<button type="button" onclick="'+click_func.replace('"', '\\\"')+'">sub-select rows</button>'
        IPython.core.display.display_html(IPython.core.display.HTML(data=html))
        if self.debug:
            print html, src
        else:
            IPython.core.display.display_javascript(IPython.core.display.Javascript(data=src))

    def deviationplot(self, target="", width=400, height=80, data=None):
        if not target:
            target = 'div_devplot_'+ipyTools.random_str()
	    html = "<div id='%s'></div>"%(target)
        IPython.core.display.display_html(IPython.core.display.HTML(data=html))
        if data is None:
            data = "Retina.RendererInstances.deviationplot[0].exampleData()"
        else:
            data = json.dumps(data)
        
	    opt = "target: document.getElementById('%s'), width: %d, height: %d, data: %s"%(target, width, height, data)
	    src = """
              (function(){
                  Retina.load_renderer('deviationplot').then( function () { Retina.Renderer.create('deviationplot', {""" + opt + """} ).render(); } );
              })();
        """
        if self.debug:
            print src
        else:
            IPython.core.display.display_javascript(IPython.core.display.Javascript(data=src))

    def boxplot(self, target="", width=300, height=300, data=None):
        if not target:
            target = 'div_boxplot_'+ipyTools.random_str()
        html = "<div id='%s'></div>"%(target)
        IPython.core.display.display_html(IPython.core.display.HTML(data=html))
        if data is None:
            data = "Retina.RendererInstances.boxplot[0].exampleData()"
        else:
            data = json.dumps(data)
        
        opt = "target: document.getElementById('%s'), width: %d, height: %d, data: %s"%(target, width, height, data)
        src = """
              (function(){
                  Retina.load_renderer('boxplot').then( function () { Retina.Renderer.create('boxplot', {""" + opt + """} ).render(); } );
              })();
        """
        if self.debug:
            print src
        else:
            IPython.core.display.display_javascript(IPython.core.display.Javascript(data=src))
    
    def _bool(self, aBool):
        if aBool:
            return 'true'
        else:
            return 'false'
