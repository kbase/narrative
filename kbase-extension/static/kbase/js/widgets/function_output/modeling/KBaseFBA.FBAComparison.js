function KBaseFBA_FBAComparison(modeltabs) {
    var self = this;
    this.modeltabs = modeltabs;

    this.setMetadata = function (data) {
        this.workspace = data[7];
        this.objName = data[1];
        this.overview = {wsid: data[7]+"/"+data[1],
                         ws: data[7],
                         obj_name: data[1],
                         objecttype: data[2],
                         owner: data[5],
                         instance: data[4],
                         moddate: data[3],
                         commonreactions: data[10]["Common reactions"],
                         commoncompounds: data[10]["Common compounds"],
                         numfbas: data[10]["Number FBAs"],
                         numreactions: data[10]["Number reactions"],
                         numcompounds: data[10]["Number compounds"]};
    };

	this.cmpnamehash = {
		"c":"Cytosol",
		"p":"Periplasm",
		"g":"Golgi apparatus",
		"e":"Extracellular",
		"r":"Endoplasmic reticulum",
		"l":"Lysosome",
		"n":"Nucleus",
		"d":"Plastid",
		"m":"Mitochondria",
		"x":"Peroxisome",
		"v":"Vacuole",
		"w":"Cell wall",
	};

    this.tabList = [{
        "key": "overview",
        "name": "Overview",
        "type": "verticaltbl",
        "rows": [{
            "label": "Name",
            "key": "name"
        },{
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
            "label": "Number FBAs",
            "key": "numfbas"
        },{
            "label": "Number reactions",
            "key": "numreactions"
        },{
            "label": "Common reactions",
            "key": "commonreactions"
        },{
            "label": "Number compounds",
            "key": "numcompounds"
        },{
            "label": "Common compounds",
            "key": "commoncompounds"
        }
        ]
    }, {
        "key": "fbas",
    	"name": "Flux Balance Analyses",
        "type": "dataTable",
    	"columns": [{
            "label": "FBA",
            "key": "fba",
            "type": "wstype",
            "linkformat": "dispWSRef"
        }, {
        	"label": "Model",
            "key": "model",
            "type": "wstype",
            "linkformat": "dispWSRef"
        }, {
        	"label": "Media",
             "key": "media",
            "type": "wstype",
            "linkformat": "dispWSRef"
        }, {
            "label": "Objective",
            "key": "objective",
        }, {
            "label": "Reactions",
            "key": "rxndata",
        }, {
            "label": "Exchanges",
            "key": "exchangedata"
        }]
    }, {
        "key": "fbacomparisons",
    	"name": "FBA Comparisons",
        "type": "dataTable",
    	"columns": [{
            "label": "Index",
            "key": "index",
        }, {
            "label": "FBA",
            "key": "fba",
            "type": "wstype",
            "linkformat": "dispWSRef"
        }]
    }, {
        "key": "modelreactions",
        "name": "Reactions",
        "type": "dataTable",
        "columns": [{
            "label": "Reaction",
            "type": "tabLink",
            "linkformat": "dispIDCompart",
            "key": "id",
            "method": "ReactionTab"
        }, {
            "label": "Name",
            "key": "name"
        }, {
            "label": "Equation",
            "key": "equation",
            "type": "tabLink",
            "linkformat": "linkequation",
		}, {
            "label": "FBAs",
            "key": "numfba"
		}, {
            "label": "Most common state",
            "key": "mostcommonstate"
		}, {
            "label": "Inactive states",
            "key": "inactivestates"
        }, {
            "label": "Forward states",
            "key": "forwardstates"
        }, {
            "label": "Reverse states",
            "key": "reversestates"
        }]
    }, {
        "key": "modelcompounds",
        "name": "Compounds",
        "type": "dataTable",
        "columns": [{
            "label": "Compound",
            "type": "tabLink",
            "linkformat": "dispIDCompart",
            "key": "id",
            "method": "CompoundTab",
        }, {
            "label": "Exchange",
            "key": "exchange"
        }, {
            "label": "Formula",
            "key": "formula"
        }, {
            "label": "Charge",
            "key": "charge"
        }, {
            "label": "FBAs",
            "key": "numfba"
		}, {
            "label": "Most common state",
            "key": "mostcommonstate"
		}, {
            "label": "Inactive states",
            "key": "inactivestates"
        }, {
            "label": "Uptake states",
            "key": "uptakestates"
        }, {
            "label": "Excretion states",
            "key": "excretionstates"
        }]
    }];

	this.ReactionTab = function (info) {
        var rxn = self.rxnhash[info.id];
		var output = [{
			"label": "Reaction",
			"data": rxn.dispid,
		}, {
			"label": "Name",
			"data": rxn.name
		}, {
			label: "Equation",
			data: rxn.equation,
            type: "pictureEquation"
        }, {
			label: "Inactive FBAs",
			data: rxn.inactivestates
		}, {
			label: "Forward FBAs",
			data: rxn.forwardstates
		}, {
			label: "Reverse FBAs",
			data: rxn.reversestates
		}];
		return output;
    }

    this.CompoundTab = function (info) {
        var cpd = self.cpdhash[info.id];
		var output = [{
			"label": "Compound",
			"data": cpd.dispid,
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
            "label": "Most common state",
            "data": cpd.mostcommonstate
		}, {
            "label": "Inactive states",
            "data": cpd.inactivestates
        }, {
            "label": "Uptake states",
            "data": cpd.uptakestates
        }, {
            "label": "Excretion states",
            "data": cpd.excretionstates
		}];

		return output;
    }

    this.CompareTab = function (info) {
        var cpd = self.cpdhash[info.id];
		var output = [{
			"label": "Compound",
			"data": cpd.dispid,
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
            "label": "Most common state",
            "data": cpd.mostcommonstate
		}, {
            "label": "Inactive states",
            "data": cpd.inactivestates
        }, {
            "label": "Uptake states",
            "data": cpd.uptakestates
        }, {
            "label": "Excretion states",
            "data": cpd.excretionstates
		}];

		return output;
    }

    this.setData = function (indata) {
        this.data = indata;
        this.fbas = this.data.fbas;
        this.cpdhash = {};
        this.rxnhash = {};
        this.fbahash = {};
        this.fbacomparisons = [];
        for (var i=0; i< this.fbas.length; i++) {
        	this.fbacomparisons[i] = {};
        	this.fbahash[this.fbas[i].id] = this.fbas[i];
        	var item = "F"+(i+1);
        	this.tabList[2]["columns"].push({
    			"label": item,
            	"key": item
    		});
    		this.fbas[i]["dispid"] = this.fbas[i].id.split("/")[1];
    		this.fbas[i]["fba"] = this.fbas[i]["fba_ref"];
    		this.fbas[i]["model"] = this.fbas[i]["fbamodel_ref"];
    		this.fbas[i]["media"] = this.fbas[i]["media_ref"];
    		this.fbas[i]["rxndata"] = "Inactive: "+(this.fbas[i]["reactions"]-this.fbas[i]["active_reactions"])+"<br>Active: "+this.fbas[i]["active_reactions"];
    		this.fbas[i]["exchangedata"] = "Available: "+(this.fbas[i]["compounds"]-this.fbas[i]["uptake_compounds"]-this.fbas[i]["excretion_compounds"])+"<br>Uptake: "+this.fbas[i]["uptake_compounds"]+"<br>Excretion: "+this.fbas[i]["excretion_compounds"];
    		var fbaabbrev = "F"+(i+1);
    		this.fbacomparisons[i]["fba"] = this.fbas[i]["fba"];
    		this.fbacomparisons[i]["index"] = fbaabbrev;
    		for (var j=0; j< this.fbas.length; j++) {
    			fbaabbrev = "F"+(j+1);
    			if (j != i) {
    				if (this.fbas[j].id in this.fbas[i]["fba_similarity"]) {
						var simdata = this.fbas[i]["fba_similarity"][this.fbas[j]["id"]];
						rfraction = Math.round(100*(simdata[1]+simdata[2]+simdata[3])/simdata[0])/100;
						cfraction = Math.round(100*(simdata[5]+simdata[6]+simdata[7])/simdata[4])/100;
						var text = "R: "+rfraction+"<br>C: "+cfraction;
						var tooltip = "Common reactions: "+simdata[0]+"&#013;Common forward: "+simdata[1]+"&#013;Common reverse: "+simdata[2]+"&#013;Common inactive: "+simdata[3]+"&#013;Common compounds: "+simdata[4]+"&#013;Common uptake: "+simdata[5]+"&#013;Common excretion: "+simdata[6]+"&#013;Common inactive: "+simdata[7];
						this.fbacomparisons[i][fbaabbrev] = "<p title=\""+tooltip+"\">"+text+"</p>";
					}
    			} else {
					this.fbacomparisons[i][fbaabbrev] = "<p title=\"Reactions: "+this.fbas[i].reactions+"&#013;Compounds: "+this.fbas[i].compounds+"\">R: 1<br>C: 1</p>";
    			}
    		}
    	}

        this.modelreactions = this.data.reactions;
        for (var i=0; i< this.modelreactions.length; i++) {
        	var idarray = this.modelreactions[i]["id"].split('_');
        	var namearray = this.modelreactions[i]["name"].split('_');
        	this.modelreactions[i]["name"] = namearray[0];
            this.modelreactions[i].dispid = idarray[0]+"["+idarray[1]+"]";
        	this.rxnhash[this.modelreactions[i].id] = this.modelreactions[i];
        	var reactants = "";
            var products = "";
            var sign = "<=>";
            if (this.modelreactions[i].direction == ">") {
                sign = "=>";
            } else if (this.modelreactions[i].direction == "<") {
                sign = "<=";
            }
            for (var j=0; j< this.modelreactions[i].stoichiometry.length; j++) {
                var rgt = this.modelreactions[i].stoichiometry[j];
                idarray = rgt[2].split('_');
                namearray = rgt[1].split('_');
                if (rgt[0] < 0) {
                    if (reactants.length > 0) {
                        reactants += " + ";
                    }
                    if (rgt[0] != -1) {
                        var abscoef = Math.round(-1*100*rgt[0])/100;
                        reactants += "("+abscoef+") ";
                    }
                    reactants += namearray[0]+"["+idarray[1]+"]";
                } else {
                    if (products.length > 0) {
                        products += " + ";
                    }
                    if (rgt[0] != 1) {
                        var abscoef = Math.round(100*rgt[0])/100;
                        products += "("+abscoef+") ";
                    }
                    products += namearray[0]+"["+idarray[1]+"]";
                }
            }
        	this.modelreactions[i].equation = reactants+" "+sign+" "+products;
        	this.modelreactions[i].numfba = 0;
        	var percent = Math.floor(100*this.modelreactions[i].state_conservation[this.modelreactions[i].most_common_state][1]);
        	this.modelreactions[i].mostcommonstate = this.modelreactions[i].most_common_state+" ("+percent+"%)";
        	this.modelreactions[i].inactivestates = "None";
        	this.modelreactions[i].forwardstates = "None";
        	this.modelreactions[i].reversestates = "None";
        	for (var key in this.modelreactions[i].reaction_fluxes) {
        		this.modelreactions[i].numfba++;
        		if (this.modelreactions[i].reaction_fluxes[key][0] == "IA") {
        			if (this.modelreactions[i].inactivestates == "None") {
        				this.modelreactions[i].inactivestates = "Count: "+this.modelreactions[i].state_conservation["IA"][0]+"<br>"+key;
        			} else {
        				this.modelreactions[i].inactivestates += "<br>"+key;
        			}
        		} else if (this.modelreactions[i].reaction_fluxes[key][0] == "FOR") {
        			if (this.modelreactions[i].forwardstates == "None") {
        				this.modelreactions[i].forwardstates = "Average: "+this.modelreactions[i].state_conservation["FOR"][2]+" +/- "+this.modelreactions[i].state_conservation["FOR"][3]+"<br>"+key+": "+this.modelreactions[i].reaction_fluxes[key][5];
        			} else {
        				this.modelreactions[i].forwardstates += "<br>"+key+": "+this.modelreactions[i].reaction_fluxes[key][5];
        			}
        		} else if (this.modelreactions[i].reaction_fluxes[key][0] == "REV") {
        			if (this.modelreactions[i].reversestates == "None") {
        				this.modelreactions[i].reversestates = "Average: "+this.modelreactions[i].state_conservation["REV"][2]+" +/- "+this.modelreactions[i].state_conservation["REV"][3]+"<br>"+key+": "+this.modelreactions[i].reaction_fluxes[key][5];
        			} else {
        				this.modelreactions[i].reversestates += "<br>"+key+": "+this.modelreactions[i].reaction_fluxes[key][5];
        			}
        		}
        	}
    	}

    	this.modelcompounds = this.data.compounds;
        for (var i=0; i< this.modelcompounds.length; i++) {
        	this.cpdhash[this.modelcompounds[i].id] = this.modelcompounds[i];
        	var idarray = this.modelcompounds[i]["id"].split('_');
        	var namearray = this.modelcompounds[i]["name"].split('_');
        	this.modelcompounds[i]["name"] = namearray[0];
            this.modelcompounds[i].dispid = idarray[0]+"["+idarray[1]+"]";
        	this.modelcompounds[i].exchange = " => "+this.modelcompounds[i].name+"["+namearray[1]+"]";
        	this.modelcompounds[i].numfba = 0;
        	var percent = Math.floor(100*this.modelcompounds[i].state_conservation[this.modelcompounds[i].most_common_state][1]);
        	this.modelcompounds[i].mostcommonstate = this.modelcompounds[i].most_common_state+" ("+percent+"%)";
        	if ("UP" in this.modelcompounds[i].state_conservation) {
        		this.modelcompounds[i].uptakestates = "Average: "+this.modelcompounds[i].state_conservation["UP"][2]+" +/- "+this.modelcompounds[i].state_conservation["UP"][3];
        	} else {
        		this.modelcompounds[i].uptakestates = "None";
        	}
        	if ("EX" in this.modelcompounds[i].state_conservation) {
        		this.modelcompounds[i].excretionstates = "Average: "+this.modelcompounds[i].state_conservation["EX"][2]+" +/- "+this.modelcompounds[i].state_conservation["EX"][3];
        	} else {
        		this.modelcompounds[i].excretionstates = "None";
        	}
        	if ("IA" in this.modelcompounds[i].state_conservation) {
        		this.modelcompounds[i].inactivestates = "Count: "+this.modelcompounds[i].state_conservation["IA"][0];
        	} else {
        		this.modelcompounds[i].inactivestates = "None";
        	}
        	for (var key in this.modelcompounds[i].exchanges) {
        		this.modelcompounds[i].numfba++;
        		if (this.modelcompounds[i].exchanges[key][0] == "UP") {
        			this.modelcompounds[i].uptakestates += "<br>"+key+": "+this.modelcompounds[i].exchanges[key][5];
        		} else if (this.modelcompounds[i].exchanges[key][0] == "EX") {
        			this.modelcompounds[i].excretionstates += "<br>"+key+": "+(-1*this.modelcompounds[i].exchanges[key][5]);
        		} else {
        			this.modelcompounds[i].inactivestates += "<br>"+key;
        		}
        	}
        }

    };

}

// make method of base class
KBModeling.prototype.KBaseFBA_FBAComparison = KBaseFBA_FBAComparison;
