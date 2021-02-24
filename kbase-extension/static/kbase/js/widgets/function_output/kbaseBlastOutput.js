define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'util/string',
		'd3',
		'kbaseAuthenticatedWidget',
		'kbaseTabs',
		'jquery-dataTables'
	], (
		KBWidget,
		bootstrap,
		$,
		StringUtil,
		d3,
		kbaseAuthenticatedWidget,
		kbaseTabs,
		jquery_dataTables
	) => {
    return KBWidget({
        name: "kbaseBlastOutput",
        parent : kbaseAuthenticatedWidget,
        version: "1.0.0",
        ws_id: null,
        ws_name: null,
        token: null,
        width: 1150,
        options: {
            ws_id: null,
            ws_name: null
        },
        loadingImage: "static/kbase/images/ajax-loader.gif",
        wsUrl: window.kbconfig.urls.workspace,
        timer: null,
        lastElemTabNum: 0,

        init: function (options) {
            this._super(options);
            this.ws_id = options.blast_output_name;
            this.ws_name = options.workspaceName;
            return this;
        },

        //tabData is used to create tabs later on in the output widget
        tabData: function () {
            return {
                names: ['Overview', 'Hits', 'Graphical Alignment', 'Sequence Alignment'],
                ids: ['overview', 'contigs', 'genes', 'alignments']
            };
        },

        render: function () {
            const self = this;
            const pref = StringUtil.uuid();

            //login related error
            const container = this.$elem;
            if (self.token == null) {
                container.empty();
                container.append("<div>[Error] You're not logged in</div>");
                return;
            }

            const kbws = new Workspace(self.wsUrl, {'token': self.token});

            const ready = function (data) {
                container.empty();
                data = data[0].data;
                const tabPane = $('<div id="' + pref + 'tab-content">');
                container.append(tabPane);
                const tabWidget = new kbaseTabs(tabPane, {canDelete: true, tabs: []});

                const tabData = self.tabData();
                const tabNames = tabData.names;
                const tabIds = tabData.ids;

                tabIds.forEach((tabId, i) => {
                    const tabDiv = $('<div id="' + pref + tabId + '"> ');
                    tabWidget.addTab({
                        tab: tabNames[i],
                        content: tabDiv,
                        canDelete: false,
                        show: (i == 0)
                    });
                });

                ////////////////////////////// Overview Tab //////////////////////////////

                //Append table to overview tab and display contents

                const parameters = data.BlastOutput_param.Parameters;
                const db = data.BlastOutput_db;
                const query_info = data.BlastOutput_iterations.Iteration[0]['Iteration_query-def'];
                const hits = data.BlastOutput_iterations.Iteration[0].Iteration_hits.Hit;

                $('#' + pref + 'overview').append('<table class="table table-striped table-bordered" style="margin-left: auto; margin-right: auto;" id="' + pref + 'overview-table"/>');
                const overviewLabels = ["Input Sequence ids", "Input Genome id(s)", "Total number of hits"];
                const overviewData = [query_info, db, hits.length];

                const overviewTable = $('#' + pref + 'overview-table');
                for (let i = 0; i < overviewData.length; i++) {
                    overviewTable.append('<tr><td>' + overviewLabels[i] + '</td><td>' + overviewData[i] + '</td></tr>');
                }

                for (const key in parameters) {
                    overviewTable.append('<tr><td>' + key + '</td><td>' + parameters[key] + '</td></tr>');
                }

                ////////////////////////////////Hits tab////////////////////

                $('#' + pref + 'contigs').append('<table class="table table-striped table-bordered" style="margin-left: auto; margin-right: auto;" id="' + pref + 'contigs-table"/>');

                const formatEvalue = function (value) {
                    if (value.includes('e')) {
                        const val = value.split('e');
                        return parseInt(val[0]) + 'e' + val[1];
                    } else if (value !== '0') {
                        return parseFloat(value).toFixed(4);
                    } else {
                        return value;
                    }
                };
                const genesData = [];

                //var hits = data.BlastOutput_iterations.Iteration[0].Iteration_hits.Hit;
                const query_len = parseInt(data.BlastOutput_iterations.Iteration[0]['Iteration_query-len']);
                hits.forEach((d) => {
                    const hit_id = d["Hit_id"];
                    const hit_def = d["Hit_def"];
                    const hit_len = d["Hit_len"];

                    const hsps = d["Hit_hsps"].Hsp;
                    const hsp = hsps[0];

                    const evalue = hsp["Hsp_evalue"];
                    const identity = hsp["Hsp_identity"];
                    const align_len = hsp["Hsp_align-len"];
                    const query_to = hsp["Hsp_query-to"];
                    const query_from = hsp["Hsp_query-from"];
                    const hit_to = hsp["Hsp_hit-to"];
                    const hit_from = hsp["Hsp_hit-from"];
                    const bit_score = hsp["Hsp_bit-score"];

                    genesData.push({
                        gene_id: hit_id,
                        evalue: formatEvalue(evalue),
                        gene_annotation: hit_def,
                        identity: Math.round(identity / align_len * 100) + '%',
                        query_cov: Math.round((Math.abs(query_to - query_from) + 1) / query_len * 100) + '%',
                        subject_cov: Math.round((Math.abs(hit_to - hit_from) + 1) / hit_len * 100) + '%',
                        score: bit_score
                    });
                });

                function geneEvents() {
                    //   $('.'+pref+'gene-click').unbind('click');
                    //  $('.'+pref+'gene-click').click(function() {
                    //get geneID and pass it to the next step
                    //    var geneId = [$(this).data('geneid')];
                    // showGene(geneId);
                    //});
                }

                const genesSettings = {
                    "sPaginationType": "full_numbers",
                    "iDisplayLength": 10,
                    "aaSorting": [[5, "desc"], [1, "asc"]],
                    "aoColumns": [
                        {sTitle: "GeneID", mData: "gene_id"},
                        {sTitle: "E Value", mData: "evalue"},
                        {sTitle: "Identity", mData: "identity"},
                        {sTitle: "Query cover", mData: "query_cov"},
                        {sTitle: "Subject cover", mData: "subject_cov"},
                        {sTitle: "Score", mData: "score"},
                        {sTitle: "Function", mData: "gene_annotation"}
                    ],
                    "aaData": [],
                    "oLanguage": {
                        "sSearch": "Search Hits:",
                        "sEmptyTable": "No Hits found."
                    },
                    "fnDrawCallback": geneEvents
                };
                const contigsDiv = $('#' + pref + 'contigs-table').dataTable(genesSettings);
                contigsDiv.fnAddData(genesData);

                //////////////////////////////// Graphical Alignment tab ////////////////////
                //Functions for counter and color

                const gethitcolor = function (n) {
                    n = Number(n);
                    let color = '#000000';
                    if (n < 40) {
                        color = '#000000';
                    }
                    if (n >= 40 && n < 50) {
                        color = '#0000FF';
                    }
                    if (n >= 50 && n < 80) {
                        color = '#66FF66';
                    }
                    if (n >= 80 && n < 200) {
                        color = '#FF3399';
                    }
                    if (n >= 200) {
                        color = '#FF0000';
                    }
                    return (color);

                };

                const id = pref + 'genes';
                const genesDivdata = document.getElementById(id);

                const dataForGraphics = function (Hit) {
                    const formatted_hits = [{}];
                    Hit.forEach((oneHit, idx) => {
                        oneHit['Hit_hsps']['Hsp'].forEach((hsp) => {

                            let begin = hsp["Hsp_query-from"];
                            let end = hsp["Hsp_query-to"];

                            if (begin > end) {
                                const tmp = begin;
                                begin = end;
                                end = tmp;
                            }
                            formatted_hits.push({
                                "begin": begin,
                                "seqlength": (end - begin),
                                "rownumber": idx,
                                "bitscore": hsp["Hsp_bit-score"],
                                "id": oneHit['Hit_id']
                            });

                        });
                    });
                    return (formatted_hits);

                };

                const querylength = data.BlastOutput_iterations.Iteration[0]['Iteration_query-len'];
                //var hits = data.BlastOutput_iterations.Iteration[0].Iteration_hits.Hit;

                //set up svg display for graphics alignment
                const margin = {top: 0, right: 0, bottom: 0, left: 10},
                    width = 540 - margin.left - margin.right,
                    height = 500 - margin.top - margin.bottom;

                const padding = margin.left + margin.right;

                const scaley = margin.top + 20;
                const rect1 = margin.top + 10;
                const fullscalelength = (10 - Number(querylength) % 10) + Number(querylength);

                const x = d3.scale.linear()
                    .domain([0, querylength])
                    .range([0, width - 30]);

                const xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom");
                const svg = d3.select(genesDivdata).append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .append("g")
                    .attr("transform", "translate(" + 10 + "," + margin.top + ")");

                svg.append("rect")
                    .attr("x", 0)
                    .attr("fill", "green")
                    .attr("y", 0)
                    .attr("width", x(querylength))
                    .attr("height", 6)
                    .attr("transform", "translate(" + 10 + "," + margin.top + ")");

                //Prepare data to use with d3

                const formattedhits = dataForGraphics(hits);

                //display svg

                svg.selectAll("rect")
                    .data(formattedhits)
                    .enter()
                    .append("rect")
                    .attr("fill", (d) => {
                        return (gethitcolor(d.bitscore));
                    })
                    .attr("y", (d) => {
                        return (d.rownumber * 7)
                    })
                    .attr("x", (d) => {
                        return x(d.begin);
                    })
                    .attr("width", (d) => {
                        return x(d.seqlength);
                    })
                    .attr("height", () => {
                        return 4;
                    })
                    .attr("transform", "translate(" + 10 + "," + 30 + ")");

                svg.append("g")
                    .attr("class", "axis") //Assign "axis" class
                    .attr("transform", "translate(" + 10 + "," + 10 + ")")
                    .call(xAxis);

                //////////////////////////////// Sequence Alignment tab ////////////////////
                //padding function to be used in text alignment

                const paddingx = function (n) {
                    const z = ' ';
                    n = n + '';
                    const width = 8;
                    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
                };

                //formatter for hits

                const formatter = function (d, al) {
                    const accession = d["Hit_accession"];
                    const hit_def = d["Hit_def"];
                    const hit_len = d["Hit_len"];
                    const hsps = d["Hit_hsps"].Hsp;
                    const num_matches = hsps.length;

                    let str = '<div STYLE="font-family: monospace;  white-space: pre;">';
                    str += '</br><hr>' + 'Sequence ID:' + accession + '</br>';
                    str += "Hit_def:" + hit_def + '</br>' + "Length:" + hit_len + ' ';
                    str += "Number of matches:" + num_matches + '<hr>';
                    al.append(str);

                    hsps.forEach((hsp, counter) => {
                        const match_number = counter + 1;
                        const align_len = hsp["Hsp_align-len"];
                        const bit_score = hsp["Hsp_bit-score"];
                        const evalue = hsp["Hsp_evalue"];
                        let gaps = hsp["Hsp_gaps"];
                        const hit_frame = hsp["Hsp_hit-frame"];
                        const hit_from = hsp["Hsp_hit-from"];
                        const hit_to = hsp["Hsp_hit-to"];
                        const hseq = hsp["Hsp_hseq"];
                        const identity = hsp["Hsp_identity"];
                        const midline = hsp["Hsp_midline"];
                        const num = hsp["Hsp_num"];
                        const positive = hsp["Hsp_positive"];
                        const qseq = hsp["Hsp_qseq"];
                        const query_frame = hsp["Hsp_query-frame"];
                        const query_from = hsp["Hsp_query-from"];
                        const query_to = hsp["Hsp_query-to"];
                        const score = hsp["Hsp_score"];

                        if (gaps == null) {
                            gaps = 0;
                        }

                        const empty_space = new Array(10).join(' ');

                        const pctid = (Number(identity) / Number(align_len)) * 100;
                        const pctpositive = (Number(positive) / Number(align_len)) * 100;
                        const pctgap = (Number(gaps) / Number(align_len) ) * 100;

                        let str = '<div STYLE="font-family: monospace;  white-space: pre;">';
                        str += '</br>' + 'Range ' + match_number + ': ' + hit_from + ' to ' + hit_to + '</br>';
                        str += 'Score = ' + bit_score + '(' + score + '), ' + 'Expect = ' + evalue + '</br>';
                        str += 'Identities = ' + identity + '/' + align_len + '(' + Math.round(pctid) + '%), ';
                        str += 'Positives = ' + positive + '/' + align_len + '(' + Math.round(pctpositive) + '%), ';
                        str += 'Gaps = ' + gaps + '/' + align_len + '(' + Math.round(pctgap) + ')';
                        if (query_frame || hit_frame) {
                            str += ', Frame = ';
                            (query_frame) ? str += query_frame : '';
                            (query_frame && hit_frame) ? str += '/' : '';
                            (hit_frame) ? str += hit_frame : '';
                        }
                        str += '</br></br>';
                        al.append(str);

                        let q_start = 0;
                        let q_end = 0;
                        let h_start = 0;
                        let h_end = 0;

                        let i = 0;
                        while (i < hseq.length) {
                            start = i;
                            end = i + 60;
                            const p1 = hseq.substring(start, end);
                            const p2 = midline.substring(start, end);
                            const p3 = qseq.substring(start, end);

                            if (i == 0) {
                                q_start = Number(query_from);
                                h_start = Number(hit_from);
                            }
                            else {
                                h_start = h_end + 1;
                                q_start = q_end + 1;
                            }

                            const c1 = p1.replace(/-/g, "");
                            const c3 = p3.replace(/-/g, "");

                            q_end = q_start + c3.length - 1;
                            h_end = h_start + c1.length - 1;

                            let alnstr = '<div STYLE="font-family: monospace;  white-space: pre;">';
                            alnstr += paddingx(q_start) + ' ' + p3 + ' ' + q_end + '</br>';
                            alnstr += empty_space + p2 + '</br>';
                            alnstr += paddingx(h_start) + ' ' + p1 + ' ' + h_end + '</br>';
                            alnstr += '</font></div></br>';
                            al.append(alnstr);
                            i = end;
                        }

                    });
                };

                //text alignment tab and use of formatter function to add to the content of the tab

                const al = $('#' + pref + 'alignments');
                //var hits = data.BlastOutput_iterations.Iteration[0].Iteration_hits.Hit;
                hits.forEach((hit) => {
                    formatter(hit, al);
                });

            };

            container.empty();
            container.append("<div><img src=\"" + self.loading_image + "\">&nbsp;&nbsp;loading data...</div>");

            kbws.get_objects([{ref: self.ws_name + "/" + self.ws_id}], (data) => {
                    ready(data)
                },
                (data) => {
                    container.empty();
                    container.append('<p>[Error] ' + data.error.message + '</p>');
                });
            return this;
        },

        loggedInCallback: function (event, auth) {
            this.token = auth.token;
            this.render();
            return this;
        },

        loggedOutCallback: function (event, auth) {
            this.token = null;
            this.render();
            return this;
        }
    });
});
