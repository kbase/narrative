/**
 * KBase widget to display a Metagenome
 */
(function($, undefined) {
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

				var html = "<h3>Metagenome Data Sheet for "+d.id+"</h3>";
				html += '<table>';
				html += '<tr><td style="padding-right: 25px;"><b>Metagenome Name</b></td><td>'+d.name+'</td></tr>';
                                html += '<tr><td style="padding-right: 25px;"><b>PI</b></td><td>'+d.metadata.project.data.PI_firstname+' '+d.metadata.project.data.PI_lastname+'</td></tr>';
                                html += '<tr><td style="padding-right: 25px;"><b>Organization</b></td><td>'+d.metadata.project.data.PI_organization+'</td></tr>';
                                html += '<tr><td style="padding-right: 25px;"><b>Visibility</b></td><td>'+d["status"]+'</td></tr>';
				html += '</table>';
				html += '<h3>Metagenome Summary</h3>';
				html += '<p>The dataset '+d.name+' was uploaded on '+d.created+' and contains '+d.statistics.sequence_stats.sequence_count_raw+' sequences totaling '+d.statistics.sequence_stats.bp_count_raw+' basepairs with an average length of '+d.statistics.sequence_stats.average_length_raw+' bps.</p>';

				var is_rna = (d.sequence_type == 'Amplicon') ? 1 : 0;
				var total  = parseInt(stats['sequence_count_raw']);
        			var ptext  = " Of the remainder, "+ann_aa_reads+" sequences ("+(ann_aa_reads / total * 100).toFixed(2)+"%) contain predicted proteins with known functions and "+unkn_aa_reads+" sequences ("+(unkn_aa_reads / total * 100).toFixed(2)+"%) contain predicted proteins with unknown function.";
        			var ftext  = " "+unknown_all+" sequences ("+(unknown_all / total * 100).toFixed(2)+"%) have no rRNA genes"+(is_rna ? '.' : " or predicted proteins");
				html += '<p>'+qc_fail_seqs+' sequences ('+(qc_fail_seqs / total * 100).toFixed(2)+'%) failed to pass the QC pipeline. Of the sequences that passed QC, '+ann_rna_reads+' sequences ('+(ann_rna_reads / total * 100).toFixed(2)+'%) containe ribosomal RNA genes.'+(is_rna ? '' : ptext)+ftext+'</p>';

				html += '<h3>Project Information</h3>';
				html += '<p>This metagenome is part of the project '+d.metadata.project.data.project_name+'</p>';
				if (d.metadata.project.data.project_description) {
                    html += '<p>'+d.metadata.project.data.project_description+'</p>';
                }
				html += '<h3>Metadata</h3>';
				html += '<table class="table table-condensed table-striped">';
				html += '<tr><th colspan=2>MIxS</th></tr>';
				for (var i in d.mixs) {
					if (d.mixs.hasOwnProperty(i)) {
                                                var x = i.replace(/_/g, " ");
						html += '<tr><td><b>'+x+'</b></td><td>'+d.mixs[i]+'</td></tr>';
					}
				}
				html += '<tr><th colspan=2>Project</th></tr>';
				for (var i in d.metadata.project.data) {
                                        if (d.metadata.project.data.hasOwnProperty(i)) {
						if (i == 'description') { continue; }
                                                var x = i.replace(/_/g, " ");
                                                html += '<tr><td><b>'+x+'</b></td><td>'+d.metadata.project.data[i]+'</td></tr>';
                                        }
                                }
                                html += '<tr><th colspan=2>Library</th></tr>';
                                for (var i in d.metadata.library.data) {
                                        if (d.metadata.library.data.hasOwnProperty(i)) {
                                                var x = i.replace(/_/g, " ");
                                                html += '<tr><td><b>'+x+'</b></td><td>'+d.metadata.library.data[i]+'</td></tr>';
                                        }
                                }
                                html += '<tr><th colspan=2>Sample</th></tr>';
                                for (var i in d.metadata.sample.data) {
                                        if (d.metadata.sample.data.hasOwnProperty(i)) {
                                                var x = i.replace(/_/g, " ");
                                                html += '<tr><td><b>'+x+'</b></td><td>'+d.metadata.sample.data[i]+'</td></tr>';
                                        }
                                }
                                html += '<tr><th colspan=2>Environmental Package</th></tr>';
                                for (var i in d.metadata.env_package.data) {
                                        if (d.metadata.env_package.data.hasOwnProperty(i)) {
						var x = i.replace(/_/g, " ");
                                                html += '<tr><td><b>'+x+'</b></td><td>'+d.metadata.env_package.data[i]+'</td></tr>';
                                        }
                                }
				html += '</table>';

		            	container.append(html);
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
        }
    });
})(jQuery);
