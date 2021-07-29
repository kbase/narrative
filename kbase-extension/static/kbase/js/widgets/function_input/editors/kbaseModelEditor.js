/**
 *	kbaseModelEditor.js (kbaseModelEditor)
 *
 *	Given a pair of workspace and media object names or ids,
 *	produce editable model tables.
 *
 *  Optional params
 *  	onSave (function): called after data has been saved
 *
 *  @author nconrad <nconrad@anl.gov>
 *
 */

define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'ModelingAPI',
    'kbaseEditHistory',
    'kbaseAuthenticatedWidget',
    'kbaseModal',
], (KBWidget, bootstrap, $, ModelingAPI, EditHistory, kbaseAuthenticatedWidget, kbaseModal) => {
    'use strict';

    return KBWidget({
        name: 'kbaseModelEditor',
        parent: kbaseAuthenticatedWidget,
        version: '1.0.0',
        options: {},
        init: function (input) {
            this._super(input);
            const self = this,
                container = $('<div class="kb-editor">');

            self.$elem.append(container);

            // APIs
            const modeling = new ModelingAPI(self.authToken()),
                api = modeling.api,
                biochem = modeling.biochem,
                getCpds = modeling.getCpds;

            // accept either workspace/object names or workspace/object ids
            const wsName = input.ws,
                objName = input.obj;

            if (isNaN(wsName) && isNaN(objName)) var param = { workspace: wsName, name: objName };
            else if (!isNaN(wsName) && !isNaN(objName)) var param = { ref: wsName + '/' + objName };
            else {
                self.$elem.append(
                    'kbaseModelEditor arguments are invalid: ',
                    JSON.stringify(input)
                );
                return this;
            }

            let table, // main table to be edited (reactions for now)
                modelObj,
                model, // actual model data
                modelreactions, // edited table
                rawData, // raw workspace object
                tabs; // UI tabs

            // some controls for the table
            const saveBtn = $('<button class="btn btn-primary btn-save hide">' + 'Save</button>');
            //var saveAsBtn = $('<button class="btn btn-primary btn-save hide">'+
            //                'Save as...</button>');
            const addBtn = $(
                '<button class="btn btn-primary">' +
                    '<i class="fa fa-plus"></i> Add reactions...</button>'
            );
            const rmBtn = $('<button class="btn btn-danger hide">');

            // keep track of edits
            const _editHistory = new EditHistory();

            const allowedTabs = ['Reactions', 'Compounds', 'Compartments', 'Biomass'];

            // get media data
            container.loading();
            api('ws', 'get_objects', [param]).done((res) => {
                rawData = $.extend(true, {}, res[0]);

                modelObj = new KBaseFBA_FBAModel(self);
                modelObj.setMetadata(res[0].info);
                modelObj.setData(res[0].data);
                model = modelObj.data;
                //console.log('modelObj', modelObj);

                // table being edited
                modelreactions = model.modelreactions;

                // skip overview
                const tabList = modelObj.tabList.slice(1);

                const uiTabs = [];

                let i = tabList.length;
                while (i--) {
                    const tab = tabList[i];

                    // skip viz not needed
                    if (allowedTabs.indexOf(tab.name) === -1) {
                        tabList.splice(i, 1);
                        continue;
                    }

                    // add loading status
                    const placeholder = $('<div>');
                    placeholder.loading();

                    uiTabs.unshift({ name: tabList[i].name, content: placeholder });
                }

                uiTabs[0].active = true;
                tabs = container.kbaseTabTableTabs({ tabs: uiTabs });

                buildContent(tabList);
                container.rmLoading();
            });

            function buildContent(tabList) {
                //5) Iterates over the entries in the spec and instantiate things
                for (let i = 0; i < tabList.length; i++) {
                    const tabSpec = tabList[i];
                    const tabPane = tabs.tabContent(tabSpec.name);

                    // skip any vertical tables for now
                    if (tabSpec.type === 'verticaltbl') continue;

                    if (tabSpec.name === 'Reactions') createRxnTable(tabSpec, tabPane);
                    else createDataTable(tabSpec, tabPane);
                }
            }

            function createDataTable(tabSpec, tabPane) {
                const settings = getTableSettings(tabSpec, model);
                tabPane.rmLoading();

                // the 'style' here is a hack for narrative styling :/
                var table = $('<table class="table table-bordered table-striped kb-editor-table">');
                tabPane.append(table);
                var table = table.DataTable(settings);
            }

            // creates a datatable on a tabPane
            function createRxnTable(tabSpec, tabPane) {
                const settings = getTableSettings(tabSpec, model);
                tabPane.rmLoading();

                // the 'style' here is a hack for narrative styling :/
                table = $('<table class="table table-bordered table-striped kb-editor-table">');
                tabPane.append(table);
                table = table.DataTable(settings);

                // add controls
                const controls = tabPane.find('.controls');

                controls.append(addBtn, rmBtn, saveBtn);

                addBtn.on('click', rxnModal);
                saveBtn.on('click', () => {
                    saveData(_editHistory.getMaster(), wsName, objName);
                });
                //saveAsBtn.on('click', saveModal);
                rmBtn.on('click', () => {
                    // get all selected data
                    const data = getTableData('.row-select');

                    // edit table
                    const ids = data.map((obj) => {
                        return obj.id;
                    });

                    const op = { op: 'rm', data: data, ids: ids };
                    editTable(op);
                    modeling.notice(container, 'Removed ' + data.length + ' reactions');

                    rmBtn.toggleClass('hide');
                    addBtn.toggleClass('hide');
                });

                // event for clicking on table row
                table.on('click', 'tbody tr td:first-child', function () {
                    $(this).parent().toggleClass('row-select');

                    const count = table.rows('.row-select').data().length;

                    if (count > 0) {
                        addBtn.addClass('hide');
                        rmBtn.html(
                            '<i class="fa fa-minus"></i> ' + 'Remove ' + count + ' reactions'
                        );
                        rmBtn.removeClass('hide');
                    } else {
                        rmBtn.addClass('hide');
                        addBtn.removeClass('hide');
                    }
                });

                // event for clicking on editable cells
                table.on('click', '.editable-direction', function (e) {
                    if ($(e.target).is('select')) return;

                    const cell = table.cell(this);
                    const cellContent = cell.data();
                    const rowData = table.row($(this).parents('tr')).data();

                    const direction = rowData.direction;

                    // render again with dropdown
                    if (cellContent.indexOf('<=>') !== -1) var sides = cellContent.split('<=>');
                    else if (cellContent.indexOf('=>') !== -1) var sides = cellContent.split('=>');
                    else if (cellContent.indexOf('<=') !== -1) var sides = cellContent.split('<=');

                    const dd = $(
                        '<select class="form-control">' +
                            '<option value="="><=></option>' +
                            '<option value="<"><=</option>' +
                            '<option value=">">=></option>' +
                            '</select>'
                    );
                    const eq = $('<span>');
                    dd.find('option[value="' + direction + '"]').attr('selected', 'selected');

                    eq.append(sides[0], dd, sides[1]);
                    table.cell(this).data(eq.html()).draw();
                    $(this).find('select').focus();

                    // event for when direction dropdown changes
                    $(this)
                        .find('select')
                        .on('blur', function () {
                            const newDirection = $(this).val();

                            if (newDirection === '=') var dir = '<=>';
                            else if (newDirection === '>') var dir = '=>';
                            else if (newDirection === '<') var dir = '<=';

                            const newContent = sides[0] + dir + sides[1];

                            // set data in datable memory
                            cell.data(newContent).draw();

                            if (direction === newDirection) return;

                            // save in history
                            const op = {
                                op: 'edit',
                                kind: 'direction',
                                ids: [rowData.id],
                                before: direction,
                                after: newDirection,
                            };
                            editTable(op);
                        });

                    $(this)
                        .find('select')
                        .on('change', function (e) {
                            $(this).blur();
                        });
                });

                // need API call for genes
                /*
            table.on('click', '.editable-genes', function(e) {
                $(this).attr('contenteditable', true);
                $(this).addClass('editing-focus');
                $(this).focus();
            })
            */

                // event for 'leaving' cell
                /*
            table.on('blur', 'td.editable-genes', function(){
                var before = table.cell(this).data(),
                    after = $(this).text();

                // fixme: add better validation and error handling
                if (before === after) return;

                // set data in datable memory
                table.cell( this ).data(after).draw()

                // save in history
                var id = table.row( $(this).parents('tr') ).data().id;
                var op = {op: 'edit', ids: [id], before: before, after: after};
                editTable(op);
            })
            */

                // emit blur on enter as well
                /*
            table.on('keydown', 'td.editable-genes', function(e) {
                if(e.keyCode == 13) {
                    e.preventDefault();
                    $(this).blur();
                }
            });
            */
            }

            // takes table spec and prepared data, returns datatables settings object
            function getTableSettings(tab, data) {
                const tableColumns = getColSettings(tab);

                return {
                    dom: '<"top col-sm-6 controls"><"top col-sm-6"f>rt<"bottom"ip><"clear">',
                    data: modelObj[tab.key],
                    columns: tableColumns,
                    order: [[1, 'asc']],
                    language: {
                        search: '_INPUT_',
                        searchPlaceholder: 'Search ' + tab.name,
                    },
                };
            }

            // takes table spec, returns datatables column settings
            function getColSettings(tab) {
                const settings = [];
                const cols = tab.columns;

                // add checkbox
                if (tab.name == 'Reactions') {
                    settings.push({
                        orderable: false,
                        data: function (row) {
                            return '<i class="fa fa-square-o"></i>';
                        },
                    });
                }

                for (let i = 0; i < cols.length; i++) {
                    const col = cols[i];
                    const key = col.key,
                        type = col.type,
                        format = col.linkformat,
                        method = col.method,
                        action = col.action;

                    const config = {
                        title: col.label,
                        name: col.label,
                        defaultContent: '-',
                    };

                    if (['equation'].indexOf(key) !== -1)
                        config.className = 'editable editable-direction';

                    if (['genes'].indexOf(key) !== -1) config.className = 'editable-genes';

                    if (key === 'genes') {
                        config.data = function (row) {
                            const items = [];
                            for (let i = 0; i < row.genes.length; i++) {
                                items.push(row.genes[i].id);
                            }
                            return items.join('<br>');
                        };
                    } else {
                        config.data = key;
                    }

                    if (col.width) config.width = col.width;

                    settings.push(config);
                }

                return settings;
            }

            function rxnModal() {
                var table = $(
                    '<table class="table table-bordered table-striped kb-editor-table' +
                        ' " style="width: 100% !important;">'
                );

                const modal = new kbaseModal($('<div>'), {
                    title: 'Add Reactions',
                    subText: 'Select reactions below, then click "add".',
                    body: table,
                    width: '75%',
                });

                var table = table.DataTable({
                    processing: true,
                    serverSide: true,
                    orderMulti: false,
                    order: [[1, 'asc']],
                    ajax: function (opts, callback, settings) {
                        biochem('reactions', opts, ['id', 'name', 'definition']).done((res) => {
                            if (res) {
                                const data = {
                                    data: res.docs,
                                    recordsFiltered: res.numFound,
                                    recordsTotal: 27693,
                                };
                                callback(data);
                            }
                        });
                    },
                    dom: '<"top col-sm-6 controls"l><"top col-sm-6"f>rt<"bottom"ip><"clear">',
                    columns: [
                        {
                            orderable: false,
                            data: function (row) {
                                return '<i class="fa fa-square-o"></i>';
                            },
                        },
                        { title: 'Reaction', data: 'id' },
                        { title: 'Name', data: 'name' },
                        { title: 'Equation', data: 'definition', defaultContent: '-' },
                    ],
                    rowCallback: function (row, data, index) {
                        if (selectedRows.isSelected(data.id)) $(row).addClass('row-select');
                    },
                });

                // biochem table controls
                const controls = modal.body().find('.controls');
                const addBtn = $('<button class="btn btn-primary pull-right hide">');
                controls.append(addBtn);

                var selectedRows = new SelectedRows();

                // biochem table events
                table.on('click', 'tbody tr', function () {
                    $(this).toggleClass('row-select');

                    const data = table.rows(this).data()[0];

                    if ($(this).hasClass('row-select')) selectedRows.add(data);
                    else selectedRows.rm(data.id);

                    if (selectedRows.count() > 0) {
                        addBtn.html(
                            '<i class="fa fa-plus"></i> Add (' + selectedRows.count() + ')'
                        );
                        addBtn.removeClass('hide');
                    } else {
                        addBtn.addClass('hide');
                    }
                });

                // add reactions on click, hide dialog, give notice
                addBtn.on('click', () => {
                    const data = setRxnDefaults(selectedRows.getSelected()),
                        ids = data.map((obj) => {
                            return obj.id;
                        }),
                        op = { op: 'add', data: data, ids: ids };
                    editTable(op);
                    modal.hide();
                    modeling.notice(container, 'Added ' + data.length + ' reactions');
                });

                modal.show();
            }

            // not currently used
            function saveModal() {
                const name = objName; // +'-edited';  save as same name by default.
                const input = $(
                        '<input type="text" class="form-control" placeholder="my-media-name">'
                    ),
                    form = $(
                        '<div class="form-group">' + '<div class="col-sm-10"></div>' + '</div>'
                    );

                input.val(name);
                form.find('div').append(input);

                const modal = new kbaseModal($('<div>'), {
                    title: 'Save Media As...',
                    body: form,
                    buttons: [
                        {
                            text: 'Cancel',
                        },
                        {
                            text: 'Save',
                            kind: 'primary',
                        },
                    ],
                });

                modal.button('Save').on('click', () => {
                    saveData(getTableData(), wsName, input.val());
                });

                modal.show();
            }

            // function to edit table, store history, and rerender
            function editTable(operation) {
                _editHistory.add(operation);

                container.find('.btn-save').removeClass('hide');

                if (operation.op === 'edit') {
                    return;
                } else if (operation.op === 'add') {
                    table.rows.add(operation.data).draw();
                } else if (operation.op === 'rm') {
                    table.rows('.row-select').remove().draw();
                }
            }

            // object for selected rows.
            // only used for biochem search engine table.
            function SelectedRows() {
                let rows = [];

                this.add = function (row) {
                    rows.push(row);
                };

                this.rm = function (id) {
                    var i = id.length;
                    for (var i = 0; i < rows.length; i++) {
                        if (rows[i].id === id) {
                            rows.splice(i, 1);
                            return;
                        }
                    }
                };

                this.isSelected = function (id) {
                    for (let i = 0; i < rows.length; i++) {
                        if (rows[i].id === id) return true;
                    }
                    return false;
                };

                this.count = function () {
                    return rows.length;
                };

                this.getSelected = function () {
                    return rows;
                };

                this.clearAll = function () {
                    rows = [];
                };
            }

            // takes list of cpd info, sets defaults and returns
            // list of cpd objects.
            function setRxnDefaults(rxns) {
                // if not new model, use the same ref
                const ref = modelreactions[0].reaction_ref.split('/');
                const defaultRef = modelreactions.length
                    ? ref.slice(0, ref.length - 1).join('/') + '/'
                    : '489/6/1/reactions/id/';

                const newRxns = [];
                for (let i = 0; i < rxns.length; i++) {
                    const rxn = rxns[i];

                    newRxns.push({
                        equation: rxn.definition,
                        id: rxn.id + '_c0',
                        reaction_: defaultRef + rxn.id,
                        name: rxn.name,
                        genes: [],
                    });
                }

                return newRxns;
            }

            // takes optional selector, returns list of
            // data from datatables (instead of api object)
            function getTableData(selector) {
                const d = selector ? table.rows(selector).data() : table.rows().data();

                const data = [];
                for (let i = 0; i < d.length; i++) {
                    data.push(d[i]);
                }
                return data;
            }

            function saveData(master, ws, name) {
                saveBtn.text('saving...');

                // there are 3 requests: added, removed, and edited
                let prom;
                const rxnsToAdd = Object.keys(master.added),
                    rxnsToRemove = Object.keys(master.removed),
                    rxnsToEdit = Object.keys(master.edits);

                if (rxnsToAdd.length && rxnsToRemove.length) {
                    prom = addReactions(ws, name, rxnsToAdd).then(() => {
                        return rmReactions(ws, name, rxnsToRemove);
                    });
                } else if (rxnsToAdd.length && !rxnsToRemove.length) {
                    prom = addReactions(ws, name, rxnsToAdd);
                } else if (!rxnsToAdd.length && rxnsToRemove.length) {
                    prom = rmReactions(ws, name, rxnsToRemove);
                }

                if (rxnsToEdit.length) {
                    const directions = [];
                    rxnsToEdit.forEach((id) => {
                        directions.push(master.edits[id].direction.after);
                    });

                    if (prom) {
                        prom = prom.then(() => {
                            return editReactions(ws, name, rxnsToEdit, directions);
                        });
                    } else {
                        prom = editReactions(ws, name, rxnsToEdit, directions);
                    }
                }

                prom.done((res) => {
                    saveBtn.text('Save').hide();
                    //saveAsBtn.text('Save as...').hide();
                    modeling.notice(container, 'Saved as ' + name, 5000);

                    if (input.onSave) input.onSave();
                });
            }

            function addReactions(ws, name, ids) {
                return api('fba', 'adjust_model_reaction', {
                    workspace: ws,
                    model: name,
                    reaction: ids,
                    addReaction: true,
                }).fail((e) => {
                    const error = JSON.stringify(JSON.parse(e.responseText), null, 4);
                    new kbaseModal($('<div>'), {
                        title:
                            'Oh no! Something seems to have went wrong with the reactions you wanted to add' +
                            'Please contact KBase and we would be glad to help.',
                        body: '<pre>' + error + '</pre>',
                    }).show();
                });
            }

            function rmReactions(ws, name, ids) {
                return api('fba', 'adjust_model_reaction', {
                    workspace: ws,
                    model: name,
                    reaction: ids,
                    removeReaction: true,
                }).fail((e) => {
                    const error = JSON.stringify(JSON.parse(e.responseText), null, 4);
                    new kbaseModal($('<div>'), {
                        title:
                            'Oh no! Something seems to have went wrong with the reactions you wanted to remove.' +
                            'Please contact KBase and we would be glad to help.',
                        body: '<pre>' + error + '</pre>',
                    }).show();
                });
            }

            function editReactions(ws, name, ids, directions) {
                return api('fba', 'adjust_model_reaction', {
                    workspace: ws,
                    model: name,
                    reaction: ids,
                    direction: directions,
                }).fail((e) => {
                    const error = JSON.stringify(JSON.parse(e.responseText), null, 4);
                    new kbaseModal($('<div>'), {
                        title:
                            'Oh no! Something seems to have went wrong with the reactions you wanted to edit.' +
                            'Please contact KBase and we would be glad to help.',
                        body: '<pre>' + error + '</pre>',
                    }).show();
                });
            }

            return this;
        },
    }); // end KBWidget
});
