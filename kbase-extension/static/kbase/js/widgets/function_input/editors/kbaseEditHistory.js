/**
 *	kbaseEditHistory.js
 *
 *  @author nconrad <nconrad@anl.gov>
 *
 *  Object for managing edit history on client.
 *  - Keeps a history of operations that can be fetched with EditHistory.getHistory()
 *  - Keeps a master set of added, removed, and edited that can be fetched with EditHistory.getMaster()
 *  - The master copy is based on IDs.  Ids are assumed to be unique.
 *  - Works on the operations "add", "rm", and "edit", where unique ids are provided
 *
 *  To add an operation, use EditHistory.add(operation), where
 *  - "add" op is of form:
 *    	{op: 'add', ids: ['unique_id', ... ], data: [Object object]}
 *  - "rm" op is of form:
 *    	{op: 'rm', ids: ['unique_id', ... ], data: [Object object]}
 *  - "edit" op is of the following form:
 *      {
 *          op: 'edit',
 *          id: ['unique_id',..]
 *          kind: 'kind_of_edit',
 *          before: 'data before',
 *          after: 'data after',
 *      }
 *
 */

define([], function() {

    function EditHistory() {
        var ops = [];

        // master copy
        var added = {};
        var removed = {};
        var edits = {};  // has form {<id>: {<kind>: {before: <before>, after: <after>}}}

        this.add = function(newOp) {
            ops.push(newOp);

            if (newOp.op === 'add') {
                newOp.ids.forEach(function(id, i) {
                    added[id] = newOp.data[i];

                    // remove any removed ids in master
                    if (id in removed) delete removed[id];
                })
            } else if (newOp.op === 'rm') {
                newOp.ids.forEach(function(id, i) {
                    removed[id] = newOp.data[i];

                    // remove any edited ids or added ids from master
                    if (id in edits) delete edits[id];
                    if (id in added) delete added[id];
                })
            } else if (newOp.op === 'edit') {
                // for all ids in edit, if edit already exists,
                // replace with latest edit.  if not, add edit.
                newOp.ids.forEach(function(id) {
                    if ( !(id in edits) ) edits[id] = {};

                    // if this type of edit is already there, use same "before" and new "after"
                    if (newOp.kind in edits[id])
                        edits[id][newOp.kind] = {before: edits[id][newOp.kind].before, after: newOp.after};
                    else
                        edits[id][newOp.kind] = {before: newOp.before, after: newOp.after};

                    // remove any added ids from master
                    if (id in added) delete added[id];
                })
            }
        }


        this.count = function() {
            return ops.length;
        }

        this.getHistory = function() {
            return ops;
        }

        this.clearAll = function() {
            ops = [];
            master = {};
        }

        this.getMaster = function() {
            return {
                 added: added,
                 removed: removed,
                 edits: edits
            };
        }
    }

    return EditHistory;
})
