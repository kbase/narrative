(function ($, undefined) {
    return KBWidget({
        name: 'kbaseModelCore',
        version: '1.0.0',
        options: {},

        getData: function () {
            return {
                id: this.options.ids,
                workspace: this.options.workspaces,
                title: 'Central Carbon Core Metabolic Pathway',
                type: 'Model',
            };
        },

        init: function (options) {
            this._super(options);
            const self = this;
            const models = options.ids;
            const workspaces = options.workspaces;
            const models_data = options.modelsData;
            const fbas_data = options.fbasData;

            const randId = this._uuidgen();

            const container = this.$elem;
            container.append('<div id="core-model"></div>');

            const flux_threshold = 0.001;
            const heat_colors = ['#731d1d', '#8a2424', '#b35050', '#d05060', '#f28e8e'];
            const neg_heat_colors = ['#4f4f04', '#7c7c07', '#8b8d08', '#acc474', '#dded00'];
            const gapfill_color = '#f000ff';
            const gene_stroke = '#777';
            const g_present_color = '#8bc7e5';
            const grid = 50;
            const r_width = grid * (4 / 5);
            const r_height = grid * (1 / 5);
            const radius = 5;

            load_core_model(models);

            function load_core_model(kbids) {
                //draw_legend(kbids, false);
                draw_core_model(kbids);
            }

            function draw_core_model(kbids) {
                const graph_AJAX = $.getJSON('assets/data/core.json');

                $.when(graph_AJAX).done((core_data) => {
                    const core = join_model_to_core(core_data, models_data, kbids, fbas_data);
                    const stage = core_model(core, true);
                });
            }

            // Fixme: This looks a little worse than it is, but can be refactored.
            function join_model_to_core(core, models, kbids, fba_data) {
                const org_names = [];
                for (var i in models) {
                    org_names.push(models[i].name);
                }

                // Adding data structures to core data or each organism
                for (var i in core) {
                    var obj = core[i];
                    obj['kbids'] = {};
                    for (var j in kbids) {
                        kbid = kbids[j];
                        const kb_gid = get_genome_id(kbid);
                        obj.kbids[kb_gid] = [];
                    }
                }

                for (const n in models) {
                    const model = models[n];
                    rxn_list = model.reactions;

                    let model_fba = [];
                    for (const k in fba_data) {
                        console.log(get_genome_id(fba_data[k].id), get_genome_id(model.id));
                        if (get_genome_id(fba_data[k].id) == get_genome_id(model.id)) {
                            model_fba = fba_data[k];
                        }
                    }

                    for (var i in rxn_list) {
                        const rxn_obj = rxn_list[i];
                        const rxn_id = rxn_obj.reaction;
                        const data = find_shape_by_rxn(core, rxn_id);

                        // if a shape was not found in the core json for
                        // a reaction, skip
                        if (!data) continue;

                        // for each obj in the core graph json
                        for (var j in data) {
                            obj = data[j];

                            const dict = $.extend({}, rxn_obj);

                            dict.reaction_id = rxn_id;
                            dict.gene_present = true; //not really needed
                            dict.org_name = org_names[n];

                            // get any associated flux values for rxn_id
                            for (const z in model_fba.reactionFluxes) {
                                const rxn_flux = model_fba.reactionFluxes[z];
                                console.log(rxn_flux);
                                if (rxn_flux[0].slice(0, rxn_flux[0].indexOf('_')) == rxn_id) {
                                    dict.flux = parseFloat(rxn_flux[1]); // reaction flux value
                                }
                            }

                            obj.kbids[get_genome_id(model.id)].push(dict);
                        }
                    }
                }
                return core;
            }

            function find_shape_by_rxn(core, rxn_id) {
                const objs = [];
                for (const k in core) {
                    const obj = core[k];
                    const core_rxns = obj.rxns;

                    if (core_rxns) {
                        for (const j in core_rxns) {
                            const core_rxn = core_rxns[j];
                            if (core_rxn == rxn_id) {
                                objs.push(obj);
                            }
                        }
                    }
                }
                if (objs.length > 0) {
                    return objs;
                }
            }

            function core_model(data, show_flux) {
                const stage = Raphael('core-model', 1000, 1500);

                // Draw shapes
                for (var i in data) {
                    var obj = data[i];

                    const x = (obj.x - 2) * grid; //Fixme: update json
                    const y = (obj.y - 2) * grid;

                    if (obj.shape == 'rect') {
                        const rect = stage.core_rect(obj, x, y, r_width, r_height, show_flux);
                        //var text = stage.text(x+r_width/2+50, y+r_height/2, obj.rxns.join('\n'))
                        //text.attr({'font-size':8})
                    } else if (obj.shape == 'circ') {
                        const circle = stage.circle(x + r_width / 2, y + r_height / 2, radius);
                        if (obj.textPos) {
                            if (obj.textPos == 'left') {
                                var text = stage.text(x, y + r_height / 2, obj.text);

                                var offset = (-1 * text.getBBox().width) / 2 + (radius + 3);
                                text.translate(offset, 0);
                            } else if (obj.textPos == 'above') {
                                var text = stage.text(x, y - r_height / 2, obj.text);
                            } else if (obj.textPos == 'below') {
                                var text = stage.text(x, y + r_height / 2 + r_height, obj.text);
                            }
                        } else {
                            var text = stage.text(x + r_width / 2, y + r_height / 2, obj.text);

                            var offset = text.getBBox().width / 2 + radius + 3;
                            text.translate(offset, 0);
                        }
                    }
                }

                // Draw arrows
                for (var i = 0; i < data.length; i++) {
                    var obj = data[i];
                    if (obj.shape != 'circ') continue;

                    const conns = obj.connects;
                    if (!conns) continue;

                    if (conns instanceof Array) {
                        for (var j = 0; j < conns.length; j++) {
                            var conn_id = conns[j];

                            for (var k = 0; k < data.length; k++) {
                                var link_obj = data[k];
                                if (link_obj.id == conn_id) {
                                    stage.draw_arrow(obj, link_obj);
                                }
                            }
                        }
                    } else if (conns instanceof Object) {
                        for (const key in conns) {
                            if (key == 'curve') {
                                stage.draw_curve(obj);
                            }
                            if (key == 'dashed') {
                                for (var j = 0; j < conns.dashed.length; j++) {
                                    var conn_id = conns.dashed[j];

                                    for (var k = 0; k < data.length; k++) {
                                        var link_obj = data[k];
                                        if (link_obj.id == conn_id) {
                                            stage.draw_arrow(obj, link_obj, '--');
                                        }
                                    }
                                }
                            }
                            if (key == 'conns') {
                                for (var j = 0; j < conns.conns.length; j++) {
                                    var conn_id = conns.conns[j];

                                    for (var k = 0; k < data.length; k++) {
                                        var link_obj = data[k];
                                        if (link_obj.id == conn_id) {
                                            stage.draw_arrow(obj, link_obj);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // event for reaction view
                $('.model-rxn').unbind('click');
                $('.model-rxn').click(function (event) {
                    const rxns = $(this).data('rxns').split(',');
                    self.trigger('rxnClick', { rxns: rxns });
                });

                return stage;
            }

            Raphael.fn.core_rect = function (obj, x, y, r_width, r_height, show_flux) {
                const orgs = obj.kbids;
                let org_count = 0;
                for (var i in orgs) {
                    org_count++;
                }

                const offset = r_width / org_count;

                if (orgs) {
                    var i = 0;
                    for (const kbid in orgs) {
                        // draw box for that org
                        const rect = this.rect(x + i * offset, y, offset, r_height);
                        rect.node.setAttribute('class', 'model-rxn');
                        rect.node.setAttribute('data-rxns', obj.rxns.join(','));

                        const rxn_list = orgs[kbid]; // reaction list for a given org

                        // Go through rxns for each org,
                        // if at least one gene is present (or has flux), mark
                        var has_flux = false;
                        let flux = 0;
                        var gene_present = false;
                        let tip = '';
                        for (const j in rxn_list) {
                            const rxn_obj = rxn_list[j];
                            if (rxn_obj.gene_present == true) var gene_present = true;
                            flux += rxn_obj.flux;
                            tip += core_tooltip(rxn_obj, rxn_obj.flux);
                        }

                        if (Math.abs(flux) > flux_threshold) var has_flux = true;
                        if (orgs[kbid][0]) var org_name = orgs[kbid][0].org_name;
                        else var org_name = '';
                        $(rect.node).popover({
                            content: tip,
                            title: org_name,
                            trigger: 'hover',
                            html: true,
                            container: 'body',
                            placement: 'bottom',
                        });

                        //var rect = this.rect(x+(i*offset), y, offset, r_height)

                        if (has_flux && show_flux) {
                            //rect.attr({'fill':'#e06060'});
                            //rect.attr({'fill':comp_colors[i]});

                            if (!rxn_list[0]) continue;
                            if (Math.abs(flux) >= 100) {
                                var color = heat_colors[0];
                            } else if (Math.abs(flux) >= 50) {
                                var color = heat_colors[1];
                            } else if (Math.abs(flux) >= 10) {
                                var color = heat_colors[2];
                            } else if (Math.abs(flux) >= 5) {
                                var color = heat_colors[3];
                            } else {
                                var color = heat_colors[4];
                            }
                            rect.attr({ fill: color });
                        } else if (gene_present) {
                            rect.attr({ fill: g_present_color });
                        } else {
                            rect.attr({ fill: 'white', 'stroke-width': 0.5 });
                        }

                        // Give rect obj has the list of reactions
                        rect.data('rxns', obj.rxns);
                        i++;
                    }
                }
            };

            function core_tooltip(rxn_obj, flux_val) {
                let tip = '';
                tip += '<b>Rxn:</b> ' + rxn_obj.reaction + '<br>';
                tip += '<b>Eq:</b> ' + rxn_obj.definition + '<br>';
                tip += '<b>Flux Value:</b> ' + flux_val + '<br><br>';

                return tip;
            }

            Raphael.fn.draw_curve = function (obj) {
                const xys = obj.connects.curve.path;
                if (obj.pathPos == 'below') {
                    var x1 = (xys[0][0] - 2) * grid + r_width / 2;
                    var y1 = (xys[0][1] - 2) * grid + radius * 3;
                    var x2 = (xys[1][0] - 2) * grid + r_width / 2;
                    var y2 = (xys[1][1] - 2) * grid + r_width / 2;
                    var x3 = (xys[2][0] - 2) * grid + r_width / 2;
                    var y3 = (xys[2][1] - 2) * grid + radius * 3;
                } else if (obj.pathPos == 'above') {
                    var x1 = (xys[0][0] - 2) * grid + r_width / 2;
                    var y1 = (xys[0][1] - 2) * grid - radius;
                    var x2 = (xys[1][0] - 2) * grid + r_width / 2;
                    var y2 = (xys[1][1] - 2) * grid;
                    var x3 = (xys[2][0] - 2) * grid + r_width / 2;
                    var y3 = (xys[2][1] - 2) * grid - radius;
                }
                const path = this.path(
                    'M' +
                        x1 +
                        ',' +
                        y1 +
                        'C' +
                        x1 +
                        ',' +
                        y2 +
                        ' ' +
                        x3 +
                        ',' +
                        y2 +
                        ' ' +
                        x3 +
                        ',' +
                        y3
                );
                path.toBack();
                return path;
            };

            Raphael.fn.draw_curved_arrow = function (obj) {
                const xys = obj.connects.curve.path;
                if (obj.pathPos == 'below') {
                    var x1 = xys[0][0] * grid - 2 + r_width / 2;
                    var y1 = xys[0][1] * grid - 2 + radius * 3;
                    var x2 = xys[1][0] * grid - 2 + r_width / 2;
                    var y2 = xys[1][1] * grid - 2 + r_width / 2;
                    var x3 = xys[2][0] * grid - 2 + r_width / 2;
                    var y3 = xys[2][1] * grid - 2 + radius * 3;
                } else if (obj.pathPos == 'above') {
                    var x1 = (xys[0][0] - 2) * grid + r_width / 2;
                    var y1 = (xys[0][1] - 2) * grid - radius;
                    var x2 = (xys[1][0] - 2) * grid + r_width / 2;
                    var y2 = (xys[1][1] - 2) * grid;
                    var x3 = (xys[2][0] - 2) * grid + r_width / 2;
                    var y3 = (xys[2][1] - 2) * grid - radius;
                }

                let angle = Math.atan2(x1 - x2, y2 - y1);
                angle = (angle / (2 * Math.PI)) * 360;
                const arrowPath = this.path(
                    'M' +
                        x2 +
                        ' ' +
                        y2 +
                        ' L' +
                        (x2 - size) +
                        ' ' +
                        (y2 - size) +
                        ' L' +
                        (x2 - size) +
                        ' ' +
                        (y2 + size) +
                        ' L' +
                        x2 +
                        ' ' +
                        y2
                ).rotate(90 + angle, x2, y2);
                const linePath = this.path('M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2);

                linePath.attr({ stroke: '#444', 'stroke-dasharray': style });
                arrowPath.attr({ stroke: '#444', fill: '#666', 'stroke-dasharray': style });
                linePath.data('type', 'path');
                arrowPath.data('type', 'path');
                linePath.toBack();
                arrowPath.toBack();

                return this.path(
                    'M' +
                        x1 +
                        ',' +
                        y1 +
                        'C' +
                        x1 +
                        ',' +
                        y2 +
                        ' ' +
                        x3 +
                        ',' +
                        y2 +
                        ' ' +
                        x3 +
                        ',' +
                        y3
                );
            };

            Raphael.fn.draw_arrow = function (obj, link_obj, dashed) {
                if (link_obj.y < obj.y) {
                    var x1 = (obj.x - 2) * grid + r_width / 2;
                    var y1 = (obj.y - 2) * grid + r_height / 2 - 10;
                    var x2 = (link_obj.x - 2) * grid + r_width / 2;
                    var y2 = (link_obj.y - 2) * grid + r_height / 2 + 10;
                } else if (link_obj.y > obj.y) {
                    var x1 = (obj.x - 2) * grid + r_width / 2;
                    var y1 = (obj.y - 2) * grid + r_height / 2 + 10;
                    var x2 = (link_obj.x - 2) * grid + r_width / 2;
                    var y2 = (link_obj.y - 2) * grid + r_height / 2 - 10;
                }

                if (link_obj.x < obj.x && link_obj.y > obj.y) {
                    var x1 = (obj.x - 2) * grid + r_width / 2 - 10;
                    var y1 = (obj.y - 2) * grid + r_height / 2 + 10;
                    var x2 = (link_obj.x - 2) * grid + r_width / 2 + 10;
                    var y2 = (link_obj.y - 2) * grid + r_height / 2 - 10;
                } else if (link_obj.x < obj.x && link_obj.y < obj.y) {
                    var x1 = (obj.x - 2) * grid + r_width / 2 - 10;
                    var y1 = (obj.y - 2) * grid + r_height / 2 - 10;
                    var x2 = (link_obj.x - 2) * grid + r_width / 2 + 10;
                    var y2 = (link_obj.y - 2) * grid + r_height / 2 + 10;
                } else if (link_obj.x > obj.x && link_obj.y > obj.y) {
                    var x1 = (obj.x - 2) * grid + r_width / 2 + 10;
                    var y1 = (obj.y - 2) * grid + r_height / 2 + 10;
                    var x2 = (link_obj.x - 2) * grid + r_width / 2 - 10;
                    var y2 = (link_obj.y - 2) * grid + r_height / 2 - 10;
                } else if (link_obj.x > obj.x && link_obj.y < obj.y) {
                    var x1 = (obj.x - 2) * grid + r_width / 2 + 10;
                    var y1 = (obj.y - 2) * grid + r_height / 2 - 10;
                    var x2 = (link_obj.x - 2) * grid + r_width / 2 - 10;
                    var y2 = (link_obj.y - 2) * grid + r_height / 2 + 10;
                } else if (link_obj.x < obj.x && link_obj.y == obj.y) {
                    var x1 = (obj.x - 2) * grid + r_width / 2 - 10;
                    var y1 = (obj.y - 2) * grid + r_height / 2;
                    var x2 = (link_obj.x - 2) * grid + r_width / 2 + 10;
                    var y2 = (link_obj.y - 2) * grid + r_height / 2;
                } else if (link_obj.x > obj.x && link_obj.y == obj.y) {
                    var x1 = (obj.x - 2) * grid + r_width / 2 + 10;
                    var y1 = (obj.y - 2) * grid + r_height / 2;
                    var x2 = (link_obj.x - 2) * grid + r_width / 2 - 10;
                    var y2 = (link_obj.y - 2) * grid + r_height / 2;
                }
                if (dashed) {
                    return this.arrow(x1, y1, x2, y2, 4, dashed);
                } else {
                    return this.arrow(x1, y1, x2, y2, 4);
                }
            };

            Raphael.fn.arrow = function (x1, y1, x2, y2, size, style) {
                let angle = Math.atan2(x1 - x2, y2 - y1);
                angle = (angle / (2 * Math.PI)) * 360;
                const arrowPath = this.path(
                    'M' +
                        x2 +
                        ' ' +
                        y2 +
                        ' L' +
                        (x2 - size) +
                        ' ' +
                        (y2 - size) +
                        ' L' +
                        (x2 - size) +
                        ' ' +
                        (y2 + size) +
                        ' L' +
                        x2 +
                        ' ' +
                        y2
                ).rotate(90 + angle, x2, y2);
                const linePath = this.path('M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2);

                linePath.attr({ stroke: '#444', 'stroke-dasharray': style });
                arrowPath.attr({ stroke: '#444', fill: '#666', 'stroke-dasharray': style });
                linePath.data('type', 'path');
                arrowPath.data('type', 'path');
                linePath.toBack();
                arrowPath.toBack();
                return linePath;
            };

            function get_genome_id(ws_id) {
                const pos = ws_id.indexOf('.');
                var ws_id = ws_id.slice(0, ws_id.indexOf('.', pos + 1));
                return ws_id;
            }

            //this._rewireIds(this.$elem, this);

            return self;
        }, //end init

        /**
         * uuid generator
         *
         * @private
         */
        _uuidgen: function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                const r = (Math.random() * 16) | 0,
                    v = c == 'x' ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            });
        },
    });
})(jQuery);
