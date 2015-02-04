/* 
   Listselect Renderer

   Provides a select list that allows the selection of one or multiple data items that can be filtered by their attributes. The attribute to be filtered will be displayed as the label in the selection list. Filters can be chained by pressing the enter key in the filter box.

   Options:

   target (HTML Container Element)
      Element to render in.

   data (ARRAY of objects)
      The data to display.

   multiple (BOOLEAN)
      If set to false, displays a single select vs a multi select. Default is false.

   no_button (BOOLEAN)
      If set to true, does not display submit button (callback triggers on change event). Default is false.

   rows (INT)
      The number of rows to display in the select list. Default is 10.

   sort (BOOLEAN)
      Setting this to true will automatically sort the lists by the currently selected filter. Default is false.

   filter (ARRAY of STRING)
      An ordered list of attribute names that are attributes of the objects passed in data that the selection list may be filtered by

   filter_value (STRING)
      Initial value of the filter. Default is an empty string.

   filter_attribute (STRING)
      Initial attribute to be displayed and filtered by. Default is the first element in the filter list.

   no_filter (BOOLEAN)
      If set to true, hides the filter. Default is false.

   result_field (BOOLEAN)
      If set to true, shows a text input field to name the result. Default is false.

   result_field_default (STRING)
      Default string to put into the result field. Default is an empty string.

   result_field_placeholder (STRING)
      Placeholder text for the result field. Default is "selection name".

   select_name (STRING)
      Name attribute of the result listselect. Default is "selection".

   select_id (STRING)
      ID attribute of the result listselect. Default is "selection".

   value (STRING)
      The attribute of the data objects to be used as the value of the select options.

   callback (FUNCTION)
      The function to be called when the submit button is pressed. This function will pass the values of the selected option(s).

   selection (HASH of STRING)
      Hash of values pointing to 1. The inital selection in the result box. The values must be attribute values of the data object attribute selected as the value attribute of the selection list.

   button (OBJECT)
      This allows setting of the class, style, text and icon attributes of the button, i.e. { class: 'btn btn-error', style: 'border: 1px dotted black;', icon: '<i class="icon-ok icon-white"></i>', text: 'search' }

   synchronous (BOOLEAN)
      This is true by default. If set to false, the listselect expects its data to be set, filtered and browsed externally. It will issue a callback to the navigation callback function on any of those events, expecting an external data update.

   navigation_callback (FUNCTION)
      The function to be called when a navigation / filter action is issued and the listselect is in asynchronous state (synchronous set to false). It will be passed either a string ("more", "reset") or an object that can contain one of the following structures:
        query: [ { searchword: $filter_value, field: $column_name_to_search, comparison: $comparison_operator }, ... ]
        limit: $number_of_rows_per_page

   asynch_limit (INTEGER)
      The number of items initially loaded in asynchronous mode, default is 100.

   asynch_filter_min_length (INTEGER)
      The number of characters that need to be entered into the filter before the filter callback is performed. Default is 3.

   asynch_keystroke_threshold (INTEGER)
      The number of miliseconds in between keystrokes the navigation callback method will wait for new keystrokes before sending the full request. Default is 1000 (one second).
*/
(function () {
    var root = this;
    var standaloneListselect = root.standaloneListselect = {
	about: {
	    name: "listselect",
	    title: "List Select",
            author: "Tobias Paczian",
            version: "1.0",
            requires: [],
            defaults: {
		'rows': 10,
		'filter': [],
		'filter_value': '',
		'filter_type': 'substring',
		'filter_attribute': null,
		'filtered_data': [],
		'selection_data': [],
		'select_name': "selection",
		'select_id': "selection",
		'filter_breadcrumbs': [],
		'result_field': false,
		'result_field_default': '',
		'result_field_placeholder': 'selection name',
		'selection': {},
		'data': [],
		'target': null,
		'sort': false,
		'multiple': false, 
		'no_button': false,
		'no_filter': false,
		'extra_wide': false,
		'synchronous': true,
		'navigation_callback': null,
		'navigation_url': null,
		'asynch_limit': 100,
		'asynch_keystroke_threshold': 1000,
		'asynch_filter_min_length': 3,
		'return_object': false,
		'style': "" }
	},

	exampleData: function () {
	    return { };
        },

	create: function (params) {
	    var renderer = this;
	    if (! window.hasOwnProperty('rendererListselect')) {
		window.rendererListselect = [];
	    }
	    var instance = { settings: {},
			     index: params.index };
	    jQuery.extend(true, instance, renderer);
	    jQuery.extend(true, instance.settings, renderer.about.defaults, params);
	    window.rendererListselect.push(instance);

	    return instance;
	},

	render: function (index) {
	    var renderer = rendererListselect[index];
	    
	    if (renderer.settings.navigation_url) {
		renderer.settings.navigation_callback = renderer.update_data;
	    }

	    // get the target div
	    var target = renderer.settings.target;
	    var tstyle = 'background-image: linear-gradient(to bottom, #FAFAFA, #F2F2F2); background-repeat: repeat-x; border: 1px solid #D4D4D4; border-radius: 4px 4px 4px 4px; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.067); padding-left: 10px; padding-top: 10px; width: ';
	    if (renderer.settings.multiple) {
		tstyle += renderer.settings.extra_wide ? '1010px;' : '600px;';
	    } else if (renderer.settings.no_button) {
		tstyle += '256px;';
	    } else {
	        tstyle += '426px;';
	    }
	    target.setAttribute('style', tstyle+renderer.settings.style);
	    target.innerHTML = "";

	    // initialize filter attribute
	    if (renderer.settings.filter_attribute == null) {
		renderer.settings.filter_attribute = renderer.settings.filter[0];
	    }

	    // get the selection list
	    var selection_list = document.createElement('select');
	    if (typeof renderer.settings.navigation_callback == "function") {
		selection_list.addEventListener('scroll', function(event) {
		    event = event || window.event;
		    if (event.target.scrollTop == event.target.scrollTopMax) {
			rendererListselect[index].settings.scroll_position = event.target.scrollTop;
			rendererListselect[index].settings.navigation_callback("more", index);
		    }
		});
	    }
	    if (renderer.settings.extra_wide) {
		selection_list.setAttribute('style', 'width: 415px');
	    }
	    if (renderer.settings.multiple) {
		selection_list.setAttribute('multiple', '');
	    }
	    selection_list.setAttribute('size', renderer.settings.rows);
	    renderer.redrawSelection(selection_list, index);

	    // create a filter box
	    var filter = document.createElement('div');
	    var filter_grp = document.createElement('div');
	    filter_grp.setAttribute('class', 'input-append');
	    var filter_input = document.createElement('input');
	    filter_input.setAttribute('type', 'text');
	    filter_input.setAttribute('style', renderer.settings.extra_wide ? 'width: 205px;' : 'width: 122px;');
	    filter_input.setAttribute('placeholder', 'Enter filter');
	    filter_input.setAttribute('value', renderer.settings.filter_value);
	    filter_input.addEventListener('keyup', function (event) {
		if (event.keyCode == 13) {
		    rendererListselect[index].addBreadcrumb(index);
		    return;
		}
		rendererListselect[index].settings.filter_value = filter_input.value;
		if (rendererListselect[index].settings.synchronous) {
		    rendererListselect[index].redrawSelection(selection_list, index);
		} else {
		    if (filter_input.value.length >= rendererListselect[index].settings.asynch_filter_min_length) {
			rendererListselect[index].typing = new Date().getTime();
			window.setTimeout("rendererListselect["+index+"].check_threshold("+index+")", rendererListselect[index].settings.asynch_keystroke_threshold);
		    }
		}
	    });
	    var filter_surround = document.createElement('div');
	    filter_surround.setAttribute('class', 'btn-group');
	    var filter_select = document.createElement('button');
	    filter_select.setAttribute('class', 'btn dropdown-toggle');
	    filter_select.setAttribute('style', (renderer.settings.extra_wide ? 'width: 210px;' : 'width: 85px;') + ' text-align: right;');
	    filter_select.setAttribute('data-toggle', 'dropdown');
	    filter_select.innerHTML = renderer.settings.filter_attribute + ' <span class="caret"></span>';
	    var filter_list = document.createElement('ul');
	    filter_list.setAttribute('class', 'dropdown-menu');
	    filter_list.setAttribute('style', renderer.settings.extra_wide ? 'max-height: 200px; overflow: auto;' : 'max-height: 200px; overflow: auto;');
	    var filter_string = '';
	    for (var i=0; i<renderer.settings.filter.length; i++) {
		filter_string += '<li><a onclick="rendererListselect['+renderer.index+'].settings.filter_value=\'\';rendererListselect['+renderer.index+'].settings.filter_attribute=this.innerHTML.slice(0, -1);rendererListselect['+renderer.index+'].render('+renderer.index+');" style="cursor: pointer;">'+renderer.settings.filter[i]+' </a></li>';
	    }
	    filter_list.innerHTML = filter_string;
	    filter_grp.appendChild(filter_input);
	    filter_surround.appendChild(filter_select);
	    filter_surround.appendChild(filter_list);
	    filter_grp.appendChild(filter_surround);
	    filter.appendChild(filter_grp);

	    // create the filter breadcrumbs
	    var filter_breadcrumbs = document.createElement('div');
	    filter_breadcrumbs.setAttribute('style', 'font-size: 9px; position: relative; top: -5px;');
	    for (var i=0;i<renderer.settings.filter_breadcrumbs.length;i++) {
		var bc_button = document.createElement('button');
		bc_button.setAttribute('class', "btn btn-mini");
		bc_button.setAttribute('style', "margin-right: 3px;");
		bc_button.setAttribute('title', "remove filter");
		bc_button.setAttribute('name', i);
		bc_button.innerHTML = renderer.settings.filter_breadcrumbs[i][0]+": "+renderer.settings.filter_breadcrumbs[i][1]+' <span style="font-size: 11px; color: gray;">x</span>';
		bc_button.addEventListener('click', function (event) {
		    rendererListselect[index].removeBreadcrumb(this, index);
		});
		filter_breadcrumbs.appendChild(bc_button);
	    }

	    // check for multi-select vs single select
	    if (renderer.settings.multiple) {
	    
		// create the result list
		var result_list = document.createElement('select');
		result_list.setAttribute('multiple', '');
		result_list.setAttribute('style', 'width: 415px');
		result_list.setAttribute('size', renderer.settings.rows);
		result_list.setAttribute('name', renderer.settings.select_name);
		result_list.setAttribute('id', renderer.settings.select_id);
		renderer.redrawResultlist(result_list, index);
		
		// create the action buttons
		var button_span = document.createElement('span');
		button_span.setAttribute('style', "position: relative; bottom: 100px;");
		var button_left = document.createElement('a');
		button_left.setAttribute('class', 'btn btn-small btn-default');
		button_left.setAttribute('style', 'position: relative; left: 36px; top: 40px;');
		button_left.innerHTML = '<i class="fa fa-chevron-left"></i>';
		button_left.addEventListener('click', function () {
		    for (var x=0; x<result_list.options.length; x++) {
			if (result_list.options[x].selected) {
			    for (var y=0;y<rendererListselect[index].settings.selection_data.length;y++) {
				if (rendererListselect[index].settings.selection_data[y][rendererListselect[index].settings.value] == result_list.options[x].value) {
				    rendererListselect[index].settings.selection_data.splice(y,1);
				    break;
				}
			    }

			    delete rendererListselect[index].settings.selection[result_list.options[x].value];			
			}
		    }
		    rendererListselect[index].redrawResultlist(result_list, index);
		    rendererListselect[index].redrawSelection(selection_list, index);
		});
		var button_right = document.createElement('a');
		button_right.setAttribute('class', 'btn btn-small btn-default');
		button_right.setAttribute('style', 'position: relative; right: 36px; bottom: 40px;');
		button_right.innerHTML = '<i class="fa fa-chevron-right"></i>';
		button_right.addEventListener('click', function () {
		    for (var x=0; x<selection_list.options.length; x++) {
			if (selection_list.options[x].selected) {
			    rendererListselect[index].settings.selection[selection_list.options[x].value] = 1;
			    for (var y=0;y<rendererListselect[index].settings.data.length;y++) {
				if (rendererListselect[index].settings.data[y][rendererListselect[index].settings.value] == selection_list.options[x].value) {
				    rendererListselect[index].settings.selection_data.push(rendererListselect[index].settings.data[y]);
				    break;
				}
			    }
			}
		    }
		    rendererListselect[index].redrawResultlist(result_list, index);
		    rendererListselect[index].redrawSelection(selection_list, index);
		});
		var button_x = document.createElement('a');
		button_x.setAttribute('class', 'btn btn-small btn-default');
		button_x.innerHTML = '<i class="fa fa-times"></i>';
		button_x.addEventListener('click', function () {
		    rendererListselect[index].settings.selection = {};
		    rendererListselect[index].settings.selection_data = [];
		    rendererListselect[index].redrawResultlist(result_list, index);
		    rendererListselect[index].redrawSelection(selection_list, index);
		});
		button_span.appendChild(button_left);
		button_span.appendChild(button_x);
		button_span.appendChild(button_right);

		// check for a result field
		if (renderer.settings.result_field) {
		    var resultField = document.createElement('input');
		    resultField.setAttribute('type', 'text');
		    resultField.setAttribute('placeholder', renderer.settings.result_field_placeholder);
		    resultField.value = renderer.settings.result_field_default;
		    resultField.setAttribute('style', 'margin-left: 110px;');
		    resultField.setAttribute('id', 'listselect'+index+'selectionname');
		    filter_surround.appendChild(resultField);
		}
	    }

	    // create the submit button
	    var submit_button = document.createElement('a');
	    submit_button.setAttribute('class', (renderer.settings.button && renderer.settings.button.class) ? renderer.settings.button.class : 'btn btn-small btn-success');
	    submit_button.setAttribute('id', 'listselect_submit_button'+index);
	    submit_button.setAttribute('style', (renderer.settings.button && renderer.settings.button.style) ? renderer.settings.button.style : 'margin-left: 8px; margin-bottom: 8px;');
	    submit_button.innerHTML = ((renderer.settings.button && renderer.settings.button.text) ? renderer.settings.button.text : '') + ( (renderer.settings.button && renderer.settings.button.icon) ? renderer.settings.button.icon : '<i class="fa fa-check"></i>');
	    if (typeof(renderer.settings.callback) == 'function') {
	        var index = renderer.index;
		if (renderer.settings.multiple) {
		    submit_button.addEventListener('click', function () {
			var selection_result = [];
			if (renderer.settings.return_object) {
			    for (var x=0; x<result_list.options.length; x++) {
			        for (var y=0; y<renderer.settings.data.length; y++) {
                                    if (result_list.options[x].value == renderer.settings.data[y][renderer.settings.value]) {
					selection_result.push(renderer.settings.data[y]);
					break;
                                    }
				}
		            }
			} else {
			    for (var x=0; x<result_list.options.length; x++) {
				selection_result.push(result_list.options[x].value);
		            }
			}
			var selection_name = document.getElementById('listselect'+index+'selectionname') ? document.getElementById('listselect'+index+'selectionname').value : "";
			rendererListselect[index].settings.callback(selection_result, selection_name);
		    });
		} else if (renderer.settings.no_button) {
		    selection_list.addEventListener('change', function () {
		        var selection_result;
		        if (renderer.settings.return_object) {
			    for (var x=0; x<renderer.settings.data.length; x++) {
				if (selection_list.options[selection_list.selectedIndex].value == renderer.settings.data[x][renderer.settings.value]) {
				    selection_result = renderer.settings.data[x];
				    break;
				}
			    }
	                } else {
			    selection_result = selection_list.options[selection_list.selectedIndex].value;
	                }
			var selection_name = document.getElementById('listselect'+index+'selectionname') ? document.getElementById('listselect'+index+'selectionname').value : "";
			rendererListselect[index].settings.callback(selection_result, selection_name);
		    });
		} else {
		    submit_button.addEventListener('click', function () {
			var selection_result;
		        if (renderer.settings.return_object) {
			    for (var x=0; x<renderer.settings.data.length; x++) {
				if (selection_list.options[selection_list.selectedIndex].value == renderer.settings.data[x][renderer.settings.value]) {
				    selection_result = renderer.settings.data[x];
				    break;
				}
			    }
	                } else {
			    selection_result = selection_list.options[selection_list.selectedIndex].value;
	                }
			var selection_name = document.getElementById('listselect'+index+'selectionname') ? document.getElementById('listselect'+index+'selectionname').value : "";
	                rendererListselect[index].settings.callback(selection_result, selection_name);
		    });
	        }
            }
	    
	    // build the output
	    if (! renderer.settings.no_filter) {
		target.appendChild(filter);
	    }
	    target.appendChild(filter_breadcrumbs);
	    target.appendChild(selection_list);
	    selection_list.scrollTop = rendererListselect[index].settings.scroll_position || 0;
	    if (renderer.settings.multiple) {
		target.appendChild(button_span);
		target.appendChild(result_list);
		if (! renderer.settings.no_button) {
		    target.appendChild(submit_button);
		}
	    } else if (! renderer.settings.no_button) {
	        target.appendChild(submit_button);
	    }
	    filter_input.focus();
	    filter_input.selectionStart = filter_input.value.length;
	    filter_input.selectionEnd = filter_input.value.length;
	},
	// add a breadcrumb to the list
	addBreadcrumb: function (index) {
	    var renderer = rendererListselect[index];
	    if (renderer.settings.filter_value != "") {
		renderer.settings.filter_breadcrumbs.push([renderer.settings.filter_attribute, renderer.settings.filter_value]);
		renderer.settings.filter_value = "";
		if (renderer.settings.synchronous) {
		    renderer.render(index);
		} else {
		    renderer.update(index);
		}
	    }
	},
	// remove a breadcrumb from the list
	removeBreadcrumb: function (button, index) {
	    var renderer = rendererListselect[index];
	    renderer.settings.filter_breadcrumbs.splice(button.name, 1);
	    renderer.settings.filter_value = '';
	    if (renderer.settings.synchronous) {
		renderer.render(index);
	    } else {
		renderer.update(index);
	    }
	},
	// redraw the result list (right)
	redrawResultlist: function (result_list, index) {  
	    var renderer = rendererListselect[index];
	    var result_list_array = [];
	    for (var i=0; i<renderer.settings.selection_data.length; i++) {
		result_list_array.push( [ renderer.settings.selection_data[i][renderer.settings.value], '<option value="'+renderer.settings.selection_data[i][renderer.settings.value]+'" title="'+renderer.settings.selection_data[i][renderer.settings.filter_attribute]+'">'+renderer.settings.selection_data[i][renderer.settings.filter_attribute]+'</option>'] );
	    }
	    if (renderer.settings.sort) {
		result_list_array.sort(renderer.listsort);
	    }
	    var result_list_string = "";
	    for (var i=0; i<result_list_array.length; i++) {
		result_list_string += result_list_array[i][1];
	    }
	    result_list.innerHTML = result_list_string;
	},
	// redraw the selection list (left)
	redrawSelection: function (selection_list, index) {
	    var renderer = rendererListselect[index];

	    // initialize the filter
	    renderer.settings.filtered_data = renderer.settings.data;

	    // apply all filter breadcrumbs
	    for (var i=0; i<renderer.settings.filter_breadcrumbs.length; i++) {
		renderer.settings.filtered_data = renderer.filter({ data: renderer.settings.filtered_data, value: renderer.settings.filter_breadcrumbs[i][1], type: renderer.settings.filter_type, attribute: renderer.settings.filter_breadcrumbs[i][0] }, index);
	    }
	    
	    // filter the list with the current filter
	    renderer.settings.filtered_data = renderer.filter({ data: renderer.settings.filtered_data, value: renderer.settings.filter_value, type: renderer.settings.filter_type, attribute: renderer.settings.filter_attribute }, index);
	    
	    // sort the list
	    if (renderer.settings.sort) {
		renderer.settings.filtered_data.sort(renderer.objectsort);
	    }
	    
	    // create the selection list
	    var settings_string = "";
	    for (var i=0; i<renderer.settings.filtered_data.length; i++) {
		if (! renderer.settings.selection[renderer.settings.filtered_data[i][renderer.settings.value]]) {
		    settings_string += '<option value="'+renderer.settings.filtered_data[i][renderer.settings.value]+'" title="'+renderer.settings.filtered_data[i][renderer.settings.filter_attribute]+'">'+renderer.settings.filtered_data[i][renderer.settings.filter_attribute]+'</option>';
		}
	    }
	    selection_list.innerHTML = settings_string;

	    return;
	},

	check_threshold: function(index) {
	    var threshold = new Date().getTime();
	    if (rendererListselect[index].typing + rendererListselect[index].settings.asynch_keystroke_threshold < threshold) {
		rendererListselect[index].update(index);
	    }		
	},

	update: function (index) {
	    var renderer = rendererListselect[index];
	    var query = [];
	    for (var i=0; i<renderer.settings.filter_breadcrumbs.length; i++) {
		query.push( { "field": renderer.settings.filter_breadcrumbs[i][0],
			      "searchword": renderer.settings.filter_breadcrumbs[i][1] } );
	    }
	    if (renderer.settings.filter_value.length) {
		query.push( { "field": renderer.settings.filter_attribute,
			      "searchword": renderer.settings.filter_value } );
	    }
	    renderer.settings.navigation_callback( { "clear": true, "query": query }, index );
	},

	// filter the data according to all breadcrumbs and the current filter
	filter: function(settings, index) {
	    var renderer = rendererListselect[index];
	    var results = [];
	    for (var x=0;x<settings.data.length;x++) {
		if (typeof(renderer.settings.selection[x]) == 'undefined') {
		    if (settings.data[x].hasOwnProperty(settings.attribute) && typeof(settings.data[x][settings.attribute]) == 'string') {
			if (settings.type == 'substring') {
			    if (settings.data[x][settings.attribute].toLowerCase().indexOf(settings.value.toLowerCase()) > -1) {
				results.push(settings.data[x]);
			    }
			} else if (settings.type == 'complete') {
			    if (settings.data[x][settings.attribute] == settings.value) {
				results.push(settings.data[x]);
			    }
			}
		    }
		}
	    }
	    return results;
	},
	// sort the list by the label attribute
	objectsort: function(a, b) {
	    if (a[renderer.settings.label] > b[renderer.settings.label]) {
		return 1;
	    } else if (b[renderer.settings.label] > a[renderer.settings.label]) {
		return -1;
	    } else {
		return 0;
	    }
	},
	// sort the list by the first item in the sublist
	listsort: function (a, b) {
	    if (a[0] > b[0]) {
		return 1;
	    } else if (b[0] > a[0]) {
		return -1;
	    } else {
		return 0;
	    }
	},
	update_data: function (params, index) {
	    var renderer = rendererListselect[index];

	    if (typeof params == 'string' && params == 'more') {
		renderer.settings.offset = renderer.settings.data.length;
		if (renderer.settings.total_count <= renderer.settings.asynch_limit) {
		    return;
		}
	    } 
	    if (typeof params == 'object') {
	        if (params.sort) {
	            if (params.sort == 'default') {
	                renderer.settings.sort = 'name';
    		        renderer.settings.sortDir = 'asc';
	            } else {
		        renderer.settings.sort = params.sort;
		        renderer.settings.sortDir = params.dir;
	            }
	        }
	        if (params.query) {
		    renderer.settings.offset = 0;
		    if (params.clear) {
		        renderer.settings.query = {};
		    }
	            if (typeof params.query != 'object') {
	                renderer.settings.query = {};
	            } else {
			renderer.settings.query = params.query;
		    }
	        }
	        if (params.goto != null) {
		    renderer.settings.offset = params.goto;
	        }
	        if (params.limit) {
		    renderer.settings.limit = params.limit;
	        }
	    }

	    var query = "";
	    for (var i in renderer.settings.query) {
	        if (renderer.settings.query.hasOwnProperty(i) && renderer.settings.query[i].searchword.length) {
		    query +=  "&" + renderer.settings.query[i].field + '=*' + renderer.settings.query[i].searchword + '*';
	        }
	    }

	    var url = renderer.settings.navigation_url + query + "&limit=" + renderer.settings.asynch_limit + "&offset=" + (renderer.settings.offset || 0) + "&order=" +renderer.settings.asynch_filter_attribute;

	    var headers = renderer.Authentication ? {'AUTH': renderer.Authentication} : {};
	
	    jQuery.ajax({ url: url, headers: headers, dataType: "json", success: function(data) {
		var renderer =  rendererListselect[index];
		renderer.settings.total_count = data.total_count;
		if (typeof params == 'string' && params == "more") {
		    renderer.settings.data = renderer.settings.data.concat(data.data);
		} else {
		    renderer.settings.data = data.data;
		}
		renderer.render(index);
	    }});
	}
    }
}).call(this);
