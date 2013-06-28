
(function( $, undefined ) {

$.kbWidget("kbaseWSSelector", 'kbaseWidget', {
    version: "1.0.0",
    options: {
    },
    init:  function(options) {
    this._super(options);
    var self = this;

    // arguments
    var user = {};
    user['token'] = options.userToken;
    //var state = options.state;
    var state = new State();
    var selectHandler = options.selectHandler;

    var wsHandler = new WSHandler({user: user})

    var wsRows = [],
        wsFiltRows = [],
        workspaceIdToRow = {},
        selected = [],
        lastSelectedRow = null,
        lastShiftSelect = null,
        container = this.$elem;

    wsHandler.getWorkspaces()
        .done(handleGetWorkspaces)
        .fail(handleGetWorkspacesError);

    // make public, and set it after handleGetWorkspaces is called
    self.workspaces;

    function handleGetWorkspaces(allWorkspaces) {
        // save workspaces outside of this scope
        self.workspaces = allWorkspaces;
        workspaces = self.workspaces;

        // extend the workspaces array
        extendWorkspaceArray();
        workspaces.mysort();

        // whenever the user selects one/more workspaces, call selectHandler
        self.onselect(selectHandler);

        // on document ready, append wsSelector and objectTable
        $(function() {
            $('#ws-selector-container').append('<div id="kbase-ws-selector"></div>')
            
            $('#kbase-ws-selector').append(self.getHtml());

            self.reload();
            self.resizeTable();
        });

        // add handlers for adding/removing workspaces
        workspaces.onchange(function() {
            self.reload();
        });
    }

    // should do something with this error
    function handleGetWorkspacesError(error) {
        console.log('Error: ', error);
    }


    /*
     *  Extend workspace array by adding following methods:
     *    add - add a workspace to the array
     *    remove - remove a workspace from the array
     *    replace - replace a workspace in the array
     *    onchange - add a callback function for when any of
     *               above methods is called
     */
    function extendWorkspaceArray() {
        var callback = $.Callbacks();

        workspaces.add = function(workspace) {
            workspaces.push(workspace);
            workspaces.mysort();
            callback.fire();
        };

        workspaces.remove = function(workspace) {
            var index = $.inArray(workspace, workspaces);
            workspaces.splice(index, 1);
            callback.fire();
        };

        workspaces.replace = function(workspace, newWorkspace) {
            var index = $.inArray(workspace, workspaces);
            workspaces.splice(index, 1, newWorkspace);
            callback.fire();
        };

    // special sort function, puts owned workspaces first
        workspaces.mysort = function() {
            workspaces.sort(function(a,b) {
                if (a.isOwned) {
                    if (!b.isOwned) {
                        return -1;
                    }
                } else if (b.isOwned) {
                    if (!a.isOwned) {
                        return 1;
                    }
                }

                var aId = a.id.toLowerCase();
                var bId = b.id.toLowerCase();

                if (aId < bId) {
                    return -1;
                } else if (aId === bId) {
                    return 0;
                } else {
                    return 1;
                }
            });
        };

        workspaces.onchange = function(cb) {
            callback.add(cb);
        };
    }
    
    // setup filter collapse
    filterCollapse = $(filterCollapseHtml());

    // create workspace link
    filterCollapse.find('#create-workspace').click(function(e) {
        e.stopImmediatePropagation();
        createWorkspaceModal();
        return false;
    });

    // no way to hook into collapse animation, so set interval to resize table
    // this is kind of messy...
    var resizeInt = null;
    filterCollapse.find('.collapse').on('shown', function() {
        resizeTable();
        state.set('filter-open', true);
        filterCollapse.find('.caret').removeClass().addClass('caret-up');
        filterCollapse.find('input').removeAttr('tabindex');
        window.clearInterval(resizeInt);
        resizeInt = null;
    }).on('hidden', function() {
        resizeTable();
        state.set('filter-open', false);
        filterCollapse.find('.caret-up').removeClass().addClass('caret');
        filterCollapse.find('input').attr('tabindex', '-1');
        window.clearInterval(resizeInt);
        resizeInt = null;
    }).on('show hide', function() {
        resizeInt = window.setInterval(function() {
            resizeTable();
        }, 1000 / 50); // 50 FPS
    });

    filterCollapse.find('button').click(function() {
        filterCollapse.find('.collapse').collapse('toggle');
    });

    var filterOpen = state.get('filter-open');
    if (filterOpen) {
        filterCollapse.find('.collapse').addClass('in');
    }

    var filterOwner = filterCollapse.find('#ws-filter-owner').change(filter);
    var filterAdmin = filterCollapse.find('#ws-filter-admin').change(filter);
    var filterWrite = filterCollapse.find('#ws-filter-write').change(filter);
    var filterRead  = filterCollapse.find('#ws-filter-read').change(filter);

    container.append(filterCollapse);

    var filterSearch = $('<input type="text" class="search-query" style="margin-bottom: 5px; width:100%;"\
             placeholder="Filter Workspaces">');
    container.append(filterSearch);

    filterSearch.keyup(filter);

    var prevFilter = state.get('filter');
    if (prevFilter !== null) {
        filterOwner.prop('checked', prevFilter.owner);
        filterAdmin.prop('checked', prevFilter.admin);
        filterWrite.prop('checked', prevFilter.write);
        filterRead.prop('checked', prevFilter.read);
        filterSearch.val(prevFilter.search);
    } else {
        filterOwner.prop('checked', false);
        filterAdmin.prop('checked', true);
        filterWrite.prop('checked', true);
        filterRead.prop('checked', true);
    }

    var tableDiv = $('<div id="ws-table-div" tabindex="0">');
    container.append(tableDiv);
    var table = $('<table id="ws-table" class="table table-bordered table-condensed">');
    tableDiv.append(table);

    tableDiv.click(function() {
        tableDiv.focus();
    });

    tableDiv.keydown(tableKey);
    
    var callback = $.Callbacks();

    this.getHtml = function() {
        return container;
    };

    this.onselect = function(cb) {
        callback.add(cb);

        var ws = [];
        for (var i=0; i<selected.length; i++) {
            ws.push(selected[i].getWorkspace());
        }
    };

    this.setLoaded = function(workspace) {
        var wsRow = workspaceIdToRow[workspace.id];
        if (wsRow) {
                wsRow.loaded();
        }
    };

    this.reload = reload;

    this.resizeTable = resizeTable;

    function resizeTable() {
        tableDiv.css('top', filterCollapse.outerHeight(true) + filterSearch.outerHeight(true) + 'px');
    }

    var initialized = false;
    function reload() {
        table.empty();

        var infoRow = $('<tr id="ws-info-row">');
        table.append(infoRow);
        var infoCell = $('<td>');
        infoRow.append(infoCell);

        // save selected rows
        var saveSelected = {};
        if (initialized) {
            for (var i=0; i<selected.length; i++) {
                saveSelected[selected[i].getWorkspace().id] = true;
            }
        } else {
            // load from local storage
            var ids = state.get('selected');
            if ($.type(ids) === 'array') {
                for (var i=0; i<ids.length; i++) {
                    saveSelected[ids[i]] = true;
                }
            }
        }

        workspaceIdToRow = {};
        var newSelected = [];
        var newRows = [];
        for (var i=0; i<workspaces.length; i++) {
            var workspace = workspaces[i];
            var wsRow = new WorkspaceRow(workspace);

            if (saveSelected[workspace.id]) {
                newSelected.push(wsRow);
            }

            table.append(wsRow.getHtml());
            newRows.push(wsRow);
            workspaceIdToRow[workspace.id] = wsRow;
        }

        selected = newSelected;
        wsRows = newRows;

        filter();
    }

    function select(wsRows) {
        // first unselect
        for (var i=0; i<selected.length; i++) {
            selected[i].unselect();
        }

        var ws = [],
            ids = [];
        for (var i=0; i<wsRows.length; i++) {
            var wsRow = wsRows[i];
            var workspace = wsRow.getWorkspace();
            ws.push(workspace);
            ids.push(workspace.id);
            wsRow.select();
        }

        selected = wsRows;
        state.set('selected', ids);
        callback.fire(ws);
    };

    function getRowPosition(wsRow) {
        return $.inArray(wsRow, wsFiltRows);
    }

    function getPrevious(wsRow) {
        var ind = getRowPosition(wsRow);

        if (ind > 0) {
            return wsFiltRows[ind-1];
        } else {
            return null;
        }
    }

    function getNext(wsRow) {
        var ind = getRowPosition(wsRow);

        if (ind < (wsFiltRows.length-1)) {
            return wsFiltRows[ind+1];
        } else {
            return null;
        }
    }

    function wsRowClick(e, wsRow) {
        if (e.ctrlKey || e.metaKey) {
            var ind = $.inArray(wsRow, selected);
            var newSelected = selected.slice();
            if (ind > -1) {
                // remove
                newSelected.splice(ind, 1);
            } else {
                // add
                newSelected.push(wsRow);
            }

            lastSelectedRow = wsRow;
            lastShiftSelect = null;
            select(newSelected);
        } else if (e.shiftKey) {
            if (lastSelectedRow === null) {
                lastSelectedRow = wsRow;
            }

            var i0 = getRowPosition(lastSelectedRow);
            var i1 = getRowPosition(wsRow);

            var dir;
            var last;
            if (i0 === i1) {
                dir = 'none';
                last = i0;
            } else if (i0 > i1) {
                dir = 'up';
                last = i1;
                var t = i0;
                i0 = i1;
                i1 = t;
            } else {
                dir = 'down';
                last = i1;
            }

            lastShiftSelect = {
                dir: dir,
                last: wsFiltRows[last]
            };
            
            var newSelected = [];
            for (var i=i0; i <= i1; i++) {
                newSelected.push(wsFiltRows[i]);
            }
            select(newSelected);
        } else {
            lastSelectedRow = wsRow;
            lastShiftSelect = null;
            select([wsRow]);
        }
    }

    function tableKey(e) {
        // ctrl-a: select all
        if ((e.ctrlKey || e.metaKey) && e.which == 65) {
            select(wsFiltRows);
            return false;
        }

        if (e.keyCode === 38) {         // up
            // check if we're at the top already
            if ( (lastShiftSelect ?
                  getRowPosition(lastShiftSelect.last) :
                  getRowPosition(lastSelectedRow)) === 0 ) {
                return false;
            }

            if (e.shiftKey) {
                if (lastSelectedRow === null) {
                    lastSelectedRow = wsFiltRows[wsFiltRows.length-1];
                }

                if (lastShiftSelect === null) {
                    lastShiftSelect = {
                        dir: 'none',
                        last: lastSelectedRow
                    };
                }

                var prev;
                if (lastShiftSelect.dir === 'down') {
                    prev = lastShiftSelect.last;
                } else {
                    prev = getPrevious(lastShiftSelect.last);
                }

                if (prev !== null) {
                    var newSelected = selected.slice();
                    if (getRowPosition(lastShiftSelect.last) <= getRowPosition(lastSelectedRow)) {
                        if ($.inArray(prev, newSelected) < 0) {
                            newSelected.push(prev);
                            scrollIntoView('up', prev);
                        }
                    } else if (prev === lastSelectedRow) {
                        prev = getPrevious(prev);
                        newSelected.push(prev);
                        scrollIntoView('up', prev);
                    } else {
                        newSelected.splice($.inArray(prev, newSelected), 1);
                        scrollIntoView('up', getPrevious(prev));
                    }

                    lastShiftSelect = {
                        dir: 'up',
                        last: prev
                    };

                    select(newSelected);
                    return false;
                }
            } else {
                var prev;
                if (lastSelectedRow === null) {
                    prev = wsFiltRows[wsFiltRows.length-1];
                } else if (lastShiftSelect !== null) {
                    prev = getPrevious(lastShiftSelect.last);
                } else {
                    prev = getPrevious(lastSelectedRow);
                }

                if (prev !== null) {
                    lastSelectedRow = prev;
                    lastShiftSelect = null;
                    select([prev]);
                    scrollIntoView('up', prev);
                    return false;
                }
            }
        } else if (e.keyCode === 40) {  // down
            // check if we're at the bottom already
            if ( (lastShiftSelect ?
                  getRowPosition(lastShiftSelect.last) :
                  getRowPosition(lastSelectedRow)) === (wsFiltRows.length-1) ) {

                return false;
            }

            if (e.shiftKey) {
                if (lastSelectedRow === null) {
                    lastSelectedRow = wsFiltRows[0];
                }

                if (lastShiftSelect === null) {
                    lastShiftSelect = {
                        dir: 'none',
                        last: lastSelectedRow
                    };
                }

                var next;
                if (lastShiftSelect.dir === 'up') {
                    next = lastShiftSelect.last;
                } else {
                    next = getNext(lastShiftSelect.last);
                }

                if (next !== null) {
                    var newSelected = selected.slice();
                    if (getRowPosition(lastShiftSelect.last) >= getRowPosition(lastSelectedRow)) {
                        if ($.inArray(next, newSelected) < 0) {
                            newSelected.push(next);
                            scrollIntoView('down', next);
                        }
                    } else if (next === lastSelectedRow) {
                        next = getNext(next);
                        newSelected.push(next);
                        scrollIntoView('down', next);
                    } else {
                        newSelected.splice($.inArray(next, newSelected), 1);
                        scrollIntoView('down', getNext(next));
                    }

                    lastShiftSelect = {
                        dir: 'down',
                        last: next
                    };

                    select(newSelected);
                    return false;
                }
            } else {
                var next;
                if (lastSelectedRow === null) {
                    next = wsFiltRows[0];
                } else if (lastShiftSelect !== null) {
                    next = getNext(lastShiftSelect.last);
                } else {
                    next = getNext(lastSelectedRow);
                }

                if (next !== null) {
                    lastSelectedRow = next;
                    lastShiftSelect = null;
                    select([next]);
                    scrollIntoView('down', next);
                    return false;
                }
            }
        }

        return true;
    }

    function scrollIntoView(dir, wsRow) {
        // first find out the position of the row
        var ind = $.inArray(wsRow, wsFiltRows);
        if (ind < 0) {
            return; // shouldn't happen
        }

        var height = wsRow.getHtml().height(); // assumes all rows are same height
        var start = ind * height + 1; // 1 for the border on top
        var end = start + height;

        var scrollStart = tableDiv.scrollTop();
        var scrollEnd = scrollStart + tableDiv.height();

        if (start >= scrollStart && end <= scrollEnd) {
            // completely in view, do nothing
            return;
        }

        // check if we're one off
        if (dir === 'down') {
            if (Math.abs(start - scrollEnd) <= height) {
                wsRow.getHtml().get(0).scrollIntoView(false);
                return;
            }
        } else if (dir === 'up') {
            if (Math.abs(end - scrollStart) <= height) {
                wsRow.getHtml().get(0).scrollIntoView(true);
                return;
            }
        }

        // scroll into middle of view
        tableDiv.scrollTop(start - (((scrollEnd - scrollStart) - height) / 2));
    }

    function filter() {
        var owner = filterOwner.prop('checked');
        var admin = filterAdmin.prop('checked');
        var write = filterWrite.prop('checked');
        var read  = filterRead.prop('checked');
        var search = filterSearch.val();

        state.set('filter', {
            owner: owner,
            admin: admin,
            write: write,
            read: read,
            search: search
        });

        // if there aren't any workspaces, set info cell
        if (wsRows.length === 0) {
            table.find('#ws-info-row').removeClass('hide')
                .find('td').html('no workspaces');
            return;
        }

        var searchRegex = new RegExp(search, 'i');
        wsFiltRows = [];
        for (var i=0; i<wsRows.length; i++) {
            var wsRow = wsRows[i];
            var workspace = wsRow.getWorkspace();
            var show = false;

            // filter based on permissions
            if (admin && workspace.user_permission === 'a') {
                show = true;
            }
            if (write && workspace.user_permission === 'w') {
                show = true;
            }
            if (read && workspace.user_permission === 'r') {
                show = true;
            }
            if (show && owner && !workspace.isOwned) {
                show = false;
            }

            // filter based on search
            if (show && search != '') {
                show = searchRegex.test(workspace.id);
            }

            if (show) {
                wsRow.show();
                wsFiltRows.push(wsRow);
            } else {
                var ind = $.inArray(wsRow, selected);
                if (ind > -1) {
                    wsRow.unselect();
                    selected.splice(ind, 1);
                }
                wsRow.hide();
            }
        }

        if (wsFiltRows.length === 0) {
            table.find('#ws-info-row').removeClass('hide')
                .find('td').html('no workspaces (change filters)');
        } else {
            table.find('#ws-info-row').addClass('hide');
        }

        select(selected);
    }

    function filterCollapseHtml() {
        return '' +
            '<div class="accordion" style="margin-bottom: 0px;>'
            + '<div class="accordion-group">'
            + '<div class="accordion-heading" style="text-align: center; position: relative;">'
            + '<button class="btn btn-link" title="Filter Workspaces" style="width: 100%;">'
            + 'Workspaces <span class="caret"></span>'
            + '</button>'
            + '<button id="create-workspace" class="btn btn-mini"'
            + ' style="position: absolute; right: 3px; height: 20px; top: 5px; font-size: 15px; padding: 0px 4px 2px 4px;">'
            + '+'
            + '</button>'
            + '</div>'
            + '<div id="collapseOne" class="accordion-body collapse">'
            + '<div class="accordion-inner">'
            + '<div class="pull-left" style="position: relative; margin-right: 10px; height: 75px;">'
            + '<div style="display: table; position: static; height: 100%;">'
            + '<div style="display: table-cell; vertical-align: middle; position: static">'
            + '<label class="checkbox"><input id="ws-filter-owner" type="checkbox" tabindex="-1" /> owner</label>'
            + '</div></div></div><div class="pull-left">'
            + '<label class="checkbox"><input id="ws-filter-admin" type="checkbox" tabindex="-1" /> admin</label>'
            + '<label class="checkbox"><input id="ws-filter-write" type="checkbox" tabindex="-1" /> write</label>'
            + '<label class="checkbox"><input id="ws-filter-read" type="checkbox" tabindex="-1" /> read</label>'
            + '</div><div class="clearfix"></div>'
            + '</div></div></div></div>';
    };

    function WorkspaceRow(workspace) {
        var self = this;

        var row = $('<tr class="ws-row">');
        var cell = $('<td class="ws-cell">');

        row.append(cell);

        var div = $('<div class="ws-cell-content">');
        cell.append(div);
        div.append('<span class="ws-num-objects badge">~ ' + workspace.objects + '</span>');

        div.append( workspace.isOwned
                    ? '<strong>' + workspace.id + '</strong>'
                    : workspace.id );

        // disable text selection (on the element itself)
        cell.mousedown(function() {
            return false;
        });

        cell.click(function(e) {
            wsRowClick(e, self);
        });

        // add manage button
        var manage = $('<a class="ws-cell-manage btn btn-mini btn-xmini hide"'
                       + ' style="margin-right: 2px; padding-bottom: 2px;"'
                       + ' title="Manage Workspace"><i class="icon-cog"></i></a>');

        div.append(manage);

        manage.click(function() {
            manageWorkspaceModal(workspace);
            return false;
        });

        // check if objects loaded already
        if ($.type(workspace.objectData) === 'array') {
            loaded();
        }

        /*
         * If using desktop browser (not mobile), hide the buttons
         * and show when hover. Otherwise (if mobile), always show
         */
        if ($.browser.mobile) {
            manage.removeClass('hide');
            div.addClass('ws-cell-content-hover');
        } else {
            cell.hover(function() {
                manage.removeClass('hide');
                div.addClass('ws-cell-content-hover');
            }, function() {
                manage.addClass('hide');
                div.removeClass('ws-cell-content-hover');
            });
        }

        this.getHtml = function() {
            return row;
        };

        this.select = function() {
            cell.addClass('ws-cell-selected');
        };

        this.unselect = function() {
            cell.removeClass('ws-cell-selected');
        };

        this.hide = function() {
            row.addClass('hide');
        };

        this.show = function() {
            row.removeClass('hide');
        };

        this.getWorkspace = function() {
            return workspace;
        };

        this.loaded = loaded;

        function loaded() {
            div.find('.badge')
                .addClass('badge-success')
                .html(workspace.objectData.length);
        };
    }


     // show the create workspace modal, pretty straight forward
    function createWorkspaceModal() {
        var modal = new Modal();

        modal.setTitle('Create Workspace');

        modal.setContent(
            '<table style="margin-left: auto; margin-right: auto; text-align: right;">'
              + '<tr><td>Workspace Id:</td>'
              + '<td><input type="text" id="create-id" style="width: 150px" /></td></tr>'
              + '<tr><td>Global Permission:</td>'
              + '<td>' + createPermissionSelect('create-permission', 'n')
              + '</td></tr></table>'
        );

        $('#create-permission').css({
            width: '164px'
        });

        // set events
        modal.on('hidden', function() {
            modal.delete();
        });

        $('#create-id').keypress(function(e) {
            if (e.which == 13) {
                modal.submit();
            }
        });

        modal.setButtons('Cancel', 'Create');

        modal.on('submit', function() {
            createWorkspace(modal);
        });

        modal.show();

        // focus on id input
        $('#create-id').focus();
    }

    // special Modal object used for the various modals
    function Modal() {
        var self = this;

        var modal = baseModal.clone();
        $('body').append(modal);

        // prevent hiding modal when locked
        var isLocked = false;
        modal.on('hide', function(e) {
            if (isLocked) {
                e.stopImmediatePropagation();
                return false;
            } else {
                return true;
            }
        });

        // test alert types
        var alertRegex = /error|warning|info|success/;

        // set submit click listener, fire 'submit' event on modal
        var btns = modal.find('.modal-footer').find('button');
        btns.eq(1).click(function() {
            modal.trigger('submit');
        });

        this.setTitle = function(title) {
            modal.find('.modal-header').find('h3').html(title);
        };

        this.setContent = function(content) {
            modal.find('.modal-body')
                .empty()
                .append(content);
        };

        // pass in null to remove button
        // note: currently cannot add button back after removing
        this.setButtons = function(cancel, submit) {
            if (cancel === null) {
                btns.eq(0).remove();
            } else if (typeof(cancel) === 'string') {
                btns.eq(0).html(cancel);
            }

            if (submit === null) {
                btns.eq(1).remove();
            } else if (typeof(submit) === 'string') {
                btns.eq(1).html(submit);
            }
        };

        this.on = function() {
            modal.on.apply(modal, arguments);
        };

        this.off = function() {
            modal.off.apply(modal, arguments);
        };

        this.show = function(options, width) {
            if (!options) {
                options = {
                    backdrop: 'static'
                };
            }

            modal.modal(options);
            this.setWidth(width);

            modal.find('.modal-body').css({
                'padding': '0px 15px',
                'margin': '15px 0px'
            });
        };

        this.hide = function() {
            modal.modal('hide');
        };

        this.delete = function() {
            modal.modal('hide');
            modal.remove();
        };

        this.lock = function() {
            isLocked = true;

            modal.find('.modal-header').find('button').prop('disabled', true);
            btns.prop('disabled', true);
        };

        this.unlock = function() {
            isLocked = false;

            modal.find('.modal-header').find('button').prop('disabled', false);
            btns.prop('disabled', false);
        };

        this.cover = function(content) {
            modal.find('.base-modal-cover-box')
                .removeClass()
                .addClass('base-modal-cover-box base-modal-cover-content')
                .empty()
                .append(content);

            modal.find('.modal-body')
                .fadeTo(0, .3);

            modal.find('.base-modal-cover')
                .height(modal.find('.modal-body').outerHeight())
                .width(modal.find('.modal-body').outerWidth())
                .removeClass('hide');
        };

        this.uncover = function() {
            modal.find('.base-modal-cover')
                .addClass('hide');;

            modal.find('.modal-body')
                .fadeTo(0, 1);
        };

        this.alert = function(message, type) {
            type = (alertRegex.test(type) ? 'alert-' + type : '');

            modal.find('.base-modal-alert')
                .removeClass('hide alert-error alert-info alert-success')
                .addClass(type)
                .empty()
                .append(message);
        };

        this.alertHide = function() {
            modal.find('.base-modal-alert')
                .addClass('hide');
        };

        this.coverAlert = function(message, type) {
            type = (alertRegex.test(type) ? 'alert-' + type : '');

            this.cover(message);

            modal.find('.base-modal-cover-box')
                .removeClass()
                .addClass('base-modal-cover-box alert ' + type);
        };

        this.coverAlertHide = function() {
            this.uncover();
        };

        this.focus = function() {
            modal.focus();
        };

        this.setWidth = function(width) {
            modal.css({
                width: function() {
                    return (width ? width : $(this).width());
                },
                'margin-left': function () {
                    return -($(this).width() / 2);
                }
            });
        };

        // currently only used to fire event, not for adding events
        this.submit = function() {
            modal.trigger('submit');
        };
    }    

    var baseModal = $(
        '<div class="modal base-modal hide" style="width: auto;" tabindex="-1" role="dialog"> \
           <div class="modal-header"> \
             <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button> \
             <h3>Modal</h3> \
           </div> \
           <div class="alert base-modal-alert hide"></div> \
           <div class="base-modal-cover hide"> \
             <div class="base-modal-cover-table"> \
               <div class="base-modal-cover-cell"> \
                 <span class="base-modal-cover-box"> \
                 </span> \
               </div> \
             </div> \
           </div> \
           <div class="modal-body"></div> \
           <div class="modal-footer"> \
             <button data-dismiss="modal" class="btn">Cancel</button> \
             <button class="btn btn-primary">Submit</button> \
           </div> \
         </div>'
    );

    function createPermissionSelect(id, value, noNone) {
        var sel = ' selected="selected"';
        var idval = ' id="' + id + '"';

        return '<select' + (id ? idval : '') + ' class="input-small"'
            + ' style="margin: 0px;" data-value="' + value + '">'
            + (noNone ? '' : '<option value="n"' + (value === 'n' ? sel : '') + '>none</option>')
            + '<option value="r"' + (value === 'r' ? sel : '') + '>read</option>'
            + '<option value="w"' + (value === 'w' ? sel : '') + '>write</option>'
            + '<option value="a"' + (value === 'a' ? sel : '') + '>admin</option>'
            + '</select>';
    }

    function permToReadable(value) {
        var map = {
            n: 'none',
            r: 'read',
            w: 'write',
            a: 'admin'
        };

        return map[value];
    }

    // show the manage workspace modal, pretty straight forward
    function manageWorkspaceModal(workspace) {
        var modal = new Modal();

        modal.setTitle('Manage Workspace');
        modal.show(null, '350px');

        // first check if we need to load permission data
        if ( (workspace.isOwned || workspace.user_permission === 'a')
             && $.type(workspace.permissions) === 'undefined' ) {

            // disable cancelling for now
            modal.lock();
            modal.setContent(
                '<div style="height: 250px; text-align: center; margin-top: 30px;">'
                    + '<img src="img/loading.gif" /><br />Loading...'
                    + '</div>'
            );

            workspace.getPermissions().done(function() {
                populateModal();
                modal.unlock();
            });
        } else {
            populateModal();
        }
        
        function populateModal() {
            var container = $('<div class="manage-workspace">');
            var table = $('<table class="table table-bordered table-condensed">');
            container.append(table);
            modal.setContent(container);

            var perm;
            if (workspace.isOwned || workspace.user_permission === 'a') {
                perm = createPermissionSelect( 'global-perm',
                                               workspace.global_permission );
            } else {
                perm = permToReadable(workspace.global_permission);
            }

            var data = [
                ['Id', workspace.id],
                ['Objects', ($.type(workspace.objectData) === 'array' ?
                             workspace.objectData.length :
                             '~ ' + workspace.objects) ],
                ['Owner', workspace.owner],
                ['Permission', permToReadable(workspace.user_permission)],
                ['Global Permission', perm]
            ];

            for (var i=0; i<data.length; i++) {
                var row = $('<tr>');
                row.append(
                    '<td class="manage-modal-attribute"><strong>' + data[i][0] + '</strong></td>'
                        + '<td class="manage-modal-value">' + data[i][1] + '</td>');
                table.append(row);
            }

        // show the user permissions
            if (workspace.isOwned || workspace.user_permission === 'a') {
                var perms = [];
                $.each(workspace.permissions, function(user, perm) {
                    if (perm !== 'n') {
                        perms.push([user, perm]);
                    }
                });

                var userTable = $('<table class="table table-bordered table-condensed">');
                var noPermRow = $('<tr><td colspan="3" style="text-align: center;">None</td></tr>');
                userTable.append(noPermRow);

                if (perms.length > 0) {
                    noPermRow.addClass('hide');
                    for (var i=0; i<perms.length; i++) {
                        var perm = perms[i];
                        userTable.append(
                            '<tr class="manage-existing-perm"><td style="width: 100%">' + perm[0] + '</td>'
                                + '<td>' + createPermissionSelect(null, perm[1], true) + '</td>'
                                + '<td style="vertical-align: middle;">'
                                + '<button type="button" class="close" aria-hidden="true">&times;</button>'
                                + '</td></tr>'
                        );
                    }
                }

                var addPerm = $('<button class="btn btn-link">(add)</button>');
                addPerm.click(function() {
                    noPermRow.addClass('hide');

                    userTable.append(
                        '<tr class="manage-new-perm"><td>'
                            + '<input type="text" class="input-medium" style="margin: 0px;" placeholder="username" />'
                            + '</td><td>' + createPermissionSelect(null, null, true) + '</td>'
                            + '<td style="vertical-align: middle;">'
                            + '<button type="button" class="close" aria-hidden="true">&times;</button>'
                            + '</td></tr>'
                    );

                    var inputs = userTable.find('input');
                    inputs.eq(inputs.length - 1).focus().keypress(function(e) {
                        if (e.which == 13) {
                            modal.submit();
                        }
                    });
                });

                userTable.on('click', '.close', function() {
                    $(this).parent().parent().remove();

                    if (userTable.find('tr').length === 1) {
                        noPermRow.removeClass('hide');
                    }
                });

                var title = $('<div>User Permissions </div>');
                title.append(addPerm);

                container.append(title);
                container.append(userTable);
            }

            // set events
            modal.on('hidden', function() {
                modal.delete();
            });

            var clone = $('<button class="btn btn-link">Clone</button>');
            clone.click(function() {
                cloneWorkspace(workspace, modal);
            });
 
            // only the workspace owner can delete
            if (workspace.isOwned) {
                var del = $('<button class="btn btn-link">Delete</button>');
                del.click(function() {
                    deleteWorkspace(workspace, modal);
                });

                var left = $('<div class="pull-left"></div>');
                    left.append(clone);
                var right = $('<div class="pull-right"></div>');
                right.append(del);

                container.append(left)
                    .append(right)
                    .append('<div class="clearfix"></div>');
            } else {
                container.append(clone);
            }

            if (workspace.isOwned || workspace.user_permission === 'a') {
                modal.setButtons('Cancel', 'Save');
                modal.on('submit', function() {
                    manageWorkspaceSave(workspace, modal);
                });
            } else {
                // remove cancel and change submit to close
                modal.setButtons(null, 'Close');
                modal.on('submit', function() {
                    modal.hide();
                });
            }

            modal.setWidth((container.outerWidth()+60) + 'px');
        }
    }


    function createWorkspace(modal) {
        var workspaceId = $('#create-id').val();

        // check for empty workspace id
        if (workspaceId === '') {
            modal.alert('Must enter a workspace id', 'error');
            $('#create-id').focus();
            return;
        }

        // validate workspace id
        if (! validateString(workspaceId)) {
            modal.alert('Invalid workspace id<br />(alphanumeric characters only)', 'error');
            $('#create-id').focus().select();
            return;
        }

        // get the permission
        var perm = $('#create-permission').find('option').filter(':selected').attr('value');

        // disable the alert while we try and create the workspace
        modal.alertHide();
        modal.lock();
        modal.cover('<img src="img/loading.gif" />');

        // remove focus and prevent tabbing to input and select
        modal.focus();
        $('.modal-body').find('input,select').attr('tabindex', '-1');

        // actually create the workspace
        wsHandler.createWorkspace(workspaceId, perm).done(function(newWorkspace) {
            newWorkspace.objectData = [];

            modal.coverAlert('<strong>Success</strong><br />Created workspace \''
                             + workspaceId + '\'</div>', 'success');

            // change buttons
            modal.setButtons(null, 'Close');

            modal.off('submit');
            modal.on('submit', function() {
                modal.hide();
            });

            // on hidden, add the new workspace to the workspace table
            modal.on('hidden', function() {
                workspaces.add(newWorkspace);
            });
        }).fail(function() {
            // for now assume the id was taken
            modal.alert('Workspace already in use, please try again', 'error');
            modal.uncover();
            $('#create-id').focus().select();
        }).always(function() {
            modal.unlock();
        });

        return;
    }

    var stringRegex = /^[a-zA-Z0-9_]+$/;
    function validateString(id) {
        return stringRegex.test(id);
    }    


    function State() {
        // Adapted from here: http://diveintohtml5.info/storage.html
        var ls;
        try {
            ls = 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            ls = false;
        }

        //var user = (auth.isLoggedIn() ? auth.getUserData().user_id : 'public');

        this.get = function(key) {
            if (!ls) {
                return null;
            }

            //key = user + '.' + key;

            var val = localStorage.getItem(key);

            try {
                val = JSON.parse(val);
            } catch(e) {
                return null;
            };

            return val;
        };

        this.set = function(key, val) {
            if (!ls) {
                return null;
            }

            //key = user + '.' + key;
            
            try {
                val = JSON.stringify(val);
            } catch(e) {
                return null;
            }

            return localStorage.setItem(key, val);
        };
    }

    return this;
    } // close init
})

}( jQuery ) );
