(function () {
    var widget = Retina.Widget.extend({
        about: {
                title: "Analysis Builder iPython Input Widget",
                name: "AnalysisBuilder",
                author: "Tobias Paczian",
                requires: [ ]
        }
    });
    
    // notebook type
    widget.nb_type = 'analysis';
    // nb_id -> data_variable_name -> { 'type': viz_type, 'parent': sample_variable_name }
    widget.used_variables = {};
    // nb_id -> sample_variable_name -> { 'type': data_type, 'data': [ data_ids ] }
    widget.loaded_ids = {};

    widget.setup = function () {
        return [ Retina.add_renderer({"name": "listselect", "resource": "renderers/", "filename": "renderer.listselect.js"}),
		         this.loadRenderer('listselect')
		       ];
    };
    
    widget.transfer = function (data, cell_handling, nbid) {
	    var command = data.replace(/'/g, "##").replace(/"/g, "!!").replace(/\n/g, "\\n");
	    var msgstring = '';
	    if (cell_handling == 'create new cell') {
	        msgstring += 'if (ipy.read_cell() == \'\') { ipy.write_cell(null, \''+command+'\'); } else { ';
	        msgstring += 'ipy.write_cell(ipy.add_cell(), \''+command+'\'); }';
	    } else if (cell_handling == 'replace current cell') {
	        msgstring += 'ipy.write_cell(null, \''+command+'\');';
	    } else if (cell_handling == 'append to current cell') {
	        msgstring += 'ipy.append_to_cell(null, \''+command+'\');';
	    } else {
	        msgstring += 'if (ipy.read_cell() == \'\') { ipy.write_cell(null, \''+command+'\'); } else { ';
	        msgstring += 'ipy.write_cell(ipy.add_cell(), \''+command+'\'); }';
	    }
	    msgstring += "IPython.notebook.execute_selected_cell();";
	    if (! nbid) {
	        nbid = Retina.WidgetInstances.AnalysisBuilder[0].current_nb();
	    }
	    if (nbid) {
	        stm.send_message(nbid, msgstring, 'action');
        }
    };
    
    widget.current_nb = function () {
        var curr_iframe = jQuery('#tab_div').children('.active').children('iframe');
        if (curr_iframe && curr_iframe[0] && (curr_iframe[0].id != 'ipython_dash')) {
            return curr_iframe[0].id;
        } else {
            return undefined;
        }
    };

    widget.nb_created = function (nbid) {
        Retina.WidgetInstances.AnalysisBuilder[0].used_variables[nbid] = {};
        Retina.WidgetInstances.AnalysisBuilder[0].loaded_ids[nbid] = {};
        Retina.WidgetInstances.AnalysisBuilder[0].set_data_tab(nbid);
        Retina.WidgetInstances.AnalysisBuilder[0].populate_varnames(nbid);
    };
    
    widget.nb_deleted = function (nbid) {
        delete Retina.WidgetInstances.AnalysisBuilder[0].used_variables[nbid];
        delete Retina.WidgetInstances.AnalysisBuilder[0].loaded_ids[nbid];
        Retina.WidgetInstances.AnalysisBuilder[0].populate_varnames('delete');
        Retina.WidgetInstances.AnalysisBuilder[0].populate_sample_vars('delete');
    };

    widget.perform_login = function (params) {
        var progress = '<div class="alert alert-block alert-info" id="progressIndicator" style="position: absolute; top: 100px; width: 400px; right: 38%;">\
<button type="button" class="close" data-dismiss="alert">×</button>\
<h4><img src="images/loading.gif"> Please wait...</h4>\
<p>The data to be displayed is currently loading.</p>\
<p id="progressBar"></p>\
</div>';
        params.target.innerHTML = progress;
	    stm.get_objects({"repository": "mgrast", "type": "metagenome", "options": {"status": "private", "verbosity": "mixs", "limit": 0}}).then(function() {
            Retina.WidgetInstances.AnalysisBuilder[0].display(params);
        });
    };
    
    widget.display = function (params) {
    widget = Retina.WidgetInstances.AnalysisBuilder[0];
	
	var progress = '<div class="alert alert-block alert-info" id="progressIndicator" style="position: absolute; top: 100px; width: 400px; right: 38%;">\
<button type="button" class="close" data-dismiss="alert">×</button>\
<h4><img src="images/loading.gif"> Please wait...</h4>\
<p>The data to be displayed is currently loading.</p>\
<p id="progressBar"></p>\
</div>';
    params.target.innerHTML = progress;
    
	if (! stm.DataStore.hasOwnProperty('genome')) {
	    jQuery.getJSON('data/genome_public.json', function(data) {
	        for (var d in data) {
                if (data.hasOwnProperty(d)) {
                    stm.load_data({"data": data[d], "type": d});
                }
            }
            widget.display(params);
        }).fail( function() {
            stm.get_objects({"repository":"kbase","return_type":"search","type":"genome","id":"kb","options":{"count":'10000'}}).then(function () {
                widget.display(params);
            });
        });
        return;
	}
	if (! stm.DataStore.hasOwnProperty('metagenome')) {
	    jQuery.getJSON('data/mg_mixs_public.json', function(data) {
	        for (var d in data) {
                if (data.hasOwnProperty(d)) {
                    stm.load_data({"data": data[d], "type": d});
                }
            }
            widget.display(params);
        }).fail( function() {
            stm.get_objects({"repository":"mgrast","type":"metagenome","options":{"status":"public","verbosity":"mixs","limit":'0'}}).then(function () {
                widget.display(params);
            });
        });
        return;
    }
	
	// get the content div
	var content = params.target;
	content.innerHTML = "";
	content.setAttribute('style', "margin-top: 5px; margin-left: 10px;");
	content.setAttribute('class', "tabbable tabs-left");

	// create a tab menu
	var ul = document.createElement('ul');
	ul.setAttribute('class', 'nav nav-tabs');
	ul.setAttribute('style', "margin-top: 35px; margin-right: -1px; height: 340px;");

	// create the div-container
	var div = document.createElement('div');
	div.setAttribute('class', 'tab-content');
	div.setAttribute('style', 'height: 375px; border-bottom: 1px solid #DDDDDD;');

	content.appendChild(ul);
	content.appendChild(div);

	var sample_data = [];
    // load genome samples
	for (i in stm.DataStore["genome"]) {
	    if (stm.DataStore["genome"].hasOwnProperty(i)) {
	        var gd = { "name": stm.DataStore["genome"][i]["scientific_name"],
	 	        "id": i,
	 	        "project": "-",
	 	        "type": "single genome",
	            "status": "public",
	 	        "lat/long": "-",
	 	        "location": "-",
	 	        "collection date": "-",
	 	        "biome": "-",
	 	        "feature": "-",
	 	        "material": "-",
	 	        "package": "-",
	 	        "sequencing method": "-",
	            "sequencing type": "-",
	 	        "domain": stm.DataStore["genome"][i]["domain"],
	 	        "prokaryotic": stm.DataStore["genome"][i]["prokaryotic"] ? "yes" : "no",
	 	        "complete": stm.DataStore["genome"][i]["complete"] ? "yes" : "no",
	 	        "taxonomy": stm.DataStore["genome"][i].hasOwnProperty("taxonomy") ? stm.DataStore["genome"][i]["taxonomy"] : "-"
	        };
	        sample_data.push(gd);
        }
	}
	// load plant samples
	for (i in stm.DataStore["genome"]) {
	    if (stm.DataStore["genome"].hasOwnProperty(i) && stm.DataStore["genome"][i].hasOwnProperty("taxonomy") && /Streptophyta/.test(stm.DataStore["genome"][i]["taxonomy"])) {
	        var pd = { "name": stm.DataStore["genome"][i]["scientific_name"],
		        "id": i,
		        "project": "-",
		        "type": "plant genome",
		        "status": "public",
		        "lat/long": "-",
		        "location": "-",
		        "collection date": "-",
		        "biome": "-",
		        "feature": "-",
		        "material": "-",
		        "package": "-",
		        "sequencing method": "-",
		        "sequencing type": "-",
		        "domain": "Eukaryota",
            	"prokaryotic": "no",
            	"complete": stm.DataStore["genome"][i]["complete"] ? "yes" : "no",
            	"taxonomy": stm.DataStore["genome"][i]["taxonomy"]
		    };
	        sample_data.push(pd);
        }
	}
	// load metagenome samples
	for (i in stm.DataStore["metagenome"]) {
	    if (stm.DataStore["metagenome"].hasOwnProperty(i)) {
		     var md = { "name": stm.DataStore["metagenome"][i]["name"],
			   "id": i,
			   "project": stm.DataStore["metagenome"][i]["project"],
			   "type": "metagenome",
			   "status": stm.DataStore["metagenome"][i]["status"],
			   "lat/long": stm.DataStore["metagenome"][i]["latitude"]+"/"+stm.DataStore["metagenome"][i]["longitude"],
			   "location": stm.DataStore["metagenome"][i]["location"]+" - "+stm.DataStore["metagenome"][i]["country"],
			   "collection date": stm.DataStore["metagenome"][i]["collection_date"],
			   "biome": stm.DataStore["metagenome"][i]["biome"],
			   "feature": stm.DataStore["metagenome"][i]["feature"],
			   "material": stm.DataStore["metagenome"][i]["material"],
			   "package": stm.DataStore["metagenome"][i]["package"],
			   "sequencing method": stm.DataStore["metagenome"][i]["seq_method"],
			   "sequencing type": stm.DataStore["metagenome"][i]["sequence_type"],
			   "domain": "-",
           	   "prokaryotic": "-",
           	   "complete": "-",
           	   "taxonomy": "-"
			 };
		     sample_data.push(md);
	    }
	}

	// sample select
	var sample_select = document.createElement('li');
	sample_select.setAttribute('class', 'active');
	sample_select.innerHTML = '<a href="#sample_select" data-toggle="tab">'+widget.number(1)+'import data</a>';
	ul.appendChild(sample_select);

	var sample_select_div = document.createElement('div');
	sample_select_div.setAttribute('class', 'tab-pane active');
	sample_select_div.setAttribute('id', 'sample_select');

	var sample_select_ul = document.createElement('ul');
	sample_select_ul.setAttribute('class', 'nav nav-tabs');
	sample_select_ul.setAttribute('style', "margin-bottom: 10px;");

	var sample_select_disp = document.createElement('div');
	sample_select_disp.setAttribute('class', 'tab-content');

	var sample_select_li = document.createElement('li');
	sample_select_li.setAttribute('class', 'active');
	sample_select_li.innerHTML = '<a href="#sample_select_li" data-toggle="tab">select the samples you want to analyze</a>';
	sample_select_ul.appendChild(sample_select_li);

	var sample_select_disp_div = document.createElement('div');
	sample_select_disp_div.setAttribute('class', 'tab-pane active');
	sample_select_disp_div.setAttribute('id', 'sample_select_li');
	sample_select_disp_div.setAttribute('style', 'padding-top: 10px; height: 300px;');
	sample_select_disp.appendChild(sample_select_disp_div);

	var ls_multi_container = document.createElement('div');
	ls_multi_container.setAttribute('style', 'float: left; margin-left: 20px;');

	var ls_multi = document.createElement('div');
	ls_multi_container.appendChild(ls_multi);

	sample_select_disp_div.appendChild(ls_multi_container);

	sample_select_disp.appendChild(sample_select_disp_div);

	sample_select_div.appendChild(sample_select_ul);
	sample_select_div.appendChild(sample_select_disp);

	div.appendChild(sample_select_div);

	var control_sample_select = document.createElement('div');
	control_sample_select.setAttribute('style', 'float: left; margin-left: 20px;');
	sample_select_disp_div.appendChild(control_sample_select);

	control_sample_select.innerHTML = '<table style="text-align: left; margin-top: 10px;">\
<tr><th style="width: 100px;">variable name</th>\
  <td style="padding-right: 20px;"><input type="text" id="sample_select_variable_name" value="sample_set" style="margin-bottom: 0px; width: 165px;"></td>\
  <th style="width: 75px;">comment</th>\
  <td rowspan=3 style="margin-top: 10px; vertical-align: bottom;" ><textarea id="sample_select_comment" style="width: 175px;">load the initial data</textarea></td></tr>\
<tr><th>cell content</th>\
  <td><select id="sample_select_content_handling" style="margin-bottom: 0px; width: 175px;">\
    <option selected>create new cell</option>\
    <option>replace current cell</option>\
    <option>append to current cell</option>\
  </select></td></tr>\
<tr><td></td></tr></table>';

	widget.sample_select = Retina.Renderer.create('listselect', {
	    target: ls_multi,
	    multiple: true,
	    data: sample_data,
	    value: "id",
	    label: "name",
	    sort: true,
	    extra_wide: true,
	    filter: [ "name", "id", "project", "type", "status", "lat/long", "location", "collection date", "biome", "feature", "material", "package", "sequencing method", "sequencing type", "domain", "prokaryotic", "complete" ],
	    callback: function (data) {
	        if ((! data) || (data.length == 0)) {
	            alert("You have not selected any samples.\nPlease place the samples of your choice in the right side box'.");
    	        return;
	        }
		    var dataname   = document.getElementById('sample_select_variable_name').value;
	        var current_nb = widget.current_nb();
	        
	        // find and verify current notebook
	        if (! current_nb) {
                alert('You have not selected a notebook.\nEither click on an existing notebook tab or\ncreate a new one using the plus (+) tab.');
                return;
            }
            // check if we have a variable name
        	if (! dataname) {
        	    alert('You must select a variable name');
        	    return;
        	}
        	// check if the variable name is valid
        	if (! dataname.match(/^\w+$/)) {
        	    alert('you may only use alphanumeric characters for variable names');
        	    return;
        	}
        	// add this notebook to data id list
            if (! widget.loaded_ids.hasOwnProperty(current_nb)) {
                widget.loaded_ids[current_nb] = {};
            }
        	// check if the variable name has been used before
        	if (widget.loaded_ids[current_nb].hasOwnProperty(dataname)) {
        	    if (confirm('You have used to variable name "'+dataname+'" for another sample set.\nAre you sure you want to continue?\nThis would overwrite the previous samples in that variable.')) {
        		    delete(widget.loaded_ids[current_nb][dataname]);
        	    } else {
        		    return;
        	    }
        	}
		    // get ids by type
		    var has_wgs = false;
		    var quote_id = [];
		    var type_data = {};
		    for (var t in stm.DataStore) {
		        type_data[t] = [];
	        }
		    for (var i=0; i<data.length; i++) {
		        for (var t in stm.DataStore) {
		            if (stm.DataStore[t].hasOwnProperty(data[i])) {
		                type_data[t].push(data[i]);
		                quote_id.push("'"+data[i]+"'");
		                var data_obj = stm.DataStore[t][data[i]];
		                if ((t == 'metagenome') && ((data_obj["sequence_type"] == 'WGS') || (data_obj["sequence_type"] == 'MT'))) {
		                    has_wgs = true;
		                }
		            }
		        }
	        }
	        // verify all same type
	        var type_num  = 0;
	        var this_type = '';
	        for (var t in type_data) {
	            if (type_data[t].length > 0) {
	                type_num += 1;
	                this_type = t;
	            }
	        }
	        if (type_num > 1) {
	            alert('You may only select samples of the same type.');
        	    return;
	        }
	        // populate global list / create text to send
	        widget.loaded_ids[current_nb][dataname] = {'type': this_type, 'data': type_data[this_type]};
	        
	        var senddata   = "";
	        if (document.getElementById('sample_select_comment').value) {
		        senddata += "# "+document.getElementById('sample_select_comment').value.split(/\n/).join("\n# ") + "\n";
		    }
		    senddata += "id_list = [ "+quote_id.join(", ")+" ]\n";
	        switch (this_type) {
	            case 'metagenome':
	            var space_buff = Array(dataname.length+6).join(" ");
	            var dataopts = has_wgs ? "method='WGS', function_source='Subsystems'" : "method='Amplicon'";
	            senddata += dataname+" = { 'statistics': Collection(mgids=id_list, cache=True, stats=True, def_name=\""+dataname+"['statistics']\"),\n";
	            senddata += space_buff+"'abundances': get_analysis_set(ids=id_list, "+dataopts+", def_name=\""+dataname+"['abundances']\") }";
	            break;
	            case 'plant':
	            senddata += dataname+" = get_plant_set(gids=id_list, def_name='"+dataname+"')\n";
	            break;
	            case 'genome':
	            senddata += dataname+" = get_genome_set(gids=id_list, def_name='"+dataname+"')\n";
	            break;
	            default:
	            break;
	        }
	        // send it
		    widget.transfer(senddata, document.getElementById('sample_select_content_handling').value, current_nb);
		    widget.set_data_tab(current_nb);
	    }
	});
	widget.sample_select.render();

	// data load / convert
	var data_sel = document.createElement('li');
	data_sel.innerHTML = '<a href="#data" data-toggle="tab">'+widget.number(2)+'select data</a>';
	ul.appendChild(data_sel);

	var data_div = document.createElement('div');
	data_div.setAttribute('class', 'tab-pane');
	data_div.setAttribute('id', 'data');
	div.appendChild(data_div);

	var data_ul = document.createElement('ul');
	data_ul.setAttribute('class', 'nav nav-tabs');
	data_ul.setAttribute('style', "margin-bottom: 10px;");
	data_div.appendChild(data_ul);

	var data_disp = document.createElement('div');
	data_disp.setAttribute('class', 'tab-content');
	data_disp.setAttribute('style', 'padding-left: 15px;');
    data_div.appendChild(data_disp);

	var data_li = document.createElement('li');
	data_li.setAttribute('class', 'active');
	data_li.innerHTML = '<a href="#data_li" data-toggle="tab">select the data you want to analyze</a>';
	data_ul.appendChild(data_li);

	var data_disp_div = document.createElement('div');
	data_disp_div.setAttribute('class', 'tab-pane active');
	data_disp_div.setAttribute('id', 'data_li');
	data_disp.appendChild(data_disp_div);
	widget.set_data_tab(null);

	// visualizations
	var vis_sel = document.createElement('li');
	vis_sel.innerHTML = '<a href="#vis" data-toggle="tab" onclick="Retina.WidgetInstances.AnalysisBuilder[0].populate_varnames(null);Retina.WidgetInstances.AnalysisBuilder[0].check_varname_list(\'paragraph\');jQuery(\'#vis li:eq(0) a\').tab(\'show\');">'+widget.number(3)+'visualize data</a>';
	ul.appendChild(vis_sel);

	var vis_div = document.createElement('div');
	vis_div.setAttribute('class', 'tab-pane');
	vis_div.setAttribute('id', 'vis');
	div.appendChild(vis_div);

	var vis_ul = document.createElement('ul');
	vis_ul.setAttribute('class', 'nav nav-tabs');
	vis_ul.setAttribute('style', "margin-bottom: 10px;");

	var vis_disp = document.createElement('div');
	vis_disp.setAttribute('class', 'tab-content');
	vis_disp.setAttribute('style', 'padding-left: 15px;');

	// create the variable selector
	var vs = document.createElement('div');
	vs.setAttribute('id', 'variablename_div');
	vs.setAttribute('style', "display: none; float: left; height: 340px; margin-left: 10px; padding-top: 6px;");
	vs.innerHTML = "<p style='font-weight: bold;'>available variables</p><select multiple size=12 id='varnames'></select>";

	vis_div.appendChild(vis_ul);
	vis_div.appendChild(vs);
	vis_div.appendChild(vis_disp);

    // some constants
    var dist_methods  = ["bray-curtis","euclidean","maximum","manhattan","canberra","minkowski","difference"];
    var clust_methods = ["ward","single","complete","mcquitty","median","centroid"];
    var dist_options  = '';
    var clust_options = '';
    for (d in dist_methods) {
    	dist_options += "<option>"+dist_methods[d]+"</option>";
    }
    for (c in clust_methods) {
    	clust_options += "<option>"+clust_methods[c]+"</option>";
    }

	// paragraph UI
	var paragraph_sel = document.createElement('li');
	paragraph_sel.setAttribute('class', 'active');
	paragraph_sel.innerHTML = '<a href="#paragraph" data-toggle="tab" onclick="Retina.WidgetInstances.AnalysisBuilder[0].check_varname_list(\'paragraph\');"><i class="icon-align-center" style="margin-right: 5px;"></i>text writer</a>';
	vis_ul.appendChild(paragraph_sel);

	var paragraph_div = document.createElement('div');
	widget.currentParagraph = [];
	paragraph_div.setAttribute('class', 'tab-pane active');
	paragraph_div.setAttribute('id', 'paragraph');
	paragraph_div.innerHTML = '<table>\
<tr>\
 <td>\
  <div class="btn-toolbar">\
   <div class="btn-group" data-toggle="buttons-radio">\
     <button type="button" class="btn active" style="font-weight: bold;" title="title" id="paragraph_t">T</button>\
     <button type="button" class="btn" style="font-weight: bold;" title="header" id="paragraph_h">H</button>\
     <button type="button" class="btn" style="font-weight: bold;" title="paragraph" id="paragraph_p">P</button>\
   </div>\
   <div class="btn-group">\
    <button type="button" class="btn" style="margin-left: 70px;" onclick="document.getElementById(\'paragraph_text\').value = \'\';" title="clear text"><i class="icon-trash"></i></button>\
    <button type="button" class="btn" onclick="Retina.WidgetInstances.AnalysisBuilder[0].paragraph(\'replace\');" title="replace paragraph"><i class="icon-refresh"></i></button>\
    <button type="button" class="btn" onclick="Retina.WidgetInstances.AnalysisBuilder[0].paragraph(\'add\');" title="add paragraph"><i class="icon-plus"></i></button>\
   </div>\
  </div>\
  <textarea style="width: 275px; height: 175px;" id="paragraph_text"></textarea>\
 </td>\
 <td style="padding-left: 20px;">\
  <div class="btn-toolbar">\
   <div class="btn-group">\
    <button type="button" class="btn" onclick="if(confirm(\'Do you really want to delete ALL paragraphs from the list?\')){Retina.WidgetInstances.AnalysisBuilder[0].paragraph(\'delete_all\');}" title="delete all paragraphs"><i class="icon-trash"></i></button>\
    <button type="button" class="btn" onclick="if(confirm(\'Do you really want to delete the selected paragraph from the list?\')){Retina.WidgetInstances.AnalysisBuilder[0].paragraph(\'delete\');}" title="delete selected paragraph"><i class="icon-remove"></i></button>\
    <button type="button" class="btn" onclick="Retina.WidgetInstances.AnalysisBuilder[0].paragraph(\'edit\');" title="edit paragraph"><i class="icon-edit"></i></button>\
   </div>\
   <div class="btn-group">\
    <button type="button" class="btn btn-success" style="margin-left: 70px;" title="create IPython command" onclick="Retina.WidgetInstances.AnalysisBuilder[0].paragraph(\'submit\');"><i class="icon-ok icon-white"></i></button>\
   </div>\
  </div>\
  <select multiple size=11 id="paragraph_list"></select>\
 </td>\
 <td style="padding-left: 20px; vertical-align: top;">\
  <table style="text-align: left; margin-top: 50px;">\
   <tr><th>cell content</th><td><select id="para_content_handling" style="margin-bottom: 0px;"><option selected>create new cell</option><option>replace current cell</option><option>append to current cell</option></select></td></tr>\
   <tr><th style="vertical-align: top;">comment</th><td rowspan=3><textarea id="para_comment">introductory paragraph</textarea></td></tr>\
  </table>\
 </td>\
</tr>\
</table>';
	vis_disp.appendChild(paragraph_div);

	// chart UI
	var chart_sel = document.createElement('li');
	chart_sel.innerHTML = '<a href="#chart" data-toggle="tab" onclick="Retina.WidgetInstances.AnalysisBuilder[0].check_varname_list(\'graph\');"><i class="icon-signal" style="margin-right: 5px;"></i>bar-/pie-chart</a>';
	vis_ul.appendChild(chart_sel);

	var chart_div = document.createElement('div');
	chart_div.setAttribute('class', 'tab-pane');
	chart_div.setAttribute('id', 'chart');
	chart_div.innerHTML = '<table style="vertical-align: middle; text-align: left;">\
<tr><th>type</th><td><select id="graph_type" style="margin-bottom: 0px;"><option>row</option><option>stackedRow</option><option>column</option><option>stackedColumn</option><option>line</option><option>pie</option><option>stackedArea</option></select></td><td rowspan=5 style="width: 10px;"></td><th>data variable</th><td><input type="text" id="graph_data" value="" style="margin-bottom: 0px;" readonly onclick="if(confirm(\'This field should be assigned using the available variables selector.\\nDo you still want to edit this field manually?\\nEntering a non-set variable will cause a python error.\')){this.removeAttribute(\'readonly\');this.focus;}"></td></tr>\
<tr><th>title</th><td><input type="text" id="graph_title" value="" style="margin-bottom: 0px;"></td><th>cell content</th><td><select id="graph_content_handling" style="margin-bottom: 0px;"><option>append to current cell</option><option>create new cell</option><option>replace current cell</option></select></td></tr>\
<tr><th>height</th><td><input type="text" id="graph_height" value="auto" style="margin-bottom: 0px;"></td><th style="vertical-align: top;">comment</th><td rowspan=3><textarea id="graph_comment"></textarea></td></tr>\
<tr><th>width</th><td><input type="text" id="graph_width" value="auto" style="margin-bottom: 0px;"></td></tr>\
<tr><th>x-axis title</th><td><input type="text" id="graph_x_title" value="" style="margin-bottom: 0px;"></td></tr>\
<tr><th>y-axis title</th><td><input type="text" id="graph_y_title" value="" style="margin-bottom: 0px;"></td></tr>\
<tr><th>legend position</th><td><select id="graph_legend_position" style="margin-bottom: 0px;"><option>right</option><option>left</option><option>none</option></select></td></tr>\
</table>';
	vis_disp.appendChild(chart_div);

	var graph_button = document.createElement('button');
	graph_button.setAttribute('id', 'chart_button');
	graph_button.setAttribute('class', 'btn btn-success');
	graph_button.innerHTML = "<i class='icon-ok icon-white'></i>";
	graph_button.setAttribute('style', 'position: relative; bottom: 40px; left: 660px;');
	graph_button.addEventListener('click', function() {
	    var data_var = document.getElementById('graph_data').value;
	    if (! data_var) {
	        alert("You have not selected a variable name for this visualization.\nPlease choose one from the list of 'available variables'.");
	        return;
	    }
	    var current_nb = Retina.WidgetInstances.AnalysisBuilder[0].current_nb();
	    var dataname = Retina.WidgetInstances.AnalysisBuilder[0].used_variables[current_nb][data_var].parent;
	    var lpos = (document.getElementById('graph_legend_position').value == 'none') ? "'show_legend': False" : "'show_legend': True, 'legend_position': '"+document.getElementById('graph_legend_position').value+"'";
	    var height = (document.getElementById('graph_width').value == 'auto') ? "" : "'height': "+document.getElementById('graph_width').value;
	    var width  = (document.getElementById('graph_height').value == 'auto') ? "" : "'width': "+document.getElementById('graph_height').value;
	    var senddata = "graph_args = "+dataname+"['abundances'].barchart(**"+data_var+")\n";	    
	    senddata += "try:\n\tgraph_args.update({"+lpos+", 'btype': '"+document.getElementById('graph_type').value+"', 'title': '"+document.getElementById('graph_title').value+"', 'x_title': '"+document.getElementById('graph_x_title').value+"', 'y_title': '"+document.getElementById('graph_y_title').value+"'";
	    if (height) {
	        senddata += ", "+height;
	    }
	    if (width) {
	        senddata += ", "+width;
	    }
	    senddata += "})\n";
	    senddata += "\tIpy.RETINA.graph(**graph_args)\n";
	    senddata += "except:\n\tpass";
	    widget.transfer(senddata, false, false);
	});
	chart_div.appendChild(graph_button);

	// table UI
	var table_sel = document.createElement('li');
	table_sel.innerHTML = '<a href="#table" data-toggle="tab" onclick="Retina.WidgetInstances.AnalysisBuilder[0].check_varname_list(\'table\');"><i class="icon-list-alt" style="margin-right: 5px;"></i>table</a>';
	vis_ul.appendChild(table_sel);

	var table_div = document.createElement('div');
	table_div.setAttribute('class', 'tab-pane');
	table_div.setAttribute('id', 'table');
	table_div.innerHTML = '<table style="vertical-align: middle; text-align: left;">\
<tr><th>data variable</th><td><input type="text" id="table_data" value="" style="margin-bottom: 0px;" readonly onclick="if(confirm(\'This field should be assigned using the available variables selector.\\nDo you still want to edit this field manually?\\nEntering a non-set variable will cause a python error.\')){this.removeAttribute(\'readonly\');this.focus;}"></td></tr>\
<tr><th>cell content</th><td><select id="table_content_handling" style="margin-bottom: 0px;"><option>append to current cell</option><option>create new cell</option><option>replace current cell</option></select></td></tr>\
<tr><th style="vertical-align: top;">comment</th><td><textarea id="table_comment"></textarea></td></tr>\
</table>';

	var table_button = document.createElement('button');
	table_button.setAttribute('id', 'table_button');
	table_button.setAttribute('class', 'btn btn-success');
	table_button.innerHTML = "<i class='icon-ok icon-white'></i>";
	table_button.setAttribute('style', 'position: relative; left: 700px;');
	table_button.addEventListener('click', function() {
	    var data_var = document.getElementById('table_data').value;
	    if (! data_var) {
	        alert("You have not selected a variable name for this visualization.\nPlease choose one from the list of 'available variables'.");
	        return;
	    }
	    var senddata = "Ipy.RETINA.table(**"+data_var+")";
	    widget.transfer(senddata, false, false);
	});
	table_div.appendChild(table_button);
	vis_disp.appendChild(table_div);

	// heatmap UI
	var heatmap_sel = document.createElement('li');
	heatmap_sel.innerHTML = '<a href="#heatmap" data-toggle="tab" onclick="Retina.WidgetInstances.AnalysisBuilder[0].check_varname_list(\'heat\');"><img style="margin-right: 5px; position: relative; bottom: 2px;" src="images/icon_heatmap.png">heatmap</a>';
	vis_ul.appendChild(heatmap_sel);

	var heatmap_div = document.createElement('div');
	heatmap_div.setAttribute('class', 'tab-pane');
	heatmap_div.setAttribute('id', 'heatmap');
	heatmap_div.innerHTML = '<table style="vertical-align: middle; text-align: left;">\
<tr><th>tree height</th><td><input type="text" id="heat_tree_height" style="margin-bottom: 0px;" value="50"></td><td rowspan=5 style="width: 10px;"></td><th>data variable</th><td><input type="text" id="heat_data" value="" style="margin-bottom: 0px;" readonly onclick="if(confirm(\'This field should be assigned using the available variables selector.\\nDo you still want to edit this field manually?\\nEntering a non-set variable will cause a python error.\')){this.removeAttribute(\'readonly\');this.focus;}"></td></tr>\
<tr><th>tree width</th><td><input type="text" id="heat_tree_width" value="200" style="margin-bottom: 0px;"></td><th>cell content</th><td><select id="heat_content_handling" style="margin-bottom: 0px;"><option>create new cell</option><option>replace current cell</option><option>append to current cell</option></select></td></tr>\
<tr><th>legend height</th><td><input type="text" id="heat_legend_height" value="250" style="margin-bottom: 0px;"></td><th style="vertical-align: top;">comment</th><td rowspan=3><textarea id="heat_comment"></textarea></td></tr>\
<tr><th>legend width</th><td><input type="text" id="heat_legend_width" value="250" style="margin-bottom: 0px;"></td></tr>\
<tr><th>minimum cell height</th><td><input type="text" id="heat_min_cell_height" value="19" style="margin-bottom: 0px;"></td></tr>\
<tr><th>distance method</th><td><select id="heat_distance" style="margin-bottom: 0px;">'+dist_options+'</select></td></tr>\
<tr><th>cluster method</th><td><select id="heat_cluster" style="margin-bottom: 0px;">'+clust_options+'</select></td></tr>\
</table>';

	var heat_button = document.createElement('button');
	heat_button.setAttribute('id', 'heat_button');
	heat_button.setAttribute('class', 'btn btn-success');
	heat_button.innerHTML = "<i class='icon-ok icon-white'></i>";
	heat_button.setAttribute('style', 'position: relative; left: 700px;');
	heat_button.addEventListener('click', function() {
	    var data_var = document.getElementById('heat_data').value;
	    if (! data_var) {
	        alert("You have not selected a variable name for this visualization.\nPlease choose one from the list of 'available variables'.");
	        return;
	    }
	    var current_nb = Retina.WidgetInstances.AnalysisBuilder[0].current_nb();
	    var dataname = Retina.WidgetInstances.AnalysisBuilder[0].used_variables[current_nb][data_var].parent;
	    var senddata = "heatmap_args = dict("+data_var+".items() + {'dist': '"+document.getElementById('heat_distance').value+"', 'clust': '"+document.getElementById('heat_cluster').value+"'}.items())\n";
	    senddata += "heat_viz_args = "+dataname+"['abundances'].heatmap(**heatmap_args)\n";
	    senddata += "try:\n\theat_viz_args.update({'tree_height': "+document.getElementById('heat_tree_height').value+", 'tree_width': "+document.getElementById('heat_tree_width').value+", 'legend_width': "+document.getElementById('heat_legend_width').value+", 'legend_height': "+document.getElementById('heat_legend_height').value+", 'min_cell_height': "+document.getElementById('heat_min_cell_height').value+"})\n";
	    senddata += "\tIpy.RETINA.heatmap(**heat_viz_args)\n";
	    senddata += "except:\n\tpass";
	    widget.transfer(senddata, false, false);
	});
	heatmap_div.appendChild(heat_button);
	vis_disp.appendChild(heatmap_div);

    // pcoa UI
    var pcoa_sel = document.createElement('li');
	pcoa_sel.innerHTML = '<a href="#pcoa" data-toggle="tab" onclick="Retina.WidgetInstances.AnalysisBuilder[0].check_varname_list(\'pcoa\');"><img style="margin-right: 5px; position: relative; bottom: 2px;" src="images/icon_pcoa.png">PCoA</a>';
	vis_ul.appendChild(pcoa_sel);
	
	var pcoa_div = document.createElement('div');
	pcoa_div.setAttribute('class', 'tab-pane');
	pcoa_div.setAttribute('id', 'pcoa');
	pcoa_div.innerHTML = '<table style="vertical-align: middle; text-align: left;">\
<tr><th>height</th><td><input type="text" id="pcoa_height" value="auto" style="margin-bottom: 0px;"></td><td rowspan=5 style="width: 10px;"></td><th>data variable</th><td><input type="text" id="pcoa_data" value="" style="margin-bottom: 0px;" readonly onclick="if(confirm(\'This field should be assigned using the available variables selector.\\nDo you still want to edit this field manually?\\nEntering a non-set variable will cause a python error.\')){this.removeAttribute(\'readonly\');this.focus;}"></td></tr>\
<tr><th>width</th><td><input type="text" id="pcoa_width" value="auto" style="margin-bottom: 0px;"></td><th>cell content</th><td><select id="pcoa_content_handling" style="margin-bottom: 0px;"><option>create new cell</option><option>replace current cell</option><option>append to current cell</option></select></td></tr>\
<tr><th>title</th><td><input type="text" id="pcoa_title" value="" style="margin-bottom: 0px;"></td><th style="vertical-align: top;">comment</th><td rowspan=3><textarea id="pcoa_comment"></textarea></td></tr>\
<tr><th>distance method</th><td><select id="pcoa_distance" style="margin-bottom: 0px;">'+dist_options+'</select></td></tr>\
<tr><th>x-axis component</th><td><select id="pcoa_x_comp" style="margin-bottom: 0px;"><option value ="1" selected>PCO1<option><option value ="2">PCO2<option><option value ="3">PCO3<option><option value ="4">PCO4<option></select></td></tr>\
<tr><th>y-axis component</th><td><select id="pcoa_y_comp" style="margin-bottom: 0px;"><option value ="1">PCO1<option><option value ="2" selected>PCO2<option><option value ="3">PCO3<option><option value ="4">PCO4<option></select></td></tr>\
<tr><th>legend position</th><td><select id="pcoa_legend_position" style="margin-bottom: 0px;"><option>right</option><option>left</option><option>none</option></select></td></tr>\
</table>';

    var pcoa_button = document.createElement('button');
    pcoa_button.setAttribute('id', 'pcoa_button');
	pcoa_button.setAttribute('class', 'btn btn-success');
	pcoa_button.innerHTML = "<i class='icon-ok icon-white'></i>";
	pcoa_button.setAttribute('style', 'position: relative; left: 700px;');
	pcoa_button.addEventListener('click', function() {
	    var data_var = document.getElementById('pcoa_data').value;
	    if (! data_var) {
	        alert("You have not selected a variable name for this visualization.\nPlease choose one from the list of 'available variables'.");
	        return;
	    }
	    var current_nb = Retina.WidgetInstances.AnalysisBuilder[0].current_nb();
	    var dataname = Retina.WidgetInstances.AnalysisBuilder[0].used_variables[current_nb][data_var].parent;
	    var height = (document.getElementById('pcoa_height').value == 'auto') ? "" : "'height': "+document.getElementById('pcoa_height').value;
	    var width = (document.getElementById('pcoa_width').value == 'auto') ? "" : "'width': "+document.getElementById('pcoa_width').value;
	    var lpos = (document.getElementById('pcoa_legend_position').value == 'none') ? "'show_legend': False" : "'show_legend': True, 'legend_position': '"+document.getElementById('pcoa_legend_position').value+"'";
	    var senddata = "pcoa_args = dict("+data_var+".items() + {'dist': '"+document.getElementById('pcoa_distance').value+"', 'x_axis': "+document.getElementById('pcoa_x_comp').value+", 'y_axis': "+document.getElementById('pcoa_y_comp').value+"}.items())\n";
	    senddata += "pcoa_viz_args = "+dataname+"['abundances'].pco(**pcoa_args)\n";
	    senddata += "try:\n\tpcoa_viz_args.update({"+lpos+", 'title': '"+document.getElementById('plot_title').value+"'";
	    if (height) {
	        senddata += ", "+height;
	    }
	    if (width) {
	        senddata += ", "+width;
	    }
	    senddata += "})\n";
	    senddata += "\tIpy.RETINA.plot(**pcoa_viz_args)\n";
	    senddata += "except:\n\tpass";
	    widget.transfer(senddata, false, false);
	});
	pcoa_div.appendChild(pcoa_button);
	vis_disp.appendChild(pcoa_div);

	// plot UI
	var plot_sel = document.createElement('li');
	plot_sel.innerHTML = '<a href="#plot" data-toggle="tab" onclick="Retina.WidgetInstances.AnalysisBuilder[0].check_varname_list(\'plot\');"><img style="margin-right: 5px; position: relative; bottom: 2px;" src="images/icon_plot.png">plot</a>';
	vis_ul.appendChild(plot_sel);

	var plot_div = document.createElement('div');
	plot_div.setAttribute('class', 'tab-pane');
	plot_div.setAttribute('id', 'plot');
	plot_div.innerHTML = '<table style="vertical-align: middle; text-align: left;">\
<tr><th>connected</th><td><select id="plot_connected" style="margin-bottom: 0px;"><option value="True">yes</option><option value="False">no</option></select></td><td rowspan=5 style="width: 10px;"></td><th>data variable</th><td><input type="text" id="plot_data" value="" style="margin-bottom: 0px;" readonly onclick="if(confirm(\'This field should be assigned using the available variables selector.\\nDo you still want to edit this field manually?\\nEntering a non-set variable will cause a python error.\')){this.removeAttribute(\'readonly\');this.focus;}"></td></tr>\
<tr><th>show dots</th><td><select id="plot_dots" style="margin-bottom: 0px;"><option value="False">no</option><option value="True">yes</option></select></td><th>cell content</th><td><select id="plot_content_handling" style="margin-bottom: 0px;"><option>append to current cell</option><option>create new cell</option><option>replace current cell</option></select></td></tr>\
<tr><th>title</th><td><input type="text" id="plot_title" value="" style="margin-bottom: 0px;"></td><th style="vertical-align: top;">comment</th><td rowspan=3><textarea id="plot_comment"></textarea></td></tr>\
<tr><th>x-axis maximum value</th><td><input type="text" id="plot_x_max" value="auto" style="margin-bottom: 0px;"></td></tr>\
<tr><th>y-axis maximum value</th><td><input type="text" id="plot_y_max" value="auto" style="margin-bottom: 0px;"></td></tr>\
<tr><th>legend position</th><td><select id="plot_legend_position" style="margin-bottom: 0px;"><option>right</option><option>left</option><option>none</option></select></td></tr>\
</table>';

	var plot_button = document.createElement('button');
	plot_button.setAttribute('id', 'plot_button');
	plot_button.setAttribute('class', 'btn btn-success');
	plot_button.innerHTML = "<i class='icon-ok icon-white'></i>";
	plot_button.setAttribute('style', 'position: relative; left: 700px;');
	plot_button.addEventListener('click', function() {
	    var data_var = document.getElementById('plot_data').value;
	    if (! data_var) {
	        alert("You have not selected a variable name for this visualization.\nPlease choose one from the list of 'available variables'.");
	        return;
	    }
	    var xmax = (document.getElementById('plot_x_max').value == 'auto') ? "" : "'x_max': "+document.getElementById('plot_x_max').value;
	    var ymax = (document.getElementById('plot_y_max').value == 'auto') ? "" : "'y_max': "+document.getElementById('plot_y_max').value;
	    var lpos = (document.getElementById('plot_legend_position').value == 'none') ? "'show_legend': False" : "'show_legend': True, 'legend_position': '"+document.getElementById('plot_legend_position').value+"'";
	    var senddata = data_var+".update({"+lpos+", 'connected': "+document.getElementById('plot_connected').value+", 'show_dots': "+document.getElementById('plot_dots').value+", 'title': '"+document.getElementById('plot_title').value+"'";
	    if (xmax) {
	        senddata += ", "+xmax;
	    }
	    if (ymax) {
	        senddata += ", "+ymax;
	    }
	    senddata += "})\n";
	    senddata += "Ipy.RETINA.plot(**"+document.getElementById('plot_data').value+")";
	    widget.transfer(senddata, false, false);
	});
	plot_div.appendChild(plot_button);
	vis_disp.appendChild(plot_div);

	// boxplot map UI
	var boxplot_sel = document.createElement('li');
	boxplot_sel.innerHTML = '<a href="#boxplot" data-toggle="tab" onclick="Retina.WidgetInstances.AnalysisBuilder[0].check_varname_list(\'boxplot\');"><img style="margin-right: 5px; position: relative; bottom: 2px;" src="images/icon_boxplot.png">boxplot</a>';
	vis_ul.appendChild(boxplot_sel);

	var boxplot_div = document.createElement('div');
	boxplot_div.setAttribute('class', 'tab-pane');
	boxplot_div.setAttribute('id', 'boxplot');
	boxplot_div.innerHTML = '<table style="vertical-align: middle; text-align: left;">\
<tr><th>height</th><td><input type="text" id="boxplot_height" style="margin-bottom: 0px;" value="350"></td><td rowspan=5 style="width: 10px;"></td><th>data variable</th><td><input type="text" id="boxplot_data" value="" style="margin-bottom: 0px;" readonly onclick="if(confirm(\'This field should be assigned using the available variables selector.\\nDo you still want to edit this field manually?\\nEntering a non-set variable will cause a python error.\')){this.removeAttribute(\'readonly\');this.focus;}"></td></tr>\
<tr><th>width</th><td><input type="text" id="boxplot_width" value="350" style="margin-bottom: 0px;"></td><th>cell content</th><td><select id="boxplot_content_handling" style="margin-bottom: 0px;"><option>create new cell</option><option>replace current cell</option><option>append to current cell</option></select></td></tr>\
<tr><th></th><td></td><th style="vertical-align: top;">comment</th><td rowspan=3><textarea id="boxplot_comment"></textarea></td></tr>\
</table>';

	var boxplot_button = document.createElement('button');
	boxplot_button.setAttribute('id', 'boxplot_button');
	boxplot_button.setAttribute('class', 'btn btn-success');
	boxplot_button.innerHTML = "<i class='icon-ok icon-white'></i>";
	boxplot_button.setAttribute('style', 'position: relative; bottom: 40px; left: 660px;');
	boxplot_button.addEventListener('click', function() {
	    var data_var = document.getElementById('boxplot_data').value;
	    if (! data_var) {
	        alert("You have not selected a variable name for this visualization.\nPlease choose one from the list of 'available variables'.");
	        return;
	    }
	    var current_nb = Retina.WidgetInstances.AnalysisBuilder[0].current_nb();
	    var dataname = Retina.WidgetInstances.AnalysisBuilder[0].used_variables[current_nb][data_var].parent;
	    var senddata = "boxplot_args = "+dataname+"['abundances'].boxplot(**"+data_var+")\n";
	    senddata += "try:\n\tboxplot_args.update({'height': "+document.getElementById('boxplot_height').value+", 'width': "+document.getElementById('boxplot_width').value+"})\n";
	    senddata += "\tIpy.RETINA.boxplot(**boxplot_args)\n";
	    senddata += "except:\n\tpass";
	    widget.transfer(senddata, false, false);
	});
	boxplot_div.appendChild(boxplot_button);
	vis_disp.appendChild(boxplot_div);

	// deviationplot UI
	var deviationplot_sel = document.createElement('li');
	deviationplot_sel.innerHTML = '<a href="#deviationplot" data-toggle="tab" onclick="Retina.WidgetInstances.AnalysisBuilder[0].check_varname_list(\'deviationplot\');"><i class="icon-tasks" style="margin-right: 5px;"></i>deviationplot</a>';
	vis_ul.appendChild(deviationplot_sel);

	var deviationplot_div = document.createElement('div');
	deviationplot_div.setAttribute('class', 'tab-pane');
	deviationplot_div.setAttribute('id', 'deviationplot');
	deviationplot_div.innerHTML = '<table style="vertical-align: middle; text-align: left;">\
<tr><th>height</th><td><input type="text" id="deviationplot_height" style="margin-bottom: 0px;" value="80"></td><td rowspan=5 style="width: 10px;"></td><th>data variable</th><td><input type="text" id="deviationplot_data" value="" style="margin-bottom: 0px;" readonly onclick="if(confirm(\'This field should be assigned using the available variables selector.\\nDo you still want to edit this field manually?\\nEntering a non-set variable will cause a python error.\')){this.removeAttribute(\'readonly\');this.focus;}"></td></tr>\
<tr><th>width</th><td><input type="text" id="deviationplot_width" value="400" style="margin-bottom: 0px;"></td></td><th>cell content</th><td><select id="deviationplot_content_handling" style="margin-bottom: 0px;"><option>append to current cell</option><option>create new cell</option><option>replace current cell</option></select></td></tr>\
<tr><th></th><td></td><th style="vertical-align: top;">comment</th><td rowspan=3><textarea id="deviationplot_comment"></textarea></td></tr>\
</table>';

	var deviationplot_button = document.createElement('button');
	deviationplot_button.setAttribute('id', 'deviationplot_button');
	deviationplot_button.setAttribute('class', 'btn btn-success');
	deviationplot_button.innerHTML = "<i class='icon-ok icon-white'></i>";
	deviationplot_button.setAttribute('style', 'position: relative; bottom: 40px; left: 660px;');
	deviationplot_button.addEventListener('click', function() {
	    var data_var = document.getElementById('deviationplot_data').value;
	    if (! data_var) {
	        alert("You have not selected a variable name for this visualization.\nPlease choose one from the list of 'available variables'.");
	        return;
	    }
	    var senddata = data_var+".update({'height': "+document.getElementById('deviationplot_height').value+", 'width': "+document.getElementById('deviationplot_width').value+"})\n";
	    senddata += "Ipy.RETINA.deviationplot(**"+document.getElementById('deviationplot_data').value+")";
	    widget.transfer(senddata, false, false);
	});
	deviationplot_div.appendChild(deviationplot_button);
	vis_disp.appendChild(deviationplot_div);

	// // manhatten plot UI
	// var manplot_sel = document.createElement('li');
	// manplot_sel.innerHTML = '<a href="#manplot" data-toggle="tab">manhatten plot</a>';
	// vis_ul.appendChild(manplot_sel);

	// var manplot_div = document.createElement('div');
	// manplot_div.setAttribute('class', 'tab-pane');
	// manplot_div.setAttribute('id', 'manplot');
	// manplot_div.innerHTML = "<h3>manhatten plot UI in development</h3>";
	// div.appendChild(manplot_div);

	// // spatial map UI
	// var spatial_sel = document.createElement('li');
	// spatial_sel.innerHTML = '<a href="#spatial" data-toggle="tab">spatial map</a>';
	// vis_ul.appendChild(spatial_sel);

	// var spatial_div = document.createElement('div');
	// spatial_div.setAttribute('class', 'tab-pane');
	// spatial_div.setAttribute('id', 'spatial');
	// spatial_div.innerHTML = "<h3>spatial map UI in development</h3>";
	// div.appendChild(spatial_div);
    };

    widget.paragraph = function (command) {
	    widget = Retina.WidgetInstances.AnalysisBuilder[0];
	    var sel = document.getElementById('paragraph_list');
	    var txt = document.getElementById('paragraph_text');
	    txt_string = txt.value.replace(/"/g, "&#34;");
	    txt_string = txt_string.replace(/'/g, "&#39;");
    	switch (command) {
    	    case 'add':
	        var para = { "title": txt_string };
	        var type = "T";
	        if (document.getElementById('paragraph_h').className == 'btn active') {
		        type = "H";
		        para = { "header": txt_string };
	        } else if (document.getElementById('paragraph_p').className == 'btn active') {
		        type = "P";
		        para = { "p": txt_string };
	        }
	        sel.options[sel.options.length] = new Option(type+": "+txt.value, type+": "+txt.value);
	        widget.currentParagraph.push(para);
    	    break;
    	    case 'delete':
	        if (sel.selectedIndex > -1) {
		        widget.currentParagraph.splice(sel.selectedIndex, 1);
		        sel.remove(sel.selectedIndex);
	        }
    	    break;
    	    case 'edit':
	        if (sel.selectedIndex > -1) {
    		    var hash = widget.currentParagraph[sel.selectedIndex];
		        var val;
		        if (hash.hasOwnProperty('header')) {
		            document.getElementById('paragraph_h').click();
		            val = hash.header;
		        } else if (hash.hasOwnProperty('title')) {
		            document.getElementById('paragraph_t').click();
		            val = hash.title;
		        } else {
		            document.getElementById('paragraph_p').click();
		            val = hash.p;
		        }
		        txt.value = val;
	        }
    	    break;
	        case 'replace':
	        if (sel.selectedIndex > -1) {
		        var para = { "title": txt_string };
		        var type = "T";
		        if (document.getElementById('paragraph_h').className == 'btn active') {
		            type = "H";
		            para = { "header": txt_string };
		        } else if (document.getElementById('paragraph_p').className == 'btn active') {
		            type = "P";
		            para = { "p": txt_string };
		        }
		        widget.currentParagraph[sel.selectedIndex] = para;
		        sel.options[sel.selectedIndex] = new Option(type+": "+txt.value, type+": "+txt.value);
	        }
	        break;
	        case 'delete_all':
	        sel.options.length = 0;
	        widget.currentParagraph = [];
	        break;
    	    case 'submit':
    	    var senddata = "";
	        if (document.getElementById('para_comment').value) {
		        senddata += "# " + document.getElementById('para_comment').value.split(/\n/).join("\n# ") + "\n";
	        }
	        var dstring = JSON.stringify(widget.currentParagraph);
	        dstring = dstring.replace(/\\n/g, "<br>");
	        senddata += "Ipy.RETINA.paragraph(data="+dstring+")";
	        widget.transfer(senddata, document.getElementById('para_content_handling').value, false);
    	    break;
    	    default:
    	    break;
    	}
    };

    widget.number = function (number) {
	    return '<p style="font-size: 16px; float: left; font-weight: bold; height: 18px; text-align: center; vertical-align: middle; margin-right: 8px; border: 5px solid #0088CC; width: 18px; border-radius: 14px 14px 14px 14px; position: relative; bottom: 5px; right: 9px;">'+number+'</p>';
    };

    widget.create_data = function () {
	var senddata = "";
	var data_var = document.getElementById('data_variable_name').value;
	var current_nb = Retina.WidgetInstances.AnalysisBuilder[0].current_nb();

	// check that there is a notebook
    if (! current_nb) {
        alert('You have not selected a notebook.\nEither click on an existing notebook tab or\ncreate a new one using the plus (+) tab.');
        return;
    }
	
	// check if we have a variable name
	if (! data_var) {
	    alert('you must select a variable name');
	    document.getElementById('data_variable_name').setAttribute('required', "");
	    document.getElementById('data_variable_name').focus();
	    return;
	}
	document.getElementById('data_variable_name').removeAttribute('required');

	// check if the variable name is valid
	if (! data_var.match(/^\w+$/)) {
	    alert('you may only use the alphanumeric characters for variable names');
	    document.getElementById('data_variable_name').setAttribute('required', "");
	    document.getElementById('data_variable_name').focus();
	    return;
	}

    // add this notebook to variable list
    if (! Retina.WidgetInstances.AnalysisBuilder[0].used_variables.hasOwnProperty(current_nb)) {
        Retina.WidgetInstances.AnalysisBuilder[0].used_variables[current_nb] = {};
    }

	// check if the variable name has been used before
	if (Retina.WidgetInstances.AnalysisBuilder[0].used_variables[current_nb].hasOwnProperty(data_var)) {
	    if (confirm('You have used to variable name "'+data_var+'" for another data result.\nAre you sure you want to continue?\nThis would overwrite the previous data in that variable.')) {
		    delete(Retina.WidgetInstances.AnalysisBuilder[0].used_variables[current_nb][data_var]);
	    } else {
		    document.getElementById('data_variable_name').focus();
		    return;
	    }
	}
	
	var dataname = document.getElementById('sample_name_select').value;
	if (document.getElementById('data_comment').value) {
	    senddata += "# " + document.getElementById('data_comment').value.split(/\n/).join("\n# ") + "\n";
	}

	var sd = [];
	var data = document.getElementById('data_sample_select').options;
	for (i=0;i<data.length;i++) {
	    if (data[i].selected) {
		    sd.push("'"+data[i].value+"'");
	    }
	}
	switch (document.getElementById('sample_type_select').value) {
	    case 'metagenome':
	    if (document.getElementById('data_select').value == 'abundance') {
	        var level = (document.getElementById('abund_type_select').value == 'organism') ? document.getElementById('tax_select').value : document.getElementById('func_select').value;
	        var norm  = (document.getElementById('norm_select').value == 'norm')? '1' : '0';
	        Retina.WidgetInstances.AnalysisBuilder[0].used_variables[current_nb][data_var] = {'type': 'abundance', 'parent': dataname};
	        senddata += dataname+"['abundances'].set_display_mgs(ids=["+sd.join(", ")+"])\n";
	        senddata += data_var+" = {'annot': '"+document.getElementById('abund_type_select').value+"', 'level': '"+level+"', 'normalize': "+norm+", 'arg_list': True}";
        } else if (document.getElementById('data_select').value == 'statistics') {
            senddata += dataname+"['statistics'].display.set_display_mgs(ids=["+sd.join(", ")+"])\n";
            switch (document.getElementById('stat_select').value) {
                case 'rare':
                // selected metagenomes - plot
                Retina.WidgetInstances.AnalysisBuilder[0].used_variables[current_nb][data_var] = {'type': 'plot', 'parent': dataname};
                senddata += dataname+"['statistics'].display.rarefaction(arg_list=True, target='"+data_var+"')";
                break;
                case 'drisee':
                // selected metagenomes - plot
                Retina.WidgetInstances.AnalysisBuilder[0].used_variables[current_nb][data_var] = {'type': 'plot', 'parent': dataname};
                senddata += dataname+"['statistics'].display.drisee(arg_list=True, target='"+data_var+"')";
                break;
                case 'kmer':
                // selected metagenomes - plot
                Retina.WidgetInstances.AnalysisBuilder[0].used_variables[current_nb][data_var] = {'type': 'plot', 'parent': dataname};
                senddata += dataname+"['statistics'].display.kmer(arg_list=True, target='"+data_var+"')";
                break;
                case 'seq_chart':
                // selected metagenomes - graph
                Retina.WidgetInstances.AnalysisBuilder[0].used_variables[current_nb][data_var] = {'type': 'graph', 'parent': dataname};
                senddata += dataname+"['statistics'].display.summary_chart(arg_list=True, target='"+data_var+"')";
                break;
                case 'seq_stats':
                // selected metagenomes - table
                Retina.WidgetInstances.AnalysisBuilder[0].used_variables[current_nb][data_var] = {'type': 'table', 'parent': dataname};
                senddata += dataname+"['statistics'].display.summary_stats(arg_list=True, target='"+data_var+"')";
                break;
                case 'metadata':
                // selected metagenomes - table
                Retina.WidgetInstances.AnalysisBuilder[0].used_variables[current_nb][data_var] = {'type': 'table', 'parent': dataname};
                senddata += dataname+"['statistics'].display.metadata(arg_list=True, target='"+data_var+"')";
                break;
                case 'alpha':
                // single and selected metagenomes - deviationplot
                Retina.WidgetInstances.AnalysisBuilder[0].used_variables[current_nb][data_var] = {'type': 'deviationplot', 'parent': dataname};
                senddata += "primary_id = '"+document.getElementById('primary_select').value+"'\n";
                senddata += "alpha_list = "+dataname+"['statistics'].get_stat(stat='alpha_diversity_shannon', mgid=primary_id)\n";
                senddata += data_var+" = { 'data': alpha_list}";
                break;
                case 'bp':
                // single and selected metagenomes - deviationplot
                Retina.WidgetInstances.AnalysisBuilder[0].used_variables[current_nb][data_var] = {'type': 'deviationplot', 'parent': dataname};
                senddata += "primary_id = '"+document.getElementById('primary_select').value+"'\n";
                senddata += "bp_list = "+dataname+"['statistics'].get_stat(stat='bp_count_raw', mgid=primary_id)\n";
                senddata += data_var+" = { 'data': bp_list }";
                break;
                case 'length':
                // single and selected metagenomes - deviationplot
                Retina.WidgetInstances.AnalysisBuilder[0].used_variables[current_nb][data_var] = {'type': 'deviationplot', 'parent': dataname};
                senddata += "primary_id = '"+document.getElementById('primary_select').value+"'\n";
                senddata += "length_list = "+dataname+"['statistics'].get_stat(stat='average_length_raw', mgid=primary_id)\n";
                senddata += data_var+" = { 'data': length_list }";
                break;
                case 'gc':
                // single and selected metagenomes - deviationplot
                Retina.WidgetInstances.AnalysisBuilder[0].used_variables[current_nb][data_var] = {'type': 'deviationplot', 'parent': dataname};
                senddata += "primary_id = '"+document.getElementById('primary_select').value+"'\n";
                senddata += "gc_list = "+dataname+"['statistics'].get_stat(stat='average_gc_content_raw', mgid=primary_id)\n";
                senddata += data_var+" = { 'data': gc_list }";
                break;
                default:
                break;
            }
        }
        break;
        case 'plant':
        senddata += "primary_plant = "+dataname+"['"+document.getElementById('plant_primary_select').value+"']\n";
        if (document.getElementById('plant_data_select').value == 'trait') {
            Retina.WidgetInstances.AnalysisBuilder[0].used_variables[current_nb][data_var] = {'type': 'table', 'parent': dataname};
            senddata += data_var+" = primary_plant.show_traits(arg_list=True)";
        } else if (document.getElementById('plant_data_select').value == 'variant') {
            Retina.WidgetInstances.AnalysisBuilder[0].used_variables[current_nb][data_var] = {'type': 'plot', 'parent': dataname};
            senddata += data_var+" = primary_plant.plot_variations(count="+document.getElementById('variant_count').value+", arg_list=True)";
        }
        break;
        default:
        break;
    }
	widget.transfer(senddata, document.getElementById('data_content_handling').value, current_nb);
    };
    
    widget.set_data_tab = function (current_nb) {
	    widget = Retina.WidgetInstances.AnalysisBuilder[0];
	    if (! current_nb) {
	        current_nb = widget.current_nb();
	    }
	    var html = "<table style='text-align:left;'>\
<tr style='vertical-align:top;text-align:center;'>\
  <th style='padding-bottom: 15px;'>select samples</th>\
  <th>select data</th>\
  <th>select target</th></tr>\
<tr style='vertical-align: top;'>\
  <td style='padding-right: 15px;'>\
    <table><tr><th style='width: 75px;'>type</th><td>\
      <select style='margin-bottom: 0px; width: 175px;' id='sample_type_select' onchange='\
        jQuery(\"table[id$=_options_tbl]\").css(\"display\", \"none\");\
        if (this.options[this.selectedIndex]) {\
            document.getElementById(this.options[this.selectedIndex].value+\"_options_tbl\").style.display=\"\";\
        } else {\
            document.getElementById(\"blank_options_tbl\").style.display=\"\";\
        }\
        Retina.WidgetInstances.AnalysisBuilder[0].variable_name();\
        Retina.WidgetInstances.AnalysisBuilder[0].populate_sample_vars();'>";
        if (current_nb && widget.loaded_ids.hasOwnProperty(current_nb)) {
            var types = [];
            for (var x in widget.loaded_ids[current_nb]) {
                if (types.indexOf(widget.loaded_ids[current_nb][x]['type']) === -1) {
                    types.push(widget.loaded_ids[current_nb][x]['type']);
                }
            }
            for (var t in types) {
                html += "<option>"+types[t]+"</option>";
            }
        }    
        html += "</select></td></tr>\
    <tr><th>variable</th><td>\
      <select style='margin-bottom: 0px; width: 175px;' id='sample_name_select' onchange='Retina.WidgetInstances.AnalysisBuilder[0].populate_sample_ids();'>\
      </select></td></tr>\
    <tr><td colspan='2'>\
      <select style='width: 250px;' multiple size=10 id='data_sample_select'></select></td></tr>\
    </table>\
  <td style='padding-right: 15px;'>\
    <table id='metagenome_options_tbl' style='display:none;'><tr><th style='width: 85px;'>data type</th><td>\
      <select style='margin-bottom: 0px; width: 175px;' id='data_select' onchange='\
        var abunds = document.getElementsByName(\"abund_row\");\
        var stats = document.getElementsByName(\"stat_row\");\
        if (this.options[this.selectedIndex].value == \"abundance\") {\
          for (var x=0; x<abunds.length; x++) { abunds[x].style.display=\"\"; }\
          for (var y=0; y<stats.length; y++) { stats[y].style.display=\"none\"; }\
        } else {\
          for (var x=0; x<abunds.length; x++) { abunds[x].style.display=\"none\"; }\
          for (var y=0; y<stats.length; y++) { stats[y].style.display=\"\"; }\
          document.getElementById(\"stat_select\").onchange();\
        }\
        Retina.WidgetInstances.AnalysisBuilder[0].variable_name();'>\
        <option value='abundance' selected>abundance profile</option>\
        <option value='statistics'>statistics</option>\
      </select>\
    </td></tr>\
    <tr name='abund_row'><th>value format</th><td>\
      <select id='norm_select' style='margin-bottom: 0px; width: 175px;'>\
        <option value='norm'>log transformed</option>\
        <option value='raw'>raw values</option>\
      </select></td></tr>\
    <tr name='abund_row'><th>hierarchy</th><td>\
      <select id='abund_type_select' style='margin-bottom: 0px; width: 175px;' onchange='if(this.options[this.selectedIndex].value==\"organism\"){document.getElementById(\"tax_select\").style.display=\"\";document.getElementById(\"func_select\").style.display=\"none\";}else{document.getElementById(\"tax_select\").style.display=\"none\";document.getElementById(\"func_select\").style.display=\"\";}'>\
        <option value='organism' selected>Taxonomic Hierarchy</option>\
        <option value='function'>Functional Hierarchy</option>\
      </select></td></tr>\
    <tr name='abund_row'><th>level</th><td>\
      <select style='margin-bottom: 0px; width: 175px;' id='tax_select'>\
        <option value='domain'>Domain</option>\
        <option value='phylum'>Phylum</option>\
        <option value='class'>Class</option>\
        <option value='order'>Order</option>\
        <option value='family'>Family</option>\
        <option value='genus'>Genus</option>\
        <option value='species'>Species</option>\
      </select>\
      <select style='margin-bottom: 0px; width: 175px;' id='func_select' style='display:none;'>\
        <option value='level1'>Level 1</option>\
        <option value='level2'>Level 2</option>\
        <option value='level3'>Level 3</option>\
        <option value='function'>Function</option>\
      </select></td></tr>\
    <tr name='stat_row' style='display: none;'><th>stat view</th><td>\
      <select style='margin-bottom: 0px; width: 175px;' id='stat_select' onchange='if(/^(alpha|bp|length|gc)$/.test(this.options[this.selectedIndex].value)){document.getElementById(\"primary_row\").style.display=\"\";}else{document.getElementById(\"primary_row\").style.display=\"none\";}Retina.WidgetInstances.AnalysisBuilder[0].variable_name();'>\
        <option value='rare'>Rarefaction Curve</option>\
        <option value='drisee'>DRISEE Profile</option>\
        <option value='kmer'>k-mer Profile</option>\
        <option value='seq_chart'>Sequence Summary</option>\
        <option value='seq_stats'>Sequence Statistics</option>\
        <option value='metadata'>Metadata</option>\
        <option value='alpha'>Alpha-Diversity</option>\
        <option value='bp'>bp Profile</option>\
        <option value='length'>Length Histogram</option>\
        <option value='gc'>GC Histogram</option>\
      </select></td></tr>\
    <tr name='stat_row' id='primary_row' style='display: none;'><th>primary data</th><td>\
      <select style='margin-bottom: 0px; width: 175px;' id='primary_select'></select></td></tr>\
    </table>\
    <table id='plant_options_tbl' style='display:none;'><tr><th style='width: 85px;'>data type</th><td>\
      <select style='margin-bottom: 0px; width: 175px;' id='plant_data_select' onchange='if(this.options[this.selectedIndex].value==\"trait\"){document.getElementById(\"variant_row\").style.display=\"none\";}else{document.getElementById(\"variant_row\").style.display=\"\";}Retina.WidgetInstances.AnalysisBuilder[0].variable_name();'>\
        <option value='trait' selected>traits</option>\
        <option value='variant'>variations</option>\
      </select></td></tr>\
    <tr id='variant_row' style='display: none;'><th>counts</th><td>\
        <input type='text' id='variant_count' value='5' style='margin-bottom: 0px; width: 165px;'></td></tr>\
    <tr><th>primary data</th><td>\
        <select style='margin-bottom: 0px; width: 175px;' id='plant_primary_select'></select></td></tr>\
    </table>\
    <table id='genome_options_tbl' style='display:none;'>\
        <tr><th style='width: 85px;'>data type</th><td style='width: 175px;'>genome selects</td></tr></table>\
    <table id='blank_options_tbl' style='display:none;'>\
        <tr><td style='width: 260px;'></td></tr></table>\
  </td><td>\
    <table>\
      <tr><th style='width: 100px;'>variable name</th>\
        <td><input type='text' id='data_variable_name' value='' style='margin-bottom: 0px; width: 170px;'></td></tr>\
      <tr><th>cell content</th>\
        <td><select id='data_content_handling' style='margin-bottom: 0px; width: 180px;'><option selected>create new cell</option><option>replace current cell</option><option>append to current cell</option></select></td></tr>\
      <tr><th style='vertical-align: top;'>comment</th>\
        <td><textarea id='data_comment' style='width: 170px;'>my data subselection</textarea></td></tr>\
      <tr><td colspan='2' align='right' style='padding-top:30px;'>\
        <button type='button' class='btn btn-success' title='create IPython command' onclick='Retina.WidgetInstances.AnalysisBuilder[0].create_data();'><i class='icon-ok icon-white'></i></button>\
      </td></tr>\
    </table>\
  </td>\
</tr></table>";
        document.getElementById('data_li').innerHTML = html;
        document.getElementById("sample_type_select").onchange();
        document.getElementById("abund_type_select").onchange();
        document.getElementById("plant_data_select").onchange();
        widget.variable_name(current_nb);
        widget.populate_sample_vars(current_nb);
    };
    
    widget.variable_name = function (nbid) {
        widget = Retina.WidgetInstances.AnalysisBuilder[0];
        if (! nbid) {
            nbid = widget.current_nb();
        }
        var temp_name = "";
        if (document.getElementById('sample_type_select').value == 'metagenome') {
            if (document.getElementById('data_select').value == 'abundance') {
                temp_name = 'abund_args_';
            } else {
                temp_name = document.getElementById('stat_select').value+"_args_";
            }
        } else if (document.getElementById('sample_type_select').value == 'plant') {
            temp_name = document.getElementById('plant_data_select').value+"_args_";
        }
        var num = 1;
        if (widget.used_variables.hasOwnProperty(nbid)) {
            while ( widget.used_variables[nbid].hasOwnProperty(temp_name+num.toString()) ) {
                num += 1;
            }
        }
        document.getElementById('data_variable_name').value = temp_name+num.toString();
    };

    widget.populate_sample_vars = function (nbid) {
        widget = Retina.WidgetInstances.AnalysisBuilder[0];
        if (! nbid) {
            nbid = widget.current_nb();
        }
        var type = document.getElementById('sample_type_select').value;
        document.getElementById('sample_name_select').innerHTML = "";
        if (nbid && (nbid != 'delete') && widget.loaded_ids.hasOwnProperty(nbid)) {
            var snopts = "";
            for (var name in widget.loaded_ids[nbid]) {
                if (widget.loaded_ids[nbid][name]['type'] == type) {
                    snopts += "<option>"+name+"</option>";
                }
            }
            document.getElementById('sample_name_select').innerHTML = snopts;
        }
        widget.populate_sample_ids(nbid);
    };

    widget.populate_sample_ids = function (nbid) {
        widget = Retina.WidgetInstances.AnalysisBuilder[0];
        if (! nbid) {
            nbid = widget.current_nb();
        }
        var name = document.getElementById('sample_name_select').value;
        var type = document.getElementById('sample_type_select').value;
        document.getElementById('data_sample_select').innerHTML = "";
        document.getElementById('primary_select').innerHTML = "";
        document.getElementById('plant_primary_select').innerHTML = "";
        if ( nbid && (nbid != 'delete') && widget.loaded_ids.hasOwnProperty(nbid) &&
             widget.loaded_ids[nbid].hasOwnProperty(name) && (widget.loaded_ids[nbid][name]['type'] == type) ) {
            var idopts = "";
            for (var i in widget.loaded_ids[nbid][name]['data']) {
                var id = widget.loaded_ids[nbid][name]['data'][i];
                var dname = stm.DataStore[type][id].hasOwnProperty('name') ? stm.DataStore[type][id].name : stm.DataStore[type][id].scientific_name;
                idopts += "<option value='"+id+"' selected>"+dname+"</option>";
            }
            document.getElementById('data_sample_select').innerHTML = idopts;
            if (type == 'metagenome') {
                document.getElementById('primary_select').innerHTML = idopts;
            } else if (type == 'plant') {
                document.getElementById('plant_primary_select').innerHTML = idopts;
            }
        }
    };
    
    widget.populate_varnames = function (nbid) {
        widget = Retina.WidgetInstances.AnalysisBuilder[0];
        if (! nbid) {
            nbid = widget.current_nb();
        }
        document.getElementById('varnames').innerHTML = "";
        if (nbid && (nbid != 'delete') && widget.used_variables.hasOwnProperty(nbid)) {
            var vnopts = "";
        	for (var i in widget.used_variables[nbid]) {
        	    if (widget.used_variables[nbid].hasOwnProperty(i)) {
        		    vnopts += "<option>"+i+"</option>";
        	    }
        	}
        	document.getElementById('varnames').innerHTML = vnopts;
        }
    };

    widget.check_varname_list = function (tab) {
	var v = document.getElementById('variablename_div');
	if (tab == 'paragraph') {
	    v.style.display = 'none';
	} else {
	    var allowed = {};
	    switch (tab) {
	        case 'graph':
		    allowed = { 'abundance': 1, 'graph': 1 };
		    break;
	        case 'table':
		    allowed = { 'table': 1 };
		    break;
	        case 'heat':
		    allowed = { 'abundance': 1 };
		    break;
	        case 'pcoa':
		    allowed = { 'abundance': 1 };
		    break;
	        case 'boxplot':
		    allowed = { 'abundance': 1 };
		    break;
	        case 'plot':
		    allowed = { 'plot': 1 };
		    break;
	        case 'deviationplot':
		    allowed = { 'deviationplot': 1 };
		    break;
		    default:
		    break;
	    }

	    v.style.display = '';
	    var current_nb = Retina.WidgetInstances.AnalysisBuilder[0].current_nb();
	    var vns = document.getElementById('varnames').options;
	    var count = 0;
	    for (i=0; i<vns.length; i++) {
		if (allowed[Retina.WidgetInstances.AnalysisBuilder[0].used_variables[current_nb][vns[i].value].type]) {
		    vns[i].removeAttribute('disabled');
		    var val = vns[i].value;
		    vns[i].setAttribute('onclick', "document.getElementById('"+tab+"_data').value = '"+val+"';");
		    count ++;
		} else {
		    vns[i].setAttribute('disabled', '');
		}
	    }
	    if (count == 0) {
		    alert('You have not selected data that can be visualized with this visualization');
	    }
	}
    };
    
})();
