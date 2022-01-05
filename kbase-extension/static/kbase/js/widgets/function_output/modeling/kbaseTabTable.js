define([
    'kbwidget',
    'jquery',
    'kbaseAuthenticatedWidget',
    'kbaseTabTableTabs',
    'narrativeConfig',

    // For effect
    'bootstrap',
    'kbasePathways',
], (KBWidget, $, kbaseAuthenticatedWidget, kbaseTabTableTabs, Config) => {
    'use strict';
    return KBWidget({
        name: 'kbaseTabTable',
        parent: kbaseAuthenticatedWidget,
        version: '1.0.0',
        options: {},

        init: function (input) {
            this._super(input);
            const self = this;
            const $tableContainer = $('<div>');
            this.$elem.append($tableContainer);

            // root url path for landing pages
            const DATAVIEW_URL = '/#dataview/';

            const type = input.type;

            // eslint-disable-next-line no-undef
            const kbModeling = new KBModeling(self.authToken());

            // kbase api helper
            this.kbapi = kbModeling.kbapi;

            //
            // 1) Use type (periods replaced with underscores) to instantiate a modeling object
            //
            this.obj = new kbModeling[type.replace(/\./g, '_')](self);

            //
            // 2) add the tabs (at page load)
            //
            const tabList = this.obj.tabList;

            const uiTabs = [];
            for (let i = 0; i < tabList.length; i++) {
                // add loading status
                const placeholder = $('<div>');
                placeholder.loading();

                uiTabs.push({ name: tabList[i].name, content: placeholder });
            }

            uiTabs[0].active = true;
            //tabs = self.$elem.kbaseTabTableTabs({tabs: uiTabs});
            const tabs = new kbaseTabTableTabs($tableContainer, { tabs: uiTabs });

            //
            // 3) get meta data, add any metadata tables
            //
            let param;
            if (isNaN(input.ws) && isNaN(input.obj))
                param = { workspace: input.ws, name: input.obj };
            else if (!isNaN(input.ws) && !isNaN(input.obj))
                param = { ref: input.ws + '/' + input.obj };

            self.kbapi('ws', 'get_object_info_new', { objects: [param], includeMetadata: 1 }).done(
                (res) => {
                    self.obj.setMetadata(res[0]);

                    for (let i = 0; i < tabList.length; i++) {
                        const spec = tabList[i];

                        if (spec.type === 'verticaltbl') {
                            const key = spec.key,
                                data = self.obj[key],
                                tabPane = tabs.tabContent(spec.name);

                            const table = self.verticalTable({ rows: spec.rows, data: data });
                            tabPane.rmLoading();
                            tabPane.append(table);
                        }
                    }
                }
            );

            //
            // 4) get object data, create tabs
            //
            if (isNaN(input.ws) && isNaN(input.obj))
                param = { workspace: input.ws, name: input.obj };
            else if (!isNaN(input.ws) && !isNaN(input.obj))
                param = { ref: input.ws + '/' + input.obj };

            self.kbapi('ws', 'get_objects', [param]).done((data) => {
                const setMethod = self.obj.setData(data[0].data, tabs);

                // see if setData method returns promise or not
                if (setMethod && 'done' in setMethod) {
                    setMethod.done(() => {
                        buildContent();
                    });
                } else {
                    buildContent();
                }
            });

            const refLookup = {};

            function preProcessDataTable(tabSpec, tabPane) {
                // get refs
                const refs = [];
                const cols = tabSpec.columns;
                cols.forEach((col) => {
                    if (
                        (col.type === 'tabLink' || col.type === 'wstype') &&
                        col.linkformat === 'dispWSRef'
                    ) {
                        self.obj[tabSpec.key].forEach((item) => {
                            if (refs.indexOf(item[col.key]) === -1) {
                                refs.push({ ref: item[col.key] });
                            }
                        });
                    }
                });

                if (!refs.length) return;

                // get human readable info from workspaces
                return self.kbapi('ws', 'get_object_info_new', { objects: refs }).then((data) => {
                    refs.forEach((ref, i) => {
                        // if (ref in referenceLookup) return
                        refLookup[ref.ref] = {
                            name: data[i][1],
                            ws: data[i][7],
                            type: data[i][2].split('-')[0],
                            //link: data[i][2].split('-')[0]+'/'+data[i][7]+'/'+data[i][1]
                            link: data[i][7] + '/' + data[i][1],
                        };
                    });
                    createDataTable(tabSpec, tabPane);
                });
            }

            function buildContent() {
                //5) Iterates over the entries in the spec and instantiate things
                for (let i = 0; i < tabList.length; i++) {
                    const tabSpec = tabList[i];
                    const tabPane = tabs.tabContent(tabSpec.name);

                    // skip any vertical tables for now
                    if (tabSpec.type === 'verticaltbl') continue;

                    // if widget, invoke widget with arguments

                    if (tabSpec.widget) {
                        new tabSpec.widget(tabPane, tabSpec.getParams());
                        continue;
                    }

                    // preprocess data to get workspace info on any references in class
                    const prom = preProcessDataTable(tabSpec, tabPane);
                    if (!prom) {
                        createDataTable(tabSpec, tabPane);
                    }
                }
            }

            // creates a datatable on a tabPane
            function createDataTable(tabSpec, tabPane) {
                const settings = self.getTableSettings(tabSpec, self.obj.data);
                tabPane.rmLoading();

                // note: must add table first
                tabPane.append(
                    '<table class="table table-bordered table-striped" style="width:100%">'
                );
                tabPane.find('table').DataTable(settings);

                // add any events
                newTabEvents(tabSpec.name);
            }

            // takes table spec and prepared data, returns datatables settings object
            this.getTableSettings = function (tab) {
                const tableColumns = getColSettings(tab);

                const settings = {
                    dom: '<"top"lf>rt<"bottom"ip><"clear">',
                    aaData: self.obj[tab.key],
                    aoColumns: tableColumns,
                    language: { search: '_INPUT_', searchPlaceholder: 'Search ' + tab.name },
                };

                const fnDrawCallback = () => {
                    newTabEvents(tab.name);
                };

                // add any events
                for (let i = 0; i < tab.columns.length; i++) {
                    settings.fnDrawCallback = fnDrawCallback;
                }

                return settings;
            };

            function newTabEvents(name) {
                const ids = tabs.tabContent(name).find('.id-click');

                ids.unbind('click');
                ids.click(function () {
                    const info = {
                        id: $(this).data('id'),
                        type: $(this).data('type'),
                        method: $(this).data('method'),
                        ref: $(this).data('ref'),
                        name: $(this).data('name'),
                        ws: $(this).data('ws'),
                        action: $(this).data('action'),
                    };

                    let content = $('<div>');

                    if (info.method && info.method !== 'undefined') {
                        const res = self.obj[info.method](info);

                        if (res && 'done' in res) {
                            content = $('<div>').loading();
                            $.when(res).done((rows) => {
                                content.rmLoading();
                                const table = self.verticalTable({ rows: rows });
                                content.append(table);
                            });
                        } else if (res === undefined) {
                            content.append('<br>No data found for ' + info.id);
                        } else {
                            const table = self.verticalTable({ rows: res });
                            content.append(table);
                        }

                        tabs.addTab({ name: info.id, content: content, removable: true });
                        tabs.showTab(info.id);
                        newTabEvents(info.id);
                    } else if (info.action === 'openWidget') {
                        // eslint-disable-next-line no-undef
                        new kbaseTabTable(content, {
                            ws: info.ws,
                            type: info.type,
                            obj: info.name,
                        });
                        tabs.addTab({ name: info.id, content: content, removable: true });
                        tabs.showTab(info.id);
                        newTabEvents(info.id);
                    }
                });
            }

            // takes table spec, returns datatables column settings
            function getColSettings(tab) {
                const settings = [];

                const cols = tab.columns;

                for (let i = 0; i < cols.length; i++) {
                    const col = cols[i];
                    const key = col.key,
                        type = col.type,
                        format = col.linkformat,
                        method = col.method;

                    const config = {
                        sTitle: col.label,
                        sDefaultContent: '-',
                        mData: ref(key, type, format, method),
                    };

                    if (col.width) config.sWidth = col.width;

                    settings.push(config);
                }

                return settings;
            }

            function ref(key, type, format, method) {
                return function (d) {
                    if (type === 'tabLink' && format === 'dispIDCompart') {
                        let dispid = d[key];
                        if ('dispid' in d) {
                            dispid = d.dispid;
                        }
                        return (
                            '<a class="id-click" data-id="' +
                            d[key] +
                            '" data-method="' +
                            method +
                            '">' +
                            dispid +
                            '</a>'
                        );
                    } else if (type === 'tabLink' && format === 'dispID') {
                        const id = d[key];
                        return (
                            '<a class="id-click" data-id="' +
                            id +
                            '" data-method="' +
                            method +
                            '">' +
                            id +
                            '</a>'
                        );
                    } else if (type === 'wstype' && format === 'dispWSRef') {
                        const ws = refLookup[d[key]].ws,
                            name = refLookup[d[key]].name,
                            wstype = refLookup[d[key]].type,
                            link = refLookup[d[key]].link;
                        return (
                            '<a href="' +
                            DATAVIEW_URL +
                            link +
                            '" target="_blank" ' +
                            '" class="id-click"' +
                            '" data-ws="' +
                            ws +
                            '" data-id="' +
                            name +
                            '" data-ref="' +
                            d[key] +
                            '" data-type="' +
                            wstype +
                            '" data-action="openPage"' +
                            '" data-method="' +
                            method +
                            '" data-name="' +
                            name +
                            '">' +
                            name +
                            '</a>'
                        );
                    }

                    const value = d[key];

                    if ($.isArray(value)) {
                        if (type === 'tabLinkArray') return tabLinkArray(value, method);
                        return d[key].join(', ');
                    }

                    return value;
                };
            }

            function tabLinkArray(a, method) {
                const links = [];
                a.forEach((d) => {
                    let dispid = d.id;
                    if ('dispid' in d) {
                        dispid = d.dispid;
                    }
                    links.push(
                        '<a class="id-click" data-id="' +
                            d.id +
                            '" data-method="' +
                            method +
                            '">' +
                            dispid +
                            '</a>'
                    );
                });
                return links.join(', ');
            }

            this.verticalTable = function (p) {
                const data = p.data;
                const rows = p.rows;

                const table = $(
                    '<table class="table table-bordered" style="margin-left: auto; margin-right: auto;">'
                );

                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];

                    // don't display undefined things in vertical table
                    if (
                        ('data' in row && typeof row.data === 'undefined') ||
                        ('key' in row && typeof data[row.key] === 'undefined')
                    )
                        continue;

                    const r = $('<tr>');
                    r.append('<td><b>' + row.label + '</b></td>');

                    // if the data is in the row definition, use it
                    if ('data' in row) {
                        let value;
                        if (row.type === 'tabLinkArray') {
                            value = tabLinkArray(row.data, row.method);
                        } else if (row.type === 'tabLink') {
                            value =
                                '<a class="id-click" data-id="' +
                                row.data +
                                '" data-method="' +
                                row.method +
                                '">' +
                                row.dispid +
                                '</a>';
                        } else {
                            value = row.data;
                        }
                        r.append('<td>' + value + '</td>');
                    } else if ('key' in row) {
                        if (row.type === 'wstype') {
                            const ref = data[row.key];

                            const cell = $('<td data-ref="' + ref + '">loading...</td>');
                            r.append(cell);

                            getLink(ref).done((info) => {
                                const name = info.url.split('/')[1];
                                const ref = info.ref;
                                table
                                    .find("[data-ref='" + ref + "']")
                                    .html(
                                        '<a href="' +
                                            DATAVIEW_URL +
                                            info.url +
                                            '" target="_blank">' +
                                            name +
                                            '</a>'
                                    );
                            });
                        } else {
                            r.append('<td>' + data[row.key] + '</td>');
                        }
                    } else if (row.type === 'pictureEquation')
                        r.append('<td>' + this.pictureEquation(row.data) + '</td>');

                    table.append(r);
                }

                return table;
            };

            this.getBiochemCompounds = function (ids) {
                return self.kbapi('biochem', 'get_compounds', { compounds: ids });
            };
            const imageURL = Config.url('compound_img_url');
            this.compoundImage = function (id) {
                return (
                    '<img src=' +
                    imageURL +
                    id.split('_')[0] +
                    ".png style='height:300px !important;'>"
                );
            };

            this.pictureEquation = function (eq) {
                let img_url;
                const cpds = get_cpds(eq);
                const $panel = $('<div>');

                for (let i = 0; i < cpds.left.length; i++) {
                    const cpd = cpds.left[i];
                    img_url = imageURL + cpd + '.png';
                    $panel.append(`
                        <div class="pull-left text-center">
                            <img src="${img_url}" width=150 ><br>
                            <div class="cpd-id" data-cpd="${cpd}">
                            ${cpd}
                            </div>
                        </div>
                    `);

                    const plus = $('<div class="pull-left text-center">+</div>');
                    plus.css('margin', '30px 0 0 0');

                    if (i < cpds.left.length - 1) {
                        $panel.append(plus);
                    }
                }

                const direction = $('<div class="pull-left text-center">' + '<=>' + '</div>');
                direction.css('margin', '25px 0 0 0');
                $panel.append(direction);

                for (let i = 0; i < cpds.right.length; i++) {
                    const cpd = cpds.right[i];
                    img_url = imageURL + cpd + '.jpeg';
                    $panel.append(`
                        <div class="pull-left text-center">
                            <img src="${img_url}" data-cpd="${cpd}" width=150 ><br>
                            <div class="cpd-id" data-cpd="${cpd}">
                                ${cpd}
                            </div>
                        </div>
                    `);

                    const plus = $('<div class="pull-left text-center">+</div>');
                    plus.css('margin', '25px 0 0 0');

                    if (i < cpds.right.length - 1) {
                        $panel.append(plus);
                    }
                }

                const cpd_ids = cpds.left.concat(cpds.right);
                const prom = self.kbapi('biochem', 'get_compounds', { compounds: cpd_ids });
                $.when(prom).done((d) => {
                    const map = {};
                    for (const i in d) {
                        map[d[i].id] = d[i].name;
                    }

                    $('.cpd-id').each(function () {
                        $(this).html(map[$(this).data('cpd')]);
                    });
                });

                return $panel;
            };

            function get_cpds(equation) {
                const cpds = {};
                const sides = equation.split('=');
                cpds.left = sides[0].match(/cpd\d*/g);
                cpds.right = sides[1].match(/cpd\d*/g);

                return cpds;
            }

            function getLink(ref) {
                return self
                    .kbapi('ws', 'get_object_info_new', { objects: [{ ref: ref }] })
                    .then((data) => {
                        const a = data[0];
                        return { url: a[7] + '/' + a[1], ref: a[6] + '/' + a[0] + '/' + a[4] };
                    });
            }

            return this;
        },
    });
});
