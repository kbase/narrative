function KBaseSearch_GenomeSet(modeltabs) {
    var self = this;
    this.modeltabs = modeltabs;

    this.setMetadata = function (data) {
	this.workspace = data[7];
        this.objName = data[1];
        this.overview = {wsid: data[7]+"/"+data[1],
                         objecttype: data[2],
                         owner: data[5],
                         instance: data[4],
                         moddate: data[3]};
        // if there is user metadata, add it
        if ('Name' in data[10]) {
            this.usermeta = {name: data[10]["Name"],
                             source: data[10]["Source"]+"/"+data[10]["Source ID"],
                             type: data[10]["Type"]}

            $.extend(this.overview, this.usermeta)}
    };

    this.setData = function (indata) {
	this.data = indata;
	this.genome_refs = [];
	for (var obj in indata.elements) {
	    this.genome_refs.push({"ref":indata.elements[obj]["ref"]});
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
		},{
			"label": "Name",
			"key": "name"
		},{
			"label": "Source",
			"key": "source"
		}]
	}, {
		"key": "genome_refs",
		"name": "Genomes",
		"type": "dataTable",
		"columns": [{
			"label": "Genome",
			"key": "ref",
			"linkformat": "dispWSRef",
			"type": "wstype",
			"wstype": "KBaseGenomes.Genome"
		}]
	}];
}

// make method of base class
KBModeling.prototype.KBaseSearch_GenomeSet = KBaseSearch_GenomeSet;