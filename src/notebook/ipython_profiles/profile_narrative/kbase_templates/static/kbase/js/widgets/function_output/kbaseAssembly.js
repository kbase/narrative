/**
 * Just a simple example widget - makes a div with "Hello world!"
 * in a user-defined color (must be a css color - 'red' or 'yellow' or '#FF0000')
 */
(function( $, undefined ) {
    $.KBWidget({
        name: "AssemblyWidget",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            color: "black",
        },
//	fbaURL: "https://kbase.us/services/KBaseFBAModeling",
//	fbaURL: 'http://140.221.85.73:4043',
	
	job_id: 0,
        arURL: null,
	ws_url: null,
	ws_name: null,
	fba_url: null,
	state: {},

        init: function(options) {
            this._super(options);
            var self = this;
            var kb_info = options.kbase_assembly_input;
	    console.log(kb_info)
	    console.log('test')
	    //Get this from options
            var user = options.ar_user
            token = options.ar_token
            self.arURL = options.ar_url
	    self.ws_url = options.ws_url
	    self.ws_name = options.ws_name
	    self.fba_url = 'http://140.221.85.73:4043'
            var arRequest = {
                "data_id": null,
		"kbase_assembly_input": options.kbase_assembly_input,
                "file_sizes": [], 
                "filename": [], 
                "ids": [], 
                "message": null, 
                "recipe": null,
                "pipeline": [['spades']],
                "queue": null, 
                "single": [[]],
                "pair": [],
                "reference": null, 
                "version": "widget"};
	    // State variables

	    
	    // Parses the AssemblyInput object and displays it in the table
	    var data_report = $('<div class="panel panel-info" style="padding:10px">')
		    .append('<div class="panel-heading panel-title">Assembly Service Data Set </div>');

	    var make_data_table = function(info) {
		var tables = $('<div>')
		if (info.paired_end_libs != undefined) {
		    for (var i = 0; i < info.paired_end_libs.length; i++) {
			var tbl = $('<table class="table table-striped table-bordered" style="margin-left:auto; margin-right:auto">');
			tbl.append('<thead><tr><th>Paired-End Files</th></tr></thead>');
			for (var j = 0; j < 2; j++) {
			    var file_row = '';
			    handle = 'handle_' + String(j+1)
			    var fname = info.paired_end_libs[i][handle].file_name
                            file_row += '<tr><td>' + fname + '</td>';
                            file_row += '</tr>'
			    tbl.append(file_row)
			}
			tables.append(tbl)
		    }
		}
		if (info.single_end_libs != undefined) {
		    for (var i = 0; i < info.single_end_libs.length; i++) {
			var tbl = $('<table class="table table-striped table-bordered" style="margin-left:auto; margin-right:auto">');
			tbl.append('<thead><tr><th>Single-End File</th></tr></thead>');
			var file_row = '';
			var fname = info.single_end_libs[i]['handle'].file_name
                        file_row += '<tr><td>' + fname + '</td>';
                        file_row += '</tr>'
			tbl.append(file_row)
			tables.append(tbl)
		    }
		}
		if (info.references != undefined) {
		    for (var i = 0; i < info.references.length; i++) {
			var tbl = $('<table class="table table-striped table-bordered" style="margin-left:auto; margin-right:auto">');
			tbl.append('<thead><tr><th>Reference File</th></tr></thead>');
			var file_row = '';
			var fname = info.references[i]['handle'].file_name
                        file_row += '<tr><td>' + fname + '</td>';
                        file_row += '</tr>'
			tbl.append(file_row)
			tables.append(tbl)
		    }
		}
		return tables;
	    }

	    var dt = make_data_table(kb_info);
	    data_report.append(dt)
            self.$elem.append(data_report);

            var asm_div = $('<div class="row">');
            var asm_choose = $('<label class="col-md-1 control-label">Assembly pipeline</label> <span class="col-md-3"><select class="form-control" name="assemblers"> \
                                      <option value="auto">Arast Smart Workflow</option> \
                                      <option value="fast">Fast Pipeline</option> \
                                      <option value="tune_velvet">Intelligent Velvet</option> \
                                      <option value="kiki">Kiki Assembler</option> \
                                    </select></span>');
            var asm_desc = $('<span class="col-md-7"><input type="text" class="form-control" style="width:100%" placeholder="Description"></span>')
            var asm_btn = $('<span class="col-md-1"><button class="btn btn-large btn-primary pull-right">Assemble</button></span>');
            asm_div.append($('<fieldset><div class="form-group">').append(asm_choose, asm_desc, asm_btn));

	    //// If assembly has been run, restore stuff



	    asm_btn.one("click", function() {
		self.state['clicked'] = true;
                var recipe = [asm_choose.find('select option:selected').val()];
                var desc = asm_desc.find('input').val();
		
                arRequest.recipe = recipe;
                arRequest.message = desc;
                asm_div.find('fieldset').attr('disabled', "true");
		
                $.ajax({
                    contentType: 'application/json',
                    url: self.arURL + 'user/' + user + '/job/new/',
                    type: 'post',
                    data: JSON.stringify(arRequest),
                    headers: {Authorization: token},
                    datatype: 'json',
                    success: function(data){
                        console.log(data);
                        job_id = data;
			self.job_id = data;
                            // var job_alert = $('<div class="row "><span class="col-md-4 col-md-offset-4 alert alert-success alert-dismissable"> \
                            //   <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button> \
                            //   <strong>Success: </strong> Assembly Job ' + data + ' submitted.</span></div>');
                            // self.$elem.append(job_alert);
                        var status = 'Submitted';
                        var status_box = make_status_table(job_id, desc, status);
			var kill_div = $('<div></div>')
			var kill_btn = $('<span class="button btn btn-danger pull-right">Terminate</span>')
			kill_btn.one("click", function(){
			    kill_job(job_id, token).done(function(res){
				console.log(res)
				kill_btn.text('Terminating...');
			    })
			})
                        self.$elem.append(status_box);
			kill_div.append(kill_btn);
                        self.$elem.append(kill_div);

			
			/////////////////////////////////////////
			///     Wait for job to complete  ///////
			/////////////////////////////////////////
                        var update_status = function() {
                            var prom = check_status(job_id);

                            $.when(prom).done(function(stat){
                                status_box.html(make_status_table(job_id, desc, stat));
				status_box.css("border", "none")
                                if (stat.search('Complete') != -1 || stat.search('FAIL') != -1) {
                                    clearInterval(status_updater);
				    kill_div.html("");
                                    if (stat.search('Complete') != -1) {
                                        var report_txt = null;
					var defer_asm = $.Deferred();
					var defer_auto = $.Deferred();
					var defer_route = $.Deferred();
					var defer_report = $.Deferred();
					//// Get all assemblies
					get_assemblies(job_id).done(function(asm){
					    defer_asm.resolve(JSON.parse(asm));
					    return defer_asm.promise();
					});
					
					//// Get auto assembly
					get_best_assembly(job_id).done(function(asm){
					    best = JSON.parse(asm)[0];
					    best_id = best.shock_id;
					    best_url = best.shock_url;
					    defer_auto.resolve({'shock_url': best.shock_url,
								'shock_id': best.shock_id,
								'name': best.filename})
					    return defer_auto.promise()
					});
					
					///// Ask server to serve files
					request_job_report(job_id).done(function(route){
					    defer_route.resolve(route);
					    return defer_route.promise();
					});
					
					///// Get the quast report
					get_job_report_txt(job_id).done(function(quast_txt){
					    var formatted = quast_txt.replace(/\n/g, '<br>')
					    var formatted2 = formatted.replace(/\s/g, '&nbsp')
					    defer_report.resolve(formatted2);
					    return defer_report.promise();
					});

					//// All request done, show results and create buttons
					$.when(defer_asm, defer_auto, defer_route, defer_report).done(function(assemblies, best, route, report){
					    self.showResults(token, assemblies, best, route, report);
					}
					);
                                    }
                                }
                            })
                        };
                        var status_updater = null;
                        status_updater = setInterval(update_status, 10000);
                    },
                    error: function(data){
                        console.log(data);
                    }
                });

            });
            self.$elem.append(asm_div);
	    
            var make_status_table = function(job_id, desc, status) {
		var status_box = $('<table class="table table-striped table-bordered" style="margin-left:auto; margin-right:auto">')
                    .append('<thead><tr><th>Job ID</th><th>Description</th><th>Status</th></tr></thead>')
                    .append('<tbody><td>' + job_id + '</td><td>'+ desc +'</td><td>'+ status +'</td></tbody>')
                return status_box;
            };

            var check_status = function(j_id) {
                var prom = $.get(self.arURL + '/user/' + user + '/job/' + j_id + '/status/')
                return prom;
            }
	    
            var request_job_report = function(job_id) {
		console.log('report')
                var prom = $.get(self.arURL + '/static/serve/' + user + '/job/' + job_id)
                return prom;
            }
	    
            var get_job_report_txt = function(job_id) {
                var prom = $.get(self.arURL + '/user/' + user + '/job/' + job_id + '/report');
                return prom
            }

            var get_job_report_log = function(job_id) {
                var prom = $.get(self.arURL + '/user/' + user + '/job/' + job_id + '/log');
                return prom
            }

	    var get_assemblies = function(job_id){
		var prom = $.get(self.arURL + '/user/' + user + '/job/' + job_id + '/results?type=contigs,scaffolds');
		return prom
	    }

	    var get_best_assembly = function(job_id){
		var prom = $.get(self.arURL + '/user/' + user + '/job/' + job_id + '/assemblies/auto')
		return prom
	    }

            var kill_job = function(job_id, token) {
                var prom = $.ajax({
                    contentType: 'application/json',
                    url: self.arURL + 'user/' + user + '/job/' + job_id + '/kill',
                    type: 'get',
                    headers: {Authorization: token}});
                return prom;
            }



            return this;	    
        },

	import_contigs_to_ws: function(token, fba_url, ws_url, ws_name, shock_id, shock_url, contig_name){
		var contig_name = $('<div class="input-group"> <span class="input-group-addon">ContigSet Name</span> <input type="text" class="form-control cname-input" value="'+ contig_name +'"> </div>');
		var $importModal = $('<div></div>').kbasePrompt(
		    {
			title : 'Import Contigs',
			body : contig_name,
			modalClass : 'fade', //Not required. jquery animation class to show/hide. Defaults to 'fade'
			controls : [
			    'cancelButton',
			    {
				name : 'Import',
				type : 'primary',
				callback : function(e, $prompt) {
				    $prompt.closePrompt();
				    cname = contig_name.find('input').val()
				    console.log(contig_name.find('input'));

				    console.log(cname);

				    var fba = new fbaModelServices(fba_url, {'token': token});
				    fba.fasta_to_ContigSet({'fasta': shock_id, 
							    'workspace': ws_name, 
							    'uid': cname, 
							    'name': cname, 
							    'shockurl': shock_url
							   }).done(function(data){
							       console.log(data);
							   });
//				    import_contigs_to_ws(token, fba_url, ws_url, ws_name, shock_id, shock_url, cname)
				}
			    }
			],
			footer : '',
		    }
		);
		
		$importModal.openPrompt();
	    },

	getState: function(){
	    var self = this;
	    console.log('get state')
	    var state = self.state;
	    console.log(state);
	    return state;
	},

	loadState: function(state){
	    var self = this;
	    console.log(self);
	    console.log('load state');
	    self.state = state;
	    console.log(self.state);	    
	    if (self.state['clicked']) {
		console.log('assembly already run')
		self.$elem.find('fieldset').attr('disabled', "true");
	    } else{
		console.log('not run yet')
	    }

	},

	showResults: function(token, assemblies, best, route, report){
	    var self = this;
	    var result_btn_row = $('<div class="row pull-right">')
	    var import_btn_group = $('<span class="btn-group"></span>');
	    var import_btn = $('<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown"> Save Contigs <span class="caret"></span> </button>');
	    var import_btn_sel = $('<ul class="dropdown-menu" role="menu"></ul>')
	    var contig_import_auto = $('<li><a>Auto Select</a></li>');
	    contig_import_auto.one("click", function() {
		self.import_contigs_to_ws(token, self.fba_url, self.ws_url, self.ws_name, best.shock_id, best.shock_url, best.name);
	    });

	    import_btn_sel.append(contig_import_auto);
	    import_btn_sel.append('<li class="divider"></li>')
	    for (i=0; i<assemblies.length;i++){
		var contig_import = $('<li><a>' + assemblies[i].name + '</a></li>');
		ws_contig_name = job_id + '_' + assemblies[i].name;
		shock_url = assemblies[i].file_infos[0].shock_url;
		shock_id = assemblies[i].file_infos[0].shock_id;
		contig_import.one("click", function() {
		    self.import_contigs_to_ws(token, self.fba_url, self.ws_url, self.ws_name, shock_id, shock_url, ws_contig_name);
		});
		import_btn_sel.append(contig_import);
	    }
	    import_btn_group.append(import_btn);
	    import_btn_group.append(import_btn_sel);
	    result_btn_row.append(import_btn_group);

	    var full_link = self.arURL + route;
	    var report_div = '<div class="">'
		
	    report_div += '<code style="font-size:4px>' + report +'</code><br>'
	    result_btn_row.append('<span class=""><a href='+ full_link +' class="btn btn-primary" target="_blank" style="padding:5px">Full Analysis</a></span>')
	    self.$elem.append(report_div);
	    self.$elem.append(result_btn_row);

	},



    })})( jQuery )

