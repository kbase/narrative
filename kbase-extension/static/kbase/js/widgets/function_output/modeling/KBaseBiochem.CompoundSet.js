function KBaseBiochem_CompoundSet(tabwidget) {
    var self = this;
    this.tabwidget = tabwidget;

    this.setMetadata = function (data) {
        this.overview = {wsid: data[7]+"/"+data[1],
                         objecttype: data[2],
                         owner: data[5],
                         instance: data[4],
                         moddate: data[3]}
    };

    this.setData = function (data) {
        this.data = data;
        this.compounds = this.data.compounds;
        this.cpdhash = {};
        var cpdarray = [];

        for (var i=0; i< this.compounds.length; i++) {
            var cpd = this.compounds[i];
            this.cpdhash[cpd.id] = cpd;
            cpdarray.push(cpd.id);
        }
    };

    this.CompoundTab = function (info) {
        var cpd = this.cpdhash[info.id];
        console.log('info', cpd)

        var output = [{
            "label": "Compound",
            "data": cpd.id,
        }, {
        "label": "Image",
            "data": cpd.img
        }, {
            "label": "Name",
            "data": cpd.name
        }, {
            "label": "Formula",
            "data": cpd.formula
        }, {
            "label": "Charge",
            "data": cpd.charge
        }, {
            "label": "Mass",
            "data": cpd.mass
        }, {
            "label": "InChIKey",
            "data": cpd.inchikey
        }, {
            "label": "SMILES",
            "data": cpd.smiles
        }, {
            "label": "Concentration",
            "data": cpd.concentration
        }];
        if (cpd.smiles) {
		    var p = self.tabwidget.kbapi('biochem', 'depict_compounds', {structures: [cpd.smiles]
		    }).then(function(data) {
                    output[1] = {
						"label": "Image",
						"data": data[0]
					};
					return output;
                });
            return p;
		}
		return output;
    }

    this.tabList = [{
        "key": "overview",
        "name": "Overview",
        "type": "verticaltbl",
        "rows": [{
            "label": "ID",
            "key": "wsid"
        },{
            "label": "Object type",
            "key": "objecttype",
            "type": "typelink"
        },{
            "label": "Owner",
            "key": "owner"
        },{
            "label": "Version",
            "key": "instance"
        },{
            "label": "Mod-date",
            "key": "moddate"
        },{
            "label": "Name",
            "key": "name"
        },{
            "label": "Description",
            "key": "description"
        },{
            "label": "Number compounds",
            "key": "numcompounds"
        }]
    }, {
        "key": "compounds",
        "name": "Media compounds",
        "type": "dataTable",
        "columns": [
        {
            "label": "Compound",
            "key": "id",
            "type": "tabLink",
            "linkformat": "dispID",
            "method": "CompoundTab",
        }, {
            "label": "Name",
            "key": "name"
        }, {
            "label": "Formula",
            "key": "formula"
        }, {
            "label": "Charge",
            "key": "charge"
        }, {
            "label": "InChIKey",
            "key": "inchikey"
        }, {
            "label": "Mass",
            "key": "mass"
        }]
    }];
};
// make method of base class
KBModeling.prototype.KBaseBiochem_CompoundSet = KBaseBiochem_CompoundSet;