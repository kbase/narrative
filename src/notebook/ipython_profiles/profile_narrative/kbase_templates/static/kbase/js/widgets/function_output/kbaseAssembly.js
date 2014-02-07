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

        init: function(options) {
            this._super(options);
            var kb_info = options.kbase_assembly_input;

	    console.log(kb_info)
	    //Get this from options
            var user = options.ar_user
            var token = options.ar_token
            var arURL = options.ar_url
	    var ws_url = options.ws_url
            var arRequest = {
                "data_id": null,
		"kbase_assembly_input": options.kbase_assembly_input,
                "file_sizes": [], 
                "filename": [], 
                "ids": [], 
                "message": null, 
                "pipeline": [['spades']], 
                "queue": null, 
                "single": [[]],
                "pair": [],
                "reference": null, 
                "version": "widget"};
            var self = this;
	    var kbws = new Workspace(ws_url, {"token": token});
            var data_report = $('<div class="panel panel-info" style="padding:10px">')
		.append('<div class="panel-heading panel-title">Assembly Service Data Set </div>');

	    var obj_params = {'type': 'KBaseAssembly.AssemblyInput',
			      'data': {'hello': 'hello data'}}

	    var save_params = {'workspace': 'cbun:home',
			       'objects': [obj_params]}
	    kbws.save_objects(save_params)

	    // Parses the AssemblyInput object and displays it in the table
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
		if (info.single_end_libs != undefined) {
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
                                      <option value="sga_preprocess,bhammer,tagdust,spades,sspace">AssemblyRAST Pipeline</option> \
                                      <option value="sga_preprocess,bhammer,tagdust,kiki spades idba">Trifecta Pipeline</option> \
                                      <option value="a6">A6 Pipeline</option> \
                                      <option value="pacbio">PacBio SMRT Pipeline</option> \
                                      <option value="spades">SPAdes Assembler</option> \
                                      <option value="idba">IDBA-UD Assembler</option> \
                                      <option value="kiki">Kiki Assembler</option> \
                                    </select></span>');
            var asm_desc = $('<span class="col-md-7"><input type="text" class="form-control" style="width:100%" placeholder="Description"></span>')
            var asm_btn = $('<span class="col-md-1"><button class="btn btn-large btn-primary pull-right">Assemble</button></span>');
            asm_div.append($('<fieldset><div class="form-group">').append(asm_choose, asm_desc, asm_btn));

	    asm_btn.one("click", function() {
                var assembler = asm_choose.find('select option:selected').val();
                var desc = asm_desc.find('input').val();
		
                arRequest.pipeline = [assembler.split(',')];
                arRequest.message = desc;
                asm_div.find('fieldset').attr('disabled', "true");
		
                $.ajax({
                    contentType: 'application/json',
                    url: arURL + 'user/' + user + '/job/new/',
                    type: 'post',
                    data: JSON.stringify(arRequest),
                    headers: {Authorization: token},
                    datatype: 'json',
                    success: function(data){
                        console.log(data);
                        job_id = data;
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
                                        request_job_report(job_id).done(function(){
                                            var report_div = '<div class="">'
					    var result_btn_row = $('<div class="row pull-right">')
                                            get_job_report_txt(job_id)
						.done(function(quast_txt){
                                                var full_link = arURL + '/static/' + user + '/job/' + job_id + '/quast/contig/report.html';
                                                var formatted = quast_txt.replace(/\n/g, '<br>')
                                                var formatted2 = formatted.replace(/\s/g, '&nbsp')
						    report_div += '<code style="font-size:4px>' + formatted2 +'</code><br>'
						    result_btn_row.append('<span class=""><a href='+ full_link +' class="btn btn-success" target="_blank" style="padding:5px">Full Analysis</a></span>')
                                            }).always(function(){
						var full_link_log = arURL + '/static/' + user + '/job/' + job_id + '/' + job_id + '_report.txt';
						result_btn_row.append('<span class=""><a href='+ full_link_log +' class="btn btn-info" target="_blank">Assembly Log</a></span></div>')
                                                self.$elem.append(report_div);
						self.$elem.append(result_btn_row);
					    })
                                        })
                                    }
                                }
                            })
                        };
                        var status_updater = null;
                        status_updater = setInterval(update_status, 5000);
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
                var prom = $.get(arURL + '/user/' + user + '/job/' + j_id + '/status/')
                return prom;
            }
	    
            var request_job_report = function(job_id) {
                var prom = $.get(arURL + '/static/serve/' + user + '/job/' + job_id + '/?quast')
                return prom;
            }
	    
            var get_job_report_txt = function(job_id) {
                var prom = $.get(arURL + '/static/' + user + '/job/' + job_id + '/quast/contig/report.txt');
                return prom
            }

            var kill_job = function(job_id, token) {
                var prom = $.ajax({
                    contentType: 'application/json',
                    url: arURL + 'user/' + user + '/job/' + job_id + '/kill',
                    type: 'get',
                    headers: {Authorization: token}});
                return prom;
            }

            return this;	    
        }

    })})( jQuery )

