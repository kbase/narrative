define(['jquery', 'kbasePathways'], ($, kbasePathways) => {
    function KBaseFBA_FBAModel(modeltabs) {
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
            };

            // if there is user metadata, add it
            if ('Name' in data[10]) {
                this.usermeta = {
                    name: data[10]['Name'],
                    source: data[10]['Source'] + '/' + data[10]['Source ID'],
                    genome: data[10]['Genome'],
                    modeltype: data[10]['Type'],
                    numreactions: data[10]['Number reactions'],
                    numcompounds: data[10]['Number compounds'],
                    numcompartments: data[10]['Number compartments'],
                    numbiomass: data[10]['Number biomasses'],
                    numgapfills: data[10]['Number gapfills'],
                };
                $.extend(this.overview, this.usermeta);
            }
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
            j: 'Mitochondrial intermembrane space',
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
                        label: 'Source',
                        key: 'source',
                    },
                    {
                        label: 'Genome',
                        key: 'genome',
                        type: 'wstype',
                    },
                    {
                        label: 'Model type',
                        key: 'modeltype',
                    },
                    {
                        label: 'Number reactions',
                        key: 'numreactions',
                    },
                    {
                        label: 'Number compounds',
                        key: 'numcompounds',
                    },
                    {
                        label: 'Number compartments',
                        key: 'numcompartments',
                    },
                    {
                        label: 'Number biomass',
                        key: 'numbiomass',
                    },
                    {
                        label: 'Number gapfills',
                        key: 'numgapfills',
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
                        width: '15%',
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
                        label: 'Genes',
                        key: 'genes',
                        type: 'tabLinkArray',
                        method: 'GeneTab',
                    },
                    {
                        label: 'Gapfilling',
                        key: 'gapfillingstring',
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
                        key: 'id',
                        type: 'tabLink',
                        linkformat: 'dispIDCompart',
                        method: 'CompoundTab',
                        width: '15%',
                    },
                    {
                        label: 'Name',
                        key: 'name',
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
                        label: 'Compartment',
                        key: 'cmpkbid',
                        type: 'tabLink',
                        method: 'CompartmentTab',
                        linkformat: 'dispID',
                    },
                ],
            },
            {
                key: 'modelgenes',
                name: 'Genes',
                type: 'dataTable',
                columns: [
                    {
                        label: 'Gene',
                        key: 'id',
                        type: 'tabLink',
                        method: 'GeneTab',
                    },
                    {
                        label: 'Reactions',
                        key: 'reactions',
                        type: 'tabLinkArray',
                        method: 'ReactionTab',
                    },
                ],
            },
            {
                key: 'modelcompartments',
                name: 'Compartments',
                type: 'dataTable',
                columns: [
                    {
                        label: 'Compartment',
                        key: 'id',
                        type: 'tabLink',
                        method: 'CompartmentTab',
                        linkformat: 'dispID',
                    },
                    {
                        label: 'Name',
                        key: 'name',
                    },
                    {
                        label: 'pH',
                        key: 'pH',
                    },
                    {
                        label: 'Potential',
                        key: 'potential',
                    },
                ],
            },
            {
                key: 'biomasscpds',
                name: 'Biomass',
                type: 'dataTable',
                columns: [
                    {
                        label: 'Biomass',
                        key: 'biomass',
                        type: 'tabLink',
                        method: 'BiomassTab',
                        linkformat: 'dispID',
                    },
                    {
                        label: 'Compound',
                        key: 'id',
                        type: 'tabLink',
                        linkformat: 'dispIDCompart',
                        method: 'CompoundTab',
                    },
                    {
                        label: 'Name',
                        key: 'name',
                    },
                    {
                        label: 'Coefficient',
                        key: 'coefficient',
                    },
                    {
                        label: 'Compartment',
                        key: 'cmpkbid',
                        type: 'tabLink',
                        linkformat: 'dispID',
                        method: 'CompartmentTab',
                    },
                ],
            },
            {
                key: 'gapfillings',
                name: 'Gapfilling',
                type: 'dataTable',
                columns: [
                    {
                        label: 'Gapfill',
                        key: 'simpid',
                    },
                    {
                        label: 'Integrated',
                        key: 'integrated',
                    },
                    {
                        label: 'Media',
                        key: 'media_ref',
                        linkformat: 'dispWSRef',
                        type: 'wstype',
                        wstype: 'KBaseFBA.Media',
                    },
                ],
            },
            {
                name: 'Pathways',
                widget: kbasePathways,
                getParams: function () {
                    return { models: [self.data] };
                },
            },
        ];

        this.ReactionTab = function (info) {
            const rxn = self.rxnhash[info.id];
            const output = [
                {
                    label: 'Reaction',
                    data: rxn.dispid,
                },
                {
                    label: 'Name',
                    data: rxn.name,
                },
            ];
            if ('pathway' in rxn) {
                output.push({
                    label: 'Pathway',
                    data: rxn.pathway,
                });
            }
            if ('reference' in rxn) {
                output.push({
                    label: 'Reference',
                    data: rxn.reference,
                });
            }
            output.push(
                {
                    label: 'Compartment',
                    data:
                        self.cmphash[rxn.cmpkbid].name +
                        ' ' +
                        self.cmphash[rxn.cmpkbid].compartmentIndex,
                },
                {
                    label: 'Equation',
                    data: rxn.equation,
                    type: 'pictureEquation',
                },
                {
                    label: 'GPR',
                    data: rxn.gpr,
                }
            );
            if (rxn.rxnkbid != 'rxn00000') {
                console.log(rxn.rxnkbid);
                return self.modeltabs
                    .kbapi('biochem', 'get_reactions', {
                        reactions: [rxn.rxnkbid],
                    })
                    .then((data) => {
                        if ('deltaG' in data[0]) {
                            output.push({
                                label: 'Delta G',
                                data: data[0].deltaG + ' (' + data[0].deltaGErr + ') kcal/mol',
                            });
                        }
                        if ('enzymes' in data[0]) {
                            output.push({
                                label: 'Enzymes',
                                data: data[0].enzymes.join(', '),
                            });
                        }
                        const aliashash = {};
                        const finalaliases = [];
                        for (const element of data[0].aliases) {
                            if (!(element in aliashash)) {
                                finalaliases.push(element);
                                aliashash[element] = 1;
                            }
                        }
                        output.push({
                            label: 'Aliases',
                            data: finalaliases.join(', '),
                        });
                        return output;
                    });
            }
            return output;
        };

        this.GeneTab = function (info) {
            // let gene = this.genehash[id];
            // doing this instead of creating hash
            let data;
            self.modelgenes.forEach((gene) => {
                if (gene.id == info.id)
                    data = [
                        {
                            label: 'ID',
                            data: gene.id,
                        },
                        {
                            label: 'Reactions',
                            data: gene.reactions,
                            type: 'tabLinkArray',
                            method: 'ReactionTab',
                        },
                    ];
            });
            return data;
        };

        this.CompoundTab = function (info) {
            const cpd = self.cpdhash[info.id];
            console.log(cpd);
            const output = [
                {
                    label: 'Compound',
                    data: cpd.dispid,
                },
                {
                    label: 'Image',
                    data: self.modeltabs.compoundImage(cpd.id), //"<img src=http://minedatabase.mcs.anl.gov/compound_images/ModelSEED/"+cpd.id.split("_")[0]+".png style='height:300px !important;'>"
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
                    label: 'InChIKey',
                    data: cpd.inchikey,
                },
                {
                    label: 'SMILES',
                    data: cpd.smiles,
                },
                {
                    label: 'Charge',
                    data: cpd.charge,
                },
                {
                    label: 'Compartment',
                    data:
                        self.cmphash[cpd.cmpkbid].name +
                        ' ' +
                        self.cmphash[cpd.cmpkbid].compartmentIndex,
                },
            ];
            if (cpd.smiles && cpd.cpdkbid == 'cpd00000') {
                return self.modeltabs
                    .kbapi('biochem', 'depict_compounds', { structures: [cpd.smiles] })
                    .then((data) => {
                        output[1] = {
                            label: 'Image',
                            data: data[0],
                        };
                        return output;
                    });
            }
            if (cpd.cpdkbid != 'cpd00000') {
                return self.modeltabs
                    .kbapi('biochem', 'get_compounds', {
                        compounds: [cpd.cpdkbid],
                    })
                    .then((data) => {
                        if ('deltaG' in data[0]) {
                            output.push({
                                label: 'Delta G',
                                data: data[0].deltaG + ' (' + data[0].deltaGErr + ') kcal/mol',
                            });
                        }
                        const aliashash = {};
                        const finalaliases = [];
                        for (const element of data[0].aliases) {
                            if (!(element in aliashash)) {
                                finalaliases.push(element);
                                aliashash[element] = 1;
                            }
                        }
                        output.push({
                            label: 'Aliases',
                            data: finalaliases.join(', '),
                        });
                        return output;
                    });
            }
            return output;
        };

        this.CompartmentTab = function (info) {
            const cmp = self.cmphash[info.id];
            return [
                {
                    label: 'Compartment',
                    data: cmp.id,
                },
                {
                    label: 'Name',
                    data: cmp.name,
                },
                {
                    label: 'pH',
                    data: cmp.pH,
                },
                {
                    label: 'potential',
                    data: cmp.potential,
                },
            ];
        };

        this.BiomassTab = function (info) {
            const bio = self.biohash[info.id];
            return [
                {
                    label: 'Biomass',
                    data: bio.id,
                },
                {
                    label: 'Name',
                    data: bio.name,
                },
                {
                    label: 'DNA fraction',
                    data: bio.dna,
                },
                {
                    label: 'RNA fraction',
                    data: bio.RNA,
                },
                {
                    label: 'Protein fraction',
                    data: bio.protein,
                },
                {
                    label: 'Cell wall fraction',
                    data: bio.cellwall,
                },
                {
                    label: 'Lipid fraction',
                    data: bio.lipid,
                },
                {
                    label: 'Cofactor fraction',
                    data: bio.cofactor,
                },
                {
                    label: 'Other fraction',
                    data: bio.other,
                },
                {
                    label: 'Energy mols',
                    data: bio.energy,
                },
                {
                    label: 'Equation',
                    data: bio.equation,
                },
            ];
        };

        this.setData = function (indata) {
            this.data = indata;
            this.modelreactions = this.data.modelreactions;
            this.modelcompounds = this.data.modelcompounds;
            this.modelgenes = [];
            this.modelcompartments = this.data.modelcompartments;
            this.biomasses = this.data.biomasses;
            this.biomasscpds = [];
            this.gapfillings = this.data.gapfillings;
            this.cpdhash = {};
            this.biohash = {};
            this.rxnhash = {};
            this.cmphash = {};
            this.genehash = {};
            this.gfhash = {};
            this.biochemws = 'kbase';
            this.biochem = 'default';
            const gfobjects = [];
            for (let i = 0; i < this.gapfillings.length; i++) {
                this.gapfillings[i].simpid = 'gf.' + (i + 1);
                if ('fba_ref' in this.gapfillings[i] && this.gapfillings[i].fba_ref.length > 0) {
                    gfobjects.push({ ref: this.gapfillings[i].fba_ref });
                } else if (
                    'gapfill_ref' in this.gapfillings[i] &&
                    this.gapfillings[i].gapfill_ref.length > 0
                ) {
                    gfobjects.push({ ref: this.gapfillings[i].gapfill_ref });
                }
                this.gfhash[this.gapfillings[i].simpid] = this.gapfillings[i];
            }
            for (const element of this.modelcompartments) {
                const cmp = element;
                cmp.cmpkbid = cmp.compartment_ref.split('/').pop();
                if (cmp.cmpkbid == 'd') {
                    this.biochem = 'plantdefault';
                }
                cmp.name = self.cmpnamehash[cmp.cmpkbid];
                this.cmphash[cmp.id] = cmp;
            }
            for (const element of this.modelcompounds) {
                const cpd = element;
                const idarray = cpd.id.split('_');
                cpd.dispid = idarray[0] + '[' + idarray[1] + ']';
                cpd.cmpkbid = cpd.modelcompartment_ref.split('/').pop();
                cpd.cpdkbid = cpd.compound_ref.split('/').pop();
                if (cpd.name === undefined) {
                    cpd.name = cpd.dispid;
                }
                cpd.name = cpd.name.replace(/_[a-zA-Z]\d+$/, '');
                this.cpdhash[cpd.id] = cpd;
                if (cpd.cpdkbid != 'cpd00000') {
                    this.cpdhash[cpd.cpdkbid + '_' + cpd.cmpkbid] = cpd;
                    if (idarray[0] != cpd.cpdkbid) {
                        cpd.dispid += '<br>(' + cpd.cpdkbid + ')';
                    }
                }
            }
            for (let i = 0; i < this.biomasses.length; i++) {
                const biomass = this.biomasses[i];
                this.biohash[biomass.id] = biomass;
                biomass.dispid = biomass.id;
                let reactants = '';
                let products = '';
                for (const element of biomass.biomasscompounds) {
                    const biocpd = element;
                    biocpd.id = biocpd.modelcompound_ref.split('/').pop();
                    const idarray = biocpd.id.split('_');
                    biocpd.dispid = idarray[0] + '[' + idarray[1] + ']';
                    biocpd.name = this.cpdhash[biocpd.id].name;
                    biocpd.formula = this.cpdhash[biocpd.id].formula;
                    biocpd.charge = this.cpdhash[biocpd.id].charge;
                    biocpd.cmpkbid = this.cpdhash[biocpd.id].cmpkbid;
                    biocpd.biomass = biomass.id;
                    this.biomasscpds.push(biocpd);
                    if (biocpd.coefficient < 0) {
                        if (reactants.length > 0) {
                            reactants += ' + ';
                        }
                        if (biocpd.coefficient != -1) {
                            const abscoef = Math.round(-1 * 100 * biocpd.coefficient) / 100;
                            reactants += '(' + abscoef + ') ';
                        }
                        reactants += biocpd.name + '[' + biocpd.cmpkbid + ']';
                    } else {
                        if (products.length > 0) {
                            products += ' + ';
                        }
                        if (biocpd.coefficient != 1) {
                            const abscoef = Math.round(100 * biocpd.coefficient) / 100;
                            products += '(' + abscoef + ') ';
                        }
                        products += biocpd.name + '[' + biocpd.cmpkbid + ']';
                    }
                }
                biomass.equation = reactants + ' => ' + products;
            }
            for (let i = 0; i < this.modelreactions.length; i++) {
                const rxn = this.modelreactions[i];
                const idarray = rxn.id.split('_');
                rxn.dispid = idarray[0] + '[' + idarray[1] + ']';
                rxn.rxnkbid = rxn.reaction_ref.split('/').pop();
                rxn.rxnkbid = rxn.rxnkbid.replace(/_[a-zA-Z]/, '');
                rxn.cmpkbid = rxn.modelcompartment_ref.split('/').pop();
                rxn.name = rxn.name.replace(/_[a-zA-Z]\d+$/, '');
                rxn.gpr = '';
                if (rxn.name == 'CustomReaction') {
                    rxn.name = rxn.dispid;
                }
                self.rxnhash[rxn.id] = rxn;
                if (rxn.rxnkbid != 'rxn00000') {
                    this.rxnhash[rxn.rxnkbid + '_' + rxn.cmpkbid] = rxn;
                    if (rxn.rxnkbid != idarray[0]) {
                        rxn.dispid += '<br>(' + rxn.rxnkbid + ')';
                    }
                }
                let reactants = '';
                let products = '';
                let sign = '<=>';
                if (rxn.direction == '>') {
                    sign = '=>';
                } else if (rxn.direction == '<') {
                    sign = '<=';
                }
                if (rxn.modelReactionProteins > 0) {
                    rxn.gpr = '';
                }
                for (let j = 0; j < rxn.modelReactionReagents.length; j++) {
                    const rgt = rxn.modelReactionReagents[j];
                    rgt.cpdkbid = rgt.modelcompound_ref.split('/').pop();
                    if (rgt.coefficient < 0) {
                        if (reactants.length > 0) {
                            reactants += ' + ';
                        }
                        if (rgt.coefficient != -1) {
                            const abscoef = Math.round(-1 * 100 * rgt.coefficient) / 100;
                            reactants += '(' + abscoef + ') ';
                        }
                        reactants +=
                            '<a class="id-click" data-id="' +
                            rgt.cpdkbid +
                            '" data-method="CompoundTab">' +
                            this.cpdhash[rgt.cpdkbid].name +
                            '[' +
                            this.cpdhash[rgt.cpdkbid].cmpkbid +
                            ']</a>';
                    } else {
                        if (products.length > 0) {
                            products += ' + ';
                        }
                        if (rgt.coefficient != 1) {
                            const abscoef = Math.round(100 * rgt.coefficient) / 100;
                            products += '(' + abscoef + ') ';
                        }
                        products +=
                            '<a class="id-click" data-id="' +
                            rgt.cpdkbid +
                            '" data-method="CompoundTab">' +
                            this.cpdhash[rgt.cpdkbid].name +
                            '[' +
                            this.cpdhash[rgt.cpdkbid].cmpkbid +
                            ']</a>';
                    }
                }
                rxn.ftrhash = {};
                for (let j = 0; j < rxn.modelReactionProteins.length; j++) {
                    const prot = rxn.modelReactionProteins[j];
                    if (j > 0) {
                        rxn.gpr += ' or ';
                    }
                    rxn.gpr += '(';
                    for (let k = 0; k < prot.modelReactionProteinSubunits.length; k++) {
                        const subunit = prot.modelReactionProteinSubunits[k];
                        if (k > 0) {
                            rxn.gpr += ' and ';
                        }
                        rxn.gpr += '(';
                        if (subunit.feature_refs.length == 0) {
                            rxn.gpr += 'Unknown';
                        }
                        for (let m = 0; m < subunit.feature_refs.length; m++) {
                            const ftrid = subunit.feature_refs[m].split('/').pop();
                            rxn.ftrhash[ftrid] = 1;
                            if (m > 0) {
                                rxn.gpr += ' or ';
                            }
                            rxn.gpr += ftrid;
                        }
                        rxn.gpr += ')';
                    }
                    rxn.gpr += ')';
                }

                rxn.gapfilling = [];
                for (const gf in rxn.gapfill_data) {
                    if (rxn.gapfill_data[gf][0][0] == '<') {
                        rxn.gapfilling.push(gf + ': reverse');
                    } else {
                        rxn.gapfilling.push(gf + ': forward');
                    }
                }
                rxn.gapfillingstring = rxn.gapfilling.join('<br>');

                rxn.dispfeatures = '';
                rxn.genes = [];
                for (const gene in rxn.ftrhash) {
                    rxn.genes.push({ id: gene });

                    const genes = [];
                    this.modelgenes.forEach((item) => {
                        genes.push(item.id);
                    });

                    if (genes.indexOf(gene) == -1)
                        this.modelgenes.push({
                            id: gene,
                            reactions: [{ id: rxn.id, dispid: rxn.dispid }],
                        });
                    else
                        this.modelgenes[genes.indexOf(gene)].reactions.push({
                            id: rxn.id,
                            dispid: rxn.dispid,
                        });
                }

                rxn.equation = reactants + ' ' + sign + ' ' + products;
            }
            if (gfobjects.length > 0) {
                const p = self.modeltabs.kbapi('ws', 'get_objects', gfobjects).then((data) => {
                    for (let i = 0; i < data.length; i++) {
                        const solrxns =
                            data[i].data.gapfillingSolutions[0].gapfillingSolutionReactions;
                        for (let j = 0; j < solrxns.length; j++) {
                            const array = solrxns[j].reaction_ref.split('/');
                            let id = array.pop();
                            let rxnobj;
                            if (id in self.rxnhash) {
                                rxnobj = self.rxnhash[id];
                            } else {
                                const cmparray = solrxns[j].compartment_ref.split('/');
                                const cmp = cmparray.pop();
                                id = id + '_' + cmp + solrxns[j].compartmentIndex;
                                rxnobj = self.rxnhash[id];
                            }
                            if (typeof rxnobj != 'undefined') {
                                if (solrxns[j].direction == '<') {
                                    rxnobj.gapfilling.push('gf.' + (i + 1) + ': reverse');
                                } else {
                                    rxnobj.gapfilling.push('gf.' + (i + 1) + ': forward');
                                }
                                rxnobj.gapfillingstring = rxnobj.gapfilling.join('<br>');
                            }
                        }
                    }
                });
                return p;
            }
        };
    }

    // make method of base class
    KBModeling.prototype.KBaseFBA_FBAModel = KBaseFBA_FBAModel;
});
