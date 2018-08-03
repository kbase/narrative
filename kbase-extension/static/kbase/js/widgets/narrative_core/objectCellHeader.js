/**
 * A widget for displaying some toggleable object info in a single div. This should communicate
 * with a parent widget to optionally trigger changes. E.g., selecting a different version of
 * an object to view should trigger that update in the controlling parent.
 */
define([
    'jquery',
    'bluebird',
    'kbwidget',
    'kb_service/client/workspace',
    'common/runtime',
    'util/timeFormat'
], function(
    $,
    Promise,
    KBWidget,
    Workspace,
    Runtime,
    TimeFormat
) {
    'use strict';

    return KBWidget({
        name: 'objectCellHeader',
        options: {
            upas: {},   // key = some id string, value = either string (single upa) or array (many)
            versionCallback: null,
            primaryUpaId: null // main key in the upas object
        },
        objectInfo: {},

        init: function(options) {
            options.upas = options.upas || {};
            this._super(options);
            var runtime = Runtime.make();
            this.workspace = new Workspace(runtime.config('services.workspace.url'), {
                token: runtime.authToken()
            });
            this.fetchObjectInfo();
        },

        updateUpas: function(upas) {
            this.options.upas = upas;
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
                    self.objectInfo[upa] = {};
                }
                else if (Array.isArray(upa)) {
                    upa.forEach(function(subUpa) {
                        self.options.upas[subUpa] = {};
                        self.objectInfo[subUpa] = {};
                    });
                }
            });

            // prep workspace call.
            var wsInfoCall = [];
            Object.keys(self.objectInfo).forEach(function(upa) {
                wsInfoCall.push({'ref': upa});
            });

            var allPromises = [];
            // do ws call.
            var objInfoProm = self.workspace.get_object_info_new({'objects': wsInfoCall})
                .then(function(infos) {
                    wsInfoCall.forEach(function(upaRef, idx) {
                        self.objectInfo[upaRef.ref].info = infos[idx];
                    });
                });
            allPromises.push(objInfoProm);

            wsInfoCall.forEach(function(upaRef) {
                if (upaRef.ref.indexOf(';') === -1) {
                    var histPromise = self.workspace.get_object_history(upaRef)
                        .then(function(history) {
                            self.objectInfo[upaRef.ref].history = history;
                        });
                    allPromises.push(histPromise);
                }
            });
            Promise.all(allPromises)
                .then(function() {
                    self.render();
                })
                .catch(function(error) {
                    // console.error(error);
                });
        },

        buildObjectInfo: function(upa) {
            var $info = $('<div>');
            if (!this.objectInfo[upa]) {
                return $info;
            }
            var objInfo = this.objectInfo[upa].info;

            var addField = function(key, value) {
                $info.append($('<div><span>' + key + '</span>: <span>' + value + '</span></div>'));
            };

            // var keys = ['id', 'name', 'type', 'saved', 'version', 'owner', 'wsid', 'wsname', 'checksum', 'size', 'metadata'];
            // var keyIds = [1, 2, 3, ]
            // permanent id <link to LP>
            // name
            // type
            // version
            // saved <date> by <user>
            // size?

            addField('Permanent id', upa);
            addField('Name', objInfo[1]);
            addField('Type', objInfo[2]);
            addField('Version', objInfo[4]);
            addField('Saved', TimeFormat.readableTimestamp(objInfo[3]) + ' by ' + objInfo[5]);
            // addField('Size', StringUtil.readableBytes(objInfo[9]));

            return $info;
        },

        buildVersionToggle: function(upaId) {
            var upa = this.options.upas[upaId];
            if (!upa || !this.objectInfo[upa] || !this.objectInfo[upa].history) {
                return $('<div>Other object versions unavailable!</div>');
            }
            var $versions = $('<div>');
            var curVersion = this.objectInfo[upa].info[4];
            var totalVersions = this.objectInfo[upa].history.length;
            $versions.append('<div>version ' + curVersion + ' of ' + totalVersions + '</div>');

            var $backBtn = $('<button>')
                .addClass('btn btn-default kb-data-obj disabled')
                .append($('<span>').addClass('fa fa-arrow-left'))
                .click(function() {
                    // move back version
                    if (curVersion > 1) {
                        this.options.versionCallback(upaId, curVersion-1);
                    }
                }.bind(this));
            if (curVersion > 1) {
                $backBtn.removeClass('disabled');
            }

            var $fwdBtn = $('<button>')
                .addClass('btn btn-default kb-data-obj disabled')
                .append($('<span>').addClass('fa fa-arrow-right'))
                .click(function() {
                    if (curVersion < totalVersions) {
                        this.options.versionCallback(upaId, curVersion+1);
                    }
                }.bind(this));
            if (curVersion < totalVersions) {
                $fwdBtn.removeClass('disabled');
            }

            $versions.append(
                $('<div>').append($fwdBtn).append($backBtn)
            );
            return $versions;
        },

        detach: function() {
            // remove events from buttons.
            this.$elem.find('button').off('click');
        },

        render: function() {
            var mainUpa = null,
                mainUpaId = null,
                numUpas = Object.keys(this.objectInfo).length;
            if (this.options.primaryUpaId) {
                mainUpaId = this.options.primaryUpaId;
            } else if (numUpas === 1) {
                mainUpaId = Object.keys(this.options.upas)[0];
            }
            mainUpa = this.options.upas[mainUpaId];
            var $body = $('<div style="display:flex; flex-direction:row; justify-content: space-between">'),
                $info;
            if (mainUpa) {
                $info = this.buildObjectInfo(mainUpa);
            }
            else {
                $info = $('<div>Lots of info available for ' + numUpas + ' object on display!</div>');
            }

            var $versionToggle = this.buildVersionToggle(mainUpaId);

            $body.append($info)
                .append($versionToggle);
            this.$elem.empty().append($body);
        }
    });
});
