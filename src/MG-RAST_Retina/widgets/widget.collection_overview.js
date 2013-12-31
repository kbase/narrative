(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Collection Overview Widget",
                name: "collection_overview",
                author: "Travis Harrison",
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
    widget.sub_mgs = [];
    widget.curr_mgs = [];
    widget.curr_mg_stats = [];
    
    widget.get_mgs = function (index, stats) {
        var mg_ids = Retina.WidgetInstances.collection_overview[index].sub_mgs;
        var mg_set = stats ? Retina.WidgetInstances.collection_overview[index].curr_mg_stats : Retina.WidgetInstances.collection_overview[index].curr_mgs;
        if (mg_ids.length > 0) {
            return mg_set.filter(function (i) { return (mg_ids.indexOf(i.id) !== -1); });
        } else {
            return mg_set;
        }
    };
    
    widget.display = function (wparams) {
        widget = this;
	    var index = widget.index;
        // check if id given
        if (wparams.ids) {
            jQuery('#mg_modal').modal('hide');
	        // check if required data is loaded (use stats)
	        var stats_promises = [];
	        for (var i in wparams.ids) {
	            if (! (stm.DataStore.hasOwnProperty('metagenome_statistics') && stm.DataStore.metagenome_statistics.hasOwnProperty(wparams.ids[i]))) {
	                stats_promises.push(stm.get_objects({ "type": "metagenome", "id": wparams.ids[i], "options": { "verbosity": "full" } }));
    	            stats_promises.push(stm.get_objects({ "type": "metagenome_statistics", "id": wparams.ids[i], "options": { "verbosity": "full" } }));
	            }
            }
            if (stats_promises.length > 0) {
	            jQuery.when.apply(this, stats_promises).then(function() {
		            widget.display(wparams);
	            });
	            return;
            }
        }
	    // get ids first
        else {
            widget.metagenome_modal(index, wparams.target);
            return;
        }
	
	    // make some shortcuts
	    var content = wparams.target;
	    widget.curr_mgs = [];
    	widget.curr_mg_stats = [];
	    for (var i in wparams.ids) {
	        widget.curr_mgs.push( stm.DataStore.metagenome[wparams.ids[i]] );
	        widget.curr_mg_stats.push( stm.DataStore.metagenome_statistics[wparams.ids[i]] );
        }
	
	    // set the output area
	    content.innerHTML = '';
	
	    // set style variables
	    var header_color = "black";
	    var title_color = "black";
	    var outputs = [
	        { type: 'paragraph', data: 'toc_list' },
	        { type: 'title', data: 'Overview' },
	        { type: 'table', data: 'overview_table', category: 'overview' },
	        { type: 'stackcolumn', data: 'summary_stack' },
	        { type: 'title', data: 'Analysis Statistics' },
	        { type: 'table', data: 'summary_stats_table', category: 'summary_stats' },
	        { type: 'title', data: 'GSC MIxS Info' },
	        { type: 'table', data: 'mixs_metadata_table', category: 'mixs' },
	        { type: 'paragraph', data: 'drisee_introtext' },
	        { type: 'plot', data: 'drisee_plot', category: 'drisee' },
	        { type: 'paragraph', data: 'kmer_introtext' },
	        { type: 'plot', data: 'kmer_plot', category: 'kmer' },
	        { type: 'paragraph', data: 'ontology_introtext' },
	        { type: 'barchart', data: 'COG', category: 'ontology' },
	        { type: 'barchart', data: 'KO', category: 'ontology' },
	        { type: 'barchart', data: 'NOG', category: 'ontology' },
	        { type: 'barchart', data: 'Subsystems', category: 'ontology' },
	        { type: 'paragraph', data: 'taxonomy_introtext' },
	        { type: 'barchart', data: 'domain', category: 'taxonomy' },
	        { type: 'barchart', data: 'phylum', category: 'taxonomy' },
	        { type: 'barchart', data: 'class', category: 'taxonomy' },
	        { type: 'paragraph', data: 'rarefaction_introtext' },
	        { type: 'plot', data: 'rarefaction_plot', category: 'rarefaction' },
	        { type: 'title', data: 'Metadata' },
	        { type: 'table', data: 'full_metadata_table', category: 'metadata' }
	    ];
	
	    // iterate over the outputs
	    for (out=0;out<outputs.length;out++) {
	        if (! outputs[out]) {
		        continue;
	        }
	        // create and append the output div
	        var data;
	        var div = document.createElement('div');
	        var tag = document.createElement('a');
	        tag.setAttribute('name', outputs[out].data);
	        content.appendChild(tag);
	        content.appendChild(div);
	    
	        // check the type and call the according renderer with the data generated by the defined function
	        switch (outputs[out].type) {
	            case 'title':
	            Retina.Renderer.create("paragraph", {target: div, data: [{header: outputs[out].data}]}).render();
	            break;
	            case 'paragraph':
		        data = widget[outputs[out].data](index);
		        if (! data) {
                    content.removeChild(tag);
		            content.removeChild(div);
                    break;
                }
		        data.target = div;
		        data.title_color = title_color;
		        data.header_color = header_color;
		        Retina.Renderer.create("paragraph", data).render();
		        break;
		        case 'stackcolumn':
		        data = widget.summary_stackcolumn(index);
		        data.target = div;
		        Retina.Renderer.create("graph", data).render();
		        break;
	            case 'barchart':
	            data = widget.annotation_barchart(index, outputs[out].category, outputs[out].data);
	            if (! data) {
                    content.removeChild(tag);
		            content.removeChild(div);
                    break;
                }
		        data.target = div;
		        Retina.Renderer.create("graph", data).render();
		        break;
	            case 'plot':
	            data = widget.mgs_plot(index, outputs[out].category);
	            if (! data) {
                    content.removeChild(tag);
		            content.removeChild(div);
                    break;
                }
                data.target = div;
                Retina.Renderer.create("plot", data).render();
                break;
                case 'table':
                data = widget.build_table(index, outputs[out].category);
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
        if (! Retina.WidgetInstances.collection_overview[index].mg_select_list) {
            jQuery.getJSON('data/mg_mixs_public.json', function(data) {
                for (var d in data) {
                    if (data.hasOwnProperty(d)) {
                        stm.load_data({"data": data[d], "type": d});
                    }
                }
                Retina.WidgetInstances.collection_overview[index].metagenome_selector(index, target);
            }).fail( function() {
                stm.get_objects({"type": "metagenome", "options": {"verbosity": "mixs", "limit": 0}}).then(function() {
                    Retina.WidgetInstances.collection_overview[index].metagenome_selector(index, target);
                });
            });
        } else {
            Retina.WidgetInstances.collection_overview[index].mg_select_list.render();
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
    	Retina.WidgetInstances.collection_overview[index].mg_select_list = Retina.Renderer.create('listselect', {
    	    "target": document.getElementById('mg_modal_body'),
			"data": metagenome_data,
		    "value": "id",
            "label": "name",
	        "filter": ["name", "id", "project", "status", "lat/long", "location", "collection date", "biome", "feature", "material", "package", "sequencing method", "sequencing type"],
	        "sort": true,
	        "multiple": true,
		    "callback": function (data) {
		        if ((! data) || (data.length == 0)) {
    	            alert("You have not selected any metagenomes.\nPlease place the metagenomes of your choice in the right side box'.");
        	        return;
    	        }
		        Retina.WidgetInstances.collection_overview[index].display({"target": target, "ids": data});
	        }
		});
		Retina.WidgetInstances.collection_overview[index].mg_select_list.render();
    };
    
    widget.toc_list = function(index) {
        return { data: [ { header: "Table of Contents" },
			             { fancy_table: {
			                 data: [ [ "<a href='#overview_table'>Overview Info</a>",
			                           "<a href='#summary_stack'>Sequence Summary</a>",
			                           "<a href='#summary_stats_table'>Statistics</a>",
			                           "<a href='#mixs_metadata_table'>MIxS Metadata</a>",
			                           "<a href='#drisee_introtext'>DRISEE</a>" ],
			                         [ "<a href='#kmer_introtext'>Kmer Profile</a>",
			                           "<a href='#ontology_introtext'>Functional Hits</a>",
			                           "<a href='#taxonomy_introtext'>Taxonomic Hits</a>",
			                           "<a href='#rarefaction_introtext'>Rarefaction Curve</a>",
			                           "<a href='#full_metadata_table'>Full Metadata</a>" ]
			                       ] } }
			            ] };
    };

    widget.summary_stackcolumn = function(index) {
        var mgs = Retina.WidgetInstances.collection_overview[index].get_mgs(index, false);
        var mg_stats = Retina.WidgetInstances.collection_overview[index].get_mgs(index, true);
	    var scData = [];
	    var labels = [];
	    var legend = ["Failed QC", "Unknown", "Unknown Protein", "Annotated Protein", "ribosomal RNA"];
	    var colors = ["#6C6C6C", "#dc3912", "#ff9900", "#109618", "#3366cc", "#990099"];
	    for (var l in legend) {
	        scData.push({ name: legend[l], data: [], fill: colors[l] });
	    }
	    for (var m in mgs) {
	        labels.push(mgs[m].id);
	        var scNums = Retina.WidgetInstances.collection_overview[index]._summary_fuzzy_math(mgs[m], mg_stats[m]);
	        for (var i in scNums) {
	            scData[i].data[m] = parseInt(scNums[i]);
	        }
	    }
	    var pwidth  = mgs.length * 75;
    	var lwidth  = 150;
    	var lheight = 150;
    	var width   = pwidth+lwidth;
    	var height  = 300;
	    var data = { 'title': 'Sequence Breakdown',
	                 'type': 'stackedColumn',
		             'title_settings': { 'font-size': '18px', 'font-weight': 'bold', 'x': 0, 'text-anchor': 'start' },
		             'x_labels': labels,
		             'x_labels_rotation': 300,
		             'show_legend': true,
		             'legend_position': 'right',
		             'legendArea': [pwidth+30, 50, lwidth, lheight],
		             'chartArea': [30, 50, pwidth, height],
		             'width': width+30,
		             'height': height+50,
		             'data': scData };
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
            var diff;
            if (unknown_all < 0) { unknown_all = 0; }
            if (raw_seqs < (qc_fail_seqs + unknown_all + unkn_aa_reads + ann_aa_reads + ann_rna_reads)) {
      	        diff = (qc_fail_seqs + unknown_all + unkn_aa_reads + ann_aa_reads + ann_rna_reads) - raw_seqs;
      	        unknown_all = (diff > unknown_all) ? 0 : unknown_all - diff;
            }
            if ((unknown_all == 0) && (raw_seqs < (qc_fail_seqs + unkn_aa_reads + ann_aa_reads + ann_rna_reads))) {
      	        diff = (qc_fail_seqs + unkn_aa_reads + ann_aa_reads + ann_rna_reads) - raw_seqs;
      	        unkn_aa_reads = (diff > unkn_aa_reads) ? 0 : unkn_aa_reads - diff;
            }
            // hack to make MT numbers add up
            if ((unknown_all == 0) && (unkn_aa_reads == 0) && (raw_seqs < (qc_fail_seqs + ann_aa_reads + ann_rna_reads))) {
      	        diff = (qc_fail_seqs + ann_aa_reads + ann_rna_reads) - raw_seqs;
      	        ann_rna_reads = (diff > ann_rna_reads) ? 0 : ann_rna_reads - diff;
            }
        }
        return [ qc_fail_seqs, unknown_all, unkn_aa_reads, ann_aa_reads, ann_rna_reads ];
    };
    
    widget.drisee_introtext = function(index) {
	    return { style: "clear: both", data: [ { header: "DRISEE" },
			 { p: "Duplicate Read Inferred Sequencing Error Estimation (<a href='http://www.ploscompbiol.org/article/info%3Adoi%2F10.1371%2Fjournal.pcbi.1002541'>Keegan et al., PLoS Computational Biology, 2012</a>)" },
			 { p: "DRISEE is a tool that utilizes artificial duplicate reads (ADRs) to provide a platform independent assessment of sequencing error in metagenomic (or genomic) sequencing data. DRISEE is designed to consider shotgun data. Currently, it is not appropriate for amplicon data." },
			 { p: "Note that DRISEE is designed to examine sequencing error in raw whole genome shotgun sequence data. It assumes that adapter and/or barcode sequences have been removed, but that the sequence data have not been modified in any additional way. (e.g.) Assembly or merging, QC based triage or trimming will both reduce DRISEE's ability to provide an accurate assessment of error by removing error before it is analyzed." }
        ] };
    };
    
    widget.kmer_introtext = function(index) {
	    return { style: "clear: both", data: [ { header: "Kmer Profile" },
	        { p: "The kmer abundance spectra are tools to summarize the redundancy (repetitiveness) of sequence datasets by counting the number of occurrences of 15 and 6 bp sequences." },
	        { p: "The kmer rank abundance graph plots the kmer coverage as a function of abundance rank, with the most abundant sequences at left." }
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
	    return { data: [ { header: "Taxonomic Hits Distribution" },
			             { p: "The pie charts below illustrate the distribution of taxonomic domains, phyla, and orders for the annotations. Each slice indicates the percentage of reads with predicted proteins and ribosomal RNA genes annotated to the indicated taxonomic level. This information is based on all the annotation source databases used by MG-RAST." } ] };
    };
    
    widget.annotation_barchart = function(index, dcat, dtype) {
        var mg_stats = Retina.WidgetInstances.collection_overview[index].get_mgs(index, true);
        var annotSet = {};
        var annotMg = {};
        var barData = [];
        var colors  = GooglePalette(mg_stats.length);
        var annMax  = 0;
        for (var i in mg_stats) {
            try {
                barData.push({ name: mg_stats[i].id, data: [], fill: colors[i] });
                var thisAnnot = mg_stats[i][dcat][dtype];
                var thisData  = {};
                for (var j in thisAnnot) {
                    annotSet[ thisAnnot[j][0] ] = 1;
                    thisData[ thisAnnot[j][0] ] = thisAnnot[j][1];
                    annMax = Math.max(annMax, thisAnnot[j][0].length);
                }
                annotMg[ mg_stats[i].id ] = thisData;
            } catch (err) {
    	        continue;
    	    }
        }
        var annot = Object.keys(annotSet).sort();
        for (var m in mg_stats) {
            var mid = mg_stats[m].id;
            if (! annotMg.hasOwnProperty(mid)) {
                continue;
            }
            for (var a in annot) {
                if (annotMg[mid].hasOwnProperty(annot[a])) {
                    barData[m].data.push( parseInt(annotMg[mid][annot[a]]) );
                } else {
                    barData[m].data.push(0);
                }
            }
        }
        if ((annot.length == 0) || (barData.length == 0)) {
            return undefined;
        }        
        var width   = 600;
        var height  = annot.length * barData.length * 7.5;
        var lwidth  = annMax * 7.8;
        var lheight = barData.length*35;
        if (height < 100) {
            height = 100;
        }
    	var data = { 'title': dtype,
    	             'type': 'row',
    		         'title_settings': { 'font-size': '18px', 'font-weight': 'bold', 'x': 0, 'text-anchor': 'start' },
    		         'x_labels': annot,
    		         'show_legend': true,
    		         'legendArea': [width+lwidth, 50, 150, lheight],
    		         'chartArea': [lwidth, 50, 0.81, height],
    		         'width': width+lwidth+150,
    		         'height': Math.max(height, lheight),
    		         'data': barData };
    	return data;
    };
    
    widget.mgs_plot = function(index, type, kmer) {
        var mg_stats = Retina.WidgetInstances.collection_overview[index].get_mgs(index, true);
        var xt, yt;
        var labels = [];
        var points = [];
        var xscale = 'linear';
        var yscale = 'linear';
        switch (type) {
            case 'drisee':
            for (var m in mg_stats) {
                try {
                    var xy = [];
        	        for (var i in mg_stats[m].qc.drisee.percents.data) {
        	            xy.push( [ mg_stats[m].qc.drisee.percents.data[i][0], mg_stats[m].qc.drisee.percents.data[i][7] ] );
        	        }
        	        if (! xy.length) {
        	            continue;
        	        }
        	        points.push(xy);
        	        labels.push(mg_stats[m].id);
        	    } catch (err) {
        	        continue;
        	    }
            }
            xt = 'bp position';
            yt = 'percent error';
            break;
            case 'kmer':
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
            for (var m in mg_stats) {
                try {
                    var xy = [];
                    for (var i = 0; i < mg_stats[m].qc.kmer['15_mer']['data'].length; i+=4) {
                        var thisY = (yi == 5) ? 1 - parseFloat(mg_stats[m].qc.kmer['15_mer']['data'][i][yi]) : mg_stats[m].qc.kmer['15_mer']['data'][i][yi];
                        xy.push( [ mg_stats[m].qc.kmer['15_mer']['data'][i][xi], thisY ] );
                    }
                    points.push(xy);
        	        labels.push(mg_stats[m].id);
                } catch (err) {
            	    continue;
            	}
        	}
            break;
            case 'rarefaction':
            for (var m in mg_stats) {
                try {
                    var xy = [];
                    for (var i=0; i<mg_stats[m].rarefaction.length; i+=4) {
                        xy.push( [ mg_stats[m].rarefaction[i][0], mg_stats[m].rarefaction[i][1] ] );
                    }
                    points.push(xy);
        	        labels.push(mg_stats[m].id);
                } catch (err) {
            	    continue;
            	}
        	}
            xt = 'number of reads';
            yt = 'species count';
            break;
            default:
            break;
        }
        if (! (labels.length && points.length)) {
            return undefined;
        }
        return Retina.WidgetInstances.collection_overview[0].multi_plot(points, labels, xt, yt, xscale, yscale);
    };

    widget.multi_plot = function(points, labels, xt, yt, xscale, yscale) {
        var plotData = {'series': [], 'points': []};
        var x_all  = [];
        var y_all  = [];
        var annMax = 0;
        var colors = GooglePalette(labels.length);
        if (labels.length != points.length) {
            return undefined;
        }
        for (var l in labels) {
            annMax = Math.max(annMax, labels[l].length);
            plotData.series.push({'name': labels[l], 'color': colors[l]});
        }
        for (var p in points) {
            var xy = [];
            for (var i in points[p]) {
                var x = parseFloat(points[p][i][0]);
                var y = parseFloat(points[p][i][1]);
                x_all.push(x);
                y_all.push(y);
                xy.push({ 'x': x, 'y': y });
            }
            plotData.points.push(xy);
        }
        var pwidth  = 750;
    	var pheight = 300;
    	var lwidth  = annMax * 10;
    	var lheight = plotData.series.length * 23;
    	var width   = pwidth+lwidth;
    	var height  = (lheight > pheight) ? Math.min(lheight, pheight+(pheight/2)) : pheight;
        var data = { 'y_titleOffset': 60,
                     'x_titleOffset': 40,
                     'x_title': xt,
                     'y_title': yt,
                     'x_scale': xscale,
                     'y_scale': yscale,
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
                     'data': plotData
                 };
        return data;
    };
    
    widget.build_table = function(index, type) {
        var mgs = Retina.WidgetInstances.collection_overview[index].get_mgs(index, false);
        var mg_stats = Retina.WidgetInstances.collection_overview[index].get_mgs(index, true);
        var widget = Retina.WidgetInstances.collection_overview[0];
        var cname = [];
        var tdata = [];
        var options = {};
        switch (type) {
            case 'overview':
            cname = ['Metagenome ID'];
            tdata = [ ["Metagenome Name"],
                      ["PI"],
                      ["Organization"],
                      ["Visibility"],
                      ["NCBI Project ID"],
                      ["GOLD ID"],
                      ["PubMed ID"] ];
            options = { 'sorted': true, 'disable_sort': {}, 'hide_options': true, 'rows_per_page': tdata.length, 'filter': {} };
            var pi_link, organization, ncbi_id, gold_id, pubmed_id;
            for (var m in mgs) {
                var md = mgs[m].metadata;
                try {
        	        pi_link = "<a href='mailto:"+md.project.data.PI_email+"'>"+md.project.data.PI_firstname+" "+md.project.data.PI_lastname+"</a>";
        	    } catch (err) {
        	        pi_link = "-";
        	    }
        	    try {
        	        organization = md.project.data.PI_organization;
        	        if (! organization) { organization = '-'; }
        	    } catch (err) {
        	        organization = "-";
        	    }
        	    try {
        	        ncbi_id = "<a href='http://www.ncbi.nlm.nih.gov/genomeprj/"+md.project.data.ncbi_id+"'>"+md.project.data.ncbi_id+"</a>";
        	        if (! md.project.data.ncbi_id) { ncbi_id = '-'; }
        	    } catch (err) {
        	        ncbi_id = "-";
        	    }
        	    try {
        	        gold_id = "<a href='http://www.ncbi.nlm.nih.gov/genomeprj/"+md.library.data.gold_id+"'>"+md.library.data.gold_id+"</a>";
        	        if (! md.library.data.gold_id) { gold_id = '-'; }
        	    } catch (err) {
        	        gold_id = "-";
        	    }
        	    try {
         	        pubmed_id = md.library.data.pubmed_id.split(", ");
        	        var pm = [];
        	        for (i=0;i<pubmed_id.length;i++) {
        		        pm.push("<a href='http://www.ncbi.nlm.nih.gov/pubmed/"+pubmed_id[i]+"'>"+pubmed_id[i]+"</a>");
        	        }
        	        pubmed_id = pm.join(", ");
        	        if (! md.library.data.pubmed_id) { pi_link = '-'; }
        	    } catch (err) {
        	        pubmed_id = "-";
        	    }
                tdata[0].push( mgs[m].name );
                tdata[1].push( pi_link );
                tdata[2].push( organization );
                tdata[3].push( mgs[m].status );
                tdata[4].push( ncbi_id );
                tdata[5].push( gold_id );
                tdata[6].push( pubmed_id );
            }
            break;
            case 'summary_stats':
            cname = ['statistics'];
            tdata = [ ["Upload: bp Count"],
                      ["Upload: Sequences Count"],
                      ["Upload: Mean Sequence Length"],
                      ["Upload: Mean GC percent"],
                      ["Artificial Duplicate Reads: Sequence Count"],
                      ["Post QC: bp Count"],
                      ["Post QC: Sequences Count"],
                      ["Post QC: Mean Sequence Length"],
                      ["Post QC: Mean GC percent"],
                      ["Processed: Predicted Protein Features"],
                      ["Processed: Predicted rRNA Features"],
                      ["Alignment: Identified Protein Features"],
                      ["Alignment: Identified rRNA Features"],
                      ["Annotation: Identified Functional Categories"] ];
            options = { 'sorted': false, 'disable_sort': {}, 'hide_options': true, 'rows_per_page': tdata.length, 'filter': {} };
            for (var s in mg_stats) {
                tdata[0].push( widget._to_num('bp_count_raw', mg_stats[s].sequence_stats)+" bp" );
                tdata[1].push( widget._to_num('sequence_count_raw', mg_stats[s].sequence_stats) );
                tdata[2].push( widget._to_num('average_length_raw', mg_stats[s].sequence_stats)+" ± "+widget._to_num('standard_deviation_length_raw', mg_stats[s].sequence_stats)+" bp" );
                tdata[3].push( widget._to_num('average_gc_content_raw', mg_stats[s].sequence_stats)+" ± "+widget._to_num('standard_deviation_gc_content_raw', mg_stats[s].sequence_stats)+" %" );
                tdata[4].push( widget._to_num('sequence_count_dereplication_removed', mg_stats[s].sequence_stats) );
                tdata[5].push( widget._to_num('bp_count_preprocessed', mg_stats[s].sequence_stats)+" bp" );
                tdata[6].push( widget._to_num('sequence_count_preprocessed', mg_stats[s].sequence_stats) );
                tdata[7].push( widget._to_num('average_length_preprocessed', mg_stats[s].sequence_stats)+" ± "+widget._to_num('standard_deviation_length_preprocessed', mg_stats[s].sequence_stats)+" bp" );
                tdata[8].push( widget._to_num('average_gc_content_preprocessed', mg_stats[s].sequence_stats)+" ± "+widget._to_num('standard_deviation_gc_content_preprocessed', mg_stats[s].sequence_stats)+" %" );
                tdata[9].push( widget._to_num('sequence_count_processed_aa', mg_stats[s].sequence_stats) );
                tdata[10].push( widget._to_num('sequence_count_processed_rna', mg_stats[s].sequence_stats) );
                tdata[11].push( widget._to_num('sequence_count_sims_aa', mg_stats[s].sequence_stats) );
                tdata[12].push( widget._to_num('sequence_count_sims_rna', mg_stats[s].sequence_stats) );
                tdata[13].push( widget._to_num('sequence_count_ontology', mg_stats[s].sequence_stats) );
            }
            break;
            case 'mixs':
            cname = ['term'];
            tdata = [ ["Investigation Type"],
                      ["Project Name"],
                      ["Latitude and Longitude"],
                      ["Country and/or Sea, Location"],
                      ["Collection Date"],
                      ["Environment (Biome)"],
                      ["Environment (Feature)"],
                      ["Environment (Material)"],
                      ["Environmental Package"],
                      ["Sequencing Method"] ];
            options = { 'sorted': false, 'disable_sort': {}, 'hide_options': true, 'rows_per_page': tdata.length, 'filter': {} };
            for (var m in mgs) {
                tdata[0].push( mgs[m].mixs['sequence_type'] );
                tdata[1].push( mgs[m].mixs['project'] );
                tdata[2].push( mgs[m].mixs['latitude']+" , "+mgs[m].mixs['longitude'] );
                tdata[3].push( mgs[m].mixs['country']+" , "+mgs[m].mixs['location'] );
                tdata[4].push( mgs[m].mixs['collection_date'] );
                tdata[5].push( mgs[m].mixs['biome'] );
                tdata[6].push( mgs[m].mixs['feature'] );
                tdata[7].push( mgs[m].mixs['material'] );
                tdata[8].push( mgs[m].mixs['package'] );
                tdata[9].push( mgs[m].mixs['seq_method'] );
            }
            break;
            case 'metadata':
            cname = ['category', 'field'];
            options = { 'sort_autodetect': true, 'filter_autodetect': true, 'hide_options': false, 'rows_per_page': 20 };
            var mdata = {'project': {}, 'sample': {}, 'library': {}, 'env_package': {}};
            for (var m in mgs) {
                for (var c in mdata) {
                    if (mgs[m].metadata.hasOwnProperty(c)) {
                        for (var key in mgs[m].metadata[c]['data']) {
                            if (! mdata[c].hasOwnProperty(key)) {
                                mdata[c][key] = new Array(mgs.length);
                            }
                            mdata[c][key][m] = mgs[m].metadata[c]['data'][key];
                        }
                    }
                }
            }
            for (var c in mdata) {
                for (var k in mdata[c]) {
                    tdata.push( [c, k].concat(mdata[c][k]) );
                }
            }
            break;
            default:
            tdata = [ mgs.map(function (i) { return ''; }) ];
            break;
        }
        var head = cname.concat( mgs.map(function (i) { return i.id; }) );
        if (options.hasOwnProperty('disable_sort')) {
            for (var i=1; i<head.length; i++) {
                options.disable_sort[i] = 1;
            }
        }
        var data = { 'width': 400,
                     'height': 600,
                     'data': {'data': tdata, 'header': head}
                   };
        return jQuery.extend({}, data, options);
    };
    
    widget._to_per = function(n, d) {
        return (parseInt(n) / parseInt(d) * 100).formatString(1) + "%";
    };
    
    widget._to_num = function(key, obj) {
        var num = (key in obj) ? obj[key] : 0;
        return parseInt(num).formatString();
    };
    
})();