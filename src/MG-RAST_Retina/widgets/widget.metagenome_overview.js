(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Overview Widget",
                name: "metagenome_overview",
                author: "Tobias Paczian",
                requires: [ "rgbcolor.js" ]
        }
    });
    
    widget.setup = function () {
	    return [ Retina.add_renderer({"name": "listselect", "resource": "./renderers/",  "filename": "renderer.listselect.js" }),
                 Retina.load_renderer("listselect"),
	             Retina.add_renderer({"name": "paragraph", "resource": "./renderers/",  "filename": "renderer.paragraph.js" }),
		         Retina.load_renderer("paragraph"),
		         Retina.add_renderer({"name": "graph", "resource": "./renderers/",  "filename": "renderer.graph.js" }),
		         Retina.load_renderer("graph"),
		         Retina.add_renderer({"name": "plot", "resource": "./renderers/",  "filename": "renderer.plot.js" }),
 		         Retina.load_renderer("plot"),
 		         Retina.add_renderer({"name": "table", "resource": "./renderers/",  "filename": "renderer.table.js" }),
  		         Retina.load_renderer("table")
	           ];
    };
    
    widget.mg_select_list = undefined;
    widget.curr_mg = undefined;
    widget.curr_mg_stats = undefined;
    
    widget.display = function (wparams) {
        widget = this;
	    var index = widget.index;
        // check if id given
        if (wparams.id) {
            jQuery('#mg_modal').modal('hide');
	        // check if required data is loaded (use stats)
	        if (! (stm.DataStore.hasOwnProperty('metagenome_statistics') && stm.DataStore.metagenome_statistics.hasOwnProperty(wparams.id))) {
	            // make a promise list
	            var stats_promises = [];
	            stats_promises.push(stm.get_objects({ "type": "metagenome", "id": wparams.id, "options": { "verbosity": "full" } }));
	            stats_promises.push(stm.get_objects({ "type": "metagenome_statistics", "id": wparams.id, "options": { "verbosity": "full" } }));
	            jQuery.when.apply(this, stats_promises).then(function() {
		            widget.display(wparams);
	            });
	            return;
            }
	    // get id first
        } else {
            widget.metagenome_modal(index, wparams.target);
            return;
        }
	
	// make some shortcuts
	widget.curr_mg = stm.DataStore.metagenome[wparams.id];
	widget.curr_mg_stats = stm.DataStore.metagenome_statistics[wparams.id];
	var content = wparams.target;
	
	// set the output area
	content.innerHTML = '';
	
	// set style variables
	var header_color = "black";
	var title_color = "black";
	var ont_tbl = document.createElement('table');
	var tax_tbl = document.createElement('table');
	ont_tbl.id = 'ont_tbl';
	tax_tbl.id = 'tax_tbl';
	var outputs = [ 
	    { type: 'paragraph', data: 'general_overview' },
	    { type: 'paragraph', data: 'metagenome_summary' },
	    { type: 'piechart', data: 'summary', category: 'summary' },
	    { type: 'paragraph', data: 'toc_list' },
	    { type: 'paragraph', data: 'piechart_footnote' },
	    { type: 'paragraph', data: 'project_information' },
	    { type: 'paragraph', data: 'analysis_statistics' },
	    { type: 'paragraph', data: 'mixs_metadata' },
	    { type: 'paragraph', data: 'drisee_introtext' },
	    (widget.curr_mg.sequence_type == 'Amplicon') ? null: { type: 'plot', data: 'drisee_plot', category: 'drisee' },
	    { type: 'paragraph', data: 'kmer_introtext' },
	    (widget.curr_mg.sequence_type == 'Amplicon') ? null: { type: 'plot', data: 'kmer_plot', category: 'kmer' },
	    { type: 'paragraph', data: 'bp_introtext' },
	    (widget.curr_mg.sequence_type == 'Amplicon') ? null: { type: 'areagraph', data: 'bp_plot', category: 'bp' },
	    { type: 'paragraph', data: 'ontology_introtext' },
	    { type: 'add_element', data: ont_tbl },
	    { type: 'piechart', data: 'Subsystems', category: 'ontology', pos: 'left' },
	    { type: 'piechart', data: 'KO', category: 'ontology', pos: 'right' },
	    { type: 'piechart', data: 'COG', category: 'ontology', pos: 'left' },
	    { type: 'piechart', data: 'NOG', category: 'ontology', pos: 'right' },
	    { type: 'paragraph', data: 'taxonomy_introtext' },
	    { type: 'add_element', data: tax_tbl },
	    { type: 'piechart', data: 'domain', category: 'taxonomy', pos: 'left' },
	    { type: 'piechart', data: 'phylum', category: 'taxonomy', pos: 'right' },
	    { type: 'piechart', data: 'class', category: 'taxonomy', pos: 'left' },
	    { type: 'piechart', data: 'order', category: 'taxonomy', pos: 'right' },
	    { type: 'piechart', data: 'family', category: 'taxonomy', pos: 'left' },
	    { type: 'piechart', data: 'genus', category: 'taxonomy', pos: 'right' },
	    { type: 'paragraph', data: 'rank_abund_introtext' },
	    { type: 'linegraph', data: 'rank_abund_plot', category: 'rank_abund' },
	    { type: 'paragraph', data: 'rarefaction_introtext' },
	    { type: 'plot', data: 'rarefaction_plot', category: 'rarefaction' },
	    { type: 'title', data: 'Metadata' },
	    { type: 'metadata_table', data: 'metadata_table' }
	];
	
	// iterate over the outputs
	var curr_table = undefined;
	for (out=0;out<outputs.length;out++) {
	    if (! outputs[out]) {
		    continue;
	    }
	    if (outputs[out].type == 'add_element') {
	        curr_table = outputs[out].data.id;
	        content.appendChild(outputs[out].data);
	        continue;
	    }
	    // create and append the output div
	    var data, x, y, labels, points, xt, yt, xscale, yscale;
	    var div = document.createElement('div');
	    var tag = document.createElement('a');
	    tag.setAttribute('name', outputs[out].data);
	    // add div to content or table
	    if (outputs[out].hasOwnProperty('pos') && curr_table) {
	        if (outputs[out].pos == 'left') {
	            jQuery('#'+curr_table).append( jQuery('<tr>').append( jQuery('<td>').css('vertical-align', 'top').append( jQuery(div) )));
	        } else if (outputs[out].pos == 'right') {
	            jQuery('#'+curr_table+' tr').last().append( jQuery('<td>').css('vertical-align', 'top').append( jQuery(div) ) );
	        }
	    } else {
	        content.appendChild(tag);
	        content.appendChild(div);
        }
	    
	    // check the type and call the according renderer with the data generated by the defined function
	    switch (outputs[out].type) {
	        case 'title':
	        Retina.Renderer.create("paragraph", {target: div, data: [{header: outputs[out].data}]}).render();
	        break;
	        case 'paragraph':
		    data = widget[outputs[out].data](index);
		    if (data) {
		        data.target = div;
		        data.title_color = title_color;
		        data.header_color = header_color;
		        Retina.Renderer.create("paragraph", data).render();
	        } else {
		        content.removeChild(tag);
		        content.removeChild(div);
		    }
		    break;
	        case 'piechart':
	        if (outputs[out].data == 'summary') {
	            data = widget.summary_piechart(index);
	            div.setAttribute('class', 'span9');
	        } else {
	            data = widget.annotation_piechart(index, outputs[out].category, outputs[out].data);
	        }
		    data.target = div;
		    Retina.Renderer.create("graph", data).render();
		    break;
		    case 'linegraph':
            data = widget.taxon_linegraph(index, 'family', 50);
            data.target = div;
            Retina.Renderer.create("graph", data).render();
            break;
            case 'areagraph':
            if (! widget.curr_mg_stats.qc.bp_profile.percents.data) {
		        content.removeChild(tag);
		        content.removeChild(div);
                break;
            }
            data = widget.bp_areagraph(index);
            data.target = div;
            Retina.Renderer.create("graph", data).render();
            break;
            case 'plot':
            data = widget.mg_plot(index, outputs[out].category);
            if (! data) {
                content.removeChild(tag);
	            content.removeChild(div);
                break;
            }
            data.target = div;
            Retina.Renderer.create("plot", data).render();
            break;
            case 'metadata_table':
            data = widget.metadata_table(index);
            data.target = div;
            Retina.Renderer.create("table", data).render();
            break;
	        default:
	        break;
	    }
	}
    };
    
    widget.metagenome_modal = function(index, target) {
        jQuery('#mg_modal').modal('show');
        if (! Retina.WidgetInstances.metagenome_overview[index].mg_select_list) {
            jQuery.getJSON('data/mg_mixs_public.json', function(data) {
                for (var d in data) {
                    if (data.hasOwnProperty(d)) {
                        stm.load_data({"data": data[d], "type": d});
                    }
                }
                Retina.WidgetInstances.metagenome_overview[index].metagenome_selector(index, target);
            }).fail( function() {
                stm.get_objects({"type": "metagenome", "options": {"verbosity": "mixs", "limit": 0}}).then(function() {
                    Retina.WidgetInstances.metagenome_overview[index].metagenome_selector(index, target);
                });
            });
        } else {
            Retina.WidgetInstances.metagenome_overview[index].mg_select_list.render();
        }
    };
    
    widget.metagenome_selector = function(index, target) {
        var metagenome_data = [];
        for (i in stm.DataStore["metagenome"]) {
    	    if (stm.DataStore["metagenome"].hasOwnProperty(i)) {
    		     var md = { "name": stm.DataStore["metagenome"][i]["name"],
    			   "id": i,
    			   "project": stm.DataStore["metagenome"][i]["project"],
    			   "status": stm.DataStore["metagenome"][i]["status"],
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
    	Retina.WidgetInstances.metagenome_overview[index].mg_select_list = Retina.Renderer.create('listselect', {
    	    "target": document.getElementById('mg_modal_body'),
			"data": metagenome_data,
		    "value": "id",
            "label": "name",
	        "filter": ["name", "id", "project", "status", "lat/long", "location", "collection date", "biome", "feature", "material", "package", "sequencing method", "sequencing type"],
	        "sort": true,
	        "multiple": false,
		    "callback": function (mgid) {
		        Retina.WidgetInstances.metagenome_overview[index].display({"target": target, "id": mgid});
	        }
		});
		Retina.WidgetInstances.metagenome_overview[index].mg_select_list.render();
    };
    
    widget.general_overview = function (index) {
        var mg = Retina.WidgetInstances.metagenome_overview[index].curr_mg;
	    // general overview
	    var ncbi_id;
	    try {
	        ncbi_id = mg.metadata.project.data.ncbi_id;
	        ncbi_id = "<a href='http://www.ncbi.nlm.nih.gov/genomeprj/"+ncbi_id+"'>"+ncbi_id+"</a>";
	    } catch (err) {
	        ncbi_id = "-";
	    }
	    var gold_id;
	    try {
 	        gold_id = mg.metadata.library.data.gold_id;
	        gold_id = "<a href='http://www.ncbi.nlm.nih.gov/genomeprj/"+gold_id+"'>"+gold_id+"</a>";
	    } catch (err) {
	        gold_id = "-";
	    }
	    var pubmed_id;
	    try {
 	        pubmed_id = mg.metadata.library.data.pubmed_id.split(", ");
	        var pm = [];
	        for (i=0;i<pubmed_id.length;i++) {
		        pm.push("<a href='http://www.ncbi.nlm.nih.gov/pubmed/"+pubmed_id[i]+"'>"+pubmed_id[i]+"</a>");
	        }
	        pubmed_id = pm.join(", ");
	    } catch (err) {
	        pubmed_id = "-";
	    }
	    var pi_link;
	    try {
	        pi_link = "<a href='mailto:"+mg.metadata.project.data.PI_email+"'>"+mg.metadata.project.data.PI_firstname+" "+mg.metadata.project.data.PI_lastname+"</a>";
	    } catch (err) {
	        pi_link = "-";
	    }
	    var organization;
	    try {
	        organization = mg.metadata.project.data.PI_organization;
	    } catch (err) {
	        organization = "-";
	    }
	    var data = { data:
	           [ { title: "Metagenome Data Sheet for ID " + mg.id.substring(3)},
		         { table: [ [ { header: "Metagenome Name" }, mg.name, { header: "NCBI Project ID" }, ncbi_id ],
				            [ { header: "PI" }, pi_link, { header: "GOLD ID" }, gold_id ],
				            [ { header: "Organization" }, organization, { header: "PubMed ID" }, pubmed_id ],
				            [ { header: "Visibility" }, mg.status ]
                           ] }
		        ] };
	    return data;
    };
    
    widget.metagenome_summary = function(index) {
        var mg = Retina.WidgetInstances.metagenome_overview[index].curr_mg;
        var mg_stats = Retina.WidgetInstances.metagenome_overview[index].curr_mg_stats;
	    // hash the basic stats
	    var stats  = mg_stats.sequence_stats;
	    var fuzzy  = Retina.WidgetInstances.metagenome_overview[index]._summary_fuzzy_math(mg, mg_stats);
	    var is_rna = (mg.sequence_type == 'Amplicon') ? 1 : 0;
	    var total  = parseInt(stats['sequence_count_raw']);
        var ptext  = " Of the remainder, "+fuzzy[3].formatString()+" sequences ("+widget._to_per(fuzzy[3], total)+") contain predicted proteins with known functions and "+fuzzy[2].formatString()+" sequences ("+widget._to_per(fuzzy[2], total)+") contain predicted proteins with unknown function.";
        var ftext  = " "+fuzzy[1].formatString()+" sequences ("+widget._to_per(fuzzy[1], total)+") have no rRNA genes"+(is_rna ? '.' : " or predicted proteins");
	    var data = { data:
	            [ { header: "Metagenome Summary" },
		          { p: "The dataset "+mg.name+" was uploaded on "+mg.created+" and contains "+total.formatString()+" sequences totaling "+parseInt(stats['bp_count_raw']).formatString()+" basepairs with an average length of "+parseInt(stats['average_length_raw']).formatString()+" bps. The piechart below breaks down the uploaded sequences into "+(is_rna ? '3' : '5')+" distinct categories." },
		          { p: fuzzy[0].formatString()+" sequences ("+widget._to_per(fuzzy[0], total)+") failed to pass the QC pipeline. Of the sequences that passed QC, "+fuzzy[4].formatString()+" sequences ("+widget._to_per(fuzzy[4], total)+") contain ribosomal RNA genes."+(is_rna ? '' : ptext)+ftext },
		          { p: "The analysis results shown on this page are computed by MG-RAST. Please note that authors may upload data that they have published their own analysis for, in such cases comparison within the MG-RAST framework can not be done." }
		        ] };
	    return data;
    };

    widget.toc_list = function(index) {
        return { width: "span3",
		         style: "float: right;",
		         data: [ { header: "Table of Contents" },
			             { fancy_table: { data: [
			                 [ "<a href='#project_information'>Project</a>" ],
			                 [ "<a href='#analysis_statistics'>Statistics</a>" ],
			                 [ "<a href='#mixs_metadata'>MIxS Metadata</a>" ],
			                 [ "<a href='#drisee_introtext'>DRISEE</a>" ],
			                 [ "<a href='#kmer_introtext'>Kmer Profile</a>" ],
			                 [ "<a href='#bp_introtext'>Nucleotide Histogram</a>" ],
			                 [ "<a href='#ontology_introtext'>Functional Hits</a>" ],
			                 [ "<a href='#taxonomy_introtext'>Taxonomic Hits</a>" ],
			                 [ "<a href='#rank_abund_introtext'>Rank Abundance Plot</a>" ],
			                 [ "<a href='#rarefaction_introtext'>Rarefaction Curve</a>" ],
			                 [ "<a href='#metadata_table'>Full Metadata</a>" ]
			              ] } }
			            ] };
    };

    widget.summary_piechart = function(index) {
        var mg = Retina.WidgetInstances.metagenome_overview[index].curr_mg;
        var mg_stats = Retina.WidgetInstances.metagenome_overview[index].curr_mg_stats;
	    var pieData = [];
	    var pieNums = Retina.WidgetInstances.metagenome_overview[index]._summary_fuzzy_math(mg, mg_stats);
	    var legend  = ["Failed QC", "Unknown", "Unknown Protein", "Annotated Protein", "ribosomal RNA"];
	    var colors  = ["#6C6C6C", "#dc3912", "#ff9900", "#109618", "#3366cc", "#990099"];
	    for (var i = 0; i < pieNums.length; i++) {
	        pieData.push({ name: legend[i], data: [ parseInt(pieNums[i]) ], fill: colors[i] });
	    }
	    var data = { 'title': 'Sequence Breakdown',
	                 'type': 'pie',
		             'title_settings': { 'font-size': '18px', 'font-weight': 'bold', 'x': 0, 'text-anchor': 'start' },
		             'x_labels': [ " " ],		     
		             'show_legend': true,
		             'legend_position': 'right',
		             'width': 650,
		             'height': 300,
		             'data': pieData };
	    return data;
    };
    
    widget._summary_fuzzy_math = function(mg, mg_stats) {
        // get base numbers
        var stats  = mg_stats.sequence_stats;
        var is_rna = (mg.sequence_type == 'Amplicon') ? 1 : 0;
        var raw_seqs    = ('sequence_count_raw' in stats) ? parseFloat(stats.sequence_count_raw) : 0;
        var qc_rna_seqs = ('sequence_count_preprocessed_rna' in stats) ? parseFloat(stats.sequence_count_preprocessed_rna) : 0;
        var qc_seqs     = ('sequence_count_preprocessed' in stats) ? parseFloat(stats.sequence_count_preprocessed) : 0;
        var rna_sims    = ('sequence_count_sims_rna' in stats) ? parseFloat(stats.sequence_count_sims_rna) : 0;
        var r_clusts    = ('cluster_count_processed_rna' in stats) ? parseFloat(stats.cluster_count_processed_rna) : 0;
        var r_clust_seq = ('clustered_sequence_count_processed_rna' in stats) ? parseFloat(stats.clustered_sequence_count_processed_rna) : 0;
        var ann_reads   = ('read_count_annotated' in stats) ? parseFloat(stats.read_count_annotated) : 0;
        var aa_reads    = ('read_count_processed_aa' in stats) ? parseFloat(stats.read_count_processed_aa) : 0;
        // first round math
        var qc_fail_seqs  = raw_seqs - qc_seqs;
        var ann_rna_reads = rna_sims ? (rna_sims - r_clusts) + r_clust_seq : 0;
        var ann_aa_reads  = (ann_reads && (ann_reads > ann_rna_reads)) ? ann_reads - ann_rna_reads : 0;
        var unkn_aa_reads = aa_reads - ann_aa_reads;
        var unknown_all   = raw_seqs - (qc_fail_seqs + unkn_aa_reads + ann_aa_reads + ann_rna_reads);
        if (raw_seqs < (qc_fail_seqs + ann_rna_reads)) {
            var diff = (qc_fail_seqs + ann_rna_reads) - raw_seqs;
            unknown_all = (diff > unknown_all) ? 0 : unknown_all - diff;
        }
        // fuzzy math
        if (is_rna) {
            qc_fail_seqs  = raw_seqs - qc_rna_seqs;
            unkn_aa_reads = 0;
            ann_aa_reads  = 0;
            unknown_all   = raw_seqs - (qc_fail_seqs + ann_rna_reads);
        } else {
            if (unknown_all < 0) { unknown_all = 0; }
            if (raw_seqs < (qc_fail_seqs + unknown_all + unkn_aa_reads + ann_aa_reads + ann_rna_reads)) {
      	        var diff = (qc_fail_seqs + unknown_all + unkn_aa_reads + ann_aa_reads + ann_rna_reads) - raw_seqs;
      	        unknown_all = (diff > unknown_all) ? 0 : unknown_all - diff;
            }
            if ((unknown_all == 0) && (raw_seqs < (qc_fail_seqs + unkn_aa_reads + ann_aa_reads + ann_rna_reads))) {
      	        var diff = (qc_fail_seqs + unkn_aa_reads + ann_aa_reads + ann_rna_reads) - raw_seqs;
      	        unkn_aa_reads = (diff > unkn_aa_reads) ? 0 : unkn_aa_reads - diff;
            }
            // hack to make MT numbers add up
            if ((unknown_all == 0) && (unkn_aa_reads == 0) && (raw_seqs < (qc_fail_seqs + ann_aa_reads + ann_rna_reads))) {
      	        var diff = (qc_fail_seqs + ann_aa_reads + ann_rna_reads) - raw_seqs;
      	        ann_rna_reads = (diff > ann_rna_reads) ? 0 : ann_rna_reads - diff;
            }
        }
        return [ qc_fail_seqs, unknown_all, unkn_aa_reads, ann_aa_reads, ann_rna_reads ];
    };
    
    widget.piechart_footnote = function(index) {
	    return { width: "span9",
	             data: [ { footnote: { title: "Note:", text: "Sequences containing multiple predicted features are only counted in one category. Currently downloading of sequences via chart slices is not enabeled." } } ] };
    };
    
    widget.project_information = function(index) {
        var mg = Retina.WidgetInstances.metagenome_overview[index].curr_mg;
        try {
	        return { style: "clear: both",
	                 data: [ { header: "Project Information" },
			                 { p: "This metagenome is part of the project "+mg.metadata.project.name },
			                 { p: mg.metadata.project.data.project_description }
			               ] };
		} catch (err) {
            return null;
	    }
    };
    
    widget.drisee_introtext = function(index) {
        var mg = Retina.WidgetInstances.metagenome_overview[index].curr_mg;
        var mg_stats = Retina.WidgetInstances.metagenome_overview[index].curr_mg_stats;
        var message = '';
        if (mg.sequence_type == 'Amplicon') {
            message = "DRISEE cannot be run on Amplicon datasets.";
        } else if (! mg_stats.qc.drisee.percents.data) {
            message = "DRISEE could not produce a profile; the sample failed to meet the minimal ADR requirements to calculate an error profile (see Keegan et al. 2012)";
        } else {
            message = "DRISEE successfully calculated an error profile.";
        }
	return { style: "clear: both",
	         data: [ { header: "DRISEE" },
			 { p: "Duplicate Read Inferred Sequencing Error Estimation (<a href='http://www.ploscompbiol.org/article/info%3Adoi%2F10.1371%2Fjournal.pcbi.1002541'>Keegan et al., PLoS Computational Biology, 2012</a>)" },
			 { p: message },
			 { p: "DRISEE is a tool that utilizes artificial duplicate reads (ADRs) to provide a platform independent assessment of sequencing error in metagenomic (or genomic) sequencing data. DRISEE is designed to consider shotgun data. Currently, it is not appropriate for amplicon data." },
			 { p: "Note that DRISEE is designed to examine sequencing error in raw whole genome shotgun sequence data. It assumes that adapter and/or barcode sequences have been removed, but that the sequence data have not been modified in any additional way. (e.g.) Assembly or merging, QC based triage or trimming will both reduce DRISEE's ability to provide an accurate assessment of error by removing error before it is analyzed." }
                       ] };
    };
    
    widget.kmer_introtext = function(index) {
        var mg = Retina.WidgetInstances.metagenome_overview[index].curr_mg;
        var retval = { style: "clear: both", data: [ { header: "Kmer Profile" } ] };
	    if (mg.sequence_type == 'Amplicon') {
            retval.data.push( { p: "Since this is an amplicon dataset, no Kmer profile could be generated." } );
        } else {
            retval.data.push( { p: "The kmer abundance spectra are tools to summarize the redundancy (repetitiveness) of sequence datasets by counting the number of occurrences of 15 and 6 bp sequences." } );
            retval.data.push( { p: "The kmer rank abundance graph plots the kmer coverage as a function of abundance rank, with the most abundant sequences at left." } );
        }
	    return retval;
    };
    
    widget.bp_introtext = function(index) {
        var mg = Retina.WidgetInstances.metagenome_overview[index].curr_mg;
        var retval = { style: "clear: both", data: [ { header: "Nucleotide Histogram" } ] };
	    if (mg.sequence_type == 'Amplicon') {
            retval.data.push( { p: "Since this is an amplicon dataset, no Nucleotide histogram could be generated." } );
        } else {
            retval.data.push( { p: "These graphs show the fraction of base pairs of each type (A, C, G, T, or ambiguous base 'N') at each position starting from the beginning of each read up to the first 100 base pairs. Amplicon datasets should show consensus sequences; shotgun datasets should have roughly equal proportions of basecalls." } );
        }
	    return retval;
    };
    
    widget.rank_abund_introtext = function(index) {
        return { style: "clear: both",
                 data: [ { header: "Rank Abundance Plot" },
	                     { p: "The plot below shows the family abundances ordered from the most abundant to least abundant. Only the top 50 most abundant are shown. The y-axis plots the abundances of annotations in each family on a log scale." },
	                     { p: "The rank abundance curve is a tool for visually representing taxonomic richness and evenness." }
	                   ] };
    };
    
    widget.rarefaction_introtext = function(index) {
        return { data: [ { header: "Rarefaction Curve" },
	                     { p: "The plot below shows the rarefaction curve of annotated species richness. This curve is a plot of the total number of distinct species annotations as a function of the number of sequences sampled. On the left, a steep slope indicates that a large fraction of the species diversity remains to be discovered. If the curve becomes flatter to the right, a reasonable number of individuals is sampled: more intensive sampling is likely to yield only few additional species." },
	                     { p: "Sampling curves generally rise very quickly at first and then level off towards an asymptote as fewer new species are found per unit of individuals collected. These rarefaction curves are calculated from the table of species abundance. The curves represent the average number of different species annotations for subsamples of the the complete dataset." }
	                   ] };
    };
    
    widget.ontology_introtext = function(index) {
	    return { style: "clear: both",
	             data: [ { header: "Functional Category Hits Distribution" },
			             { p: "The pie charts below illustrate the distribution of functional categories for COGs, KOs, NOGs, and Subsystems at the highest level supported by these functional hierarchies. Each slice indicates the percentage of reads with predicted protein functions annotated to the category for the given source. " } ] };
    };
    
    widget.taxonomy_introtext = function(index) {
	    return { style: "clear: both",
	             data: [ { header: "Taxonomic Hits Distribution" },
			             { p: "The pie charts below illustrate the distribution of taxonomic domains, phyla, and orders for the annotations. Each slice indicates the percentage of reads with predicted proteins and ribosomal RNA genes annotated to the indicated taxonomic level. This information is based on all the annotation source databases used by MG-RAST." } ] };
    };
    
    widget.annotation_piechart = function(index, dcat, dtype) {
        var mg_stats = Retina.WidgetInstances.metagenome_overview[index].curr_mg_stats;
        var pieData = [];
        var annData = mg_stats[dcat][dtype];
        var colors  = GooglePalette(annData.length);
        var annMax  = 0;
        var annSort = annData.sort(function(a,b) {
            return b[1] - a[1];
        });        
        for (var i = 0; i < annSort.length; i++) {
    	    pieData.push({ name: annSort[i][0], data: [ parseInt(annSort[i][1]) ], fill: colors[i] });
    	    annMax = Math.max(annMax, annSort[i][0].length);
    	}
    	var pwidth  = 250;
    	var pheight = 250;
    	var lwidth  = Math.max(pwidth, annMax*7.5);
    	var lheight = pieData.length * 23;
    	var width   = pwidth+lwidth;
    	var height  = (lheight > pheight) ? Math.min(lheight, pheight+(pheight/2)) : pheight;
    	var data = { 'title': dtype,
    	             'type': 'pie',
    		         'title_settings': { 'font-size': '18px', 'font-weight': 'bold', 'x': 0, 'text-anchor': 'start' },
    		         'x_labels': [""],
    		         'show_legend': true,
    		         'legendArea': [pwidth+40, 20, lwidth, lheight],
    		         'chartArea': [25, 20, pwidth, pheight],
    		         'width': width,
    		         'height': height,
    		         'data': pieData };
    	return data;
    };

    widget.taxon_linegraph = function(index, level, num) {
        var taxons = Retina.WidgetInstances.metagenome_overview[index].curr_mg_stats.taxonomy;
        var lineData = [{ name: level+' rank abundance', data: []}];
        var xlabels  = [];
        var annSort  = taxons[level].sort(function(a,b) {
            return b[1] - a[1];
        });
        for (var i = 0; i < Math.min(num, annSort.length); i++) {
    	    lineData[0].data.push( parseInt(annSort[i][1]) );
    	    xlabels.push( annSort[i][0] );
    	}
        var gwidth  = 750;
    	var gheight = 300;
    	var longest = xlabels.reduce(function (a, b) { return a.length > b.length ? a : b; });
    	var data = { 'title': '',
    	             'type': 'column',
    	             'default_line_width': 2,
    	             'default_line_color': 'blue',
		             'y_scale': 'log',
    		         'x_labels': xlabels,
    		         'x_labels_rotation': '310',
    		         'x_tick_interval': xlabels.length,
    		         'show_legend': false,
    		         'chartArea': [80, 20, gwidth, gheight],
    		         'width': gwidth+80,
    		         'height': gheight+(longest.length * 4)+40,
    		         'data': lineData };
    	return data;
    };

    widget.bp_areagraph = function(index) {
        var mg_stats = Retina.WidgetInstances.metagenome_overview[index].curr_mg_stats;
        var labels = mg_stats.qc.bp_profile.percents.columns;
        var bpdata = mg_stats.qc.bp_profile.percents.data;
        var xt = 'bp '+labels[0];
        var yt = 'Percent bp';
        var names  = labels.slice(1);
        var colors = GooglePalette(names.length);
        var areaData = [];
        for (var x = 0; x < names.length; x++) {
    	    areaData.push({ name: names[x], data: [], fill: colors[x] });
    	}
        for (var i = 0; i < bpdata.length; i++) {
            labels.push(bpdata[i][0]);
            for (var j = 1; j < bpdata[i].length; j++) {
                areaData[j-1].data.push( parseFloat(bpdata[i][j]) );
            }
        }
        var pwidth  = 750;
    	var pheight = 300;
    	var lwidth  = 15;
    	var lheight = areaData.length * 23;
    	var width   = pwidth+lwidth;
    	var height  = (lheight > pheight) ? Math.min(lheight, pheight+(pheight/2)) : pheight;
        var data = { 'x_title': xt,
                     'y_title': yt,
                     'type': 'stackedArea',
                     'x_tick_interval': parseInt(bpdata.length/50),
                     'x_labeled_tick_interval': parseInt(bpdata.length/10),
                     'show_legend': true,
                     'legendArea': [pwidth+20, 20, lwidth, lheight],
     		         'chartArea': [70, 20, pwidth, pheight],
     		         'width': width+40,
     		         'height': height+45,
                     'data': areaData
                 };
        return data;
    };

    widget.mg_plot = function(index, type, kmer) {
        var mg_stats = Retina.WidgetInstances.metagenome_overview[index].curr_mg_stats;
        var data, x, y, labels, points, xt, yt;
        var xscale = 'linear';
        var yscale = 'linear';
	    switch (type) {
	        case 'drisee':
	        try {
	            data = Retina.WidgetInstances.metagenome_overview[0].multi_plot(0, [1,2,3,4,5,6,7], mg_stats.qc.drisee.percents.columns, mg_stats.qc.drisee.percents.data, 'bp position', 'percent error');
	        } catch (err) {
        	    data = undefined;
        	}
            break;
            case 'kmer':
	        points = [];
	        var xi, yi;
            switch (kmer) {
                case 'ranked':
                xi = 3;
                yi = 5;
                xt = 'sequence size';
                yt = 'fraction of observed kmers';
                xscale = 'log';
                yscale = 'linear';
                break;
                case 'spectrum':
                xi = 0;
                yi = 1;
                xt = 'kmer coverage';
                yt = 'number of kmers';
                xscale = 'log';
                yscale = 'log';
                break;
                default:
                xi = 3;
                yi = 0;
                xt = 'sequence size';
                yt = 'kmer coverage';
                xscale = 'log';
                yscale = 'log';
                break;
            }
	        try {
	            for (var i = 0; i < mg_stats.qc.kmer['15_mer']['data'].length; i+=2) {
	                var thisY = (yi == 5) ? 1 - parseFloat(mg_stats.qc.kmer['15_mer']['data'][i][yi]) : mg_stats.qc.kmer['15_mer']['data'][i][yi];
                    points.push([ mg_stats.qc.kmer['15_mer']['data'][i][xi], thisY ]);
                }
                data = Retina.WidgetInstances.metagenome_overview[0].single_plot(points, xt, yt, xscale, yscale);
            } catch (err) {
        	    data = undefined;
        	}
            break;
            case 'rarefaction':
            try {
                data = Retina.WidgetInstances.metagenome_overview[0].single_plot(mg_stats.rarefaction, 'number of reads', 'species count', xscale, yscale);
            } catch (err) {
            	data = undefined;
            }
            break;
            default:
            break;
        }
        return data;
    };

    widget.single_plot = function(nums, xt, yt, xscale, yscale) {
        if (! (nums && nums.length)) {
            return undefined;
        }
        var xy = [];
        var x_all = [];
        var y_all = [];
        for (var i = 0; i < nums.length; i++) {
            xy.push({ 'x': parseFloat(nums[i][0]), 'y': parseFloat(nums[i][1]) });
            x_all.push( parseFloat(nums[i][0]) );
            y_all.push( parseFloat(nums[i][1]) );
        }
        var pwidth  = 750;
    	var pheight = 300;
	    var ymax = Math.max.apply(Math, y_all);
	    ymax = ymax + (((yscale == 'log') ? 0.25 : 0.05) * ymax);
	    var pot = ymax.toString().indexOf('.') || ymax.toString.length;
	    pot = Math.pow(10, pot - 1);
	    ymax = Math.floor((ymax + pot) / pot) * pot;
        var data = { 'x_titleOffset': 40,
                     'y_titleOffset': 60,
		             'x_title': xt,
                     'y_title': yt,
                     'x_scale': xscale,
                     'y_scale': yscale,
                     'x_min': Math.min.apply(Math, x_all),
                     'x_max': Math.max.apply(Math, x_all),
                     'y_min': 0,
                     'y_max': ymax,
                     'show_legend': false,
                     'show_dots': false,
                     'connected': true,
                     'chartArea': [70, 20, pwidth, pheight],
                     'width': pwidth+40,
                     'height': pheight+45,
                     'data': {'series': [{'name': ''}], 'points': [xy]}          
                 };
        return data;
    };

    widget.multi_plot = function(x, y, labels, nums, xt, yt) {
        if (! (labels && nums && labels.length && nums.length)) {
            return undefined;
        }
        var series = [];
        var points = [];
        var x_all  = [];
        var y_all  = [];
        var annMax = 0;
        var colors = GooglePalette(y.length);
        for (var i = 0; i < y.length; i++) {
            series.push({'name': labels[y[i]], 'color': colors[i]});
            annMax = Math.max(annMax, labels[y[i]].length);
            xy = [];
            for (var j = 0; j < nums.length; j++) {
                xy.push({ 'x': parseFloat(nums[j][x]), 'y': parseFloat(nums[j][y[i]]) });
                x_all.push( parseFloat(nums[j][x]) );
                y_all.push( parseFloat(nums[j][y[i]]) );
            }
            points.push(xy);
        }
        var pwidth  = 750;
    	var pheight = 300;
    	var lwidth  = annMax * 10;
    	var lheight = series.length * 23;
    	var width   = pwidth+lwidth;
    	var height  = (lheight > pheight) ? Math.min(lheight, pheight+(pheight/2)) : pheight;
        var data = { 'y_titleOffset': 60,
                     'x_titleOffset': 40,
                     'x_title': xt,
                     'y_title': yt,
                     'x_min': Math.min.apply(Math, x_all),
                     'x_max': Math.max.apply(Math, x_all),
                     'y_min': Math.min.apply(Math, y_all),
                     'y_max': Math.max.apply(Math, y_all),
                     'show_legend': true,
                     'show_dots': false,
                     'connected': true,
                     'legendArea': [pwidth+20, 20, lwidth, lheight],
     		         'chartArea': [70, 20, pwidth, pheight],
     		         'width': width+40,
     		         'height': height+45,
                     'data': {'series': series, 'points': points}
                 };
        return data;
    };

    widget.metadata_table = function(index) {
        var md = Retina.WidgetInstances.metagenome_overview[index].curr_mg.metadata;
        var cats  = ['project', 'sample', 'library', 'env_package'];
        var tdata = [];
        for (var c in cats) {
            if (md[cats[c]]) {
                for (var key in md[cats[c]]['data']) {
                    tdata.push([ cats[c], key, md[cats[c]]['data'][key] ]);
                }
            }
        }
        var data = { 'width': 400,
                     'height': 600,
                     'data': {'data': tdata, 'header': ['category', 'field', 'value']},
                     'rows_per_page': 20,
                     'sort_autodetect': true,
                     'filter_autodetect': true,
                     'hide_options': false
                   };
        return data;
    };

    widget.analysis_statistics = function(index) {
        var stats = Retina.WidgetInstances.metagenome_overview[index].curr_mg_stats.sequence_stats;
	    return { width: "span6",
		         style: "float: left;",
		         data: [ { header: "Analysis Statistics" },
			             { fancy_table: { data: [
			                 [ { header: "Upload: bp Count" }, widget._to_num('bp_count_raw', stats)+" bp" ],
			                 [ { header: "Upload: Sequences Count" }, widget._to_num('sequence_count_raw', stats) ],
			                 [ { header: "Upload: Mean Sequence Length" }, widget._to_num('average_length_raw', stats)+" ± "+widget._to_num('standard_deviation_length_raw', stats)+" bp" ],
			                 [ { header: "Upload: Mean GC percent" }, widget._to_num('average_gc_content_raw', stats)+" ± "+widget._to_num('standard_deviation_gc_content_raw', stats)+" %" ],
			                 [ { header: "Artificial Duplicate Reads: Sequence Count" }, widget._to_num('sequence_count_dereplication_removed', stats) ],
			                 [ { header: "Post QC: bp Count" }, widget._to_num('bp_count_preprocessed', stats)+" bp" ],
			                 [ { header: "Post QC: Sequences Count" }, widget._to_num('sequence_count_preprocessed', stats) ],
			                 [ { header: "Post QC: Mean Sequence Length" }, widget._to_num('average_length_preprocessed', stats)+" ± "+widget._to_num('standard_deviation_length_preprocessed', stats)+" bp" ],
			                 [ { header: "Post QC: Mean GC percent" }, widget._to_num('average_gc_content_preprocessed', stats)+" ± "+widget._to_num('standard_deviation_gc_content_preprocessed', stats)+" %" ],
			                 [ { header: "Processed: Predicted Protein Features" }, widget._to_num('sequence_count_processed_aa', stats) ],
			                 [ { header: "Processed: Predicted rRNA Features" }, widget._to_num('sequence_count_processed_rna', stats) ],
			                 [ { header: "Alignment: Identified Protein Features" }, widget._to_num('sequence_count_sims_aa', stats) ],
			                 [ { header: "Alignment: Identified rRNA Features" }, widget._to_num('sequence_count_sims_rna', stats) ],
			                 [ { header: "Annotation: Identified Functional Categories" }, widget._to_num('sequence_count_ontology', stats) ]
			                 ] } }
			            ] };
    };
    
    widget.mixs_metadata = function(index, hide_link) {
        var md = Retina.WidgetInstances.metagenome_overview[index].curr_mg.mixs;
        var data = { width: "span6",
		             style: "float: right;",
		             data: [ { header: "GSC MIxS Info" },
			                 { fancy_table: { data: [
			                     [ { header: "Investigation Type" }, md['sequence_type'] ],
			                     [ { header: "Project Name" }, md['project'] ],
			                     [ { header: "Latitude and Longitude" }, md['latitude']+" , "+md['longitude'] ],
			                     [ { header: "Country and/or Sea, Location" }, md['country']+" , "+md['location'] ],
			                     [ { header: "Collection Date" }, md['collection_date'] ],
			                     [ { header: "Environment (Biome)" }, md['biome'] ],
			                     [ { header: "Environment (Feature)" }, md['feature'] ],
			                     [ { header: "Environment (Material)" }, md['material'] ],
			                     [ { header: "Environmental Package" }, md['package'] ],
			                     [ { header: "Sequencing Method" }, md['seq_method'] ]
			                     ] }
			                 }
			            ] };
		if (! hide_link) {
		    data.data[1].fancy_table.data.push( [{header: "More Metadata"}, "<a href='#metadata_table'>click for full table</a>"] );
	    }
		return data;
    };
    
    widget._to_per = function(n, d) {
        return (parseInt(n) / parseInt(d) * 100).formatString(1) + "%";
    };
    
    widget._to_num = function(key, obj) {
        var num = (key in obj) ? obj[key] : 0;
        return parseInt(num).formatString();
    };
    
})();