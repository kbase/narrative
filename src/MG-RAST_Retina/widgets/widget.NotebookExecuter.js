(function () {
    var widget = Retina.Widget.extend({
        about: {
                title: "iPython Input Widget for executing notebooks",
                name: "NotebookExecuter",
                author: "Travis Harrison",
                requires: [ ]
        }
    });
    
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
	    if (! nbid) {
	        nbid = Retina.WidgetInstances.NotebookExecuter[0].current_nb();
	    }
	    if (nbid) {
	        stm.send_message(nbid, msgstring, 'action');
        }
    };
    
    // this will return the notebook ID of the currently selected notebook tab
    widget.current_nb = function () {
        var curr_iframe = jQuery('#tab_div').children('.active').children('iframe');
        if (curr_iframe && curr_iframe[0] && (curr_iframe[0].id != 'ipython_dash')) {
            return curr_iframe[0].id;
        } else {
            return undefined;
        }
    };
    
    widget.nb_execute = function (nbid) {
        stm.send_message(nbid, 'IPython.notebook.kernel.restart();', 'action');
        setTimeout("stm.send_message('"+nbid+"', 'IPython.notebook.execute_all_cells();', 'action');", 2000);
    };
    
    // action to be preformed when a notebook tab is created
    widget.nb_created = function (nbid) {
    };

    // action to be preformed when a notebook tab is removed
    widget.nb_deleted = function (nbid) {
    };

    // action to be preformed when a user logs in
    // possibly retrieve additional private data to show in builder selectors
    widget.perform_login = function (params) {
    };
    
    widget.display = function (params) {
        widget = Retina.WidgetInstances.NotebookExecuter[0];

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
    	
    	// get the content div
    	var content = params.target;
    	content.innerHTML = "";
    	
    	var div = document.createElement('div');
    	div.setAttribute('style', 'height: 375px; border-bottom: 1px solid #DDDDDD;');
    	content.appendChild(div);
    	
    	var sample_select_ul = document.createElement('ul');
    	sample_select_ul.setAttribute('class', 'nav nav-tabs');
    	sample_select_ul.setAttribute('style', "margin-left: 30px; margin-bottom: 10px;");

    	var sample_select_disp = document.createElement('div');
    	sample_select_disp.setAttribute('class', 'tab-content');

    	var sample_select_li = document.createElement('li');
    	sample_select_li.setAttribute('class', 'active');
    	sample_select_li.innerHTML = '<a href="#sample_select_li" data-toggle="tab">select the samples to run in a notebook</a>';
    	sample_select_ul.appendChild(sample_select_li);

    	var sample_select_disp_div = document.createElement('div');
    	sample_select_disp_div.setAttribute('class', 'tab-pane active');
    	sample_select_disp_div.setAttribute('id', 'sample_select_li');
    	sample_select_disp_div.setAttribute('style', 'margin-left: 30px; padding-top: 10px; height: 300px;');
    	sample_select_disp.appendChild(sample_select_disp_div);
    	
    	var ls_multi_container = document.createElement('div');
    	ls_multi_container.setAttribute('style', 'float: left; margin-left: 35px;');

    	var ls_multi = document.createElement('div');
    	ls_multi_container.appendChild(ls_multi);
    	sample_select_disp_div.appendChild(ls_multi_container);

        sample_select_disp.appendChild(sample_select_disp_div);
    	div.appendChild(sample_select_ul);
    	div.appendChild(sample_select_disp);

    	var control_sample_select = document.createElement('div');
    	control_sample_select.setAttribute('style', 'float: left; margin-left: 35px;');
    	sample_select_disp_div.appendChild(control_sample_select);
    	
    	control_sample_select.innerHTML = '<table style="text-align: left; margin-top: 10px;">\
    <tr><th style="width: 100px;">variable name</th>\
      <td style="padding-right: 20px;"><input type="text" id="sample_select_variable_name" value="sample_set" style="margin-bottom: 0px; width: 165px;"></td>\
      <th style="width: 75px;">comment</th>\
      <td rowspan=3 style="margin-top: 10px; vertical-align: bottom;">\
        <textarea id="sample_select_comment" style="width: 175px;">load the initial data</textarea></td>\
      <td rowspan=3 style="vertical-align: middle;"><div style="margin-left: 150px;">\
        <button class="btn btn-primary" type="button" style="width: 100px; font-weight:bold;" onclick="Retina.WidgetInstances.NotebookExecuter[0].">Execute<br>Notebook</button></div></td>\
    </tr><tr><th>cell content</th>\
      <td><select id="sample_select_content_handling" style="margin-bottom: 0px; width: 175px;">\
        <option selected>replace current cell</option>\
        <option>append to current cell</option>\
        <option>create new cell</option>\
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
    	        // create text to send
    	        var senddata   = "";
    	        if (document.getElementById('sample_select_comment').value) {
    		        senddata += "# "+document.getElementById('sample_select_comment').value.split(/\n/).join("\n# ") + "\n";
    		    }
    		    senddata += "id_list = [ "+quote_id.join(", ")+" ]\n";
    	        switch (this_type) {
    	            case 'metagenome':
    	            var space_buff = Array(dataname.length+6).join(" ");
    	            var dataopts = has_wgs ? "method='WGS', function_source='Subsystems'" : "method='Amplicon'";
    	            senddata += dataname+" = { 'statistics': get_collection(mgids=id_list, def_name=\""+dataname+"['statistics']\"),\n";
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
	        }
	    });
        widget.sample_select.render();
        
    };

})();
    