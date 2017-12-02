/**
 * A widget for displaying some toggleable object info in a single div. This should communicate
 * with a parent widget to optionally trigger changes. E.g., selecting a different version of
 * an object to view should trigger that update in the controlling parent.
 */
define([
    'jquery',
    'kbwidget',
    'kb_service/client/workspace',
    'common/runtime'
], function(
    $,
    KBWidget,
    Workspace,
    Runtime
) {
    'use strict';

    return KBWidget({
        name: 'objectCellHeader',
        options: {
            upas: {}
        },
        objectInfo: {},

        init: function(options) {
            this._super(options);
            var runtime = Runtime.make();
            this.workspace = new Workspace(runtime.config('services.workspace.url'), {
                token: runtime.authToken()
            });
            this.fetchObjectInfo();
        },

        /**
         * Fetches general info about all UPAs in options.upas.
         * Stores this info in a map from upa->info (this.objectInfo)
         */
        fetchObjectInfo: function() {
            // parse upas dict into a list.
            var self = this;
            self.objectInfo = {};
            Object.keys(self.options.upas).forEach(function(key) {
                var upa = self.options.upas[key];
                if (typeof upa === 'string') {
                    self.objectInfo[upa] = null;
                }
                else if (Array.isArray(upa)) {
                    upa.forEach(function(subUpa) {
                        self.options.upas[subUpa] = null;
                    });
                }
            });

            // prep workspace call.
            var wsInfoCall = [];
            Object.keys(self.objectInfo).forEach(function(upa) {
                wsInfoCall.push({'ref': upa});
            });

            // do ws call.
            self.workspace.get_object_info_new({'objects': wsInfoCall})
                .then(function(infos) {
                    wsInfoCall.forEach(function(upaRef, idx) {
                        self.objectInfo[upaRef.ref] = infos[idx];
                    });
                })
                .then(function() {
                    self.render();
                });

            // done!
        },

        render: function() {
            this.$elem.append('i am a header! my upas are ' + JSON.stringify(this.options.upas));
            this.$elem.append('<br>');
            this.$elem.append('also: <br>');
            this.$elem.append(JSON.stringify(this.objectInfo));
        }
    });

});
