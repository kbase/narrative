function KBaseFBA_FBAComparison(modeltabs) {
    'use strict';
    const self = this;
    this.modeltabs = modeltabs;

    this.setMetadata = function (data) {
        this.workspace = data[7];
        this.objName = data[1];
        this.overview = {
            wsid: data[7] + '/' + data[1],
            ws: data[7],
            obj_name: data[1],
            objecttype: data[2],
            owner: data[5],
            instance: data[4],
            moddate: data[3],
            commonreactions: data[10]['Common reactions'],
            commoncompounds: data[10]['Common compounds'],
            numfbas: data[10]['Number FBAs'],
            numreactions: data[10]['Number reactions'],
            numcompounds: data[10]['Number compounds'],
        };
    };

    this.cmpnamehash = {
        c: 'Cytosol',
        p: 'Periplasm',
        g: 'Golgi apparatus',
        e: 'Extracellular',
        r: 'Endoplasmic reticulum',
        l: 'Lysosome',
        n: 'Nucleus',
        d: 'Plastid',
        m: 'Mitochondria',
        x: 'Peroxisome',
        v: 'Vacuole',
        w: 'Cell wall',
        j: 'Mitochondrial Intermembrane Space',
    };

    this.tabList = [
        {
            key: 'overview',
            name: 'Overview',
            type: 'verticaltbl',
            rows: [
                {
                    label: 'Name',
                    key: 'name',
                },
                {
                    label: 'ID',
                    key: 'wsid',
                },
                {
                    label: 'Object type',
                    key: 'objecttype',
                    type: 'typelink',
                },
                {
                    label: 'Owner',
                    key: 'owner',
                },
                {
                    label: 'Version',
                    key: 'instance',
                },
                {
                    label: 'Mod-date',
                    key: 'moddate',
                },
                {
                    label: 'Number FBAs',
                    key: 'numfbas',
                },
                {
                    label: 'Number reactions',
                    key: 'numreactions',
                },
                {
                    label: 'Common reactions',
                    key: 'commonreactions',
                },
                {
                    label: 'Number compounds',
                    key: 'numcompounds',
                },
                {
                    label: 'Common compounds',
                    key: 'commoncompounds',
                },
            ],
        },
        {
            key: 'fbas',
            name: 'Flux Balance Analyses',
            type: 'dataTable',
            columns: [
                {
                    label: 'FBA',
                    key: 'fba',
                    type: 'wstype',
                    linkformat: 'dispWSRef',
                },
                {
                    label: 'Model',
                    key: 'model',
                    type: 'wstype',
                    linkformat: 'dispWSRef',
                },
                {
                    label: 'Media',
                    key: 'media',
                    type: 'wstype',
                    linkformat: 'dispWSRef',
                },
                {
                    label: 'Objective',
                    key: 'objective',
                },
                {
                    label: 'Reactions',
                    key: 'rxndata',
                },
                {
                    label: 'Exchanges',
                    key: 'exchangedata',
                },
            ],
        },
        {
            key: 'fbacomparisons',
            name: 'FBA Comparisons',
            type: 'dataTable',
            columns: [
                {
                    label: 'Index',
                    key: 'index',
                },
                {
                    label: 'FBA',
                    key: 'fba',
                    type: 'wstype',
                    linkformat: 'dispWSRef',
                },
            ],
        },
        {
            key: 'modelreactions',
            name: 'Reactions',
            type: 'dataTable',
            columns: [
                {
                    label: 'Reaction',
                    type: 'tabLink',
                    linkformat: 'dispIDCompart',
                    key: 'id',
                    method: 'ReactionTab',
                },
                {
                    label: 'Name',
                    key: 'name',
                },
                {
                    label: 'Equation',
                    key: 'equation',
                    type: 'tabLink',
                    linkformat: 'linkequation',
                },
                {
                    label: 'FBAs',
                    key: 'numfba',
                },
                {
                    label: 'Most common state',
                    key: 'mostcommonstate',
                },
                {
                    label: 'Inactive states',
                    key: 'inactivestates',
                },
                {
                    label: 'Forward states',
                    key: 'forwardstates',
                },
                {
                    label: 'Reverse states',
                    key: 'reversestates',
                },
            ],
        },
        {
            key: 'modelcompounds',
            name: 'Compounds',
            type: 'dataTable',
            columns: [
                {
                    label: 'Compound',
                    type: 'tabLink',
                    linkformat: 'dispIDCompart',
                    key: 'id',
                    method: 'CompoundTab',
                },
                {
                    label: 'Exchange',
                    key: 'exchange',
                },
                {
                    label: 'Formula',
                    key: 'formula',
                },
                {
                    label: 'Charge',
                    key: 'charge',
                },
                {
                    label: 'FBAs',
                    key: 'numfba',
                },
                {
                    label: 'Most common state',
                    key: 'mostcommonstate',
                },
                {
                    label: 'Inactive states',
                    key: 'inactivestates',
                },
                {
                    label: 'Uptake states',
                    key: 'uptakestates',
                },
                {
                    label: 'Excretion states',
                    key: 'excretionstates',
                },
            ],
        },
    ];

    this.ReactionTab = function (info) {
        const rxn = self.rxnhash[info.id];
        return [
            {
                label: 'Reaction',
                data: rxn.dispid,
            },
            {
                label: 'Name',
                data: rxn.name,
            },
            {
                label: 'Equation',
                data: rxn.equation,
                type: 'pictureEquation',
            },
            {
                label: 'Inactive FBAs',
                data: rxn.inactivestates,
            },
            {
                label: 'Forward FBAs',
                data: rxn.forwardstates,
            },
            {
                label: 'Reverse FBAs',
                data: rxn.reversestates,
            },
        ];
    };

    this.CompoundTab = function (info) {
        const cpd = self.cpdhash[info.id];
        return [
            {
                label: 'Compound',
                data: cpd.dispid,
            },
            {
                label: 'Name',
                data: cpd.name,
            },
            {
                label: 'Formula',
                data: cpd.formula,
            },
            {
                label: 'Charge',
                data: cpd.charge,
            },
            {
                label: 'Most common state',
                data: cpd.mostcommonstate,
            },
            {
                label: 'Inactive states',
                data: cpd.inactivestates,
            },
            {
                label: 'Uptake states',
                data: cpd.uptakestates,
            },
            {
                label: 'Excretion states',
                data: cpd.excretionstates,
            },
        ];
    };

    this.CompareTab = function (info) {
        const cpd = self.cpdhash[info.id];
        return [
            {
                label: 'Compound',
                data: cpd.dispid,
            },
            {
                label: 'Name',
                data: cpd.name,
            },
            {
                label: 'Formula',
                data: cpd.formula,
            },
            {
                label: 'Charge',
                data: cpd.charge,
            },
            {
                label: 'Most common state',
                data: cpd.mostcommonstate,
            },
            {
                label: 'Inactive states',
                data: cpd.inactivestates,
            },
            {
                label: 'Uptake states',
                data: cpd.uptakestates,
            },
            {
                label: 'Excretion states',
                data: cpd.excretionstates,
            },
        ];
    };

    this.setData = function (indata) {
        this.data = indata;
        this.fbas = this.data.fbas;
        this.cpdhash = {};
        this.rxnhash = {};
        this.fbahash = {};
        this.fbacomparisons = [];
        for (let i = 0; i < this.fbas.length; i++) {
            this.fbacomparisons[i] = {};
            this.fbahash[this.fbas[i].id] = this.fbas[i];
            const item = 'F' + (i + 1);
            this.tabList[2]['columns'].push({
                label: item,
                key: item,
            });
            this.fbas[i]['dispid'] = this.fbas[i].id.split('/')[1];
            this.fbas[i]['fba'] = this.fbas[i]['fba_ref'];
            this.fbas[i]['model'] = this.fbas[i]['fbamodel_ref'];
            this.fbas[i]['media'] = this.fbas[i]['media_ref'];
            this.fbas[i]['rxndata'] =
                'Inactive: ' +
                (this.fbas[i]['reactions'] - this.fbas[i]['active_reactions']) +
                '<br>Active: ' +
                this.fbas[i]['active_reactions'];
            this.fbas[i]['exchangedata'] =
                'Available: ' +
                (this.fbas[i]['compounds'] -
                    this.fbas[i]['uptake_compounds'] -
                    this.fbas[i]['excretion_compounds']) +
                '<br>Uptake: ' +
                this.fbas[i]['uptake_compounds'] +
                '<br>Excretion: ' +
                this.fbas[i]['excretion_compounds'];
            let fbaabbrev = 'F' + (i + 1);
            this.fbacomparisons[i]['fba'] = this.fbas[i]['fba'];
            this.fbacomparisons[i]['index'] = fbaabbrev;
            for (let j = 0; j < this.fbas.length; j++) {
                fbaabbrev = 'F' + (j + 1);
                if (j != i) {
                    if (this.fbas[j].id in this.fbas[i]['fba_similarity']) {
                        const simdata = this.fbas[i]['fba_similarity'][this.fbas[j]['id']];
                        const rfraction =
                            Math.round(
                                (100 * (simdata[1] + simdata[2] + simdata[3])) / simdata[0]
                            ) / 100;
                        const cfraction =
                            Math.round(
                                (100 * (simdata[5] + simdata[6] + simdata[7])) / simdata[4]
                            ) / 100;
                        const text = 'R: ' + rfraction + '<br>C: ' + cfraction;
                        const tooltip =
                            'Common reactions: ' +
                            simdata[0] +
                            '&#013;Common forward: ' +
                            simdata[1] +
                            '&#013;Common reverse: ' +
                            simdata[2] +
                            '&#013;Common inactive: ' +
                            simdata[3] +
                            '&#013;Common compounds: ' +
                            simdata[4] +
                            '&#013;Common uptake: ' +
                            simdata[5] +
                            '&#013;Common excretion: ' +
                            simdata[6] +
                            '&#013;Common inactive: ' +
                            simdata[7];
                        this.fbacomparisons[i][fbaabbrev] =
                            '<p title="' + tooltip + '">' + text + '</p>';
                    }
                } else {
                    this.fbacomparisons[i][fbaabbrev] =
                        '<p title="Reactions: ' +
                        this.fbas[i].reactions +
                        '&#013;Compounds: ' +
                        this.fbas[i].compounds +
                        '">R: 1<br>C: 1</p>';
                }
            }
        }

        this.modelreactions = this.data.reactions;
        for (const element of this.modelreactions) {
            let idarray = element['id'].split('_');
            let namearray = element['name'].split('_');
            element['name'] = namearray[0];
            element.dispid = idarray[0] + '[' + idarray[1] + ']';
            this.rxnhash[element.id] = element;
            let reactants = '';
            let products = '';
            let sign = '<=>';
            if (element.direction == '>') {
                sign = '=>';
            } else if (element.direction == '<') {
                sign = '<=';
            }
            for (let j = 0; j < element.stoichiometry.length; j++) {
                const rgt = element.stoichiometry[j];
                idarray = rgt[2].split('_');
                namearray = rgt[1].split('_');
                if (rgt[0] < 0) {
                    if (reactants.length > 0) {
                        reactants += ' + ';
                    }
                    if (rgt[0] != -1) {
                        const abscoef = Math.round(-1 * 100 * rgt[0]) / 100;
                        reactants += '(' + abscoef + ') ';
                    }
                    reactants += namearray[0] + '[' + idarray[1] + ']';
                } else {
                    if (products.length > 0) {
                        products += ' + ';
                    }
                    if (rgt[0] != 1) {
                        const abscoef = Math.round(100 * rgt[0]) / 100;
                        products += '(' + abscoef + ') ';
                    }
                    products += namearray[0] + '[' + idarray[1] + ']';
                }
            }
            element.equation = reactants + ' ' + sign + ' ' + products;
            element.numfba = 0;
            const percent = Math.floor(
                100 * element.state_conservation[element.most_common_state][1]
            );
            element.mostcommonstate = element.most_common_state + ' (' + percent + '%)';
            element.inactivestates = 'None';
            element.forwardstates = 'None';
            element.reversestates = 'None';
            for (const key in element.reaction_fluxes) {
                element.numfba++;
                if (element.reaction_fluxes[key][0] == 'IA') {
                    if (element.inactivestates == 'None') {
                        element.inactivestates =
                            'Count: ' + element.state_conservation['IA'][0] + '<br>' + key;
                    } else {
                        element.inactivestates += '<br>' + key;
                    }
                } else if (element.reaction_fluxes[key][0] == 'FOR') {
                    if (element.forwardstates == 'None') {
                        element.forwardstates =
                            'Average: ' +
                            element.state_conservation['FOR'][2] +
                            ' +/- ' +
                            element.state_conservation['FOR'][3] +
                            '<br>' +
                            key +
                            ': ' +
                            element.reaction_fluxes[key][5];
                    } else {
                        element.forwardstates +=
                            '<br>' + key + ': ' + element.reaction_fluxes[key][5];
                    }
                } else if (element.reaction_fluxes[key][0] == 'REV') {
                    if (element.reversestates == 'None') {
                        element.reversestates =
                            'Average: ' +
                            element.state_conservation['REV'][2] +
                            ' +/- ' +
                            element.state_conservation['REV'][3] +
                            '<br>' +
                            key +
                            ': ' +
                            element.reaction_fluxes[key][5];
                    } else {
                        element.reversestates +=
                            '<br>' + key + ': ' + element.reaction_fluxes[key][5];
                    }
                }
            }
        }

        this.modelcompounds = this.data.compounds;
        for (const element of this.modelcompounds) {
            this.cpdhash[element.id] = element;
            const idarray = element['id'].split('_');
            const namearray = element['name'].split('_');
            element['name'] = namearray[0];
            element.dispid = idarray[0] + '[' + idarray[1] + ']';
            element.exchange = ' => ' + element.name + '[' + namearray[1] + ']';
            element.numfba = 0;
            const percent = Math.floor(
                100 * element.state_conservation[element.most_common_state][1]
            );
            element.mostcommonstate = element.most_common_state + ' (' + percent + '%)';
            if ('UP' in element.state_conservation) {
                element.uptakestates =
                    'Average: ' +
                    element.state_conservation['UP'][2] +
                    ' +/- ' +
                    element.state_conservation['UP'][3];
            } else {
                element.uptakestates = 'None';
            }
            if ('EX' in element.state_conservation) {
                element.excretionstates =
                    'Average: ' +
                    element.state_conservation['EX'][2] +
                    ' +/- ' +
                    element.state_conservation['EX'][3];
            } else {
                element.excretionstates = 'None';
            }
            if ('IA' in element.state_conservation) {
                element.inactivestates = 'Count: ' + element.state_conservation['IA'][0];
            } else {
                element.inactivestates = 'None';
            }
            for (const key in element.exchanges) {
                element.numfba++;
                if (element.exchanges[key][0] == 'UP') {
                    element.uptakestates += '<br>' + key + ': ' + element.exchanges[key][5];
                } else if (element.exchanges[key][0] == 'EX') {
                    element.excretionstates += '<br>' + key + ': ' + -1 * element.exchanges[key][5];
                } else {
                    element.inactivestates += '<br>' + key;
                }
            }
        }
    };
}

// make method of base class
KBModeling.prototype.KBaseFBA_FBAComparison = KBaseFBA_FBAComparison;
