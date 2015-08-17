/**
 * KBase widget to display a Metagenome
 */
define(['jquery', 'kbwidget', 'kbaseAuthenticatedWidget', 'kbaseTabs', 'RGBColor',
        'kbStandaloneTable', 'kbStandaloneGraph'], function($) {
    $.KBWidget({
        name: 'MetagenomeView',
        parent: "kbaseAuthenticatedWidget",
        version: '1.0.0',
        token: null,
        options: {
	        id: null,
	        ws: null
        },
	    ws_url: window.kbconfig.urls.workspace,
	    loading_image: "static/kbase/images/ajax-loader.gif",
        
	    init: function(options) {
            this._super(options);
            return this;
        },
	
        render: function() {
	        var self = this;
	        var pref = this.uuidv4();

	        var container = this.$elem;
	        container.empty();
            if (self.token == null) {
                container.append("<div>[Error] You're not logged in</div>");
                return;
            }
            container.append("<div><img src=\""+self.loading_image+"\">&nbsp;&nbsp;loading data...</div>");

	        var kbws = new Workspace(self.ws_url, {'token': self.token});
	        kbws.get_objects([{ref: self.options.ws+"/"+self.options.id}], function(data) {
	            container.empty();
		        // parse data
		        if (data.length == 0) {
		            var msg = "[Error] Object "+self.options.id+" does not exist in workspace "+self.options.ws;
		            container.append('<div><p>'+msg+'>/p></div>');
		        } else {
				    // parse data		            
				    var d = data[0]['data'];
                    
				    // get base numbers
        		    var stats  = d.statistics.sequence_stats;
        		    var is_rna = (d.sequence_type == 'Amplicon') ? 1 : 0;
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
            		    if ((unknown_all == 0) && (unkn_aa_reads == 0) && (raw_seqs < (qc_fail_seqs + ann_aa_reads + ann_rna_reads))) {
      	        		    var diff = (qc_fail_seqs + ann_aa_reads + ann_rna_reads) - raw_seqs;
      	        		    ann_rna_reads = (diff > ann_rna_reads) ? 0 : ann_rna_reads - diff;
            		    }
        		    }
                
                    // set tabs
                    var tabPane = $('<div id="'+pref+'tab-content">');
        		    container.append(tabPane);
        		    tabPane.kbaseTabs({canDelete : false, tabs : []});
                
                    // overview tab
                    var oTabDiv = $('<div id="'+pref+'overview">');
                    tabPane.kbaseTabs('addTab', {tab: 'Overview', content: oTabDiv, canDelete : false, show: true});
				    var html = '<h4>Info</h4>';
				    html += '<p><table class="table table-striped table-bordered" style="width: 50%;">';
				    html += '<tr><td style="padding-right: 25px; width: 165px;"><b>Metagenome ID</b></td><td>'+d.id+'</td></tr>';
				    html += '<tr><td style="padding-right: 25px; width: 165px;"><b>Metagenome Name</b></td><td>'+d.name+'</td></tr>';
				    html += '<tr><td style="padding-right: 25px; width: 165px;"><b>Project ID</b></td><td>'+d.metadata.project.id+'</td></tr>';
				    html += '<tr><td style="padding-right: 25px; width: 165px;"><b>Project Name</b></td><td>'+d.metadata.project.name+'</td></tr>';
                    html += '<tr><td style="padding-right: 25px; width: 165px;"><b>PI</b></td><td>'+d.metadata.project.data.PI_firstname+' '+d.metadata.project.data.PI_lastname+'</td></tr>';
                    html += '<tr><td style="padding-right: 25px; width: 165px;"><b>Organization</b></td><td>'+d.metadata.project.data.PI_organization+'</td></tr>';
                    html += '<tr><td style="padding-right: 25px; width: 165px;"><b>Sequence Type</b></td><td>'+d.sequence_type+'</td></tr>';
				    html += '</table></p>';
				    html += '<h4>Summary</h4>';
				    html += '<p>The dataset '+d.name+' was uploaded on '+d.created+' and contains '+stats.sequence_count_raw+' sequences totaling '+stats.bp_count_raw+' basepairs with an average length of '+stats.average_length_raw+' bps.</p>';
        		    var ptext  = " Of the remainder, "+ann_aa_reads+" sequences ("+(ann_aa_reads / raw_seqs * 100).toFixed(2)+"%) contain predicted proteins with known functions and "+unkn_aa_reads+" sequences ("+(unkn_aa_reads / raw_seqs * 100).toFixed(2)+"%) contain predicted proteins with unknown function.";
        		    var ftext  = " "+unknown_all+" sequences ("+(unknown_all / raw_seqs * 100).toFixed(2)+"%) have no rRNA genes"+(is_rna ? '.' : " or predicted proteins");
				    html += '<p>'+qc_fail_seqs+' sequences ('+(qc_fail_seqs / raw_seqs * 100).toFixed(2)+'%) failed to pass the QC pipeline. Of the sequences that passed QC, '+ann_rna_reads+' sequences ('+(ann_rna_reads / raw_seqs * 100).toFixed(2)+'%) containe ribosomal RNA genes.'+(is_rna ? '' : ptext)+ftext+'</p>';
                    $('#'+pref+'overview').append(html);
                
                    // metadata tab
                    var mTabDiv = $('<div id="'+pref+'metadata" style="width: 95%;">');
                    tabPane.kbaseTabs('addTab', {tab: 'Metadata', content: mTabDiv, canDelete : false, show: true});
                    var tlen = 0;
    		        if (window.hasOwnProperty('rendererTable') && rendererTable.length) {
			            tlen = rendererTable.length;
		            }
		            var mdata = [];
		            var cats = ['project', 'sample', 'library', 'env_package'];
		            for (var c in cats) {
                        if (d.metadata[cats[c]]) {
                            for (var key in d.metadata[cats[c]]['data']) {
                                mdata.push([ cats[c], key, d.metadata[cats[c]]['data'][key] ]);
                            }
                        }
                    }
		            var tableMeta = standaloneTable.create({index: tlen});
  		            tableMeta.settings.target = document.getElementById(pref+'metadata');
    		        tableMeta.settings.data = { header: ['Category', 'Field', 'Value'], data: mdata };
		            tableMeta.settings.width = 400;
		            tableMeta.settings.height = 600;
		            tableMeta.settings.rows_per_page = 10;
		            tableMeta.settings.sort_autodetect = true;
		            tableMeta.settings.filter_autodetect = true;
		            tableMeta.settings.hide_options = false;
		            tableMeta.render(tlen);
                    
                    // seq stats tab
                    var oTabDiv = $('<div id="'+pref+'stats">');
                    tabPane.kbaseTabs('addTab', {tab: 'Statistics', content: oTabDiv, canDelete : false, show: false});
                    html = '<p><table class="table table-striped table-bordered" style="width: 65%;">';
                    html += '<tr><td style="padding-right: 25px; width: 325px;"><b>Upload: bp Count</b></td><td>'+stats.bp_count_raw+' bp</td></tr>';
                    html += '<tr><td style="padding-right: 25px; width: 325px;"><b>Upload: Sequences Count</b></td><td>'+stats.sequence_count_raw+'</td></tr>';
                    html += '<tr><td style="padding-right: 25px; width: 325px;"><b>Upload: Mean Sequence Length</b></td><td>'+stats.average_length_raw+" ± "+stats.standard_deviation_length_raw+' bp</td></tr>';
                    html += '<tr><td style="padding-right: 25px; width: 325px;"><b>Upload: Mean GC percent</b></td><td>'+stats.average_gc_content_raw+" ± "+stats.standard_deviation_gc_content_raw+' %</td></tr>';
                    html += '<tr><td style="padding-right: 25px; width: 325px;"><b>Artificial Duplicate Reads: Sequence Count</b></td><td>'+stats.sequence_count_dereplication_removed+'</td></tr>';
                    html += '<tr><td style="padding-right: 25px; width: 325px;"><b>Post QC: bp Count</b></td><td>'+stats.bp_count_preprocessed+'</td></tr>';
                    html += '<tr><td style="padding-right: 25px; width: 325px;"><b>Post QC: Sequences Count</b></td><td>'+stats.sequence_count_preprocessed+'</td></tr>';
                    html += '<tr><td style="padding-right: 25px; width: 325px;"><b>Post QC: Mean Sequence Length</b></td><td>'+stats.average_length_preprocessed+" ± "+stats.standard_deviation_length_preprocessed+' bp</td></tr>';
                    html += '<tr><td style="padding-right: 25px; width: 325px;"><b>Post QC: Mean GC percent</b></td><td>'+stats.average_gc_content_preprocessed+" ± "+stats.standard_deviation_gc_content_preprocessed+' %</td></tr>';
                    html += '<tr><td style="padding-right: 25px; width: 325px;"><b>Processed: Predicted Protein Features</b></td><td>'+stats.sequence_count_processed_aa+'</td></tr>';
                    html += '<tr><td style="padding-right: 25px; width: 325px;"><b>Processed: Predicted rRNA Features</b></td><td>'+stats.sequence_count_processed_rna+'</td></tr>';
                    html += '<tr><td style="padding-right: 25px; width: 325px;"><b>Alignment: Identified Protein Features</b></td><td>'+stats.sequence_count_sims_aa+'</td></tr>';
                    html += '<tr><td style="padding-right: 25px; width: 325px;"><b>Alignment: Identified rRNA Features</b></td><td>'+stats.sequence_count_sims_rna+'</td></tr>';
                    html += '<tr><td style="padding-right: 25px; width: 325px;"><b>Annotation: Identified Functional Categories</b></td><td>'+stats.sequence_count_ontology+'</td></tr>';
                    html += '</table></p>';
                    $('#'+pref+'stats').append(html);
                    
		            // drisee tab
		            var drisee_cols = d.statistics.qc.drisee.percents.columns;
		            var drisee_data = d.statistics.qc.drisee.percents.data;
		            if ((! is_rna) && drisee_cols && drisee_data && (drisee_cols.length > 0) && (drisee_data.length > 0)) {
		                var dTabDiv = $('<div id="'+pref+'drisee" style="width: 95%;">');
                        tabPane.kbaseTabs('addTab', {tab: 'DRISEE', content: dTabDiv, canDelete : false, show: true});
		                var dlen = 0;
    		            if (window.hasOwnProperty('rendererPlot') && rendererPlot.length) {
			                dlen = rendererPlot.length;
		                }
		                var x = 0;
		                var y = [1,2,3,4,5,6,7];
		                var series = [];
                        var points = [];
                        var x_all  = [];
                        var y_all  = [];
                        var annMax = 0;
                        var colors = GooglePalette(y.length);
                        for (var i = 0; i < y.length; i++) {
                            series.push({'name': drisee_cols[y[i]], 'color': colors[i]});
                            annMax = Math.max(annMax, drisee_cols[y[i]].length);
                            var xy = [];
                            for (var j = 0; j < drisee_data.length; j++) {
                                xy.push({ 'x': parseFloat(drisee_data[j][x]), 'y': parseFloat(drisee_data[j][y[i]]) });
                                x_all.push( parseFloat(drisee_data[j][x]) );
                                y_all.push( parseFloat(drisee_data[j][y[i]]) );
                            }
                            points.push(xy);
                        }
                        var pwidth = 750;
                        var pheight = 300;
                        var lwidth = annMax * 10;
                        var lheight = series.length * 23;
                        var width = pwidth+lwidth;
                        var height = (lheight > pheight) ? Math.min(lheight, pheight+(pheight/2)) : pheight;
                        var plotDrisee = standalonePlot.create({index: dlen});
                        plotDrisee.settings.target = document.getElementById(pref+'drisee');
                        plotDrisee.settings.data = {'series': series, 'points': points};
                        plotDrisee.settings.x_titleOffset = 40;
                        plotDrisee.settings.y_titleOffset = 60;
                        plotDrisee.settings.x_title = 'bp position';
                        plotDrisee.settings.y_title = 'percent error';
                        plotDrisee.settings.x_min = Math.min.apply(Math, x_all);
                        plotDrisee.settings.x_max = Math.max.apply(Math, x_all);
                        plotDrisee.settings.y_min = Math.min.apply(Math, y_all);
                        plotDrisee.settings.y_max = Math.max.apply(Math, y_all);
                        plotDrisee.settings.show_legend = true;
                        plotDrisee.settings.show_dots = false;
                        plotDrisee.settings.connected = true;
                        plotDrisee.settings.legendArea = [pwidth+20, 20, lwidth, lheight];
                        plotDrisee.settings.chartArea = [70, 20, pwidth, pheight];
                        plotDrisee.settings.width = width+40;
                        plotDrisee.settings.height = height+45;
		                plotDrisee.render(dlen);
		            }
		            
		            // kmer tab
		            var kmer_data = d.statistics.qc.kmer['15_mer']['data'];
		            if ((! is_rna) && kmer_data && (kmer_data.length > 0)) {
		                var kTabDiv = $('<div id="'+pref+'kmer" style="width: 95%;">');
                        tabPane.kbaseTabs('addTab', {tab: 'Kmer Profile', content: kTabDiv, canDelete : false, show: true});
		                var klen = 0;
    		            if (window.hasOwnProperty('rendererPlot') && rendererPlot.length) {
			                klen = rendererPlot.length;
		                }
		                var xy = [];
                        var x_all = [];
                        var y_all = [];
		                for (var i = 0; i < kmer_data.length; i+=2) {
		                    xy.push({ 'x': parseFloat(kmer_data[i][3]), 'y': parseFloat(kmer_data[i][0]) });
                            x_all.push( parseFloat(kmer_data[i][3]) );
                            y_all.push( parseFloat(kmer_data[i][0]) );
		                }
		                var pwidth = 750;
                        var pheight = 300;
                        var ymax = Math.max.apply(Math, y_all);
                        ymax = ymax + (0.25 * ymax)
                        var pot = ymax.toString().indexOf('.') || ymax.toString.length;
                        pot = Math.pow(10, pot - 1);
                        ymax = Math.floor((ymax + pot) / pot) * pot;
		                var plotKmer = standalonePlot.create({index: klen});
		                plotKmer.settings.target = document.getElementById(pref+'kmer');
                        plotKmer.settings.data = {'series': [{'name': ''}], 'points': [xy]};
		                plotKmer.settings.x_titleOffset = 40;
                        plotKmer.settings.y_titleOffset = 60;
		                plotKmer.settings.x_title = 'sequence size';
		                plotKmer.settings.y_title = 'kmer coverage';
		                plotKmer.settings.x_scale = 'log';
		                plotKmer.settings.y_scale = 'log';
		                plotKmer.settings.x_min = Math.min.apply(Math, x_all);
                        plotKmer.settings.x_max = Math.max.apply(Math, x_all);
                        plotKmer.settings.y_min = 0;
                        plotKmer.settings.y_max = ymax;
		                plotKmer.settings.show_legend = false;
                        plotKmer.settings.show_dots = false;
                        plotKmer.settings.connected = true;
                        plotKmer.settings.chartArea = [70, 20, pwidth, pheight];
                        plotKmer.settings.width = pwidth+40;
                        plotKmer.settings.height = pheight+45;
                        plotKmer.render(klen);
	                }
	                
	                // bp data
	                var bp_cols = d.statistics.qc.bp_profile.percents.columns;
	                var bp_data = d.statistics.qc.bp_profile.percents.data;
	                var gTabDiv = $('<div id="'+pref+'bp_plot" style="width: 95%;">');
                    tabPane.kbaseTabs('addTab', {tab: 'Nucleotide Histogram', content: gTabDiv, canDelete : false, show: true});
	                var glen = 0;
                    if (window.hasOwnProperty('rendererGraph') && rendererGraph.length) {
                        glen = rendererGraph.length;
                    }
                    var names = bp_cols.slice(1);
                    var colors = GooglePalette(names.length);
                    var areaData = [];
                    for (var x = 0; x < names.length; x++) {
                        areaData.push({ name: names[x], data: [], fill: colors[x] });
                    }
                    for (var i = 0; i < bp_data.length; i++) {
                        for (var j = 1; j < bp_data[i].length; j++) {
                            areaData[j-1].data.push( parseFloat(bp_data[i][j]) );
                        }
                    }
                    var pwidth = 750;
                    var pheight = 300;
                    var lwidth = 15;
                    var lheight = areaData.length * 23;
                    var width = pwidth+lwidth;
                    var height = (lheight > pheight) ? Math.min(lheight, pheight+(pheight/2)) : pheight;
                    var graphBP = standaloneGraph.create({index: glen});
	                graphBP.settings.target = document.getElementById(pref+'bp_plot');
                    graphBP.settings.data = areaData;
		            graphBP.settings.x_title = 'bp '+bp_cols[0];
		            graphBP.settings.y_title = 'Percent bp';
		            graphBP.settings.type = 'stackedArea';
		            graphBP.settings.x_tick_interval = parseInt(bp_data.length / 50);
		            graphBP.settings.x_labeled_tick_interval = parseInt(bp_data.length / 10);
		            graphBP.settings.show_legend = true;
		            graphBP.settings.legendArea = [pwidth+20, 20, lwidth, lheight];
		            graphBP.settings.chartArea = [70, 20, pwidth, pheight];
		            graphBP.settings.width = width+40;
		            graphBP.settings.height = height+45;
		            graphBP.render(glen);
		            
		            // set active
		            tabPane.kbaseTabs('showTab', 'Overview');
		        }
	        }, function(data) {
		        container.empty();
		        var main = $('<div>');
		        main.append($('<p>')
		            .css({'padding': '10px 20px'})
		            .text('[Error] '+data.error.message));
		        container.append(main);
	        });
	        return self;
        },

        loggedInCallback: function(event, auth) {
            this.token = auth.token;
            this.render();
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.token = null;
            this.render();
            return this;
        },
        
        uuidv4: function(a,b) {
	        for (b=a=''; a++<36; b+=a*51&52?(a^15?8^Math.random()*(a^20?16:4):4).toString(16):'-');
	        return b;
	    }
    });
});