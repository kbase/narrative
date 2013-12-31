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

   value (STRING)
      The attribute of the data objects to be used as the value of the select options.

   callback (FUNCTION)
      The function to be called when the submit button is pressed. This function will pass the values of the selected option(s).

   selection (HASH of STRING)
      Hash of values pointing to 1. The inital selection in the result box. The values must be attribute values of the data object attribute selected as the value attribute of the selection list.

   button (OBJECT)
      This allows setting of the class, style, text and icon attributes of the button, i.e. { class: 'btn btn-error', style: 'border: 1px dotted black;', icon: '<i class="icon-ok icon-white"></i>', text: 'search' }

*/
(function () {
    var renderer = Retina.Renderer.extend({
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
		'filter_breadcrumbs': [],
		'selection': {},
		'data': {},
		'target': null,
		'sort': false,
		'multiple': false, 
		'no_button': false,
		'extra_wide': false,
		'style': "" },
	},
	exampleData: function () {
	    return { };
        },
	render: function () {
	    renderer = this;
	    var index = renderer.index;

	    // get the target div
	    var target = renderer.settings.target;
	    var tstyle = 'background-image: linear-gradient(to bottom, #FAFAFA, #F2F2F2); background-repeat: repeat-x; border: 1px solid #D4D4D4; border-radius: 4px 4px 4px 4px; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.067); padding-left: 10px; padding-top: 10px; width: ';
	    if (renderer.settings.multiple) {
		tstyle += renderer.settings.extra_wide ? '800px;' : '600px;';
	    } else if (renderer.settings.no_button) {
		tstyle += '256px;';
	    } else {
	        tstyle += '286px;';
	    }
	    target.setAttribute('style', tstyle+renderer.settings.style);
	    target.innerHTML = "";

	    // initialize filter attribute
	    if (renderer.settings.filter_attribute == null) {
		renderer.settings.filter_attribute = renderer.settings.filter[0];
	    }

	    // get the selection list
	    var selection_list = document.createElement('select');
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
	    filter_grp.setAttribute('class', 'btn-group');
	    var filter_input = document.createElement('input');
	    filter_input.setAttribute('type', 'text');
	    filter_input.setAttribute('class', renderer.settings.extra_wide ? 'span3' : 'span2');
	    filter_input.setAttribute('style', 'float: left;');
	    filter_input.setAttribute('placeholder', 'Enter filter');
	    filter_input.setAttribute('value', renderer.settings.filter_value);
	    filter_input.addEventListener('keyup', function (event) {
		if (event.keyCode == 13) {
		    Retina.RendererInstances.listselect[index].addBreadcrumb(index);
		}
		Retina.RendererInstances.listselect[index].settings.filter_value = filter_input.value;
		Retina.RendererInstances.listselect[index].redrawSelection(selection_list, index);
	    });
	    var filter_select = document.createElement('button');
	    filter_select.setAttribute('class', 'btn dropdown-toggle');
	    filter_select.setAttribute('style', (renderer.settings.extra_wide ? 'width: 195px;' : 'width: 85px;') + ' text-align: right;');
	    filter_select.setAttribute('data-toggle', 'dropdown');
	    filter_select.innerHTML = renderer.settings.filter_attribute + ' <span class="caret"></span>';
	    var filter_list = document.createElement('ul');
	    filter_list.setAttribute('class', 'dropdown-menu');
	    filter_list.setAttribute('style', renderer.settings.extra_wide ? 'left: 252px; max-height: 200px; overflow: auto;' : 'left: 58px; max-height: 200px; overflow: auto;');
	    var filter_string = '';
	    for (i=0; i<renderer.settings.filter.length; i++) {
		filter_string += '<li><a onclick="Retina.RendererInstances[\'listselect\']['+renderer.index+'].settings.filter_value=\'\';Retina.RendererInstances[\'listselect\']['+renderer.index+'].settings.filter_attribute=this.innerHTML.slice(0, -1);Retina.RendererInstances[\'listselect\']['+renderer.index+'].render();" style="cursor: pointer;">'+renderer.settings.filter[i]+' </a></li>';
	    }
	    filter_list.innerHTML = filter_string;
	    filter_grp.appendChild(filter_input);
	    filter_grp.appendChild(filter_select);
	    filter_grp.appendChild(filter_list);
	    filter.appendChild(filter_grp);

	    // create the filter breadcrumbs
	    var filter_breadcrumbs = document.createElement('div');
	    filter_breadcrumbs.setAttribute('style', 'font-size: 9px; position: relative; top: -5px;');
	    for (i=0;i<renderer.settings.filter_breadcrumbs.length;i++) {
		var bc_button = document.createElement('button');
		bc_button.setAttribute('class', "btn btn-mini");
		bc_button.setAttribute('style', "margin-right: 3px;");
		bc_button.setAttribute('title', "remove filter");
		bc_button.setAttribute('name', i);
		bc_button.innerHTML = renderer.settings.filter_breadcrumbs[i][0]+": "+renderer.settings.filter_breadcrumbs[i][1]+' <span style="font-size: 11px; color: gray;">x</span>';
		bc_button.addEventListener('click', function (event) {
		    Retina.RendererInstances.listselect[index].removeBreadcrumb(this, index);
		});
		filter_breadcrumbs.appendChild(bc_button);
	    }

	    // check for multi-select vs single select
	    if (renderer.settings.multiple) {
	    
		// create the result list
		var result_list = document.createElement('select');
		result_list.setAttribute('multiple', '');
		result_list.setAttribute('size', renderer.settings.rows);
		renderer.redrawResultlist(result_list, index);
		
		// create the action buttons
		var button_span = document.createElement('span');
		var button_left = document.createElement('a');
		button_left.setAttribute('class', 'btn btn-small');
		button_left.setAttribute('style', 'position: relative; left: 34px; top: 40px;');
		button_left.innerHTML = '<i class="icon-chevron-left"></i>';
		button_left.addEventListener('click', function () {
		    for (x=0; x<result_list.options.length; x++) {
			if (result_list.options[x].selected) {
			    delete Retina.RendererInstances.listselect[index].settings.selection[result_list.options[x].value];			
			}
		    }
		    Retina.RendererInstances.listselect[index].redrawResultlist(result_list, index);
		    Retina.RendererInstances.listselect[index].redrawSelection(selection_list, index);
		});
		var button_right = document.createElement('a');
		button_right.setAttribute('class', 'btn btn-small');
		button_right.setAttribute('style', 'position: relative; right: 34px; bottom: 40px;');
		button_right.innerHTML = '<i class="icon-chevron-right"></i>';
		button_right.addEventListener('click', function () {
		    for (x=0; x<selection_list.options.length; x++) {
			if (selection_list.options[x].selected) {
			    Retina.RendererInstances.listselect[index].settings.selection[selection_list.options[x].value] = 1;
			}
		    }
		    Retina.RendererInstances.listselect[index].redrawResultlist(result_list, index);
		    Retina.RendererInstances.listselect[index].redrawSelection(selection_list, index);
		});
		var button_x = document.createElement('a');
		button_x.setAttribute('class', 'btn btn-small');
		button_x.innerHTML = '<i class="icon-remove"></i>';
		button_x.addEventListener('click', function () {
		    Retina.RendererInstances.listselect[index].settings.selection = {};
		    Retina.RendererInstances.listselect[index].redrawResultlist(result_list, index);
		    Retina.RendererInstances.listselect[index].redrawSelection(selection_list, index);
		});
		button_span.appendChild(button_left);
		button_span.appendChild(button_x);
		button_span.appendChild(button_right);
	    }

	    // create the submit button
	    var submit_button = document.createElement('a');
	    submit_button.setAttribute('class', (renderer.settings.button && renderer.settings.button.class) ? renderer.settings.button.class : 'btn btn-small btn-success');
	    submit_button.setAttribute('style', (renderer.settings.button && renderer.settings.button.style) ? renderer.settings.button.style : 'margin-left: 15px;');
	    submit_button.innerHTML = ((renderer.settings.button && renderer.settings.button.text) ? renderer.settings.button.text : '') + ( (renderer.settings.button && renderer.settings.button.icon) ? renderer.settings.button.icon : '<i class="icon-ok icon-white"></i>');
	    if (typeof(renderer.settings.callback) == 'function') {
	        var index = renderer.index;
		    if (renderer.settings.multiple) {
		        submit_button.addEventListener('click', function () {
			        var selection_result = [];
			        for (x=0; x<result_list.options.length; x++) {
			            selection_result.push(result_list.options[x].value);			
			        }
			        Retina.RendererInstances.listselect[index].settings.callback(selection_result);
		        });
		    } else if (renderer.settings.no_button) {
		        selection_list.addEventListener('change', function () {
                    Retina.RendererInstances.listselect[index].settings.callback(selection_list.options[selection_list.selectedIndex].value);
	            });
		    } else {
		        submit_button.addEventListener('click', function () {
			        Retina.RendererInstances.listselect[index].settings.callback(selection_list.options[selection_list.selectedIndex].value);
		        });
	        }
        }

	    // build the output
	    target.appendChild(filter);
	    target.appendChild(filter_breadcrumbs);
	    target.appendChild(selection_list);
	    if (renderer.settings.multiple) {
		    target.appendChild(button_span);
		    target.appendChild(result_list);
		    target.appendChild(submit_button);
	    } else if (! renderer.settings.no_button) {
	        target.appendChild(submit_button);
	    }
	},
	// add a breadcrumb to the list
	addBreadcrumb: function (index) {
	    renderer = Retina.RendererInstances.listselect[index];
	    if (renderer.settings.filter_value != "") {
		renderer.settings.filter_breadcrumbs.push([renderer.settings.filter_attribute, renderer.settings.filter_value]);
		renderer.settings.filter_value = "";
		renderer.settings.filter_attribute = null;
		renderer.render();
	    }
	},
	// remove a breadcrumb from the list
	removeBreadcrumb: function (button, index) {
	    renderer = Retina.RendererInstances.listselect[index];
	    renderer.settings.filter_breadcrumbs.splice(button.name, 1);
	    renderer.settings.filter_value = '';
	    renderer.render();
	},
	// redraw the result list (right)
	redrawResultlist: function (result_list, index) {  
	    renderer = Retina.RendererInstances.listselect[index];
	    var result_list_array = [];
	    for (i=0; i<renderer.settings.data.length; i++) {
		if (renderer.settings.selection[renderer.settings.data[i][renderer.settings.value]]) {
		    result_list_array.push( [ renderer.settings.data[i][renderer.settings.value], '<option value="'+renderer.settings.data[i][renderer.settings.value]+'" title="'+renderer.settings.data[i][renderer.settings.filter_attribute]+'">'+renderer.settings.data[i][renderer.settings.filter_attribute]+'</option>'] );
		}
	    }
	    if (renderer.settings.sort) {
		result_list_array.sort(renderer.listsort);
	    }
	    var result_list_string = "";
	    for (i=0; i<result_list_array.length; i++) {
		result_list_string += result_list_array[i][1];
	    }
	    result_list.innerHTML = result_list_string;
	},
	// redraw the selection list (left)
	redrawSelection: function (selection_list, index) {
	    renderer = Retina.RendererInstances.listselect[index];
	    // initialize the filter
	    renderer.settings.filtered_data = renderer.settings.data;

	    // apply all filter breadcrumbs
	    for (i=0; i<renderer.settings.filter_breadcrumbs.length; i++) {
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
	    for (i=0; i<renderer.settings.filtered_data.length; i++) {
		if (! renderer.settings.selection[renderer.settings.filtered_data[i][renderer.settings.value]]) {
		    settings_string += '<option value="'+renderer.settings.filtered_data[i][renderer.settings.value]+'" title="'+renderer.settings.filtered_data[i][renderer.settings.filter_attribute]+'">'+renderer.settings.filtered_data[i][renderer.settings.filter_attribute]+'</option>';
		}
	    }
	    selection_list.innerHTML = settings_string;
	    
	    return;
	},
	// filter the data according to all breadcrumbs and the current filter
	filter: function(settings, index) {
	    renderer = Retina.RendererInstances.listselect[index];
	    var results = [];
	    for (x=0;x<settings.data.length;x++) {
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
	}
    });
}).call(this);
