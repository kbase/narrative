/**
 * Output widget for creation/visualization/modification of set of genomes.
 * @author Bill Riehl <wjriehl@lbl.gov>, Roman Sutormin <rsutormin@lbl.gov>
 * @public
 */

define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'narrativeConfig',
    'kbaseAuthenticatedWidget',
    'kbasePrompt',
], (KBWidget, bootstrap, $, Config, kbaseAuthenticatedWidget, kbasePrompt) => {
    return KBWidget({
        name: 'kbaseGenomeSetBuilder',
        parent: kbaseAuthenticatedWidget,
        version: '1.0.0',
        options: {
            loadExisting: null,
            wsName: null,
            genomeSetName: null,
            loadingImage: Config.get('loading_gif'),
        },

        useSelect2: true,
        IGNORE_VERSION: true,
        pref: null,
        wsUrl: Config.url('workspace'),
        genomeList: null,

        init: function (options) {
            this._super(options);
            this.pref = this.genUUID();
            this.render();
            return this;
        },

        render: function () {
            if (this.options.loadExisting == 1) {
                if (!this.authToken()) {
                    this.$elem.empty();
                    this.$elem.append("<div>[Error] You're not logged in</div>");
                    return;
                }
                const kbws = new Workspace(this.wsUrl, { token: this.authToken() });
                const prom = kbws.get_objects([
                    { workspace: this.options.wsName, name: this.options.genomeSetName },
                ]);
                const self = this;
                $.when(prom)
                    .done((data) => {
                        var data = data[0].data;
                        const state = { descr: data.description };
                        const obj_refs = [];
                        for (const key in data.elements)
                            obj_refs.push({ ref: data.elements[key]['ref'] });
                        $.when(kbws.get_object_info(obj_refs))
                            .then((refinfo) => {
                                const refhash = {};
                                for (var i = 0; i < refinfo.length; i++) {
                                    const item = refinfo[i];
                                    refhash[obj_refs[i].ref] = item[7] + '/' + item[1];
                                }
                                let count = 0;
                                for (var key in data.elements) {
                                    if (data.elements.hasOwnProperty(key)) count++;
                                }
                                let regenerate = false;
                                for (var i = 0; i < count; i++)
                                    if (!data.elements.hasOwnProperty('param' + i)) {
                                        regenerate = true;
                                        break;
                                    }
                                var i = 0;
                                for (var key in data.elements) {
                                    if (!data.elements.hasOwnProperty(key)) continue;
                                    let newKey = key;
                                    if (regenerate) newKey = 'param' + i;
                                    state[newKey] = refhash[data.elements[key]['ref']].split(
                                        '/'
                                    )[1];
                                    i++;
                                }
                                self.renderState(state);
                            })
                            .fail((e) => {
                                self.$elem.append(
                                    '<div class="alert alert-danger">' + e.error.message + '</div>'
                                );
                            });
                    })
                    .fail((e) => {
                        self.$elem.append(
                            '<div class="alert alert-danger">' + e.error.message + '</div>'
                        );
                    });
            } else {
                this.renderState({});
            }
        },

        renderState: function (state) {
            this.$elem.empty();
            const cellStyle = 'border:none; vertical-align:middle;';
            let inputDiv =
                "<div class='kb-cell-params'>" +
                '<b>Target genome set object name:</b> ' +
                this.options.genomeSetName +
                '<br>' +
                "<font size='-1'>(genome fields may be left blank if they are not needed)</font><br>" +
                "<table id='gnms" +
                this.pref +
                "' class='table'>" +
                "<tr style='" +
                cellStyle +
                "'>" +
                "<td style='" +
                cellStyle +
                "'><b>Genome set description</b></td>" +
                "<td style='" +
                cellStyle +
                " width: 80%;'>" +
                "<input class='form-control' style='width: 100%' id='descr" +
                this.pref +
                "' name='descr' value='' type='text'/>" +
                '</td>' +
                "<td style='" +
                cellStyle +
                "'></td>" +
                '</tr>' +
                '</table>';
            inputDiv +=
                "You can <button id='add" +
                this.pref +
                "'>Add</button> more genomes " +
                "and finally <button id='save" +
                this.pref +
                "'>Save</button> genome set object." +
                '</div>';
            this.$elem.append(inputDiv);
            const self = this;
            $('#add' + this.pref).click((e) => {
                self.addParam('');
                self.refresh();
            });
            $('#save' + this.pref).click((e) => {
                self.saveIntoWs();
            });
            if (this.size(state) == 0) {
                this.addParam('');
            } else {
                for (const key in state)
                    if (state.hasOwnProperty(key) && key.indexOf('param') == 0)
                        this.addParam(state[key]);
            }
            if (state.hasOwnProperty('descr')) {
                $(this.$elem)
                    .find('[name^=descr]')
                    .filter(':input')
                    .each((key, field) => {
                        const $field = $(field);
                        if ($field.is('input') && $field.attr('type') === 'text') {
                            $field.val(state['descr']);
                        }
                    });
            }
            this.refresh();
        },

        saveIntoWs: function () {
            const self = this;
            const kbws = new Workspace(this.wsUrl, { token: this.authToken() });
            const elems = {};
            const state = this.getState();
            for (const key in state)
                if (state.hasOwnProperty(key) && key.indexOf('param') == 0 && state[key].length > 0)
                    elems[key] = { ref: this.options.wsName + '/' + state[key] };
            const gset = {
                description: state['descr'],
                elements: elems,
            };
            kbws.save_objects(
                {
                    workspace: this.options.wsName,
                    objects: [
                        {
                            type: 'KBaseSearch.GenomeSet',
                            name: this.options.genomeSetName,
                            data: gset,
                        },
                    ],
                },
                (data) => {
                    self.trigger('updateData.Narrative');
                    self.showInfo(
                        'Genome set object <b>' +
                            self.options.genomeSetName +
                            '</b> ' +
                            'was stored into Narrative'
                    );
                },
                (data) => {
                    alert('Error: ' + data.error.message);
                }
            );
        },

        addParam: function (genomeObjectName) {
            const self = this;
            const paramPos = this.size(this.getState());
            const pid = 'param' + paramPos;
            const cellStyle = 'border:none; vertical-align:middle;';
            $('#gnms' + this.pref).append(
                '' +
                    "<tr style='" +
                    cellStyle +
                    "'>" +
                    "<td style='" +
                    cellStyle +
                    "'><b>Genome " +
                    (paramPos + 1) +
                    '</b></td>' +
                    "<td style='" +
                    cellStyle +
                    " width: 80%;'>" +
                    "<input class='form-control' style='width: 100%' name='" +
                    pid +
                    "' " +
                    "id='inp_" +
                    pid +
                    '_' +
                    this.pref +
                    "' value='" +
                    genomeObjectName +
                    "' type='text'/>" +
                    '</td>' +
                    "<td style='" +
                    cellStyle +
                    "'><center>" +
                    "<button id='btn_" +
                    pid +
                    '_' +
                    this.pref +
                    "' class='form-control' style='max-width:40px;'>" +
                    "<span class='glyphicon glyphicon-trash'/></button></center>" +
                    '</td>' +
                    '</tr>'
            );
            $('#btn_' + pid + '_' + this.pref).click((e) => {
                $('#inp_' + pid + '_' + self.pref).val('');
            });
        },

        size: function (obj) {
            let size = 0;
            for (const key in obj) if (obj.hasOwnProperty(key) && key.indexOf('param') == 0) size++;
            return size;
        },

        /**
         * Returns an object representing the state of this widget.
         * In this particular case, it is a list of key-value pairs, like this:
         * {
         *   'param0' : 'parameter value',
         *   'param1' : 'parameter value'
         * }
         * with one key/value for each parameter in the defined method.
         */
        getState: function () {
            const state = {};

            $(this.$elem)
                .find('[name^=param]')
                .filter(':input')
                .each((key, field) => {
                    state[field.name] = field.value;
                });

            $(this.$elem)
                .find('[name^=descr]')
                .filter(':input')
                .each((key, field) => {
                    state[field.name] = field.value;
                });

            return state;
        },

        /**
         * Adjusts the current set of parameters based on the given state.
         * Doesn't really do a whole lot of type checking yet, but it's assumed that
         * a state will be loaded from an object generated by getState.
         */
        loadState: function (state) {
            if (!state) return;
            this.renderState(state);
        },

        /**
         * Refreshes the input fields for this widget. I.e. if any of them reference workspace
         * information, those fields get refreshed without altering any other inputs.
         */
        refresh: function () {
            const type = 'KBaseGenomes.Genome';
            const lookupTypes = [type];
            const size = this.size(this.getState());
            const self = this;
            if (this.genomeList && this.genomeList.length > 0) {
                this.refreshInputs();
            } else {
                this.trigger('dataLoadedQuery.Narrative', [
                    lookupTypes,
                    this.IGNORE_VERSION,
                    $.proxy((objects) => {
                        let objList = [];
                        /*
                         * New sorting - by date, then alphabetically within dates.
                         */
                        if (objects[type] && objects[type].length > 0) {
                            objList = objects[type];
                            objList.sort((a, b) => {
                                if (a[3] > b[3]) return -1;
                                if (a[3] < b[3]) return 1;
                                if (a[1] < b[1]) return -1;
                                if (a[1] > b[1]) return 1;
                                return 0;
                            });
                        }
                        self.genomeList = objList;
                        self.refreshInputs();
                    }, this),
                ]);
            }
        },

        refreshInputs: function () {
            const type = 'KBaseGenomes.Genome';
            const lookupTypes = [type];
            const size = this.size(this.getState());
            const objList = this.genomeList;
            for (let i = 0; i < size; i++) {
                const pid = 'param' + i;
                const $input = $($(this.$elem).find('[name=' + pid + ']'));
                let datalistID = $input.attr('list');
                if (objList.length == 0 && datalistID) {
                    $(this.$elem.find('#' + datalistID)).remove();
                    $input.removeAttr('list');
                    $input.val('');
                } else if (objList.length > 0) {
                    var $datalist;
                    if (!datalistID) {
                        datalistID = this.genUUID();
                        $input.attr('list', datalistID);
                        $datalist = $('<datalist>').attr('id', datalistID);
                        $input.after($datalist);
                    } else {
                        $datalist = $(this.$elem.find('#' + datalistID));
                    }
                    $datalist.empty();
                    for (let j = 0; j < objList.length; j++) {
                        $datalist.append(
                            $('<option>').attr('value', objList[j][1]).append(objList[j][1])
                        );
                    }
                }
            }
        },

        genUUID: function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                const r = (Math.random() * 16) | 0,
                    v = c == 'x' ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            });
        },

        loggedInCallback: function (event, auth) {
            this.render();
            return this;
        },

        loggedOutCallback: function (event, auth) {
            this.render();
            return this;
        },

        showInfo: function (message) {
            new kbasePrompt($('<div/>'), { title: 'Information', body: message }).openPrompt();
        },
    });
});
