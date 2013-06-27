(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Experimental Design Wizard",
                name: "wizard",
                author: "Tobias Paczian",
                requires: [ "rgbcolor.js" ]
        }
    });

    widget.setup = function () {
	return [ Retina.add_renderer({"name": "heatmap", "resource": "renderers/",  "filename": "renderer.heatmap.js" }),
		 Retina.load_renderer("heatmap"),
		 Retina.add_renderer({"name": "listselect", "resource": "renderers/",  "filename": "renderer.listselect.js" }),
		 Retina.load_renderer("listselect"),
		 Retina.add_renderer({"name": "table", "resource": "renderers/",  "filename": "renderer.table.js" }),
		 Retina.load_renderer("table"),
		 Retina.add_renderer({"name": "plot", "resource": "renderers/",  "filename": "renderer.plot.js" }),
		 Retina.load_renderer("plot"),
		 Retina.add_renderer({"name": "graph", "resource": "renderers/",  "filename": "renderer.graph.js" }),
		 Retina.load_renderer("graph"),
		 Retina.add_renderer({"name": "deviationplot", "resource": "renderers/",  "filename": "renderer.deviationplot.js" }),
		 Retina.load_renderer("deviationplot"),
		 Retina.add_renderer({"name": "boxplot", "resource": "renderers/",  "filename": "renderer.boxplot.js" }),
		 Retina.load_renderer("boxplot")
	       ];
    };
    
    widget.ids = [];
    widget.name_id_hash = {};
    widget.name_mgid_hash = {};
    widget.table = null;
    widget.stats_loaded = false;

    widget.display = function (wparams) {
	widget = this;
	var index = widget.index;

	var target = wparams.target;
	target.innerHTML = "";

	if (! stm.DataStore.hasOwnProperty('metagenome')) {
	    var progress = document.createElement('div');
	    progress.innerHTML = '<div class="alert alert-block alert-info" id="progressIndicator" style="position: absolute; top: 250px; width: 400px; right: 38%;">\
<button type="button" class="close" data-dismiss="alert">×</button>\
<h4><img src="images/loading.gif"> Please wait...</h4>\
<p>The data to be displayed is currently loading.</p>\
<p id="progressBar"></p>\
</div>';
	    target.appendChild(progress);
	    jQuery.getJSON('data/mg_mixs_public.json', function(data) {
		for (var d in data) {
                    if (data.hasOwnProperty(d)) {
			stm.load_data({"data": data[d], "type": d});
                    }
		}
		widget.display(wparams);
            }).fail( function() {
		stm.get_objects({"type": "metagenome", "options": {"status": "public", "verbosity": "mixs", "limit": 0}}).then(function() {
                    widget.display(wparams);
		});
	    });
	    
	    return;
	}
	
	var metagenome_data = [];
	for (i in stm.DataStore["metagenome"]) {
	    if (stm.DataStore["metagenome"].hasOwnProperty(i)) {
		stm.DataStore["metagenome"][i].group = '-';
		var md = { "name": stm.DataStore["metagenome"][i]["name"],
			   "id": i,
			   "project": stm.DataStore["metagenome"][i]["project"],
			   "lat/long": stm.DataStore["metagenome"][i]["latitude"]+"/"+stm.DataStore["metagenome"][i]["longitude"],
			   "location": stm.DataStore["metagenome"][i]["location"]+" - "+stm.DataStore["metagenome"][i]["country"],
			   "collection date": stm.DataStore["metagenome"][i]["collection_date"],
			   "biome": stm.DataStore["metagenome"][i]["biome"],
			   "feature": stm.DataStore["metagenome"][i]["feature"],
			   "material": stm.DataStore["metagenome"][i]["material"],
			   "package": stm.DataStore["metagenome"][i]["package"],
			   "sequencing method": stm.DataStore["metagenome"][i]["seq_method"],
			   "sequencing type": stm.DataStore["metagenome"][i]["sequence_type"]
			 };
		metagenome_data.push(md);
	    }
	}

	// we do not yet have metagenomes selected, show the select
	if (widget.ids.length == 0) {
	    var wrapper = document.createElement('div');
	    wrapper.setAttribute('class', 'container');
	    wrapper.setAttribute('style', 'width: 640px;');

	    target.appendChild(wrapper);

	    var title = document.createElement('div');
	    var select = document.createElement('div');

	    wrapper.appendChild(title);
	    wrapper.appendChild(select);

	    title.innerHTML = "<h2 style='margin-top: 50px;'>Welcome to the Experiment Design Wizard</h2>\
<p style='width: 600px; margin-top: 20px; margin-bottom: 20px;'>\
With the KBase metagenomics wizard, you can design your metagenomic sequencing experiment. Selecting samples for deep(er) sequencing based on a metadata inexpensive 16s amplicon data.</p>\
<p>If you have already uploaded your 16s sequence data, you can select them below. Otherwise please proceed to the <a href='http://140.221.92.81:7051/' target=_blank>upload page</a>.</p>\
<p style='width: 600px; margin-bottom: 20px;'>The wizard assumes that you either already have the data describing your samples (metadata) or are willing to create a spreadsheet with this data using the <a href='http://gensc.org/gc_wiki/index.php/Main_Page' target=_blank>GSC conventions</a>. If have not yet provided metadata for your samples, you can do so using <a href='http://metagenomics.anl.gov/metazen.cgi' target=_blank>Metazen</a>.</p>";

	    title.innerHTML += "<h3 style='margin-bottom: 20px;'>select your samples</h3>";

	    Retina.Renderer.create("listselect", { target: select,
						   multiple: true,
						   data: metagenome_data,
						   value: "id",
						   button: { text: 'next ',
							     icon: "<i class='icon-forward' style='position: relative; top: 2px;'></i>",
							     class: 'btn btn-large',
							     style: 'margin-bottom: 10px; margin-left: 465px;' },
						   callback: function (data) {
						       widget.ids = data;
						       widget.display(wparams);
						   },
						   filter: ["name", "id", "project", "lat/long", "location", "collection date", "biome", "feature", "material", "package", "sequencing method", "sequencing type"] }).render();
	}
	
	// we have metagenomes, show the wizard
	else {
	    
	    // check if all data is loaded
	    if (! widget.stats_loaded) {
		
		// make a promise list
		var num_resolved = 0;
		var total = widget.ids.length * 3;
		var stats_promises = [];
		for (i=0; i<widget.ids.length; i++) {
		    stats_promises.push(stm.get_objects({ "type": "metagenome", "id": widget.ids[i], options: { verbosity: 'full' } }).then(function(){ num_resolved++; document.getElementById('stats_progress').innerHTML = num_resolved + " of " + total; document.getElementById('stats_progress_bar').style.width = parseInt(num_resolved / total * 100)+"%"; }));
		    stats_promises.push(stm.get_objects({ "type": "metagenome_statistics", "id": widget.ids[i], options: { verbosity: 'full' } }).then(function(){ num_resolved++; document.getElementById('stats_progress').innerHTML = num_resolved + " of " + total; document.getElementById('stats_progress_bar').style.width = parseInt(num_resolved / total * 100)+"%"; }));
//		    stats_promises.push(stm.get_objects({ "type": "abundanceprofile", "id": widget.ids[i], options: { "source": "Subsystems", "type": "function" } }).then(function(){ num_resolved++; document.getElementById('stats_progress').innerHTML = num_resolved + " of " + total; document.getElementById('stats_progress_bar').style.width = parseInt(num_resolved / total * 100)+"%"; }));
		    stats_promises.push(stm.get_objects({ "type": "abundanceprofile", "id": widget.ids[i], options: { "source": "M5RNA", "type": "organism" } }).then(function(){ num_resolved++; document.getElementById('stats_progress').innerHTML = num_resolved + " of " + total; document.getElementById('stats_progress_bar').style.width = parseInt(num_resolved / total * 100)+"%"; }));
		}
		
		jQuery.when.apply(this, stats_promises).then(function() {
		    widget.stats_loaded = true;
		    widget.display(wparams);
		});

		target.innerHTML = "<p style='position: absolute; top: 300px; left: 37%;'><img src='images/loading.gif'> loading stats <span id='stats_progress'></span></p>\
<div class='progress' style='width: 400px; position: absolute; top: 350px; left: 37%;'>\
  <div class='bar' id='stats_progress_bar' style='width: 0%;'></div>\
</div>";
		
		return;
	    }
	    
	    var metagenome_data = [];
	    for (i=0;i<widget.ids.length;i++) {
	    	var mg = stm.DataStore.metagenome[widget.ids[i]];
		widget.name_mgid_hash[mg.name] = mg.id;
	    	metagenome_data.push({name: mg.name, id: mg.id, group: "-"});
	    }

	    var group_select = widget.group_select = Retina.Renderer.create("listselect", { multiple: true,
	    										    data: metagenome_data,
	    										    value: "id",
	    										    filter: [ "name", "id", "group" ] });

	    var single_select = widget.single_select = Retina.Renderer.create("listselect", { multiple: false,
	    										     data: metagenome_data,
	    										     no_button: true,
	    										     value: "id",
	    										     filter: [ "name", "id" ] });
	    
	    // do the bottom part
	    target.innerHTML = '<td colspan=3 style="padding-top: 10px;">\
  <div class="tabbable">\
    <ul class="nav nav-tabs" id="tab_list">\
       <li class="active"><a id="tab_welcome" onfocus="this.blur();" data-toggle="tab" href="#welcome">Get Started</a></li>\
       <li style="margin-bottom: -11px;"><a id="tab_pcoa" onfocus="this.blur();" data-toggle="tab" href="#pcoa" onclick="if(! Retina.WidgetInstances.wizard['+index+'].pcoa){document.getElementById(\'pcoa\').className=\'tab-pane active\';Retina.WidgetInstances.wizard['+index+'].render_pcoa('+index+');}">'+widget.number('1')+'Sample Subselection</a></li>\
       <li style="margin-bottom: -11px;"><a id="tab_depth" onfocus="this.blur();" data-toggle="tab" href="#depth" onclick="if(! Retina.WidgetInstances.wizard['+index+'].depth_graph){document.getElementById(\'depth\').className=\'tab-pane active\';Retina.WidgetInstances.wizard['+index+'].render_depth('+index+');}">'+widget.number('2')+'Sequence Depth Estimation Summary</a></li>\
       <li style="margin-bottom: -11px;"><a id="tab_result" onfocus="this.blur();" data-toggle="tab" href="#result" onclick="if(! Retina.WidgetInstances.wizard['+index+'].result_table){document.getElementById(\'result\').className=\'tab-pane active\';Retina.WidgetInstances.wizard['+index+'].render_result(null, null, '+index+');}">'+widget.number('3')+'Sequence Depth Detailed Reports</a></li>\
    </ul>\
     \
    <div id="tab_div" class="tab-content" style="overflow: visible;">\
<div class="tab-pane active span10" id="welcome" style="padding-left: 15px;"><h2 style="margin-bottom: 15px;">Wizard Steps</h2><p style="margin-bottom: 20px;">The Experimental Design Wizard consists of three steps. You can get to the next step by clicking the <b>next</b> button, or by selecting the appropriate tab above. You can always go back to the previous steps to adjust your selections. The steps are:</p>\
<ul style="margin-left: 150px; margin-top: 50px; list-style: none;">\
    <li>'+widget.number('1')+'<p style="width: 600px;"><b>Sample Subselection</b><br>In this section you can group and subselect your samples based on metadata, the results of a preliminary comparative analysis (PCoA), or any other criteria you choose.</p><br><br></li>\
    <li>'+widget.number('2')+'<p style="width: 600px;padding-left: 36px;"><b>Sequence Depth Estimation Summary</b><br>This tool provides a summary that indicates the likelihood that you will be able to generate an assembly for each taxa as well as the expected proportion of proteins that should be annotated in each taxa without assembly.<br>Estimates use <a href="http://www.ncbi.nlm.nih.gov/pubmed/3294162" target=_blank>Lander Waterman based metrics</a>, the composition of your 16s samples, and typical settings for and Illumina-based WGS sequencing run.</p><br><br></li>\
    <li>'+widget.number('3')+'<p style="width: 600px;"><b>Sequence Depth Detailed Reports</b><br>Here you can access the complete assembly and gene detection predictions for all taxa in each of your samples.</p><br><br></li>\
</ul>\
<p style="margin-bottom: 20px;"><button class="btn btn-large" style="margin-left: 250px;" onclick="if(confirm(\'Really return to the sample selection?\\nThe statistical data will have to be reloaded.\')){window.top.location=\'wizard.html\';}"><i class="icon-backward" style="position: relative; top: 2px;"></i> previous</button><button class="btn btn-large" style="margin-left: 20px;" onclick="document.getElementById(\'tab_pcoa\').click();">next <i class="icon-forward" style="position: relative; top: 2px;"></i></button></p></div>\
    <div class="tab-pane" id="pcoa" style="padding-left: 15px;"></div>\
       <div class="tab-pane" id="depth" style="padding-left: 15px;"></div>\
       <div class="tab-pane" id="result" style="padding-left: 15px;"></div>\
       <div class="tab-pane" id="overview" style="padding-left: 15px;"></div>\
       <div class="tab-pane" id="qc" style="padding-left: 15px;"></div>\
    </div>\
  </div>\
</td>';

	    widget.render_result();
	}
    };

    widget.render_result = function () {
	var target = document.getElementById('result');
	target.innerHTML = "<button class='btn btn-large' style='position: absolute; top: 180px; left: 1100px;' onclick='document.getElementById(\"tab_depth\").click();'> <i class='icon-backward' style='position: relative; top: 2px;'></i> previous</button><h2 style='margin-bottom: 10px;'>Sequence Depth Detailed Reports</h2><div id='result_settings_div'></div><input type='button' class='btn' value='download table data' onclick='stm.saveAs(stm.DataStore.intermediate[\"result\"],\"sequence depth detailed report.csv\");' style='float: right; margin-right: 10px;margin-bottom: 10px;'><div id='result_table_div'></div>";

	
    }

    widget.rerender_depth = function (params) {
	var genome_size = document.getElementById('depth_genomesize') ? parseInt(document.getElementById('depth_genomesize').value) : 5000000;
	var coverage = document.getElementById('depth_coverage') ? parseInt(document.getElementById('depth_coverage').value) : 30;
	var sequence_size = genome_size * coverage;
	var data = Retina.WidgetInstances.wizard[1].abu_graph.settings.data;
	var new_data = [];
	var new_labels = Retina.WidgetInstances.wizard[1].abu_graph.settings.x_labels.slice(0,params.index+1);
	var sum = [];
	for (i=0;i<data.length;i++) {
	    sum[i] = 0;
	    for (h=0;h<data[i].data.length;h++) {
		sum[i] += parseInt(data[i].data[h]);
	    }
	}

	for (h=0;h<data.length;h++) {
	    new_data.push({ name: data[h].name, data: [], fill: data[h].fill });
	    for (i=0;i<=params.index;i++) {
		var n = parseInt(data[h].data[i]) / sum[h];
		new_data[h].data.push((n>0) ? Math.round(sequence_size / n) : 0);
	    }
	}

	Retina.WidgetInstances.wizard[1].depth_graph.settings.data = new_data;
	Retina.WidgetInstances.wizard[1].depth_graph.settings.x_labels = new_labels;
	Retina.WidgetInstances.wizard[1].depth_graph.render();
    }

    widget.depth_details = function (params) {
	var id = widget.name_id_hash[params.series];
	var val = params.value / parseInt(stm.DataStore.metagenome_statistics[widget.name_mgid_hash[params.series]].sequence_stats.sequence_count_raw);
	var percent = val * 100;
	percent = percent.formatString(4);

	var genome_size = document.getElementById('genome_length') ? parseFloat(document.getElementById('genome_length').value) * 1000000 : 4600000;
	var read_length = document.getElementById('read_length') ? parseInt(document.getElementById('read_length').value) : 125;
	var num_reads = document.getElementById('run_size') ? parseInt(document.getElementById('run_size').value) : 100000000;

	var lw = widget.lander_waterman( { genome_size: genome_size,
					   read_length: read_length,
					   num_reads: parseInt(val * num_reads) });

	if (params.nodraw) {
	    return lw;
	} else {
	    var target = document.getElementById('abundance_result_detail'+id);
	    target.innerHTML = "<br>The genus <b>"+params.label+"</b> was detected in <b>"+percent+"%</b> of your sample. Given the selected parameters you can expect the following results:<br><br><table style='text-align: left;'>\
<tr><th style='width: 200px;'>genome coverage</th><td>"+lw.coverage.toFixed(4)+" fold</td></tr>\
<tr><th># contigs</th><td>"+lw.num_contigs+"</td></tr>\
<tr><th>sequences / contig</th><td>"+lw.seqs_per_contig+"</td></tr>\
<tr><th>contig length</th><td>"+lw.average_contig_length+"</td></tr>\
<tr><th>proteins covered</th><td>"+lw.percent_proteins_detected+"%</td></tr>\
</table>";
	}
    }

    /* calculates lander waterman data
       params:
          genome_size
	  read_length
	  num_reads
     */
    widget.lander_waterman = function (params) {
	var overlap = 30;
	var theta = overlap / params.read_length;
	var sigma = 1 - theta;
	var coverage = params.read_length * params.num_reads / params.genome_size;
	var num_contigs = params.num_reads * Math.exp(-1 * coverage * sigma);
	var seqs_per_contig = Math.exp(coverage * sigma);
	var average_contig_length = params.read_length * (((Math.exp(coverage * sigma) - 1 )  / coverage) + (1 - sigma));
	var percent_proteins_detected = parseInt(100 * num_contigs * average_contig_length / params.genome_size);
	
	if (num_contigs < 1) { num_contigs = 1; }
	if (num_contigs > params.num_reads) { num_contigs = params.num_reads; }
	num_contigs = parseInt(num_contigs);
	
	if (average_contig_length > params.genome_size) { average_contig_length = params.genome_size; }
	average_contig_length = parseInt(average_contig_length);
	
	if (seqs_per_contig < 1) { seqs_per_contig = 1; }
	if (seqs_per_contig > parseInt(params.num_reads / num_contigs)) { seqs_per_contig = parseInt(params.num_reads / num_contigs); }
	seqs_per_contig = parseInt(seqs_per_contig);

	if (isNaN(percent_proteins_detected)) {
	    percent_proteins_detected = 100;
	}

	return { coverage: coverage,
		 num_contigs: num_contigs,
		 seqs_per_contig: seqs_per_contig,
		 average_contig_length: average_contig_length,
		 percent_proteins_detected: percent_proteins_detected };
    }

    widget.render_depth = function (index) {
	if (document.getElementById('depth').className == 'tab-pane active') {
	    widget = Retina.WidgetInstances.wizard[index];

	    var disp = document.getElementById('depth');
	    
	    var show_ids = widget.depth_mgs ? widget.depth_mgs : widget.ids;
	    var genome_size = document.getElementById('genome_length') ? parseInt(document.getElementById('genome_length').value) : 4600000;
	    var read_length = document.getElementById('read_length') ? parseInt(document.getElementById('read_length').value) : 125;
	    var num_reads = document.getElementById('run_size') ? parseInt(document.getElementById('run_size').value) : 100000000;

	    var level = 6;
	    var data = widget.extract_data({ ids: show_ids, type: "organism", level: level, filter_bacteria: true });

	    var rows = [];
	    for (i=0;i<data.rows.length;i++) {
		var row = [data.rows[i]];
		for (h=0;h<data.matrix_data[i].length;h++) {
		    row.push(data.matrix_data[i][h]);
		}
		rows.push(row);
	    }

	    var spaces = "";
	    var colors = GooglePalette(20);
	    var graph_data = [];
	    var label_data = [];
	    var result_table_data = [];
	    var result_table_header = [ 'genus' ];
	    var genus_rows_hash = [];
	    var ds = ['string'];
	    for (h=0;h<show_ids.length;h++) {		
		rows.sort(function(a,b){return b[h+1] - a[h+1];});
		var name = stm.DataStore.metagenome[show_ids[h]].name;
		result_table_header.push(name + ' coverage');
		result_table_header.push(name + ' proteins');
		ds.push('number');
		ds.push('number');
		var d = [];
		var fills = [];
		var dumpstore = name+" abundance data\n";
		label_data.push([]);
		for (i=0;i<rows.length;i++) {
		    if (! genus_rows_hash[rows[i][0]]) {
			genus_rows_hash[rows[i][0]] = [];
		    }
		    if (rows[i][h + 1] == 0) {
			genus_rows_hash[rows[i][0]][h] = [ "<span style='color: "+colors[1]+";'>0</span>", "<span style='color: "+colors[1]+";'>0 %</span>" ];
			continue;
		    }
		    var cell_val = parseInt(rows[i][h + 1]);
		    var landerwaterman = widget.depth_details({ series: name, value: cell_val, nodraw: true });
		    if (i<41) {
			d.push(cell_val);
		    }
		    var cov = landerwaterman.coverage;
		    if (cov > 1) { cov = cov.toFixed(0); } else { cov = cov.toFixed(4); }
		    if (landerwaterman.coverage >= 30) {
			fills.push(colors[3]);
			genus_rows_hash[rows[i][0]][h] = [ "<span style='color: "+colors[3]+";'>"+cov+"</span>", "<span style='color: "+colors[3]+";'>"+landerwaterman.percent_proteins_detected+"%</span>" ];
		    } else if ((landerwaterman.coverage >= 1) && (landerwaterman.percent_proteins_detected >= 95)) {
			fills.push(colors[0]);
			genus_rows_hash[rows[i][0]][h] = [ "<span style='color: "+colors[0]+";'>"+cov+"</span>", "<span style='color: "+colors[0]+";'>"+landerwaterman.percent_proteins_detected+"%</span>" ];
		    } else if ((landerwaterman.coverage >= 0.5) && (landerwaterman.percent_proteins_detected >= 50)) {
			fills.push(colors[2]);
			genus_rows_hash[rows[i][0]][h] = [ "<span style='color: "+colors[2]+";'>"+cov+"</span>", "<span style='color: "+colors[2]+";'>"+landerwaterman.percent_proteins_detected+"%</span>" ];
		    } else {
			fills.push(colors[1]);
			genus_rows_hash[rows[i][0]][h] = [ "<span style='color: "+colors[1]+";'>"+cov+"</span>", "<span style='color: "+colors[1]+";'>"+landerwaterman.percent_proteins_detected+"%</span>" ];
		    }
		    label_data[h].push(rows[i][0]);
		    dumpstore += rows[i][0]+"\t"+cell_val+"\n";
		}

		if (! stm.DataStore.hasOwnProperty('intermediate')) {
		    stm.DataStore['intermediate'] = {};
		}
		stm.DataStore.intermediate[name] = dumpstore;

		graph_data.push( [ { name: name, data: d, fill: fills } ] );
		widget.name_id_hash[name] = h;
		var group = '';
		if (stm.DataStore.metagenome[show_ids[h]].group && stm.DataStore.metagenome[show_ids[h]].group != '-') {
		    group = ' ('+stm.DataStore.metagenome[show_ids[h]].group+')';
		}
		spaces += "<tr><td><div id='abundance_result"+h+"'></div></td><td style='vertical-align: top;'><h4>"+name+group+" <input type='button' value='download data' onclick='stm.saveAs(stm.DataStore.intermediate[\""+name+"\"],\""+name+"-abundances.csv\");' class='btn' style='margin-left: 20px;'></h4><div id='abundance_result_detail"+h+"'></div></td></tr>";
	    }
	    var genuses = Retina.keys(genus_rows_hash).sort();
	    var numsamples = show_ids.length;
	    for (i=0;i<genuses.length;i++) {
		var row = [ genuses[i] ];
		for (h=0;h<numsamples;h++) {
		    row.push(genus_rows_hash[genuses[i]][h][0]);
		    row.push(genus_rows_hash[genuses[i]][h][1]);
		}
		result_table_data.push(row);
	    }
	    
	    var numseqtext = "";
	    if (num_reads == 100000000) {
		numseqtext = "one half HiSeq lane ("+num_reads + " sequences)";
	    } else if (num_reads == 200000000) {
		numseqtext = "one HiSeq lane ("+num_reads + " sequences)";
	    } else if (num_reads == 50000000) {
		numseqtext = "one quarter HiSeq lane ("+num_reads + " sequences)";
	    } else {
		numseqtext = num_reads + " sequences";
	    }

	    document.getElementById('result_settings_div').innerHTML = "<p style='width: 940px; margin-bottom: 30px;'>The table below shows you the expected genome coverage and the percentage of detected proteins for your selected samples. The results shown should be taken as a rough estimate.</p>\
  <p style='width: 940px; margin-bottom: 30px;'>This tool is designed to work for Bacteria and Archaea, while the underlying technology might work for Viruses and Eukarya as well, we have not tested it. The tool is therefore limited to Bacteria and Archaea. We assume an average genome size of 3MBp.</p>\
  <p class='alert alert-success' style='width: 680px; margin-right: 10px; float: left;'><b>green</b> strong assembly candidate - enables comparative analysis - every core metabolism protein annotated<br>coverage >= 30 fold</p>\
  <p class='alert alert-info' style='width: 680px; margin-right: 10px; float: left;'><b>blue</b> weak assembly candidate - weak assembly candidate - enables comparative analysis - likely every core metabolism protein is annotated.<br>coverage >= 1 fold - at least 95% proteins detected</p>\
  <p class='alert alert-warning' style='width: 680px; margin-right: 10px; float: left;'><b>yellow</b> no assembly - likely >50% core metabolism proteins annotated<br>coverage >= 0.5 fold - at least 50% proteins detected</p>\
  <p class='alert alert-error' style='width: 680px; margin-right: 10px; float: left;'><b>red</b> no assembly - meaningful comparison of samples is not possible<br>coverage less than 0.5 fold or less than 50% proteins detected</p><h3 style='clear: both;'>settings</h3><table style='text-align: left; margin-bottom: 30px;'><tr><th style='padding-right: 15px;'>genome length (#bp)</th><td id='genome_length_mirror'></td></tr><tr><th>run size (#reads)</th><td id='run_size_mirror'></td></tr><tr><th>read length (#bp)</th><td id='read_length_mirror'></td></tr></table>";

	    var dumpstore = result_table_header.join("\t")+"\n";
	    for (i=0;i<result_table_data.length;i++) {
		dumpstore += result_table_data[i].join("\t").replace(/<(.|\n)*?>/g, "")+"\n";
	    }
	    if (! stm.DataStore.hasOwnProperty('intermediate')) {
		stm.DataStore['intermediate'] = {};
	    }
	    stm.DataStore.intermediate['result'] = dumpstore;

	    if (widget.result_table) {
		widget.result_table.settings.data = { data: result_table_data, header: result_table_header };
		widget.result_table.settings.tdata = null;
	    } else {
		widget.result_table = Retina.Renderer.create("table", { target: document.getElementById('result_table_div'),
									rows_per_page: -1,
									filter: { 0: { type: "select" } },
									sorttype: ds,
									data: { data: result_table_data, header: result_table_header } } );
		
	    }
	    widget.result_table.render();

	    if (document.getElementById('spaces')) {
		document.getElementById('spaces').innerHTML = spaces;
	    } else {
		disp.innerHTML = "<table id='abundance_result'><tr><td style='vertical-align: top; width: 800px; padding-right: 50px;'>\
  <h2>Sequence Depth Estimation Summary</h2>\
  <p>The graphs below show the rank abundance plots for your selected samples. Click on a bar to get details about the individual taxa. You can also change the settings for your WGS sequencing run. Default settings are for half of an Illumina lane with 125bp reads for a genome estimated to be the same size as E coli. These settings can be changed using the dropdown menus to select preprogrammed values or by typing the desired value into the text boxes. Click 'update graphs' to apply new settings.</p>\
  <p class='alert alert-success'>The green bars represent strong assembly candidates. These taxa are present with high enough coverage to enable assembly or comparative analysis of annotated features. It is very likely that every core metabolism protein will be annotated.</p>\
  <p class='alert alert-info'>The blue bars represent weak assembly candidates. These taxa have an estimated coverage too low to ensure complete assembly, but high enough to enable comparative analysis of annotated features. It is likely that the full compliment of core metabolism proteins will be annotated.</p>\
  <p class='alert alert-warning'>The yellow bars represent taxa that have an estimated coverage too low for any assembly. It is likely that more than 50% of the core metabolism proteins will be hit.</p>\
  <p class='alert alert-error'>The red bars represent sparse data. The expected abundances for these taxa are too low to enable assembly or meaningful comparison of annotated features.</p>\
</td><td><button class='btn btn-large' style='margin-left: 250px; margin-top: -70px;' onclick='document.getElementById(\"tab_pcoa\").click();'><i class='icon-backward' style='position: relative; top: 2px;'></i> previous</button><button class='btn btn-large' style='margin-left: 20px; margin-top: -70px;' onclick='document.getElementById(\"tab_result\").click();'>next <i class='icon-forward' style='position: relative; top: 2px;'></i></button><br>\
<div id='depth_settings_form'><h3>settings</h3>\
<table>\
  <tr><td style='padding-bottom: 9px;'>genome length (#bp)</td><td><select id='genome_length_master' onclick='document.getElementById(\"genome_length\").value=this.options[this.selectedIndex].value;' onchange='document.getElementById(\"genome_length\").value=this.options[this.selectedIndex].value;'><option value='3'>default</option><option value='4.6'>E. coli</option><option value='4.2'>B. subtilis</option><option value='0.8'>M. Pneumoniae</option><option value='5'>manual</option></select></td><td><div class='input-append' style='margin-bottom: 9px;'><input class='span2' type='text' id='genome_length' value='3' style='width: 112px;'><span class='add-on'>Mbp</span></div></td></tr>\
  <tr><td style='padding-bottom: 9px;'>run size (#reads)</td><td><select id='run_size_master' onclick='document.getElementById(\"run_size\").value=this.options[this.selectedIndex].value;' onchange='document.getElementById(\"run_size\").value=this.options[this.selectedIndex].value;'><option value='200000000'>HiSeq Lane</option><option value='100000000' selected>&frac12; HiSeq Lane</option><option value='50000000'>&frac14; HiSeq Lane</option><option>manual</option></select></td><td><input type='text' style='width: 150px;' id='run_size' value='100000000'></td></tr>\
  <tr><td style='padding-bottom: 9px;'>read length (#bp)</td><td><select id='read_length_master' onclick='document.getElementById(\"read_length\").value=this.options[this.selectedIndex].value;' onchange='document.getElementById(\"read_length\").value=this.options[this.selectedIndex].value;'><option value='100'>100 bp</option><option selected value='125'>125 bp</option><option value='150'>150 bp</option><option value='125'>manual</option></select></td><td><div style='margin-bottom: 9px;' class='input-append'><input class='span2' type='text' id='read_length' value='125'><span class='add-on'>bp</span></div></td></tr>\
  <tr><td></td><td></td><td><button class='btn btn-large' onclick='Retina.WidgetInstances.wizard["+index+"].render_depth("+index+");'>update graphs</button></td></tr>\
</table></div></td></tr></table>\
<table id='spaces'>"+spaces+"</table>";
	    }

	    document.getElementById('genome_length_mirror').innerHTML = document.getElementById('genome_length_master').options[document.getElementById('genome_length_master').selectedIndex].label + ' - ' + document.getElementById('genome_length').value + 'Mbp';
	    document.getElementById('run_size_mirror').innerHTML = document.getElementById('run_size_master').options[document.getElementById('run_size_master').selectedIndex].label + ' - ' + document.getElementById('run_size').value + ' reads';
	    document.getElementById('read_length_mirror').innerHTML = document.getElementById('read_length').value + 'bp';
	    
	    Retina.RendererInstances.graph.length = 1;
	    for (z=0;z<graph_data.length;z++) {
		var rend = Retina.Renderer.create("graph", { target: document.getElementById('abundance_result'+z), x_labels: label_data[z], data: graph_data[z], x_labels_rotation: -40, y_scale: 'log', chartArea: [ 0.1, 0.05, 0.95, 0.6 ], onclick: Retina.WidgetInstances.wizard[index].depth_details });
		rend.render();
	    }
	}
    };

    widget.render_qc_distribution = function (index) {
	if (document.getElementById('qc').className == 'tab-pane active') {
	    
	    widget = Retina.WidgetInstances.wizard[index];
	    
	    var display_area = document.getElementById('qc');
	    var menu = document.createElement('div');
	    menu.setAttribute('style', 'margin-bottom: 20px;');
	    var display = document.createElement('div');
	    
	    display_area.innerHTML = "";
	    display_area.appendChild(menu);
	    display_area.appendChild(display);
	    
	    var d1 = document.createElement('div');
	    d1.setAttribute('style', 'margin-bottom: 20px;');
	    var d2 = document.createElement('div');
	    
	    display.appendChild(d1);
	    display.appendChild(d2);
	    	    
	    menu.innerHTML = '';
	    
	    var result = widget.extract_data({ ids: widget.ids, level: 3, type: 'organism', normalize: true });
	    var res2 = widget.extract_data({ ids: widget.ids, level: 3, type: 'organism', normalize: false });
		
	    var data = widget.transpose(result.matrix_data);
	    if (widget.distribution_box_1) {
		jQuery.extend(widget.distribution_box_1.settings, { data: data, target: d1 });
	    } else {
		widget.distribution_box_1 = Retina.Renderer.create('boxplot', { data: data, target: d1, title: 'raw abundance', titles: widget.ids, height: 400, minwidth: 400 });
	    }
	    widget.distribution_box_1.render();
	    
	    var data2 = widget.transpose(res2.matrix_data);
	    if (widget.distribution_box_2) {
		jQuery.extend(widget.distribution_box_2.settings, { data: data2, target: d2 });
	    } else {
		widget.distribution_box_2 = Retina.Renderer.create('boxplot', { data: data2, target: d2, normalize_standardize: true, title: 'normalized-standardized abundance', titles: widget.ids, height: 400, minwidth: 400 });
	    }
	    widget.distribution_box_2.render();
	}
    };
 
    widget.plot_select = function (points) {
	var ps = Retina.WidgetInstances.wizard[1].pcoa.svg.plot.plotPoints;
	for (i=0;i<ps.length;i++) {
	    ps[i][0].svg.style.fill = "black";
	    ps[i][0].svg.style.stroke = "black";
	}
	var opts = "";
	for (i=0;i<points.length;i++) {
	    points[i].svg.style.fill = "red";
	    points[i].svg.style.stroke = "red";
	    opts += "<option>"+points[i].title+"</option>";
	}
	document.getElementById('pcoa_group_list').innerHTML = opts;
	Retina.WidgetInstances.wizard[1].pcoa_selection = points;
    };

    widget.color_pcoa = function () {
	var datum = document.getElementById('pcoa_metadata_select').options[document.getElementById('pcoa_metadata_select').selectedIndex].value;
	var colors = [ '#EE5F5B', '#0088CC', '#62C462', '#FBB450', '#5BC0DE', '#ee5be0', '#BD362F', '#0044CC', '#51A351', '#F89406', '#2F96B4', '#bd2fa6'];
	var colorcount = 0;
	var md = {};
	var mg = {};
	var series = [];
	var new_points = [];
	for (i=0;i<widget.ids.length;i++) {
	    if (stm.DataStore.metagenome[widget.ids[i]].hasOwnProperty(datum) || (stm.DataStore.metagenome[widget.ids[i]].mixs && stm.DataStore.metagenome[widget.ids[i]].mixs.hasOwnProperty(datum))) {
		var check = stm.DataStore.metagenome[widget.ids[i]].hasOwnProperty(datum) ? stm.DataStore.metagenome[widget.ids[i]][datum] : stm.DataStore.metagenome[widget.ids[i]].mixs[datum];
		if (! md.hasOwnProperty(check)) {
		    md[check] = colorcount;
		    series.push({ name: check, color: colors[colorcount], shape: 'circle', filled: true });
		    new_points.push([]);
		    colorcount++;
		    
		}
		mg[stm.DataStore.metagenome[widget.ids[i]].name] = md[check];
	    }
	}

	var pcoa = Retina.WidgetInstances.wizard[1].pcoa;
	var ps = Retina.WidgetInstances.wizard[1].plotPoints;

	for (i=0;i<ps.length;i++) {
	    new_points[mg[ps[i][0].title]].push(ps[i][0]);
	}
	pcoa.settings.data = { series: series, points: new_points };
	pcoa.settings.show_legend = true;
	pcoa.settings.legend_position = 'right';
	pcoa.settings.target.innerHTML = "";
	pcoa.render();
    }

    widget.assign_group = function (update) {
	var points = Retina.WidgetInstances.wizard[1].pcoa_selection;
	var pnames = {};
	if (! update) {
	    for (i=0;i<points.length;i++) {
		pnames[points[i].title] = 1;
	    }
	}
	var group = document.getElementById('pcoa_group_name').value;

	var check_selection = {};
	var table = Retina.WidgetInstances.wizard[1].sample_table;
	for (i=0;i<table.settings.tdata.length;i++) {
	    table.settings.tdata[i].include = "<input type='checkbox' onclick='Retina.WidgetInstances.wizard[1].toggle_mg(this, \""+table.settings.tdata[i].ID+"\");'>";
	    if (! update) {
		if (pnames[table.settings.tdata[i].name]) {
		    table.settings.tdata[i].group = group;
		    stm.DataStore.metagenome[table.settings.tdata[i].ID].group = group;
		}
	    }
	    if (! check_selection.hasOwnProperty(table.settings.tdata[i].group) || (check_selection[table.settings.tdata[i].group].alpha < table.settings.tdata[i]["alpha diversity"])) {
		check_selection[table.settings.tdata[i].group] = { "alpha": table.settings.tdata[i]["alpha diversity"],
								   "index": i };
	    }
	}
	Retina.WidgetInstances.wizard[1].depth_mgs = [];
	for (i in check_selection) {
	    if (check_selection.hasOwnProperty(i)) {
		table.settings.tdata[check_selection[i].index].include = "<input type='checkbox' checked onclick='Retina.WidgetInstances.wizard[1].toggle_mg(this, \""+table.settings.tdata[check_selection[i].index].ID+"\");'>";
		Retina.WidgetInstances.wizard[1].depth_mgs.push(table.settings.tdata[check_selection[i].index].ID);
	    }
	}
	table.render();
    };

    widget.toggle_mg = function (checkbox, id) {
	var checked = "";
	if (checkbox.checked) {
	    Retina.WidgetInstances.wizard[1].depth_mgs.push(id);
	    checked = " checked";
	} else {
	    var new_list = [];
	    for (i=0;i<Retina.WidgetInstances.wizard[1].depth_mgs.length;i++) {
		if (Retina.WidgetInstances.wizard[1].depth_mgs[i] != id) {
		    new_list.push(Retina.WidgetInstances.wizard[1].depth_mgs[i]);
		}
	    }
	    Retina.WidgetInstances.wizard[1].depth_mgs = new_list;
	}

	var table = Retina.WidgetInstances.wizard[1].sample_table;
	for (i=0;i<table.settings.tdata.length;i++) {
	    if (table.settings.tdata[i].ID == id) {
		table.settings.tdata[i].include = "<input type='checkbox'"+checked+" onclick='Retina.WidgetInstances.wizard[1].toggle_mg(this, \""+id+"\");'>";
	    }
	}
    }

    widget.render_pcoa = function (index) {
	if (document.getElementById('pcoa').className == 'tab-pane active') {
	    
	    widget = Retina.WidgetInstances.wizard[index];
	    
	    var display_area = document.getElementById('pcoa');
	    var menu = document.createElement('div');
	    menu.setAttribute('style', 'margin-bottom: 20px;');
	    var display = document.createElement('div');
	    display.setAttribute('style', "float: left;");
	    var grouper = document.createElement('div');
	    grouper.setAttribute('style', "float: left; margin-left: 40px;");
	    var tablespace = document.createElement('div');
	    tablespace.setAttribute('style', 'clear: both; padding-top: 50px;');
	    var info = document.createElement('div');
	    info.setAttribute('class', 'alert alert-info');
	    info.setAttribute('style', 'float: right; width: 300px; margin-top: 60px; margin-bottom: -50px;');
	    info.innerHTML = "<i class='icon-info-sign icon-white'></i><div style='float: right; width: 275px;'>Note that only included samples will be shown in the Sequence Depth Estimation Summary</div>";

	    display_area.innerHTML = "";
	    display_area.appendChild(menu);
	    display_area.appendChild(display);
	    display_area.appendChild(grouper);
	    display_area.appendChild(info);
	    display_area.appendChild(tablespace);
	    	    
	    var tdata = [];
	    for (i=0;i<widget.ids.length;i++) {
		var mg = stm.DataStore.metagenome[widget.ids[i]];
		var id = widget.ids[i];
		tdata.push([ mg.id, mg.name, stm.DataStore.metagenome[id].group ? stm.DataStore.metagenome[id].group : "-", parseFloat(stm.DataStore.metagenome_statistics[id].sequence_stats.alpha_diversity_shannon).formatString(2), "<input type='checkbox' checked onclick='Retina.WidgetInstances.wizard[1].toggle_mg(this, \""+id+"\");'>" ]);
	    }
	    var table_data = { data: tdata, header: [ "ID", "name", "group", "alpha diversity", "include" ] };
	    var table = widget.sample_table = Retina.Renderer.create("table", { target: tablespace,
										data: table_data,
										rows_per_page: 15,
										sort_autodetect: true,
										filter_autodetect: true,
										editable: { 2: true },
										edit_callback: function(data){
										    Retina.WidgetInstances.wizard[index].update_groups(data, index);
										},
										hide_options: false });
	    table.render();

	    menu.innerHTML = '\
<h2>Groups Tool</h2>\
<p style="width: 940px; margin-top: 10px; margin-bottom: 20px;">This tool will allow you to explore how well your samples group, helping you to select the best sample(s) for WGS sequencing.<br><br>The PCoA presented on the page provides a preliminary characterization of your samples that will enable you to see how closely related they are. The PCoA represents the first two principal coordinates of a euclidean distance based principal coordinate analysis of abundance data that have undergone normalization and standardization <a href="http://www.ncbi.nlm.nih.gov/pubmed/?term=17983263" target=_blank>[1]</a>.</p>\
<p style="width: 940px; margin-bottom: 20px;">Group selection can be performed in one of three ways, select the most appropriate choice: </p>\
<p style="width: 940px; margin-bottom: 20px;"><div class="btn-group" data-toggle="buttons-radio">\
<button class="btn alert alert-info btn-large" style="height: 66px;" onclick="document.getElementById(\'use_group_div\').style.display=\'\';document.getElementById(\'use_representatives_div\').style.display=\'none\';document.getElementById(\'use_all_div\').style.display=\'none\';">I expect my samples to be closely related.<br>I want to exclude samples too distant from the rest.</button>\
<button class="btn alert alert-info btn-large" style="height: 66px;" onclick="document.getElementById(\'use_group_div\').style.display=\'none\';document.getElementById(\'use_representatives_div\').style.display=\'\';document.getElementById(\'use_all_div\').style.display=\'none\';">I expect my samples to form groups that correspond to metadata.<br>I want to pick a representative from each group.</button>\
<button class="btn alert alert-info btn-large" style="height: 66px;" onclick="document.getElementById(\'use_group_div\').style.display=\'none\';document.getElementById(\'use_representatives_div\').style.display=\'none\';document.getElementById(\'use_all_div\').style.display=\'\';">I want to skip the Groups Tool</button></div></p>\
<table id="use_group_div" style="display: none; margin-left: 100px;"><tr><td><button class="btn btn-large" style="margin-right: 50px;" onclick="document.getElementById(\'tab_welcome\').click();"> <i class="icon-backward" style="position: relative; top: 2px;"></i> previous</button></td><td><div style="width: 600px; margin-bottom: 0px;" class="alert alert-info"><ul><li>Click-drag a square over the samples in the graph that should be included.<br>The selection will appear in the <b>current selection</b> box</li><li>Click the <b>next</b> button, when you are satisfied with your selection</li></ul></div></td><td><button class="btn btn-large" style="margin-left: 50px;" onclick="var l=[];for(i=0;i<document.getElementById(\'pcoa_group_list\').options.length;i++){l.push(Retina.WidgetInstances.wizard['+index+'].name_mgid_hash[document.getElementById(\'pcoa_group_list\').options[i].value]);}Retina.WidgetInstances.wizard['+index+'].depth_mgs=l;document.getElementById(\'tab_depth\').click();">next <i class="icon-forward" style="position: relative; top: 2px;"></i></button></td></tr></table>\
<table id="use_representatives_div" style="display: none; margin-left: 100px;"><tr><td><button class="btn btn-large" style="margin-right: 50px;" onclick="document.getElementById(\'tab_welcome\').click();"> <i class="icon-backward" style="position: relative; top: 2px;"></i> previous</button></td><td><div style="width: 600px; margin-bottom: 0px;" class="alert alert-info"><ul><li>Select the metadata you want to group by with the "Metadata" drop-down menu and click the <b>color PCoA</b> button</li><li>Click-drag a square over the samples in the graph that should belong to one group.<br>You will see your selection in the <b>current selection</b> box.</li><li>Pick a group name and click the <b>assign group</b> button.<br>Your selection will be reflected in the table below the graph.</li><li>Repeat this step until you have assigned a group to each sample.<br>A representative for each group will be chosen automatically based on best alpha diversity.<br>You can manually change the selection by using the checkboxes in the <b>include</b> column.</li><li>Once you are satisfied with the selection, click the <b>next</b> button to proceed to step 2.</li><li>Selected groupings will appear in the "groups" section of the table beneath the PCoA plot</li><li>You can also edit groupings by typing the desired group names into the table</li></ul></div></td><td><button class="btn btn-large" style="margin-left: 50px;" onclick="document.getElementById(\'tab_depth\').click();">next <i class="icon-forward" style="position: relative; top: 2px;"></i></button></td></tr></table>\
<table id="use_all_div" style="display: none; margin-left: 100px;"><tr><td><button class="btn btn-large" style="margin-right: 50px;" onclick="document.getElementById(\'tab_welcome\').click();"> <i class="icon-backward" style="position: relative; top: 2px;"></i> previous</button></td><td><div style="width: 600px; margin-bottom: 0px;" class="alert alert-info"><ul><li>Click the <b>next</b> button to proceed to step 2 with all samples selected</li></ul></div></td><td><button class="btn btn-large" style="margin-left: 50px;" onclick="Retina.WidgetInstances.wizard['+index+'].depth_mgs=Retina.WidgetInstances.wizard['+index+'].ids;document.getElementById(\'tab_depth\').click();">next <i class="icon-forward" style="position: relative; top: 2px;"></i></button></td></tr></table>\
</div>';

	    // a distribution was selected, draw the according visualization		
	    grouper.innerHTML = "<table><tr><td><h3 style='margin-top: 35px;'>current selection</h3><select multiple id='pcoa_group_list' size=12></select><h3>group name</h3><div class='input-append'><input type='text' id='pcoa_group_name' value='group 1'><button class='btn' onclick='Retina.WidgetInstances.wizard[1].assign_group()'>assign group</button></div></td><td style='vertical-align: top;padding-top: 35px;'><h3>metadata</h3><div class='input-append'><select id='pcoa_metadata_select'></select><button class='btn' onclick='Retina.WidgetInstances.wizard[1].color_pcoa();'>color PCoA</button></div></td></tr></table>";
	    
	    var opts = "<option>group</option>";
	    for (i in stm.DataStore.metagenome[widget.ids[0]].mixs) {
		if (stm.DataStore.metagenome[widget.ids[0]].mixs.hasOwnProperty(i)) {
		    opts += "<option>"+i+"</option>";
		}
	    }
	    document.getElementById('pcoa_metadata_select').innerHTML = opts;
	    
	    var result = widget.extract_data({ ids: widget.ids, level: 3, type: 'organism', normalize: true });
	    var data = [['']];
	    for (i=0;i<widget.ids.length;i++) {
		var idname = widget.ids[i].replace(/\./, "A");
		data[0].push(idname);
	    }
	    for (i=0;i<result.matrix_data.length;i++) {
		var row = [ i ];
		for (h=0; h<result.matrix_data[i].length;h++) {
		    row.push(result.matrix_data[i][h]);
		}
		data.push(row);
	    }
	    
	    
	    jQuery.post( "http://api.metagenomics.anl.gov/pcoa/calc", JSON.stringify(data)).then(function(d){
		var retstr = JSON.parse(d);
		var retlist = retstr.result[0].replace(/\"/g, "").split(/\n/);
		var pcoa_result = { "components": [], "samples": {} };
		for (i=0;i<retlist.length;i++) {
		    var row = retlist[i].split(/\t/)
		    if (row[0].match(/^PCO/)) {
			pcoa_result.components.push({ "val": parseFloat(row[1]), "min": null, "max": null });
		    } else {
			var cid = row[0].replace(/A/, ".");
			pcoa_result.samples[cid] = [];
			for (h=1;h<row.length;h++) {
			    var v = parseFloat(row[h]);
			    if ((pcoa_result.components[h - 1].min == null) || (pcoa_result.components[h - 1].min > v)) {
				pcoa_result.components[h - 1].min = v;
			    }
			    if ((pcoa_result.components[h - 1].max == null) || (pcoa_result.components[h - 1].max < v)) {
				pcoa_result.components[h - 1].max = v;
			    }
			    pcoa_result.samples[cid].push(v);
			}
		    }
		}
		
		var xcomp = 0;
		var ycomp = 1;
		var xmax = Math.ceil(pcoa_result.components[xcomp].max);
		var xmin = Math.floor(pcoa_result.components[xcomp].min);
		var ymax = Math.ceil(pcoa_result.components[ycomp].max);
		var ymin = Math.floor(pcoa_result.components[ycomp].min);
		var plot_data = { series: [], points: [] };
		for (i=0;i<widget.ids.length;i++) {
		    plot_data.series.push({ name: stm.DataStore.metagenome[widget.ids[i]].name, color: 'black', shape: 'circle', filled: true });
		    plot_data.points.push([{ x: pcoa_result.samples[widget.ids[i]][xcomp], y: pcoa_result.samples[widget.ids[i]][ycomp], title: stm.DataStore.metagenome[widget.ids[i]].name }]);
		}
		
	    	if (widget.pcoa) {
	    	    jQuery.extend(widget.pcoa.settings, { show_legend: false, x_min: xmin, x_max: xmax, y_min: ymin, y_max: ymax, data: plot_data, target: display });
		} else {
	    	    widget.pcoa = Retina.Renderer.create('plot', { data: plot_data, target: display, x_min: xmin, x_max: xmax, y_min: ymin, y_max: ymax, connected: false, show_legend: false, drag_select: Retina.WidgetInstances['wizard'][index].plot_select });
		}
		widget.pcoa.render();
		widget.plotPoints = Retina.WidgetInstances.wizard[1].pcoa.svg.plot.plotPoints;
		
	    });
	}
    };

    widget.transpose = function (data) {
	var transposed = [];
	for (i=0;i<data[0].length;i++) {
	    transposed.push([]);
	}
	for (i=0;i<data.length;i++) {
	    for (h=0;h<data[i].length;h++) {
		transposed[h][i] = data[i][h];
	    }
	}
	return transposed;
    }

    widget.extract_data = function (params) {
	var ids = params.ids;
	var normalize = params.normalize || false;
	var type = params.type || 'function';
	var level = params.level || 1;
	var source = (type == 'function') ? (params.source || 'Subsystems') : (params.source || 'M5RNA');
	var md_field = (type == 'function') ? "ontology" : "taxonomy";

	// generate a table header
	var theader = [];
	for (k=0; k<level; k++) {
	    theader.push("Level "+(k+1));
	}
	
	// extract the data from the api datastructure into a table structure
	var td = [];
	for (h=0;h<ids.length;h++) {
	    var data = stm.DataStore.abundanceprofile[ids[h]+"_"+type+"_"+source];
	    for (i=0;i<data.data.length;i++) {
		if (params.filter_bacteria && ((data.rows[i].metadata[md_field][0] != 'Bacteria') && (data.rows[i].metadata[md_field][0] != 'Archaea'))) {
		    continue;
		}
		if (! td.hasOwnProperty(data.rows[i].metadata[md_field][level - 1])) {
		    td[data.rows[i].metadata[md_field][level - 1]] = [];
		    for (k=0; k<level; k++) {
			td[data.rows[i].metadata[md_field][level - 1]][k] = data.rows[i].metadata[md_field][k];
		    }
		    for (j=0;j<(ids.length);j++) {
			td[data.rows[i].metadata[md_field][level - 1]][j + level] = "0";
		    }
		}
		td[data.rows[i].metadata[md_field][level - 1]][h + level] = parseInt(td[data.rows[i].metadata[md_field][level - 1]][h + level]) + parseInt(data.data[i][0]);
	    }
	    
	    theader.push(stm.DataStore.metagenome[ids[h]].name);
	}

	// turn the data hash into an array
	var tdata = [];
	for (i in td) {
	    if (td.hasOwnProperty(i)) {
		tdata.push(td[i]);
	    }
	}

	// create a data matrix
	var hcols = [];
	var hrows = [];
	var hdata = [];
	var maxvals = [];
	var minvals = [];
	for (i=0;i<ids.length;i++) {
	    hcols.push(stm.DataStore.metagenome[ids[i]].name);
	    maxvals.push(0);
	    minvals.push(-1);
	}
	
	// fill the matrix and calculate min and max values
	for (i=0;i<tdata.length;i++) {
	    var desccol = tdata[i].length - ids.length - 1;
	    hrows.push(tdata[i][desccol]);
	    var hrow = [];
	    for (h=desccol+1; h<tdata[i].length;h++) {
		if (parseInt(tdata[i][h]) > maxvals[h-desccol-1]) {
		    maxvals[h-desccol-1] = parseInt(tdata[i][h]);
		}
		if ((minvals[h-desccol-1] == -1) || (minvals[h-desccol-1] > parseInt(tdata[i][h]))) {
		    minvals[h-desccol-1] = parseInt(tdata[i][h]);
		}
		hrow.push(parseInt(tdata[i][h]));
	    }
	    hdata.push(hrow);
	}

	// perform normalization
	if (normalize) {
	    for (i=0;i<hdata.length;i++) {
		for (h=0;h<hdata[i].length;h++) {
		    hdata[i][h] = hdata[i][h] / (maxvals[h] - minvals[h])
		}
	    }
	}

	return { table_header: theader, table_data: tdata, matrix_data: hdata, columns: hcols, rows: hrows };
    }

    widget.render_overview = function (id, index) {
	if (document.getElementById('overview').className == 'tab-pane active') {
	    widget = Retina.WidgetInstances.wizard[index];
	    

	document.getElementById('overview').innerHTML = '<div style="float: right;"><h3>select sample</h3><div id="overview_mg_select"></div></div><h3 id="overview_header"></h3>\
<table><tr><td><div id="stats_overview_table"></div></td><td><div id="breakdown"></div></td></tr></table>\
<table style="width: 600px;">\
<tr><th align=left>Alpha Diversity (Shannon Index)</th><td>'+parseInt(stm.DataStore.metagenome_statistics[id].sequence_stats.alpha_diversity_shannon).formatString(2)+'</td><td><div id="alphadiversity"></div></td></tr>\
<tr><th align=left>Mean DRISEE error</th><td>'+parseInt(stm.DataStore.metagenome_statistics[id].sequence_stats.drisee_score_raw).formatString(2)+'</td><td><div id="drisee_dist"></div></td></tr>\
<tr><th align=left>Mean GC Content</th><td>'+parseInt(stm.DataStore.metagenome_statistics[id].sequence_stats.average_gc_content_preprocessed).formatString(2)+' %</td><td><div id="gc_dist"></div></td></tr>\
</table>\
<table><tr><td><div id="nuc_hist"></div></td><td><div id="drisee"></div></td></tr></table>\
<div id="rarefaction"></div>\
<table><tr><td><div id="seqlenu"></div></td><td><div id="seqlen"></div></td></tr></table>\
<table><tr><td><div id="gchistu"></div></td><td><div id="gchist"></div></td></tr></table>';

	    // mg-select
	    widget.single_select.settings.target = document.getElementById('overview_mg_select');
	    widget.single_select.settings.callback = function(data){
	    	widget.render_overview(data, index);
	    };
	    widget.single_select.render();
	    
	    // header
	    document.getElementById('overview_header').innerHTML = stm.DataStore.metagenome[id].name;
	    
	    // stats
	    var stats_space = document.getElementById('stats_overview_table');
	    stats_space.innerHTML = '<p style="font-size: 15px;">Individual Sample Statistics</p>\
<table class="table" style="width: 600px;">\
<thead>\
  <tr><td></td><th>Upload</th><th>Post QC</th></tr>\
 </thead>\
 <tbody>\
  <tr><th>number of base pairs</th><td>'+parseInt(stm.DataStore.metagenome_statistics[id].sequence_stats.bp_count_raw).formatString(0)+' bp</td><td>'+parseInt(stm.DataStore.metagenome_statistics[id].sequence_stats.bp_count_preprocessed).formatString(0)+' bp</td></tr>\
  <tr><th>number of reads</th><td>'+parseInt(stm.DataStore.metagenome_statistics[id].sequence_stats.sequence_count_raw).formatString(0)+'</td><td>'+parseInt(stm.DataStore.metagenome_statistics[id].sequence_stats.sequence_count_preprocessed).formatString(0)+'</td></tr>\
<tr><th>mean read length</th><td>'+parseInt(stm.DataStore.metagenome_statistics[id].sequence_stats.average_length_raw).formatString(0)+' bp</td><td>'+parseInt(stm.DataStore.metagenome_statistics[id].sequence_stats.average_length_preprocessed).formatString(0)+' bp</td></tr>\
  <tr><th>mean GC percent</th><td>'+parseInt(stm.DataStore.metagenome_statistics[id].sequence_stats.average_gc_content_raw).formatString(0)+'</td><td>'+parseInt(stm.DataStore.metagenome_statistics[id].sequence_stats.average_gc_content_preprocessed).formatString(0)+'</td></tr>\
  <tr><td></td><th>predicted features</th><th>alignment (identified)</th></tr>\
  <tr><th>protein</th><td>'+parseInt(stm.DataStore.metagenome_statistics[id].sequence_stats.sequence_count_processed).formatString(0)+'</td><td>'+parseInt(stm.DataStore.metagenome_statistics[id].sequence_stats.sequence_count_sims_aa).formatString(0)+'</td></tr>\
  <tr><th>tRNA</th><td>'+parseInt(stm.DataStore.metagenome_statistics[id].sequence_stats.sequence_count_processed_rna).formatString(0)+'</td><td>'+parseInt(stm.DataStore.metagenome_statistics[id].sequence_stats.sequence_count_sims_rna).formatString(0)+'</td></tr>\
  <tr><td></td><th colspan=2>Annotation</th></tr>\
  <tr><th>Identified Functional Categories</th><td colspan=2>'+parseInt(stm.DataStore.metagenome_statistics[id].sequence_stats.sequence_count_ontology).formatString(0)+'</td></tr>\
 </tbody>\
</table>';

    	    // sequence distribution
    	    var stats = stm.DataStore.metagenome_statistics[id].sequence_stats;
    	    var breakdown_data = [ { name: 'Failed QC' , data: [ parseInt(stats.sequence_count_raw) - parseInt(stats.sequence_count_processed) ], fill: 'gray' },
				   { name: 'Unknown' , data: [ parseInt(stats.sequence_count_processed) - parseInt(stats.sequence_count_processed_aa) - parseInt(stats.sequence_count_sims_rna) ], fill: '#EE5F5B' },
    				   { name: 'Unknown Protein' , data: [ parseInt(stats.sequence_count_processed_aa) - parseInt(stats.sequence_count_sims_aa) ], fill: '#FBB450' },
				   { name: 'Annotated Protein' , data: [ parseInt(stats.sequence_count_sims_aa) ], fill: '#62C462' },
				   { name: 'ribosomal RNA' , data: [ parseInt(stats.sequence_count_sims_rna) ], fill: '#0088CC' } ];
	    var bdsettings = { target: document.getElementById('breakdown'),
    			       data: breakdown_data,
    			       title: "Sequence Breakdown",
    			       show_legend: true,
			       legendArea: [ 0.7, 0.1, 0.97, 0.5 ],
			       legend_position: 'right',
			       width: 600,
    			       x_labels: [ '' ],
    			       type: "pie" };
	    if (widget.breakdown) {
		jQuery.extend(widget.breakdown.settings, bdsettings);
	    } else {
		widget.breakdown = Retina.Renderer.create("graph", bdsettings);
	    }
    	    widget.breakdown.render();
	    
    	    // nucleotide histogram
    	    var nucprof_data = [ { name: 'A', data: [], fill: 'green', lineColor: 'green' },
    				 { name: 'T', data: [], fill: 'red', lineColor: 'red' },
    				 { name: 'C', data: [], fill: 'blue', lineColor: 'blue' },
    				 { name: 'G', data: [], fill: 'orange', lineColor: 'orange' },
    				 { name: 'N', data: [], fill: 'brown', lineColor: 'brown' } ];
    	    var bp_prof = stm.DataStore.metagenome_statistics[id].qc.bp_profile.percents.data;
    	    for (i=0; i<bp_prof.length; i++) {
    		for (h=0; h<5; h++) {
    		    nucprof_data[h].data.push(bp_prof[i][h+1]);
    		}
    	    }
    	    var nucsettings = { target: document.getElementById('nuc_hist'),
    				data: nucprof_data,
				width: 600,
    				title: "Nucleotide Histogram",
    				x_title: 'bp position',
    				x_labeled_tick_interval: parseInt(bp_prof.length / 10),
    				x_tick_interval: parseInt(bp_prof.length / 10),
    				show_legend: true,
    				chartArea: [ 0.2, 0.1, 0.95, 350 ],
    				type: "stackedArea",
    				y_title: 'percentage' };
	    if (widget.nuc) {
		jQuery.extend(widget.nuc.settings, nucsettings);
	    } else {
		widget.nuc = Retina.Renderer.create("graph", nucsettings);
	    }
    	    widget.nuc.render();
	    
    	    // drisee
	    if (stm.DataStore.metagenome_statistics[id].qc.drisee.percents.data) {
    		var drisee_data = { series: [ { name: 'A', color: 'green' },
    					      { name: 'T', color: 'red' },
    					      { name: 'C', color: 'blue' },
    					      { name: 'G', color: 'orange' },
    					      { name: 'N', color: 'brown' },
    					      { name: 'InDel', color: 'black' },
    					      { name: 'Total', color: 'purple' }],
    				    points: [ [], [], [], [], [], [], [] ] };
    		var drisee_prof = stm.DataStore.metagenome_statistics[id].qc.drisee.percents.data;
    		for (i=0; i<drisee_prof.length; i++) {
    		    for (h=0; h<7; h++) {
    			drisee_data.points[h].push({ x: drisee_prof[i][0], y: drisee_prof[i][h+1]});
    		    }
    		}
    		var driseesettings = { target: document.getElementById('drisee'),
    				       data: drisee_data,
    				       title: 'DRISEE Error Profile',
    				       show_legend: true,
    				       legend_position: 'left',
    				       connected: true,
    				       show_dots: false,
				       width: 600,
    				       x_min: 0,
    				       x_max: drisee_prof[0][0] + drisee_prof.length - 1,
    				       x_title: "bp position",
    				       y_title: "percent error" };
		if (widget.drisee) {
		    jQuery.extend(widget.drisee.settings, driseesettings);
		} else {
		    widget.drisee = Retina.Renderer.create("plot", driseesettings);
		}
    		widget.drisee.render();
	    }	    
	
    	    // rarefaction curve
    	    var rare_data = { series: [ { name: 'A', color: 'blue' } ],
    			      points: [ [] ] };
    	    var rare_prof = stm.DataStore.metagenome_statistics[id].rarefaction;
    	    var rmax_x = 0;
    	    var rmax_y = 0;
    	    for (i=0; i<rare_prof.length; i++) {
    		rare_prof[i][0] = parseFloat(rare_prof[i][0]);
    		rare_prof[i][1] = parseFloat(rare_prof[i][1]);
    		if (rare_prof[i][0] > rmax_x) {
    		    rmax_x = rare_prof[i][0];
    		}
    		if (rare_prof[i][1] > rmax_y) {
    		    rmax_y = rare_prof[i][1];
    		}
    		rare_data.points[0].push({ x: rare_prof[i][0], y: rare_prof[i][1]});
    	    }
    	    var rarefactionsettings = { target: document.getElementById('rarefaction'),
    					data: rare_data,
    					title: 'Rarefaction Curve',
    					show_legend: false,
    					connected: true,
    					show_dots: false,
					width: 600,
    					x_min: 0,
    					x_max: rmax_x,
    					y_min: 0,
    					y_max: parseInt(rmax_y),
    					x_title: "number of reads",
    					y_title: "species count" };
	    
	    if (widget.rarefaction) {
		jQuery.extend(widget.rarefaction.settings, rarefactionsettings);
	    } else {
		widget.rarefaction = Retina.Renderer.create("plot", rarefactionsettings);
	    }
    	    widget.rarefaction.render();
	    
	    // gc histogram upload
    	    var gchistu_data = { series: [ { name: 'A', color: 'blue' } ],
    				 points: [ [] ] };
    	    var gchistu_prof = stm.DataStore.metagenome_statistics[id].gc_histogram.upload;
    	    var gumax_x = 0;
    	    var gumax_y = 0;
    	    for (i=0; i<gchistu_prof.length; i++) {
    		gchistu_prof[i][0] = parseFloat(gchistu_prof[i][0]);
    		gchistu_prof[i][1] = parseFloat(gchistu_prof[i][1]);
    		if (gchistu_prof[i][0] > gumax_x) {
    		    gumax_x = gchistu_prof[i][0];
    		}
    		if (gchistu_prof[i][1] > gumax_y) {
    		    gumax_y = gchistu_prof[i][1];
    		}
    		gchistu_data.points[0].push({ x: gchistu_prof[i][0], y: gchistu_prof[i][1]});
    	    }
    	    var gchistusettings = { target: document.getElementById('gchistu'),
    				    data: gchistu_data,
    				    title: 'GC Historam Upload',
    				    show_legend: false,
    				    connected: true,
    				    show_dots: false,
				    width: 600,
    				    x_min: 0,
    				    x_max: gumax_x,
    				    y_min: 0,
    				    y_max: parseInt(gumax_y),
    				    x_title: "GC",
    				    y_title: "number of reads" };
	    
	    if (widget.gchistu) {
		jQuery.extend(widget.gchistu.settings, gchistusettings);
	    } else {
		widget.gchistu = Retina.Renderer.create("plot", gchistusettings);
	    }
    	    widget.gchistu.render();
	    
	    // gc histogram post qc
    	    var gchist_data = { series: [ { name: 'A', color: 'blue' } ],
    				points: [ [] ] };
    	    var gchist_prof = stm.DataStore.metagenome_statistics[id].gc_histogram.post_qc;
    	    var gmax_x = 0;
    	    var gmax_y = 0;
    	    for (i=0; i<gchist_prof.length; i++) {
    		gchist_prof[i][0] = parseFloat(gchist_prof[i][0]);
    		gchist_prof[i][1] = parseFloat(gchist_prof[i][1]);
    		if (gchist_prof[i][0] > gmax_x) {
    		    gmax_x = gchist_prof[i][0];
    		}
    		if (gchist_prof[i][1] > gmax_y) {
    		    gmax_y = gchist_prof[i][1];
    		}
    		gchist_data.points[0].push({ x: gchist_prof[i][0], y: gchist_prof[i][1]});
    	    }
    	    var gchistsettings = { target: document.getElementById('gchist'),
    				   data: gchist_data,
    				   title: 'GC Historam Post QC',
    				   show_legend: false,
    				   connected: true,
    				   show_dots: false,
				   width: 600,
    				   x_min: 0,
    				   x_max: gmax_x,
    				   y_min: 0,
    				   y_max: parseInt(gmax_y),
    				   x_title: "GC",
    				   y_title: "number of reads" };
	    
	    if (widget.gchist) {
		jQuery.extend(widget.gchist.settings, gchistsettings);
	    } else {
		widget.gchist = Retina.Renderer.create("plot", gchistsettings);
	    }
    	    widget.gchist.render();
	    
	    // sequence length histogram upload
    	    var seqlenu_data = { series: [ { name: 'A', color: 'blue' } ],
    				 points: [ [] ] };
    	    var seqlenu_prof = stm.DataStore.metagenome_statistics[id].length_histogram.upload;
    	    var sumax_x = 0;
    	    var sumax_y = 0;
    	    for (i=0; i<seqlenu_prof.length; i++) {
    		seqlenu_prof[i][0] = parseFloat(seqlenu_prof[i][0]);
    		seqlenu_prof[i][1] = parseFloat(seqlenu_prof[i][1]);
    		if (seqlenu_prof[i][0] > sumax_x) {
    		    sumax_x = seqlenu_prof[i][0];
    		}
    		if (seqlenu_prof[i][1] > sumax_y) {
    		    sumax_y = seqlenu_prof[i][1];
    		}
    		seqlenu_data.points[0].push({ x: seqlenu_prof[i][0], y: seqlenu_prof[i][1]});
    	    }
    	    var seqlenusettings = { target: document.getElementById('seqlenu'),
    				    data: seqlenu_data,
    				    title: 'Sequence Length Histogram Upload',
    				    show_legend: false,
    				    connected: true,
    				    show_dots: false,
				    width: 600,
    				    x_min: 0,
    				    x_max: sumax_x,
    				    y_min: 0,
    				    y_max: parseInt(sumax_y),
    				    x_title: "sequence length",
    				    y_title: "number of reads" };
	    
	    if (widget.seqlenu) {
		jQuery.extend(widget.seqlenu.settings,seqlenusettings);
	    } else {
		widget.seqlenu = Retina.Renderer.create("plot", seqlenusettings);
	    }
    	    widget.seqlenu.render();
	    
	    // sequence length histogram post qc
    	    var seqlen_data = { series: [ { name: 'A', color: 'blue' } ],
    				points: [ [] ] };
    	    var seqlen_prof = stm.DataStore.metagenome_statistics[id].length_histogram.post_qc;
    	    var smax_x = 0;
    	    var smax_y = 0;
    	    for (i=0; i<seqlen_prof.length; i++) {
    		seqlen_prof[i][0] = parseFloat(seqlen_prof[i][0]);
    		seqlen_prof[i][1] = parseFloat(seqlen_prof[i][1]);
    		if (seqlen_prof[i][0] > smax_x) {
    		    smax_x = seqlen_prof[i][0];
    		}
    		if (seqlen_prof[i][1] > smax_y) {
    		    smax_y = seqlen_prof[i][1];
    		}
    		seqlen_data.points[0].push({ x: seqlen_prof[i][0], y: seqlen_prof[i][1]});
    	    }
    	    var seqlensettings = { target: document.getElementById('seqlen'),
    				   data: seqlen_data,
    				   title: 'Sequence Length Histogram Post QC',
    				   show_legend: false,
    				   connected: true,
    				   show_dots: false,
				   width: 600,
    				   x_min: 0,
    				   x_max: smax_x,
    				   y_min: 0,
    				   y_max: parseInt(smax_y),
    				   x_title: "sequence length",
    				   y_title: "number of reads" };
	    
	    if (widget.seqlen) {
		jQuery.extend(widget.seqlen.settings,seqlensettings);
	    } else {
		widget.seqlen = Retina.Renderer.create("plot", seqlensettings);
	    }
    	    widget.seqlen.render();
	    
	    var alpha_data = [ parseFloat(stm.DataStore.metagenome_statistics[id].sequence_stats.alpha_diversity_shannon) ];
	    for (i=0;i<widget.ids.length;i++) {
		if (widget.ids[i] == id) {
		    continue;
		}
		alpha_data.push(parseFloat(stm.DataStore.metagenome_statistics[widget.ids[i]].sequence_stats.alpha_diversity_shannon));
	    }
	    var alphadiversitysettings = { target: document.getElementById('alphadiversity'), 
					   data: alpha_data };
	    if (widget.alphadiversity) {
		jQuery.extend(widget.alphadiversity.settings, alphadiversitysettings);
	    } else {
		widget.alphadiversity = Retina.Renderer.create("deviationplot", alphadiversitysettings);
	    }
	    widget.alphadiversity.render();
	    
	    var driseedist_data = [ parseFloat(stm.DataStore.metagenome_statistics[id].sequence_stats.drisee_score_raw) ];
	    for (i=0;i<widget.ids.length;i++) {
		if (widget.ids[i] == id) {
		    continue;
		}
		driseedist_data.push(parseFloat(stm.DataStore.metagenome_statistics[widget.ids[i]].sequence_stats.drisee_score_raw));
	    }
	    var driseedistsettings = { target: document.getElementById('drisee_dist'),
				       data: driseedist_data };
	    if (widget.driseedist) {
		jQuery.extend(widget.driseedist.settings, driseedistsettings);
	    } else {
		widget.driseedist = Retina.Renderer.create("deviationplot", driseedistsettings);
	    }
	    widget.driseedist.render();
	    
	    var gcdist_data = [ parseFloat(stm.DataStore.metagenome_statistics[id].sequence_stats.average_gc_content_preprocessed) ];
	    for (i=0;i<widget.ids.length;i++) {
		if (widget.ids[i] == id) {
		    continue;
		}
		gcdist_data.push(parseFloat(stm.DataStore.metagenome_statistics[widget.ids[i]].sequence_stats.average_gc_content_preprocessed));
	    }
	    var gcdistsettings = { target: document.getElementById('gc_dist'),
				   data: gcdist_data };
	    if (widget.gcdist) {
		jQuery.extend(widget.gcdist.settings, gcdistsettings);
	    } else {
		widget.gcdist = Retina.Renderer.create("deviationplot", gcdistsettings);
	    }
	    widget.gcdist.render();
	}
    };

    widget.update_groups = function (data, index) {
	widget = Retina.WidgetInstances.wizard[index];
	data = data || widget.sample_table.settings.tdata;
	for (i=0;i<data.length;i++) {
	    console.log(data[i].ID);
	    if (stm.DataStore.metagenome[data[i].ID]) {
		stm.DataStore.metagenome[data[i].ID].group = data[i].group;
	    }
	}

	widget.assign_group(true);
    }
    
    widget.number = function (number) {
	return '<p style="font-size: 16px; float: left; font-weight: bold; height: 18px; text-align: center; vertical-align: middle; margin-right: 8px; border: 5px solid #0088CC; width: 18px; border-radius: 14px 14px 14px 14px; position: relative; bottom: 5px; right: 9px;">'+number+'</p>';
    };
})();