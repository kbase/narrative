function KBaseFBA_FBAModelSet(modeltabs) {
    var self = this;
    this.modeltabs = modeltabs;

    this.setMetadata = function (data) {
		this.workspace = data[7];
        this.objName = data[1];
        this.overview = {
			wsid: data[7]+"/"+data[1],
			objecttype: data[2],
			owner: data[5],
			instance: data[4],
			moddate: data[3]
        };
    };

    this.setData = function (indata) {
		this.data = indata;
		this.models = [];
		for (var obj in indata.elements) {
	    	this.models.push({"ref":indata.elements[obj]["ref"]});
		}
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
		}]
	}, {
		"key": "models",
		"name": "Models",
		"type": "dataTable",
		"columns": [{
			"label": "Model",
			"key": "ref",
			"linkformat": "dispWSRef",
			"type": "wstype",
			"wstype": "KBaseFBA.FBAModel"
		}]
	}];
}

// make method of base class
KBModeling.prototype.KBaseFBA_FBAModelSet = KBaseFBA_FBAModelSet;