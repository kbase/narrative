/**
 *	kbaseMediaEditor.js (kbaseMediaEditor)
 *
 *	Given a pair of workspace and media object names or ids,
 *	produce an editable media table.
 *
 *  Notes:
 *  	to be refactored to use an editor widget.
 *
 *  Optional params
 *  	onSave (function): called after data has been saved
 *
 * 	@author nconrad <nconrad@anl.gov>
 *
 */


 define([
    'jquery',
    'ModelingAPI',
    'kbwidget',
    'kbaseAuthenticatedWidget',
    'kbaseModal'
],
function($, ModelingAPI) {


'use strict';

$.KBWidget({
    name: "kbaseMediaEditor",
    parent: "kbaseAuthenticatedWidget",
    version: "1.0.0",
    options: {},
    init: function(input) {
        this._super(input);
        var self = this,
            container = $('<div class="kb-editor">');

        self.$elem.append(container);


        var modeling = new ModelingAPI( self.authToken() ),
            kbapi = modeling.api,
            biochem = modeling.biochem,
            getCpds = modeling.getCpds;

        // accept either workspace/object names or workspace/object ids
        var wsName = input.ws,
            objName = input.obj;

        if (isNaN(wsName) && isNaN(objName) )
            var param = {workspace: wsName, name: objName};
        else if (!isNaN(wsName) && !isNaN(objName) )
            var param = {ref: wsName+'/'+objName};
        else {
            self.$elem.append('kbaseMediaEditor arguments are invalid: ', JSON.stringify(input));
            return this;
        }

        var table, // main table to be rendered
            media, // actual media data
            rawData;  // raw workspace object

        // some controls for the table
        var saveBtn = $('<button class="btn btn-primary edit-btn pull-right hide">'+
                        'Save</button>');
        var saveAsBtn = $('<button class="btn btn-primary edit-btn pull-right hide">'+
                        'Save as...</button>');
        var addBtn = $('<button class="btn btn-primary pull-right">'+
                       '<i class="fa fa-plus"></i> Add compounds...</button>');
        var rmBtn = $('<button class="btn btn-danger pull-right hide">');
        var undoBtn = $('<button class="btn btn-danger edit-btn pull-right hide">'+
                            '<i class="fa fa-undo"></i>'+
                        '</button>');

        // keep track of edits
        var _editHistory = new EditHistory();

        // get media data
        container.loading();
        kbapi('ws', 'get_objects', [param])
            .done(function(res){
                console.log('get media res:', res)
                rawData = $.extend(true, {}, res[0]);
                console.log('raw media data', rawData)

                media = sanitizeMedia(res[0].data.mediacompounds);

                // get cpd names from biochem, add to media data
                // and render table
                var ids = getCpdIds(media);
                console.log('ids', ids)
                getCpds(ids, {select: ['name', 'id']} )
                    .then(function(objs) {
                        for (var i=0; i<objs.length; i++) {
                            media[i].name = objs[i].name;
                        }

                        renderTable(media);
                        container.rmLoading();
                    })
            })

        // renders table, any associated controls, and events
        function renderTable(data) {
            table = $('<table class="table table-bordered table-striped'+
                ' kb-editor-table" style="width: 100% !important;">')
            container.append(table);

            table = table.DataTable({
                data: data,
                order: [[ 2, "asc" ]],
                dom: '<"top col-sm-8 controls"l><"top col-sm-4"f>rt<"bottom"ip><"clear">',
                columns: [
                    { orderable: false, data: function(row) {
                        return '<i class="fa fa-square-o"></i>';
                    } },
                    { title: "Name", data: 'name'},
                    { title: "Compound", data: 'id'},
                    { title: "Concentration", data: 'concentration', className: 'editable'},
                    { title: "Max Flux", data: 'maxFlux', className: 'editable'},
                    { title: "Min Flux", data: 'minFlux', className: 'editable'}
                ]
            })

            // add controls
            var controls = container.find('.controls');

            //controls.append(undoBtn); // fixme!
            controls.append(saveAsBtn);
            controls.append(saveBtn);
            controls.append(addBtn);
            controls.append(rmBtn);

            addBtn.on('click', cpdModal);
            saveBtn.on('click', function() { saveData(getTableData(), wsName, objName) });
            saveAsBtn.on('click', saveModal);
            rmBtn.on('click', function() {
                // get all selected data
                var data = getTableData('.row-select');

                // edit table
                var op = {op: 'rm', data: data};
                editTable(op);
                modeling.notice(container, 'Removed '+data.length+' compounds');

                $(this).addClass('hide');
                addBtn.removeClass('hide');
            })

            undoBtn.on('click', function() {
                console.log('undo!')
                var op = _editHistory.popOp();
            });

            // event for clicking on table row
            table.on('click', 'tbody tr td:first-child', function() {
                $(this).parent().toggleClass('row-select');

                var count = table.rows('.row-select').data().length;

                if (count > 0){
                    addBtn.addClass('hide');
                    rmBtn.html('<i class="fa fa-minus"></i> '+
                        'Remove '+count+' compounds')
                    rmBtn.removeClass('hide');
                } else {
                    rmBtn.addClass('hide');
                    addBtn.removeClass('hide');
                }
            });

            // event for clickingon editable cells
            table.on('click', '.editable', function(e) {
                $(this).attr('contentEditable', true);
                $(this).addClass('editing-focus');
                $(this).focus();
            })

            table.on('blur', 'td.editable', function(){
                var before = table.cell(this).data(),
                    after = $(this).text();

                // fixme: add better validation and error handling
                after = parseFloat(after);
                if (before === after) return;

                // set data in datable memory
                table.cell( this ).data(after).draw()

                // save in history
                var op = {op: 'modify', before: before, after: after};
                editTable(op)
            })

            // emit blur on enter as well
            table.on('keydown', 'td.editable', function(e) {
                if(e.keyCode == 13) {
                    e.preventDefault();
                    $(this).blur();
                }
            })
        }

        // takes media data, adds id key/value, and sorts it.
        function sanitizeMedia(media) {
            var i = media.length;
            while (i--) {
                media[i].id = media[i].compound_ref.split('/').pop();
            }
            return media.sort(function(a, b) {
                if (a.id < b.id) return -1;
                if (a.id > b.id) return 1;
                return 0;
            })
        }

        function getCpdIds(media) {
            console.log('media', media)
            var ids = [];
            for (var i=0; i<media.length; i++) {
                ids.push(media[i].id )
            }
            return ids;
        }


        function cpdModal() {
            var table = $('<table class="table table-bordered table-striped kb-editor-table'+
                ' " style="width: 100% !important;">');

            var modal = $('<div>').kbaseModal({
                title: 'Add Compounds',
                subText: 'Select compounds below, then click "add".',
                body: table,
                width: '60%'
            })

            var table = table.DataTable({
                processing: true,
                serverSide: true,
                orderMulti: false,
                order: [[ 2, "asc" ]],
                ajax: function (opts, callback, settings) {
                    biochem('compounds', opts,
                        ['name', 'id', 'mass', 'deltag', 'deltagerr']
                    ).done(function(res){
                        var data = {
                            data: res.docs,
                            recordsFiltered: res.numFound,
                            recordsTotal: 27693
                        }
                        callback(data);
                    })
                },
                dom: '<"top col-sm-6 controls"l><"top col-sm-6"f>rt<"bottom"ip><"clear">',
                columns: [
                    { orderable: false, data: function(row) {
                        return '<i class="fa fa-square-o"></i>';
                    } },
                    { title: "Name", data: 'name'},
                    { title: "Compound", data: 'id'},
                    { title: "Mass", data: 'mass', defaultContent: '-'},
                    { title: "DeltaG", data: 'deltag', defaultContent: '-'},
                    { title: "DeltaG error", data: 'deltagerr', defaultContent: '-'}
                ],
                rowCallback: function( row, data, index ) {
                    if ( selectedRows.isSelected(data.id) )
                        $(row).addClass('row-select');
                }
            })

            // biochem table controls
            var controls = modal.body().find('.controls');
            var addBtn = $('<button class="btn btn-primary pull-right hide">');
            controls.append(addBtn);

            var selectedRows = new SelectedRows();

            // biochem table events
            table.on('click', 'tbody tr', function() {
                $(this).toggleClass('row-select');

                var data = table.rows( this ).data()[0];

                if ($(this).hasClass('row-select'))
                    selectedRows.add(data);
                else
                    selectedRows.rm(data.id);

                if (selectedRows.count() > 0){
                    addBtn.html('<i class="fa fa-plus"></i> Add ('+selectedRows.count()+')');
                    addBtn.removeClass('hide');
                } else {
                    addBtn.addClass('hide');
                }
            });

            // add compounds on click, hide dialog, give notice
            addBtn.on('click' , function() {
                var data = setCpdDefaults( selectedRows.getSelected() ),
                    op = {op: 'add', data: data};
                editTable(op);
                modal.hide();
                modeling.notice(container, 'Added '+data.length+' compounds')
            })

            modal.show();
        }

        function saveModal() {
            var name = objName // +'-edited';  save as same name by default.
            var input = $('<input type="text" class="form-control" placeholder="my-media-name">'),
                form = $('<div class="form-group">'+
                            '<div class="col-sm-10"></div>' +
                          '</div>');

            input.val(name);
            form.find('div').append(input);

            var modal = $('<div>').kbaseModal({
                title: 'Save Media As...',
                body: form,
                buttons: [{
                    text: 'Cancel'
                }, {
                    text: 'Save',
                    kind: 'primary'
                }]
            })

            modal.button('Save').on('click', function() {
                saveData(getTableData(), wsName, input.val())
            })

            modal.show();
        }

        // function to edit table, store history, and rerender
        function editTable(operation) {
            _editHistory.add(operation);

            container.find('.edit-btn').removeClass('hide');

            if (operation.op === 'modify') {
                return;
            } else if (operation.op === 'add') {
                table.rows.add( operation.data ).draw();
            } else if (operation.op === 'rm') {
                table.rows( '.row-select' )
                     .remove()
                     .draw();
            }
        }

        // object for selected rows.
        // only used for biochem search engine table.
        function SelectedRows() {
            var rows = [];

            this.add = function(row) {
                rows.push(row);
            }

            this.rm = function(id) {
                var i = id.length;
                for (var i=0; i<rows.length; i++) {
                    if (rows[i].id === id) {
                        rows.splice(i, 1);
                        return;
                    }
                }
            }

            this.isSelected = function(id) {
                for (var i=0; i<rows.length; i++) {
                    if (rows[i].id === id) return true;
                }
                return false;
            }

            this.count = function() {
                return rows.length;
            }

            this.getSelected = function() {
                return rows;
            }

            this.clearAll = function() {
                rows = [];
            }
        }

        // object for managing edit history
        function EditHistory() {
            var ops = [];

            this.add = function(row) {
                ops.push(row);
                console.log('op:', ops)
            }

            this.count = function() {
                return ops.length;
            }

            this.getHistory = function() {
                return ops;
            }

            this.popOp = function() {
                console.log('old ops', ops)
                var lastOp = ops.pop();
                console.log('new ops', ops)
                return lastOp;
            }

            this.clearAll = function() {
                ops = [];
            }
        }

        // takes list of cpd info, sets defaults and returns
        // list of cpd objects.
        function setCpdDefaults(cpds) {
            // if not new media, use the same ref
            var ref = media[0].compound_ref.split('/');
            var defaultRef = media.length ?
                ref.slice(0, ref.length-1).join('/')+'/' : '489/6/1/compounds/id/';

            var newCpds = [];
            for (var i=0; i<cpds.length; i++) {
                var cpd = cpds[i];

                newCpds.push({
                    concentration: 0.001,
                    minFlux: -100,
                    maxFlux: 100,
                    id: cpd.id,
                    compound_ref: defaultRef+cpd.id,
                    name: cpd.name
                })
            }

            return newCpds;
        }


        // takes optional selector, returns list of
        // data from datatables (instead of api object)
        function getTableData(selector) {
            var d = selector ? table.rows( selector ).data() : table.rows().data();

            var data = [];
            for (var i=0; i<d.length; i++) {
                data.push(d[i]);
            }
            return data;
        }

        // function to save data,
        function saveData(data, ws, name) {
            // don't remove name since it may not be in old objects
            //for (var i=0; i<data.length; i++) {
            //    delete data[i]['name'];
            //}
            rawData.data.mediacompounds = data;

            saveBtn.text('saving...');
            kbapi('ws', 'save_objects', {
                workspace: wsName,
                objects: [{
                    type: 'KBaseBiochem.Media',
                    data: rawData.data,
                    name: name,
                    meta: rawData.info[10]
                }]
            }).done(function(res) {
                saveBtn.text('Save')
                saveAsBtn.text('Save as...')
                container.find('.edit-btn').toggleClass('hide');
                modeling.notice(container, 'Saved as '+name, 5000);
                if (input.onSave) input.onSave()
            }).fail(function(e) {
                var error = JSON.stringify(JSON.parse(e.responseText), null,4);
                $('<div>').kbaseModal({
                    title: 'Oh no! Something seems to have went wrong',
                    body: '<pre>'+error+'</pre>'
                }).show();
            })
        }

        return this;
    }
}) // end of KBWidget

})
