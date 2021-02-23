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
], (
    $,
    Promise,
    KBWidget,
    Workspace,
    Runtime,
    TimeFormat
) => {
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
            const runtime = Runtime.make();
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
            const self = this;
            self.objectInfo = {};
            Object.keys(self.options.upas).forEach((key) => {
                const upa = self.options.upas[key];
                if (typeof upa === 'string') {
                    self.objectInfo[upa] = {};
                }
                else if (Array.isArray(upa)) {
                    upa.forEach((subUpa) => {
                        self.options.upas[subUpa] = {};
                        self.objectInfo[subUpa] = {};
                    });
                }
            });

            // prep workspace call.
            const wsInfoCall = [];
            Object.keys(self.objectInfo).forEach((upa) => {
                wsInfoCall.push({'ref': upa});
            });

            const allPromises = [];
            // do ws call.
            const objInfoProm = self.workspace.get_object_info_new({'objects': wsInfoCall})
                .then((infos) => {
                    wsInfoCall.forEach((upaRef, idx) => {
                        self.objectInfo[upaRef.ref].info = infos[idx];
                    });
                });
            allPromises.push(objInfoProm);

            wsInfoCall.forEach((upaRef) => {
                if (upaRef.ref.indexOf(';') === -1) {
                    const histPromise = self.workspace.get_object_history(upaRef)
                        .then((history) => {
                            self.objectInfo[upaRef.ref].history = history;
                        });
                    allPromises.push(histPromise);
                }
            });
            Promise.all(allPromises)
                .then(() => {
                    self.render();
                })
                .catch((error) => {
                    // console.error(error);
                });
        },

        buildObjectInfo: function(upa) {
            const $info = $('<div>');
            if (!this.objectInfo[upa]) {
                return $info;
            }
            const objInfo = this.objectInfo[upa].info;

            const addField = function(key, value) {
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
            const upa = this.options.upas[upaId];
            if (!upa || !this.objectInfo[upa] || !this.objectInfo[upa].history) {
                return $('<div>Other object versions unavailable!</div>');
            }
            const $versions = $('<div>');
            const curVersion = this.objectInfo[upa].info[4];
            const totalVersions = this.objectInfo[upa].history.length;
            $versions.append('<div>version ' + curVersion + ' of ' + totalVersions + '</div>');

            const $backBtn = $('<button>')
                .addClass('btn btn-default kb-data-obj disabled')
                .append($('<span>').addClass('fa fa-arrow-left'))
                .click(() => {
                    // move back version
                    if (curVersion > 1) {
                        this.options.versionCallback(upaId, curVersion-1);
                    }
                });
            if (curVersion > 1) {
                $backBtn.removeClass('disabled');
            }

            const $fwdBtn = $('<button>')
                .addClass('btn btn-default kb-data-obj disabled')
                .append($('<span>').addClass('fa fa-arrow-right'))
                .click(() => {
                    if (curVersion < totalVersions) {
                        this.options.versionCallback(upaId, curVersion+1);
                    }
                });
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
            let mainUpa = null,
                mainUpaId = null,
                numUpas = Object.keys(this.objectInfo).length;
            if (this.options.primaryUpaId) {
                mainUpaId = this.options.primaryUpaId;
            } else if (numUpas === 1) {
                mainUpaId = Object.keys(this.options.upas)[0];
            }
            mainUpa = this.options.upas[mainUpaId];
            let $body = $('<div style="display:flex; flex-direction:row; justify-content: space-between">'),
                $info;
            if (mainUpa) {
                $info = this.buildObjectInfo(mainUpa);
            }
            else {
                $info = $('<div>Lots of info available for ' + numUpas + ' object on display!</div>');
            }

            const $versionToggle = this.buildVersionToggle(mainUpaId);

            $body.append($info)
                .append($versionToggle);
            this.$elem.empty().append($body);
        }
    });
});
