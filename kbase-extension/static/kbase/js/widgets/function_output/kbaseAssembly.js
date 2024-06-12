/**
 * Just a simple example widget - makes a div with "Hello world!"
 * in a user-defined color (must be a css color - 'red' or 'yellow' or '#FF0000')
 */
define(['kbwidget', 'bootstrap', 'jquery', 'kbasePrompt'], (
    KBWidget,
    bootstrap,
    $,
    kbasePrompt
) => {
    return KBWidget({
        name: 'AssemblyWidget',

        version: '1.0.0',
        options: {
            color: 'black',
        },

        job_id: 0,
        arURL: null,
        ws_url: null,
        ws_name: null,
        fba_url: null,
        state: {},

        init: function (options) {
            this._super(options);
            const self = this;
            const kb_info = options.kbase_assembly_input;
            console.log(kb_info);
            console.log('test');
            //Get this from options
            const user = options.ar_user;
            self.token = options.ar_token;
            self.arURL = options.ar_url;
            //self.arURL = 'http://140.221.84.121:8000/'
            self.ws_url = options.ws_url;
            self.ws_name = options.ws_name;
            self.fba_url = window.kbconfig.urls.fba;

            const arRequest = {
                data_id: null,
                kbase_assembly_input: options.kbase_assembly_input,
                file_sizes: [],
                filename: [],
                ids: [],
                message: null,
                recipe: null,
                pipeline: [['spades']],
                queue: null,
                single: [[]],
                pair: [],
                reference: null,
                version: 'widget',
            };
            // State variables

            /////////// Functions

            const make_status_table = function (job_id, desc, status) {
                return $(
                    '<table class="table table-striped table-bordered" style="margin-left:auto; margin-right:auto">'
                )
                    .append(
                        '<thead><tr><th>Job ID</th><th>Description</th><th>Status</th></tr></thead>'
                    )
                    .append(
                        '<tbody><td>' +
                            job_id +
                            '</td><td>' +
                            desc +
                            '</td><td>' +
                            status +
                            '</td></tbody>'
                    );
            };

            const check_status = function (j_id) {
                const prom = $.get(self.arURL + '/user/' + user + '/job/' + j_id + '/status/');
                return prom;
            };

            const request_job_report = function (job_id) {
                console.log('report');
                const prom = $.get(self.arURL + '/static/serve/' + user + '/job/' + job_id);
                return prom;
            };

            const get_job_report_txt = function (job_id) {
                const prom = $.get(self.arURL + '/user/' + user + '/job/' + job_id + '/report');
                return prom;
            };

            const get_assemblies = function (job_id) {
                return $.get(
                    self.arURL +
                        '/user/' +
                        user +
                        '/job/' +
                        job_id +
                        '/results?type=contigs,scaffolds'
                );
            };

            const get_best_assembly = function (job_id) {
                return $.get(self.arURL + '/user/' + user + '/job/' + job_id + '/assemblies/auto');
            };

            const get_assemblers = function () {
                const deferred = $.Deferred();
                $.get(self.arURL + '/module/avail').done((mod_avail) => {
                    const asms = [];
                    const all = JSON.parse(mod_avail);
                    console.log(all);
                    for (let i = 0; i < all.length; i++) {
                        if (all[i].stages.search('assembler') != -1) {
                            asms.push(all[i]);
                        }
                    }
                    deferred.resolve(asms);
                });
                return deferred.promise();
            };

            const get_modules = function () {
                const deferred = $.Deferred();
                $.get(self.arURL + '/module/avail').done((mod_avail) => {
                    const all = JSON.parse(mod_avail);
                    // const pre = [],
                    //     asms = [],
                    //     post = [],
                    //
                    // for (let i = 0; i < all.length; i++) {
                    //     if (all[i].stages.search('pre') != -1) {
                    //         pre.push(all[i]);
                    //     }
                    // }
                    // for (let i = 0; i < all.length; i++) {
                    //     if (all[i].stages.search('assembler') != -1) {
                    //         asms.push(all[i]);
                    //     }
                    // }
                    // for (let i = 0; i < all.length; i++) {
                    //     if (all[i].stages.search('post') != -1) {
                    //         post.push(all[i]);
                    //     }
                    // }
                    // console.log('all');
                    // console.log(all);
                    deferred.resolve([all]);
                });
                return deferred.promise();
            };

            const kill_job = function (job_id, token) {
                const prom = $.ajax({
                    contentType: 'application/json',
                    url: self.arURL + 'user/' + user + '/job/' + job_id + '/kill',
                    type: 'get',
                    headers: { Authorization: token },
                });
                return prom;
            };

            //////////// End functions

            // Parses the AssemblyInput object and displays it in the table
            const data_report = $('<div class="panel panel-info" style="padding:10px">').append(
                '<div class="panel-heading panel-title">Assembly Service Data Set </div>'
            );

            const make_data_table = function (info) {
                const tables = $('<div>');
                if (info.paired_end_libs != undefined) {
                    for (let i = 0; i < info.paired_end_libs.length; i++) {
                        const tbl = $(
                            '<table class="table table-striped table-bordered" style="margin-left:auto; margin-right:auto">'
                        );
                        tbl.append('<thead><tr><th>Paired-End Files</th></tr></thead>');
                        for (let j = 0; j < 2; j++) {
                            let file_row = '';
                            const handle = 'handle_' + String(j + 1);
                            if (info.paired_end_libs[i][handle] != undefined) {
                                const fname = info.paired_end_libs[i][handle].file_name;
                                file_row += '<tr><td>' + fname + '</td>';
                                file_row += '</tr>';
                                tbl.append(file_row);
                            }
                        }
                        tables.append(tbl);
                    }
                }
                if (info.single_end_libs != undefined) {
                    for (let i = 0; i < info.single_end_libs.length; i++) {
                        const tbl = $(
                            '<table class="table table-striped table-bordered" style="margin-left:auto; margin-right:auto">'
                        );
                        tbl.append('<thead><tr><th>Single-End File</th></tr></thead>');
                        let file_row = '';
                        const fname = info.single_end_libs[i]['handle'].file_name;
                        file_row += '<tr><td>' + fname + '</td>';
                        file_row += '</tr>';
                        tbl.append(file_row);
                        tables.append(tbl);
                    }
                }
                if (info.references != undefined) {
                    for (let i = 0; i < info.references.length; i++) {
                        const tbl = $(
                            '<table class="table table-striped table-bordered" style="margin-left:auto; margin-right:auto">'
                        );
                        tbl.append('<thead><tr><th>Reference File</th></tr></thead>');
                        let file_row = '';
                        const fname = info.references[i]['handle'].file_name;
                        file_row += '<tr><td>' + fname + '</td>';
                        file_row += '</tr>';
                        tbl.append(file_row);
                        tables.append(tbl);
                    }
                }
                return tables;
            };

            const dt = make_data_table(kb_info);
            data_report.append(dt);
            self.$elem.append(data_report);
            const tabs = $('<div id="tabs">');
            const nav = $(
                '<ul class="nav nav-pills"> \
             <li><a href="#frag-recipes"><span class="glyphicon glyphicon-list-alt"><span> Recipe</a></li> \
             <li><a href="#frag-assemblers"><span class="glyphicon glyphicon-flash"><span> Assemblers</a></li> \
             <li><a href="#frag-pipeline"><span class="glyphicon glyphicon-pencil"><span> Pipeline</a><span class="label label-info">beta</span></li> \
             </ul>'
            );
            tabs.append(nav);

            /////// Recipes
            const asm_div = $(
                '<div class="row" id="frag-recipes"><small>Recipes are curated intelligent workflows designed for specific scenarios.</small></div>'
            );
            const asm_choose = $(
                '<span class="col-md-3"><select class="form-control" name="assemblers"> \
              <option value="auto">Automatic Assembly</option> \
              <option value="faster">Fast Pipeline</option> \
              <option value="smart">Arast Smart Workflow</option> \
              <option value="kiki">Kiki Assembler</option> \
              </select></span>'
            );
            const asm_desc = $(
                '<span class="col-md-7"><input type="text" class="form-control" style="width:100%" placeholder="Description"></span>'
            );
            const asm_btn = $(
                '<span class="col-md-1 pull-right"><button class="btn btn-large btn-primary pull-right"><span class="glyphicon glyphicon-play-circle"  style="color:white;"></span> Assemble</button></span>'
            );
            asm_div.append(
                $('<fieldset><div class="form-group">').append(asm_choose, asm_desc, asm_btn)
            );

            //////// Assemblers
            const asm_div2 = $(
                '<div id="frag-assemblers"><small>Assemble contigs using multiple assemblers and compare results</small></div>'
            );
            const asm_row = $('<div class="row">');
            const add_asm_group = $('<span class="btn-group col-md-2"></span>');
            const add_asm_btn = $(
                '<button type="button" class="btn btn-warning asm-form dropdown-toggle" data-toggle="dropdown"> \
             <span class="glyphicon glyphicon-plus-sign"></span>  Assembler <span class="caret"></span> </button>'
            );
            add_asm_btn.find('span').css('color', 'white');
            const add_asm_sel = $('<ul class="dropdown-menu" role="menu"></ul>');
            const assembler_pool = $('<div class="well col-md-8 col-md-offset-1" id="asm-pool">');
            const asm_picked = [];
            const asm_row2 = $('<div class="row">');
            const asm_desc2 = $(
                '<div class="col-md-10"><input type="text" class="asm-form form-control" style="width:100%" placeholder="Description"></div>'
            );
            const asm_btn2 = $(
                '<button class="btn btn-default col-md-2 btn-primary pull-right asm-form"><span class="glyphicon glyphicon-play-circle"  style="color:white;"></span> Assemble</button>'
            );

            const update_asm_pool = function (ass_pool, pool) {
                const body = $('<div>');
                for (let i = 0; i < pool.length; i++) {
                    (function (i) {
                        body.append(
                            $(
                                '<div class="btn btn-primary btn-sm" style="margin:5px">' +
                                    pool[i] +
                                    '</div>'
                            ).on('click', () => {
                                $('#asm-' + pool[i]).attr('disabled', 'false');
                                $('#asm-' + pool[i]).show();
                                const asm_idx = pool.indexOf(pool[i]);
                                pool.splice(asm_idx, 1);
                                update_asm_pool(ass_pool, pool);
                            })
                        );
                    })(i);
                }
                console.log(body);
                ass_pool.html(body);
            };

            get_assemblers().done((asms) => {
                for (let i = 0; i < asms.length; i++) {
                    (function (i) {
                        const asm_id = 'asm-' + asms[i].name;
                        const asm = $(
                            '<li data-toggle="tooltip" data-placement="right" title="' +
                                asms[i].description +
                                '" id="' +
                                asm_id +
                                '"><a>' +
                                asms[i].name +
                                '</a></li>'
                        );
                        asm.tooltip({ container: 'body' });
                        const asm_name = asms[i].name;
                        asm.on('click', () => {
                            asm_picked.push(asm_name);
                            console.log(asm_picked);
                            update_asm_pool(assembler_pool, asm_picked);
                            $('#' + asm_id).attr('disabled', 'true');
                            $('#' + asm_id).hide();
                        });
                        add_asm_sel.append(asm);
                    })(i);
                }
                console.log(asms);
            });

            add_asm_group.append(add_asm_btn);
            add_asm_group.append(add_asm_sel);
            asm_row.append(add_asm_group, assembler_pool);
            asm_row2.append(asm_desc2, asm_btn2);
            asm_div2.append($('<fieldset><div class="form-group">')).append(asm_row, asm_row2);
            //////////////////// end Assemblers

            //////// Pipeline
            const asm_div3 = $(
                '<div id="frag-pipeline"> <small>Build a customized pipeline using available preprocessing, assembly, and postprocessing tools</small></div>'
            );
            const pipe_row1 = $('<div class="row">');
            const add_pipe_group = $('<span class="btn-group col-md-2"></span>');
            const add_pipe_btn = $(
                '<button type="button" class="asm-form btn btn-large btn-warning dropdown-toggle" data-toggle="dropdown"> \
             <span class="glyphicon glyphicon-plus-sign"></span>  Pipe Stage <span class="caret"></span> </button>'
            );
            add_pipe_btn.find('span').css('color', 'white');

            const add_pipe_sel = $('<ul class="dropdown-menu" role="menu"></ul>');
            const pipeline_pool = $('<div class="well col-md-8 col-md-offset-1" id="pipe-pool">');
            const pipe_picked = [];
            const pipe_row2 = $('<div class="row">');
            const pipe_desc = $(
                '<div class="col-md-10"><input type="text" class="asm-form form-control" style="width:100%" placeholder="Description"></div>'
            );
            const pipe_btn = $(
                '<button class="btn btn-large col-md-2 asm-form btn-primary pull-right"><span class="glyphicon glyphicon-play-circle"  style="color:white;"></span> Assemble</button>'
            );

            const update_pipe_pool = function (pool) {
                const body = $('<div>');
                for (let i = 0; i < pool.length; i++) {
                    (function (i) {
                        body.append(
                            $(
                                '<div class="btn btn-primary btn-sm">' +
                                    pool[i] +
                                    '<span class="glyphicon glyphicon-chevron-right pull-right" style="color:white"></span></div>'
                            ).on('click', () => {
                                console.log(pool[i]);
                                console.log('#asm-' + pool[i]);
                                $('#pipe-' + pool[i]).attr('disabled', 'false');
                                $('#pipe-' + pool[i]).show();
                                const asm_idx = pool.indexOf(pool[i]);
                                pool.splice(asm_idx, 1);
                                update_pipe_pool(pool);
                            })
                        );
                    })(i);
                }
                console.log(body);
                pipeline_pool.html(body);
            };

            get_modules().done((lists) => {
                for (let i = 0; i < lists.length; i++) {
                    (function (i) {
                        const asms = lists[i];
                        for (let j = 0; j < asms.length; j++) {
                            (function (j) {
                                const asm_id = 'pipe-' + asms[j].name;
                                const asm2 = $(
                                    '<li data-toggle="tooltip" data-placement="right" title="' +
                                        asms[j].description +
                                        '" id="' +
                                        asm_id +
                                        '"><a>' +
                                        asms[j].name +
                                        '</a></li>'
                                );
                                asm2.tooltip({ container: 'body' });
                                const asm_name = asms[j].name;
                                asm2.on('click', () => {
                                    pipe_picked.push(asm_name);
                                    update_pipe_pool(pipe_picked);
                                    $('#' + asm_id).attr('disabled', 'true');
                                    $('#' + asm_id).hide();
                                });
                                add_pipe_sel.append(asm2);
                            })(j);
                        }
                    })(i);
                }
            });

            add_pipe_group.append(add_pipe_btn);
            add_pipe_group.append(add_pipe_sel);
            pipe_row1.append(add_pipe_group, pipeline_pool);
            pipe_row2.append(pipe_desc, pipe_btn);
            asm_div3.append($('<fieldset><div class="form-group">')).append(pipe_row1, pipe_row2);
            //////////////////// end Pipeline

            const run_asm = function (arRequest) {
                self.state['clicked'] = true;
                self.state['tab'] = tabs.tabs('option', 'active');
                // Disable fields
                asm_div.find('fieldset').attr('disabled', 'true');
                self.$elem.find('.asm-form').attr('disabled', 'true');
                $.ajax({
                    contentType: 'application/json',
                    url: self.arURL + 'user/' + user + '/job/new/',
                    type: 'post',
                    data: JSON.stringify(arRequest),
                    headers: { Authorization: self.token },
                    datatype: 'json',
                    success: function (data) {
                        console.log(data);
                        const job_id = data;
                        self.state['job_id'] = data;
                        const status = 'Submitted';
                        const status_box = make_status_table(job_id, arRequest.message, status);
                        const kill_div = $('<div></div>');
                        const kill_btn = $(
                            '<span class="button btn btn-danger pull-right">Terminate</span>'
                        );
                        kill_btn.one('click', () => {
                            kill_job(job_id, self.token).done((res) => {
                                console.log(res);
                                kill_btn.text('Terminating...');
                            });
                        });
                        self.$elem.append(status_box);
                        kill_div.append(kill_btn);
                        self.$elem.append(kill_div);

                        /////////////////////////////////////////
                        ///     Wait for job to complete  ///////
                        /////////////////////////////////////////
                        const update_status = function () {
                            const prom = check_status(job_id);

                            $.when(prom).done((stat) => {
                                status_box.html(make_status_table(job_id, arRequest.message, stat));
                                status_box.css('border', 'none');
                                if (stat.search('Complete') != -1 || stat.search('FAIL') != -1) {
                                    clearInterval(status_updater);
                                    kill_div.html('');
                                    if (stat.search('Complete') != -1) {
                                        const defer_asm = $.Deferred();
                                        const defer_auto = $.Deferred();
                                        const defer_route = $.Deferred();
                                        const defer_report = $.Deferred();
                                        //// Get all assemblies
                                        get_assemblies(job_id).done((asm) => {
                                            defer_asm.resolve(JSON.parse(asm));
                                            return defer_asm.promise();
                                        });

                                        //// Get auto assembly
                                        get_best_assembly(job_id).done((asm) => {
                                            const best = JSON.parse(asm)[0];
                                            defer_auto.resolve({
                                                shock_url: best.shock_url,
                                                shock_id: best.shock_id,
                                                name: best.filename,
                                            });
                                            return defer_auto.promise();
                                        });

                                        ///// Ask server to serve files
                                        request_job_report(job_id).done((route) => {
                                            defer_route.resolve(route);
                                            return defer_route.promise();
                                        });

                                        ///// Get the quast report
                                        get_job_report_txt(job_id).done((quast_txt) => {
                                            const formatted = quast_txt.replace(/\n/g, '<br>');
                                            const formatted2 = formatted.replace(/\s/g, '&nbsp');
                                            defer_report.resolve(formatted2);
                                            return defer_report.promise();
                                        });

                                        //// All request done, show results and create buttons
                                        $.when(
                                            defer_asm,
                                            defer_auto,
                                            defer_route,
                                            defer_report
                                        ).done((assemblies, best, route, report) => {
                                            self.state['assemblies'] = assemblies;
                                            self.state['best'] = best;
                                            self.state['route'] = route;
                                            self.state['report'] = report;
                                            console.log('showing results for the first time');
                                            self.showResults(
                                                self.token,
                                                assemblies,
                                                best,
                                                route,
                                                report,
                                                job_id
                                            );
                                        });
                                    }
                                }
                            });
                        };
                        let status_updater = null;
                        status_updater = setInterval(update_status, 10000);
                    },
                    error: function (data) {
                        console.log(data);
                    },
                });
            };

            asm_btn.one('click', () => {
                asm_div.find('fieldset').attr('disabled', 'true');
                const recipe = [asm_choose.find('select option:selected').val()];
                const desc = asm_desc.find('input').val();
                self.state['recipe'] = recipe;
                self.state['description'] = desc;
                arRequest.recipe = recipe;
                arRequest.message = desc;
                run_asm(arRequest);
            });

            asm_btn2.one('click', () => {
                const desc = asm_desc2.find('input').val();
                self.state['description'] = desc;
                self.state['asm_pool'] = asm_picked;
                arRequest.pipeline = [asm_picked.join(' ')];
                arRequest.message = desc;
                run_asm(arRequest);
            });

            pipe_btn.one('click', () => {
                const desc = pipe_desc.find('input').val();
                self.state['description'] = desc;
                self.state['pipe_pool'] = pipe_picked;
                arRequest.pipeline = [pipe_picked];
                arRequest.message = desc;
                run_asm(arRequest);
            });

            tabs.append(asm_div);
            tabs.append(asm_div2);
            tabs.append(asm_div3);
            self.$elem.append(tabs);
            tabs.tabs();
            tabs.tabs('option', 'active', 0);
            return this;
        },

        import_contigs_to_ws: function (
            _token,
            _fba_url,
            _ws_url,
            ws_name,
            shock_id,
            shock_url,
            contig_name
        ) {
            const $contig_name = $(
                '<div class="input-group"> <span class="input-group-addon">ContigSet Name</span> <input type="text" class="form-control cname-input" value="' +
                    contig_name +
                    '"> </div>'
            );
            const $importModal = new kbasePrompt($('<div></div>'), {
                title: 'Import Contigs',
                body: $contig_name,
                modalClass: 'fade', //Not required. jquery animation class to show/hide. Defaults to 'fade'
                controls: [
                    'cancelButton',
                    {
                        name: 'Import',
                        type: 'primary',
                        callback: function (e, $prompt) {
                            $prompt.closePrompt();
                            const cname = $contig_name.find('input').val();
                            console.log($contig_name.find('input'));

                            console.log(cname);

                            //let fba = new fbaModelServices(fba_url, {'token': token});
                            kb.fba
                                .fasta_to_ContigSet({
                                    fasta: shock_id,
                                    workspace: ws_name,
                                    uid: cname,
                                    name: cname,
                                    shockurl: shock_url,
                                })
                                .done((data) => {
                                    console.log(data);
                                });
                            //                  import_contigs_to_ws(token, fba_url, ws_url, ws_name, shock_id, shock_url, cname)
                        },
                    },
                ],
                footer: '',
            });
            $importModal.openPrompt();
        },

        getState: function () {
            const self = this;
            console.log('get state');
            const state = self.state;
            console.log(state);
            return state;
        },

        loadState: function (state) {
            const self = this;
            console.log(self);
            console.log('load state');
            self.state = state;
            console.log(self.state);
            if (self.state['clicked']) {
                console.log('assembly already run');
                self.$elem.find('fieldset').attr('disabled', 'true');
                self.$elem.find('.asm-form').attr('disabled', 'true');
                self.$elem.find('#tabs').tabs('option', 'active', self.state.tab);
                self.$elem.find('#tabs').tabs('option', 'disabled', true);
                $('select option[value = "' + self.state['recipe'] + '"]').attr(
                    'selected',
                    'selected'
                );

                // //// Restore assemblers
                if (self.state.asm_pool) {
                    const pool = self.state.asm_pool;
                    const body = $('<div>');
                    for (let i = 0; i < pool.length; i++) {
                        (function (i) {
                            body.append(
                                $(
                                    '<div class="btn btn-primary btn-sm" style="margin:5px">' +
                                        pool[i] +
                                        '</div>'
                                )
                            );
                        })(i);
                    }
                    self.$elem.find('#asm-pool').html(body);
                }

                // //// Restore pipeline
                if (self.state.pipe_pool) {
                    const pool = self.state.pipe_pool;
                    const body = $('<div>');
                    for (let i = 0; i < pool.length; i++) {
                        (function (i) {
                            console.log(pool[i]);
                            body.append(
                                $('<div class="btn btn-primary btn-sm">' + pool[i] + '</div>')
                            );
                        })(i);
                    }
                    self.$elem.find('#pipe-pool').html(body);
                }

                self.showResults(
                    self.token,
                    self.state['assemblies'],
                    self.state['best'],
                    self.state['route'],
                    self.state['report'],
                    self.state['job_id']
                );
            } else {
                console.log('not run yet');
            }
        },

        showResults: function (token, assemblies, best, route, report, job_id) {
            const self = this;
            if (!self.reloaded) {
                const result_btn_row = $('<div class="row pull-right">');
                const import_btn_group = $('<span class="btn-group"></span>');
                const import_btn = $(
                    '<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown"> Save Contigs <span class="caret"></span> </button>'
                );
                const import_btn_sel = $('<ul class="dropdown-menu" role="menu"></ul>');
                const contig_import_auto = $('<li><a>Auto Select</a></li>');
                contig_import_auto.one('click', () => {
                    self.import_contigs_to_ws(
                        token,
                        self.fba_url,
                        self.ws_url,
                        self.ws_name,
                        best.shock_id,
                        best.shock_url,
                        best.name
                    );
                });

                import_btn_sel.append(contig_import_auto);
                import_btn_sel.append('<li class="divider"></li>');
                for (let i = 0; i < assemblies.length; i++) {
                    (function (i) {
                        const contig_import = $('<li><a>' + assemblies[i].name + '</a></li>');
                        contig_import.on('click', () => {
                            const shock_url = assemblies[i].file_infos[0].shock_url,
                                shock_id = assemblies[i].file_infos[0].shock_id,
                                ws_contig_name = job_id + '_' + assemblies[i].name;
                            self.import_contigs_to_ws(
                                token,
                                self.fba_url,
                                self.ws_url,
                                self.ws_name,
                                shock_id,
                                shock_url,
                                ws_contig_name
                            );
                        });
                        import_btn_sel.append(contig_import);
                    })(i);
                }
                import_btn_group.append(import_btn);
                import_btn_group.append(import_btn_sel);
                result_btn_row.append(import_btn_group);

                const report_btn_group = $('<div class="btn-group">');
                const full_link = self.arURL + route;
                let report_div = '<div class="" style="margin-top:15px">';
                const report_html = $(
                    '<iframe class="col-md-12" style="margin-top:15px" frameborder="0" height="1200px" src="' +
                        full_link +
                        '">'
                );
                report_div += '<code style="font-size:4px>' + report + '</code><br>';
                const report_btn_toggle = $(
                    '<button class="btn btn-primary">Full Report</button>'
                ).on('click', () => {
                    report_html.toggle();
                });
                report_btn_group.append(report_btn_toggle);
                report_btn_group.append(
                    '<button class="btn btn-primary"><a href=' +
                        full_link +
                        ' target="_blank"><span class="glyphicon glyphicon-new-window" style="color:white;font-size:90%"></span></a></button>'
                );
                result_btn_row.append(report_btn_group);
                self.$elem.append(report_div);
                self.$elem.append(result_btn_row);
                self.$elem.append(report_html);
                report_html.hide();

                self.reloaded = true;
            }
        },
    });
});
