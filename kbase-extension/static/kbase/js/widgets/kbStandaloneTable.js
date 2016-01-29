/*
  Table Renderer

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

  editable (HASH of BOOLEAN)
      The key of the hash is the column index. If set to true, clicking a cell in this column will display an input field allowing to change the content of the cell.

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

  edit_callback (FUNCTION)
      The function to be called when a cell is edited. This function is passed the table data. It is organised as a list of hashes with each column name pointing at the value of the cell.

  synchronous (BOOLEAN)
      This is true by default. If set to false, the table expects its data to be set, filtered and browsed externally. It will issue a callback to the navigation callback function on any of those events, expecting an external data update.

  navigation_callback (FUNCTION)
      The function to be called when a navigation / filter action is issued and the table is in asynchronous state (synchronous set to false). It will be passed either a string ("previous", "next", "first", "last") or an object that can contain one of the following structures:
        sort: { sort: $fieldname, dir: [ "asc" | "desc" ] }
        query: [ { searchword: $filter_value, field: $column_name_to_search, comparison: $comparison_operator }, ... ]
        goto: $row_index
        limit: $number_of_rows_per_page
    
*/
(function () {
    var root = this;
    var standaloneTable = root.standaloneTable = {
	about: {
	    name: "table",
	    title: "Table",
            author: "Tobias Paczian",
            version: "1.0",
            requires: [],
            defaults: {
		'width': null,
		'height': null,
		'rows_per_page': 10,
		'sortcol': 0,
		'sorted': false,
		'offset': 0,
		'invisible_columns' : {},
		'disable_sort': {},
		'sortdir': 'asc',
		'sorttype': {},
		'filter_autodetect': false,
		'filter_autodetect_select_max': 10,
		'sort_autodetect': false,
		'filter': {},
		'hide_options': false,
		'filter_changed': false,
		'editable': {},
		'edit_callback': null,
		'navigation_callback': null,
		'navigation_url': null,
		'target': 'table_space',
		'synchronous': true,
		'query_type': 'infix',
		'asynch_column_mapping': null
	    },
	  options: [
	      { general:
		[
		    { name: 'editable', type: 'bool', description: "can cell data be edited?",
		      title: "editable" },
		    { name: 'filter_autodetect', type: 'bool', description: "should all columns have an auto detected filter?",
		      title: "filter autodetection" },
		]
	      },
	      { layout:
		[
		    { name: 'width', type: 'int', description: "width of the table in pixel", title: "width" },
		    { name: 'height', type: 'int', description: "height of the table in pixel", title: "height" },
		    { name: 'rows_per_page', type: 'int', description: "number of rows diplayed per page", title: "rows per page" },
		]
	      }
	  ]
      },

	create: function (params) {
	    var renderer = this;
	    if (! window.hasOwnProperty('rendererTable')) {
		window.rendererTable = [];
	    }
	    var instance = { settings: {},
			     index: params.index };
	    jQuery.extend(true, instance, renderer);
	    jQuery.extend(true, instance.settings, renderer.about.defaults, params);
	    window.rendererTable.push(instance);

	    return instance;
	},

	importDataFromDiv: function (index, id) {
	    var renderer = rendererTable[index];
	    renderer.settings.data = JSON.parse(document.getElementById(id).innerHTML);
	},

	exampleData: function () {
	    return {
		data: [ ["a1", "b1", "c1"],
			["a3", "b2", "c2"],
			["a4", "b3", "c3"],
			["a2", "b4", "c4"],
			["a1", "b1", "c1"],
			["a3", "b2", "c2"],
			["a4", "b3", "c3"],
			["a2", "b4", "c4"],
			["a1", "b1", "c1"],
			["a3", "b2", "c2"],
			["a4", "b3", "c3"],
			["a2", "b4", "c4"],
			["a1", "b3", "c1"],
			["a3", "b2", "c2"],
			["a4", "b3", "c3"],
			["a2", "b4", "c4"],
			["a5", "b5", "c5"] ],
		header: ["column A", "column B", "column C"]
	    };
        },
	update_visible_columns: function (index) {
	    var renderer = rendererTable[index];

	    var t = document.getElementById('table_colsel_table_'+index);
	    var r = t.firstChild.childNodes;
	    var inv = {};
	    for (var i=0;i<r.length;i++) {
		if (! r[i].firstChild.firstChild.checked) {
		    inv[i] = 1;
		}
	    }
	    renderer.settings.invisible_columns = inv;
	    renderer.render(index);
	},
	render: function (index) {
	    var renderer = rendererTable[index];
	    
	    renderer.settings.target.innerHTML = "";
	    if (renderer.settings.synchronous == false) {
		renderer.settings.target.innerHTML = '<div style="position: absolute; width: 100%; height: 100%; opacity: 0.7; background-color: white; display: none;"></div>';
	    }
	    
	    // check if we have a header, otherwise interpret the first line as the header
	    if (renderer.settings.data.length) {
		renderer.settings.data = { header: renderer.settings.data[0], data: renderer.settings.data };
		renderer.settings.data.data.shift();
	    }
	    
	    // if a header has already been initialized, don't touch it again
	    var header;
	    if (renderer.settings.header) {
		header = renderer.settings.header;
	    } else {
		header = renderer.settings.data.header;
		if (!renderer.settings.data.header) {
		    header = renderer.settings.data.data.shift();
		}
		renderer.settings.header = header;
		renderer.settings.data.header = null;
	    }
	    
	    // check if we have already parsed the data
	    var tdata = [];
	    if (renderer.settings.tdata) {
		tdata = renderer.settings.tdata;
	    } else {
		
		// the data has not been parsed, do it now
		for (var i=0;i<renderer.settings.data.data.length; i++) {
		    tdata[tdata.length] = {};
		    for (var h=0;h<renderer.settings.data.data[i].length;h++) {
			tdata[tdata.length - 1][header[h]] = renderer.settings.data.data[i][h] || "";
		    }
		}
		renderer.settings.tdata = tdata;
		renderer.settings.data.data = null;
	    }
	    
	    // if we are to auto determine sort functions, do so
	    if (renderer.settings.sort_autodetect) {
		for (var i=0; i<header.length; i++) {
		    if (!renderer.settings.sorttype[i]) {
			if (! tdata[0] || typeof(tdata[0][header[i]].replace) != 'function') {
			    renderer.settings.sorttype[i] = "number";
			} else {
			    var testval = tdata[0][header[i]].replace(/<(.|\n)*?>/g, "");
			    if (isNaN(parseFloat(testval))) {
				renderer.settings.sorttype[i] = "string";
			    } else {
				renderer.settings.sorttype[i] = "number";
			    }
			}
		    }
		}
	    }
	    
	    // create filter elements
	    var filter = renderer.settings.filter;
	    var filter_present = false;
	    for (var i in filter) {
		if (filter.hasOwnProperty(i)) {
		    if (filter[i].hasOwnProperty('searchword') && filter[i].searchword.length > 0) {
			filter_present = true;
			break;
		    }
		}
	    }

	    // check for data filtering
	    if (filter_present && renderer.settings.synchronous) {
		var newdata = [];
		if (renderer.settings.filter_changed) {
		    renderer.settings.offset = 0;
		    for (var i in filter) {
			var re;
			if (filter[i].case_sensitive) {
			    re = new RegExp(filter[i].searchword);
			} else {
			    re = new RegExp(filter[i].searchword, "i");
			}
			filter[i].re = re;
			if (typeof(filter[i].searchword) != "undefined" && filter[i].searchword.length > 0 &&filter[i].operator && filter[i].operator[filter[i].active_operator] == "><") {
			    filter[i].minmax = filter[i].searchword.split(",");
			    if (filter[i].minmax.length != 2) {
				alert("'"+filter[i].searchword + "' is not a valid inclusive range.\nRanges must be noted as the minimum\nand the maximum range, separated by ','\ni.e. '-2.1, 5.2'");
				filter[i].searchword = "";
			    }
			}
		    }
		    var htmlFilter = new RegExp("<.+?>", "ig");
		    for (var h=0; h<tdata.length; h++) {
			var pass = 1;
			for (var i in filter) {
			    var word = tdata[h][header[i]] + "";
			    if (! filter[i].keepHTML) {
				word = word.replace(htmlFilter, "");
			    }
			    if (typeof(filter[i].searchword) != "undefined" && filter[i].searchword.length > 0) {
				if (filter[i].operator) {
				    switch (filter[i].operator[filter[i].active_operator]) {
				    case "=":
					if (word != filter[i].searchword) {
					    pass = 0;
					}
					break;
				    case ">":
					if (parseFloat(word) <= parseFloat(filter[i].searchword)) {
					    pass = 0;
					}
					break;
				    case "<":
					if (parseFloat(word) >= parseFloat(filter[i].searchword)) {
					    pass = 0;
					}
					break;				      
				    case "><":
					if (parseFloat(word) > parseFloat(filter[i].minmax[1]) || parseFloat(word) < parseFloat(filter[i].minmax[0])) {
					    pass = 0;
					}
					break;
				    }
				} else {
				    if (! word.match(filter[i].re)) {
					pass = 0;
				    }
				}
				if (pass == 0) {
				    break;
				}
			    }
			}
			if (pass) {
			    newdata.push(tdata[h]);
			}
		    }
		} else {
		    newdata = renderer.settings.filtered_data;
		}
		renderer.settings.filter_changed = false;
		renderer.settings.filtered_data = newdata;
		tdata = newdata;
	    }
	    
	    // initialize the options
	    var offset = renderer.settings.offset;
	    var rows = (renderer.settings.rows_per_page < 0) ? tdata.length : renderer.settings.rows_per_page;
	    var sortcol = renderer.settings.sortcol;
	    var sortdir = renderer.settings.sortdir;
	    var sorttype = renderer.settings.sorttype;
	    var target = renderer.settings.target;
	    	    
	    // check width and height
	    var defined_width = "";
	    if (renderer.settings.width) {
		defined_width = "width: " + renderer.settings.width + "px; ";
	    }
	    var defined_height = "";
	    if (renderer.settings.height) {
		defined_height = "height: " + renderer.settings.height + "px; ";
	    }
	    
	    // create the actual table header
	    var table_element = document.createElement("table");
	    table_element.setAttribute("class", "table table-striped table-bordered table-condensed");
	    table_element.setAttribute("style", "margin-bottom: 2px; margin-top: 7px;");
	    var thead = document.createElement("thead");
	    var tr = document.createElement("tr");
	    tr.setAttribute('style', 'height: 30px; border-top: 1px solid lightgray;');
	    for (var i=0;i<header.length;i++) {
		
		// check if this column is visible
		if (! renderer.settings.invisible_columns[i]) {
		    
		    // create sorting elements
		    var asc = document.createElement("i");
		    asc.setAttribute("class", "fa fa-chevron-down");
		    asc.setAttribute("title", "sort ascending");
		    var desc = document.createElement("i");
		    desc.setAttribute("class", "fa fa-chevron-up");
		    desc.setAttribute("title", "sort descending");
		    if (i == sortcol) {
			if (sortdir=='asc') {
			    asc.setAttribute("class", "fa fa-chevron-circle-down");
			    asc.setAttribute("title", "current sorting: ascending");
			    asc.setAttribute("style", "padding-left: 1px");
			    desc.setAttribute("style", "cursor: pointer;");
			    desc.i = i;
			    desc.index = index;
			    desc.onclick = function () {
				var index = this.index;
				var renderer = rendererTable[index];
				renderer.settings.sortcol = this.i;
				renderer.settings.sortdir = 'desc';
				if (typeof renderer.settings.navigation_callback == "function") {
				    renderer.settings.navigation_callback({'sort': renderer.settings.header[this.i] , 'dir': 'desc'}, index);
				} else {
				    renderer.settings.sorted = false;
				    renderer.render(index);
				}
			    }
			} else {
			    desc.setAttribute("class", "fa fa-chevron-circle-up");
			    desc.setAttribute("title", "current sorting: descending");
			    desc.setAttribute("style", "padding-left: 1px");
			    asc.setAttribute("style", "cursor: pointer;");
			    asc.i = i;
			    asc.index = index;
			    asc.onclick = function () {
				var index = this.index;
				var renderer = rendererTable[index];
				renderer.settings.sortcol = this.i;
				renderer.settings.sortdir = 'asc';
				if (typeof renderer.settings.navigation_callback == "function") {
				    renderer.settings.navigation_callback({'sort': renderer.settings.header[this.i] , 'dir': 'asc'}, index);
				} else {
				    renderer.settings.sorted = false;
				    renderer.render(index);
				}
			    }
			}
		    } else {
			asc.setAttribute("style", "cursor: pointer;");
			asc.i = i;
			asc.index = index;
			asc.onclick = function () {
			    var index = this.index;
			    var renderer = rendererTable[index];
			    renderer.settings.sortcol = this.i;
			    renderer.settings.sortdir = 'asc';
			    if (typeof renderer.settings.navigation_callback == "function") {
				renderer.settings.navigation_callback({'sort': renderer.settings.header[this.i] , 'dir': 'asc'}, index);
			    } else {
				renderer.settings.sorted = false;
				renderer.render(index);
			    }
			}
			desc.setAttribute("style", "cursor: pointer;");
			desc.i = i;
			desc.index = index;
			desc.onclick = function () {
			    var index = this.index;
			    var renderer = rendererTable[index];
			    renderer.settings.sortcol = this.i;
			    renderer.settings.sortdir = 'desc';
			    if (typeof renderer.settings.navigation_callback == "function") {
				renderer.settings.navigation_callback({'sort': renderer.settings.header[this.i] , 'dir': 'desc'}, index);
			    } else {
				renderer.settings.sorted = false;
				renderer.render(index);
			    }
			}
		    }
		    
		    // check for filter autodetection
		    if (renderer.settings.filter_autodetect) {
			if (! renderer.settings.filter[i]) {
			    renderer.settings.filter[i] = { type: "text" };
			    if (renderer.settings.sorttype[i] == "number") {
				renderer.settings.filter[i].operator = [ "=", "<", ">", "><" ];
				renderer.settings.filter[i].active_operator = 0;
			    }
			    var selopts = [];
			    var numopts = 0;
			    for (var h=0;h<tdata.length;h++) {				  
				if (! selopts[tdata[h][header[i]]]) {
				    numopts++;
				}
				selopts[tdata[h][header[i]]] = 1;
			    }
			    if (numopts <= renderer.settings.filter_autodetect_select_max) {
				renderer.settings.filter[i].type = "select";
			    }
			}
		    }
		    
		    // create filter element
		    if (renderer.settings.filter[i]) {
			if (! renderer.settings.filter[i].searchword) {
			    renderer.settings.filter[i].searchword = "";
			}
			var filter_elem;
			if (renderer.settings.filter[i].type == "text") {
			    
			    var filter_text  = document.createElement("input");
			    filter_text.setAttribute('type', 'text');
			    filter_text.value = filter[i].searchword;
			    filter_text.setAttribute("style", "margin-bottom: 0px; margin-top: 2px; height: 16px; width: 100px; display: none; position: absolute; z-index: 100;");
			    filter_text.i = i;
			    filter_text.index = index;
			    filter_text.onkeypress = function (e) {
				var index = this.index;
				var renderer = rendererTable[index];
				e = e || window.event;
				if (e.keyCode == 13) {
				    renderer.settings.filter[this.i].searchword = this.value;
				    if (typeof renderer.settings.navigation_callback == "function") {
					var query = [];
					for (var x in renderer.settings.filter) {
					    if (renderer.settings.filter.hasOwnProperty(x) && renderer.settings.filter[x].hasOwnProperty('searchword')) {
						if (renderer.settings.filter[x].searchword.length > 0) {
						    query.push( { "searchword": renderer.settings.filter[x].searchword, "field": renderer.settings.header[x], "comparison": renderer.settings.filter[x].operator || "=" } );
						}
					    }
					}
					renderer.settings.navigation_callback( { "query": query }, index );
				    } else {
					renderer.settings.filter_changed = true;
					renderer.render(index);
				    }
				}
			    };
			    
			    if (renderer.settings.filter[i].operator) {
				filter_elem = document.createElement("div");
				filter_elem.setAttribute("style", "float: left; margin-bottom: 0px; display: none; position: absolute; margin-top: 2px; height: 16px; z-index: 100;");
				filter_elem.className = "input-prepend";
				var operator_span = document.createElement("span");
				operator_span.setAttribute("style", "cursor: pointer; height: 16px;");
				operator_span.i = i;
				operator_span.index = index;
				operator_span.onclick = function () {
				    var index = this.index;
				    var renderer = rendererTable[index];
				    for (var x=0; x< this.childNodes.length; x++) {
					if (this.childNodes[x].style.display == "") {
					    this.childNodes[x].style.display = "none";
					    if (x == this.childNodes.length - 1) {
						this.childNodes[0].style.display = "";
						renderer.settings.filter[this.i].active_operator = 0;
					    } else {
						this.childNodes[x + 1].style.display = "";
						x++;
						renderer.settings.filter[this.i].active_operator = x;
					    }
					}
				    }
				}
				operator_span.className = "add-on";
				for (var h=0; h<renderer.settings.filter[i].operator.length; h++) {
				    var operator = document.createElement("span");
				    operator.innerHTML = renderer.settings.filter[i].operator[h];
				    if (h==renderer.settings.filter[i].active_operator) {
					operator.setAttribute("style", "font-weight: bold; height: 16px;");
				    } else {
					operator.setAttribute("style", "display: none; font-weight: bold; height: 16px;");
				    }
				    operator.setAttribute("title", "click to switch filter operator");
				    operator_span.appendChild(operator);
				}
				filter_text.setAttribute("style", "position: relative; left: -3px; width: 80px; height: 16px;");
				filter_elem.appendChild(operator_span);
				filter_elem.appendChild(filter_text);
			    } else {
				filter_elem = filter_text;
			    }
			    
			} else if (renderer.settings.filter[i].type == "select") {
			    filter_elem = document.createElement("select");
			    filter_elem.setAttribute("style", "position: absolute; height: 26px; margin-bottom: 0px; margin-top: 2px; z-index: 100; display: none;");
			    filter_elem.add(new Option("-show all-", ""), null);
			    var selopts = [];
			    for (var h=0;h<tdata.length;h++) {
				if (tdata[h][header[i]].length) {
				    selopts[tdata[h][header[i]]] = 1;
				}
			    }
			    for (var h in selopts) {
				if (typeof selopts[h] != "function") {
				    if (h == renderer.settings.filter[i].searchword) {
					filter_elem.add(new Option(h,h, true), null);
				    } else {
					filter_elem.add(new Option(h,h), null);
				    }
				}
			    }
			    filter_elem.i = i;
			    filter_elem.index = index;
			    filter_elem.onchange = function () {
				var index = this.index;
				var renderer = rendererTable[index];
				renderer.settings.filter[this.i].searchword = this.options[this.selectedIndex].value;
				renderer.settings.filter_changed = true;
				renderer.render(index);
			    }
			    if (filter_elem.options.length == 1) {
				filter_elem = document.createElement('span');
			    }
			}  else if (renderer.settings.filter[i].type == "premade-select") {
			    filter_elem = document.createElement("select");
			    filter_elem.setAttribute("style", "position: absolute; height: 26px; margin-bottom: 0px; margin-top: 2px; z-index: 100; display: none;");
			    for (var ind=0; ind<renderer.settings.filter[i].options.length; ind++) {
				if (renderer.settings.filter[i].options[ind].value == renderer.settings.filter[i].searchword) {
				    filter_elem.add(new Option(renderer.settings.filter[i].options[ind].text, renderer.settings.filter[i].options[ind].value, true), null);
				} else {
				    filter_elem.add(new Option(renderer.settings.filter[i].options[ind].text, renderer.settings.filter[i].options[ind].value), null);
				}
			    }
			    filter_elem.i = i;
			    filter_elem.index = index;
			    filter_elem.onchange = function () {
				var index = this.index;
				var renderer = rendererTable[index];
				renderer.settings.filter[this.i].searchword = this.options[this.selectedIndex].value;
				if (typeof renderer.settings.navigation_callback == "function") {
				    var query = [];
				    for (var x in renderer.settings.filter) {
					if (renderer.settings.filter.hasOwnProperty(x) && renderer.settings.filter[x].hasOwnProperty('searchword')) {
					    if (renderer.settings.filter[x].searchword.length > 0) {
						query.push( { "searchword": renderer.settings.filter[x].searchword, "field": renderer.settings.header[x], "comparison": renderer.settings.filter[x].operator || "=" } );
					    }
					}
				    }
				    renderer.settings.navigation_callback( { "query": query }, index );
				} else {
				    renderer.settings.filter_changed = true;
				    renderer.render(index);
				}
			    }
			    if (filter_elem.options.length == 1) {
				filter_elem = document.createElement('span');
			    }
			}
		    }
		    
		    // build header cell
		    var caret = document.createElement("table");
		    caret.setAttribute("style", "float: right; margin: 0px; border: none;");
		    var caret_tr1 = document.createElement("tr");
		    caret_tr1.setAttribute("style", "border: none;");
		    var caret_td1 = document.createElement("td");
		    caret_td1.setAttribute("style", "padding: 0px 2px; line-height: 0px; border: none;");
		    var caret_tr2 = document.createElement("tr");
		    caret_tr2.setAttribute("style", "border: none;");
		    var caret_td2 = document.createElement("td");
		    caret_td2.setAttribute("style", "padding: 0px 2px; line-height: 0px; border: none;");
		    caret_td1.appendChild(desc);
		    caret_td2.appendChild(asc);
		    caret_tr1.appendChild(caret_td1);
		    caret_tr2.appendChild(caret_td2);
		    caret.appendChild(caret_tr1);
		    caret.appendChild(caret_tr2);
		    var th = document.createElement("th");
		    var mw = 1;
		    if (renderer.settings.minwidths && renderer.settings.minwidths[i]) {
			mw = renderer.settings.minwidths[i];
		    }
		    th.setAttribute("style", "padding: 0px; padding-left: 4px; min-width: "+mw+"px;");
		    var th_div = document.createElement("div");
		    th_div.setAttribute("style", "float: left; position: relative; height: 25px;");
		    th_div.innerHTML = header[i];
		    th.appendChild(th_div);
		    if (! renderer.settings.disable_sort[i]) {
			th.appendChild(caret);
			th_div.style.top = "4px";
		    }
		    if (filter[i]) {
			var filter_icon = document.createElement("i");
			filter_icon.className = "fa fa-search";
			var is_active = "";
			if (filter[i].searchword) {
			    is_active = " border: 1px solid blue;";
			    filter_icon.setAttribute("title", "filtered for: '"+filter[i].searchword+"'");
			}
			var pos = "3";
			if (! renderer.settings.disable_sort[i]) {
			    pos = "7";
			}
			filter_icon.setAttribute("style", "float: right; position: relative; top: "+pos+"px; cursor: pointer; right: 2px;"+is_active);
			filter_icon.onclick = function () {
			    if (this.nextSibling.style.display == "") {
				this.nextSibling.style.display = "none";
				this.parentNode.firstChild.style.display = "";
			    } else {
				this.nextSibling.style.display = "";
				this.parentNode.firstChild.style.display = "none";
			    }
			}			  
			th.appendChild(filter_icon);
			th.appendChild(filter_elem);
		    }
		    tr.appendChild(th);
		}
	    }
	    thead.appendChild(tr);
	    table_element.appendChild(thead);
	    var tinner_elem = document.createElement("tbody");
	    
	    // check if the data is sorted, otherwise sort now
	    var disp;
	    if (renderer.settings.sorted) {
		disp = tdata;
	    } else {
		disp = tdata.sort(function (a,b) {		      
		    if (sortdir == 'desc') {
			var c = a; a=b; b=c;
		    }
		    if (sorttype[sortcol]) {
			switch (sorttype[sortcol]) {
			case "number":
			    if ((typeof(a[header[sortcol]].replace) != 'function') || (typeof(b[header[sortcol]].replace) != 'function')) {
				if (a[header[sortcol]]==b[header[sortcol]]) return 0;
				if (a[header[sortcol]]<b[header[sortcol]]) return -1;
			    } else {
				if (parseFloat(a[header[sortcol]].replace(/<(.|\n)*?>/g, ""))==parseFloat(b[header[sortcol]].replace(/<(.|\n)*?>/g, ""))) return 0;
				if (parseFloat(a[header[sortcol]].replace(/<(.|\n)*?>/g, ""))<parseFloat(b[header[sortcol]].replace(/<(.|\n)*?>/g, ""))) return -1;
			    }
			    return 1;
			    break;
			case "string":
			    if (a[header[sortcol]].replace(/<(.|\n)*?>/g, "")==b[header[sortcol]].replace(/<(.|\n)*?>/g, "")) return 0;
			    if (a[header[sortcol]].replace(/<(.|\n)*?>/g, "")<b[header[sortcol]].replace(/<(.|\n)*?>/g, "")) return -1;
			    return 1;
			    break;
			}
		    } else {
			if ((typeof(a[header[sortcol]].replace) != 'function') || (typeof(b[header[sortcol]].replace) != 'function')) {
			    if (a[header[sortcol]]==b[header[sortcol]]) return 0;
			    if (a[header[sortcol]]<b[header[sortcol]]) return -1;
			    return 1;
			} else {
			    if (a[header[sortcol]].replace(/<(.|\n)*?>/g, "")==b[header[sortcol]].replace(/<(.|\n)*?>/g, "")) return 0;
			    if (a[header[sortcol]].replace(/<(.|\n)*?>/g, "")<b[header[sortcol]].replace(/<(.|\n)*?>/g, "")) return -1;
			    return 1;
			}
		    }
		});
		renderer.settings.sorted = true;
	    }
	    
	    // select the part of the data that will be displayed
	    if (renderer.settings.synchronous) {
		disp = disp.slice(offset, offset+rows);
	    }
	    
	    // create the table rows
	    for (var i=0;i<disp.length;i++) {
		var tinner_row = document.createElement("tr");
		for (var h=0; h<header.length; h++) {
		    if (! renderer.settings.invisible_columns[h]) {
			var tinner_cell = document.createElement("td");
			tinner_cell.innerHTML = disp[i][header[h]];
			if (renderer.settings.editable[h]) {
			    tinner_cell.index = index;
			    tinner_cell.addEventListener('click', function(e) {
				var index = this.index;
				e = e || window.event;
				var ot = e.originalTarget || e.srcElement;
				var clicked_row_index;
				var clicked_cell_index;
				for (var x=0;x<ot.parentNode.children.length;x++) {
				    if (ot.parentNode.children[x] == ot) {
					clicked_cell_index = x;
				    }				      
				}
				for (var y=0;y<ot.parentNode.parentNode.children.length;y++) {
				    if (ot.parentNode.parentNode.children[y] == ot.parentNode) {
					clicked_row_index = y + offset;
					break;
				    }
				}
				
				var edit = document.createElement('input');
				edit.setAttribute('type', 'text');
				edit.setAttribute('value', renderer.settings.tdata[clicked_row_index][header[clicked_cell_index]]);
				edit.index = index;
				edit.addEventListener('keypress', function(e) {
				    var index = this.index;
				    var renderer = rendererTable[index];
				    e = e || window.event;
				    if (e.keyCode == 13) {
					renderer.settings.tdata[clicked_row_index][header[clicked_cell_index]] = edit.value;
					if (renderer.settings.edit_callback && typeof(renderer.settings.edit_callback) == 'function') {
					    renderer.settings.edit_callback.call(renderer.settings.tdata);
					}
					renderer.render(index);
				    }
				});
				edit.index = index;
				edit.addEventListener('blur', function() {
				    var index = this.index;
				    var renderer = rendererTable[index];
				    renderer.render(index);
				});
				ot.innerHTML = "";
				ot.appendChild(edit);
				edit.focus();
				if (typeof edit.selectionStart == "number") {
				    edit.selectionStart = 0;
				    edit.selectionEnd = edit.value.length;
				} else if (typeof document.selection != "undefined") {
				    document.selection.createRange().text = edit.value;
				}
			    });
			}
			tinner_row.appendChild(tinner_cell);
		    }
		}
		tinner_elem.appendChild(tinner_row);
	    }
	    
	    // render the table
	    table_element.appendChild(tinner_elem);
	    
	    // create the navigation
	    // first, previous
	    var prev_td = document.createElement("td");
	    prev_td.setAttribute("style", "text-align: left; width: 45px; border: none;");
	    prev_td.innerHTML = "&nbsp;";
	    if (offset > 0) {
		var first = document.createElement("i");
		first.setAttribute("class", "fa fa-fast-backward");
		first.setAttribute("title", "first");
		first.setAttribute("style", "cursor: pointer;");
		first.index = index;
		first.onclick = typeof renderer.settings.navigation_callback == "function" ? function () { var index = this.index; var renderer = rendererTable[index]; renderer.settings.navigation_callback('first', index); } : function () {
		    var index = this.index;
		    var renderer = rendererTable[index];
		    renderer.settings.offset = 0;
		    renderer.render(index);
		}
		var prev = document.createElement("i");
		prev.setAttribute("class", "fa fa-backward");
		prev.setAttribute("title", "previous");
		prev.setAttribute("style", "cursor: pointer; margin-left: 5px;");
		prev.index = index;
		prev.onclick = typeof renderer.settings.navigation_callback == "function" ? function () { var index = this.index; var renderer = rendererTable[index]; renderer.settings.navigation_callback('previous', index); } : function () {
		    var index = this.index;
		    var renderer = rendererTable[index];
		    renderer.settings.offset -= rows;
		    if (renderer.settings.offset < 0) {
			renderer.settings.offset = 0;
		    }
		    renderer.render(index);
		}
		prev_td.appendChild(first);
		prev_td.appendChild(prev);
	    }
	    
	    // next, last
	    var next_td = document.createElement("td");
	    next_td.setAttribute("style", "text-align: right; width: 45px; border: none;");
	    next_td.innerHTML = "&nbsp;";
	    if (offset + rows < (renderer.settings.numrows || tdata.length)) {
		var last = document.createElement("i");
		last.setAttribute("class", "fa fa-fast-forward");
		last.setAttribute("title", "last");
		last.setAttribute("style", "cursor: pointer;");
		last.index = index;
		last.onclick = typeof renderer.settings.navigation_callback == "function" ? function () { var index = this.index; var renderer = rendererTable[index]; renderer.settings.navigation_callback('last', index); } : function () {
		    var index = this.index;
		    var renderer = rendererTable[index];
		    renderer.settings.offset = tdata.length - rows;
		    if (renderer.settings.offset < 0) {
			renderer.settings.offset = 0;
		    }
		    renderer.render(index);
		}
		var next = document.createElement("i");
		next.setAttribute("class", "fa fa-forward");
		next.setAttribute("title", "next");
		next.setAttribute("style", "cursor: pointer; margin-right: 5px;");
		next.index = index;
		next.onclick = typeof renderer.settings.navigation_callback == "function" ? function () { var index = this.index; var renderer = rendererTable[index]; renderer.settings.navigation_callback('next', index); } : function () {
		    var index = this.index;
		    var renderer = rendererTable[index];
		    renderer.settings.offset += rows;
		    if (renderer.settings.offset > tdata.length - 1) {
			renderer.settings.offset = tdata.length - rows;
			if (renderer.settings.offset < 0) {
			    renderer.settings.offset = 0;
			}
		    }
		    renderer.render(index);
		}
		next_td.appendChild(next);
		next_td.appendChild(last);
	    }
	    
	    // display of window offset
	    var showing = document.createElement("td");
	    showing.setAttribute("style", "text-align: center; border: none;");	  
	    showing.innerHTML = "showing rows "+ ((renderer.settings.offset || offset) + 1) +"-"+(disp.length + (renderer.settings.offset || offset))+" of "+(renderer.settings.numrows || tdata.length);
	    
	    // create the table to host navigation
	    var bottom_table = document.createElement("table");
	    bottom_table.setAttribute("style", "width: 100%; border: none;");
	    var bottom_row = document.createElement("tr");
	    bottom_row.setAttribute("style", "border: none;");
	    bottom_row.appendChild(prev_td);
	    bottom_row.appendChild(showing);
	    bottom_row.appendChild(next_td);
	    bottom_table.appendChild(bottom_row);
	    
	    // goto
	    var goto_label = document.createElement("span");
	    goto_label.innerHTML = "goto row ";
	    var goto_text = document.createElement("input");
	    goto_text.setAttribute("value", offset + 1);
	    goto_text.setAttribute("type", "text");
	    goto_text.setAttribute("style", "width: 30px; border: 1px solid lightgray; border-radius: 3px;");
	    goto_text.index = index;
	    goto_text.onkeypress = function (e) {
		var index = this.index;
		var renderer = rendererTable[index];
		e = e || window.event;
		if (e.keyCode == 13) {
		    if (typeof renderer.settings.navigation_callback == "function") {
			renderer.settings.navigation_callback({'goto': parseInt(this.value) - 1 }, index);
		    } else {
			renderer.settings.offset = parseInt(this.value) - 1;
			if (renderer.settings.offset < 0) {
			    renderer.settings.offset = 0;
			}
			if (renderer.settings.offset > rows) {
			    renderer.settings.offset = rows;
			}
			renderer.render(index);
		    }
		}
	    };
	    
	    // clear filter button
	    var clear_btn = document.createElement("input");
	    clear_btn.setAttribute("type", "button");
	    clear_btn.setAttribute("class", "btn btn-xs btn-default");
	    clear_btn.setAttribute("value", "clear all filters");
	    clear_btn.style.marginLeft = "10px";
	    clear_btn.index = index;
	    clear_btn.onclick = function () {
		var index = this.index;
		var renderer = rendererTable[index];
		renderer.settings.filter_changed = true;
		for (var i in renderer.settings.filter) {
		    renderer.settings.filter[i].searchword = "";
		}
		if (typeof renderer.settings.navigation_callback == "function") {
		    renderer.settings.navigation_callback({"goto": 0, "query": renderer.settings.default_query || null, "sort": renderer.settings.default_sort || null }, index);
	        } else {
		    renderer.settings.sorted = false;
		    renderer.render(index);
	        }
	    };
	    
	    // rows per page
	    var perpage = document.createElement("input");
	    perpage.setAttribute("type", "text");
	    perpage.setAttribute("value", rows);
	    perpage.setAttribute("style", "width: 30px; border: 1px solid lightgray; border-radius: 3px;");
	    perpage.index = index;
	    perpage.onkeypress = function (e) {
		var index = this.index;
		var renderer = rendererTable[index];
		e = e || window.event;
		if (e.keyCode == 13) {
		    if (typeof renderer.settings.navigation_callback == "function") {
			renderer.settings.navigation_callback({'limit': parseInt(this.value) }, index);
		    } else {
			renderer.settings.offset = 0;
			renderer.settings.rows_per_page = parseInt(this.value);
			renderer.render(index);
		    }
		}
	    };
	    var ppspan1 = document.createElement("span");
	    ppspan1.innerHTML = " show ";
	    var ppspan2 = document.createElement("span");
	    ppspan2.innerHTML = " rows at a time";
	    
	    // handle onclick event
	    if (renderer.settings.onclick) {
		table_element.index = index;
		table_element.onclick = function (e) {
		    var index = this.index;
		    var renderer = rendererTable[index];
		    e = e || window.event;
		    var ot = e.originalTarget || e.srcElement;
		    if (ot.nodeName == "TD") {
			var clicked_row = [];
			var clicked_row_index;
			var clicked_cell_index;
			for (var x=0;x<ot.parentNode.children.length;x++) {
			    if (ot.parentNode.children[x] == ot) {
				clicked_cell_index = x;
			    }
			    clicked_row.push(ot.parentNode.children[x].innerHTML);
			}
			for (var y=0;y<ot.parentNode.parentNode.children.length;y++) {
			    if (ot.parentNode.parentNode.children[y] == ot.parentNode) {
				clicked_row_index = y + offset;
				break;
			    }
			}
			var clicked_cell = ot.innerHTML;
			renderer.settings.onclick(clicked_row, clicked_cell, clicked_row_index, clicked_cell_index);
		    }
		};
	    }
	    
	    var col_sel_span = document.createElement("span");
	    var col_sel_btn = document.createElement("input");
	    col_sel_btn.setAttribute("class", "btn btn-xs btn-default");
	    col_sel_btn.setAttribute("type", "button");
	    col_sel_btn.setAttribute("value", "select columns");
	    var col_sel = document.createElement("div");
	    col_sel.setAttribute('style', "position: absolute; left: 528px; min-width: 150px; border: 1px solid #BBB; background-color: white; z-index: 99000; display: none; box-shadow: 4px 4px 4px #666; padding: 2px;");
	    col_sel_btn.addEventListener("click", function () {
		
		if (col_sel.style.display == "none") {
		    col_sel.style.display = "";
		} else {
		    col_sel.style.display = "none";
		}
	    });
	    var colsel_html = "<input type='button' class='btn btn-xs btn-default' style='float: right;' value='OK' onclick='rendererTable["+index+"].update_visible_columns("+index+");'><table id='table_colsel_table_"+index+"' style='border: none;'>";
	    for (var ii=0;ii<renderer.settings.header.length;ii++) {
		var checked = " checked";
		if (renderer.settings.invisible_columns[ii]) {
		    checked = "";
		}
		colsel_html += "<tr style='border: none;'><td style='border: none;'><input style='margin-right: 5px;' type='checkbox'"+checked+"></td><td style='border: none;'>"+renderer.settings.header[ii]+"</td></tr>";
	    }
	    colsel_html += "</table>";
	    col_sel.innerHTML = colsel_html;
	    col_sel_span.appendChild(col_sel_btn);
	    col_sel_span.appendChild(col_sel);
	    
	    var options_icon = document.createElement("div");
	    options_icon.innerHTML = "<i class='fa fa-cog'></i>";
	    options_icon.title ='table options, click to show';
	    options_icon.className = "btn btn-xs btn-default";
	    options_icon.setAttribute("style", "cursor: pointer;");
	    options_icon.onclick = function () {
		this.nextSibling.style.display = "";
		this.style.display = "none";
	    }
	    var options_span = document.createElement("div");
	    options_span.setAttribute('style', "display: none;");
	    options_span.innerHTML = "<div title='close options' onclick='this.parentNode.previousSibling.style.display=\"\";this.parentNode.style.display=\"none\";' style='cursor: pointer; margin-right: 5px;' class='btn btn-xs btn-default'><i class='fa fa-times'></div>";
	    
	    // append navigation to target element
	    if (renderer.settings.hide_options == false) {
		target.appendChild(options_icon);
		target.appendChild(options_span);
		options_span.appendChild(goto_label);
		options_span.appendChild(goto_text);
		options_span.appendChild(clear_btn);
		options_span.appendChild(ppspan1);
		options_span.appendChild(perpage);
		options_span.appendChild(ppspan2);
		options_span.appendChild(col_sel_span);
	    }
	    target.appendChild(table_element);
	    target.appendChild(bottom_table);	  
	    
	    return renderer;
	}
    }
}).call(this);
