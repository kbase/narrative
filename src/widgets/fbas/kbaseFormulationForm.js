(function( $, undefined ) {

$.KBWidget({
    name: "kbaseFormulationForm",
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;
        var token = options.auth;
        var media = options.id;
        var ws = options.ws;   
        var title = options.title ? options.title : "Set formulation";

        var fba = new fbaModelServices('http://140.221.85.73:4043/');
        var kbws = new workspaceService('http://kbase.us/services/workspace_service/');

        var container = $('<div id="kbase-formulation-form" class="panel panel-default">\
                                <div class="panel-heading">\
                                    <h4 class="panel-title">'+title+'</h4>\
                                </div>\
                                <div class="panel-body"></div>\
                           </div>');
        self.$elem.append(container);

        var panel_body = container.find('.panel-body');
        //panel_body.append('<p class="muted loader-rxn"> \
        //        <img src="../common/img/ajax-loader.gif"> loading...</p>')

        var test = [{label: "media", tag: 'input', type:'text', placeholder: 'optional', id: 'media'},
                    {label: "additionalcpds", tag: 'input', type:'text', placeholder: 'optional', id: 'additionalcpds'},
                    {label: "prommodel", tag: 'input', type:'text', placeholder: 'optional', id: 'prommodel'},
                    {label: "prommodel_workspace", tag: 'input', type:'text', placeholder: 'optional', id: 'prommodel_workspace'},
                    {label: "media_workspace", tag: 'input', type:'text', placeholder: 'optional', id: 'media_workspace'},
                    {label: "objfraction", tag: 'input', type:'text', placeholder: 'optional', id: 'objfraction'},

                    {label: "defaultmaxflux", tag: 'input', type:'text', 
                        placeholder: 'required',val:'100', id: 'defaultmaxflux', required: true},
                    {label: "defaultminuptake", tag: 'input', type:'text', 
                        placeholder: 'required',val:'-100', id: 'defaultminuptake', required: true},
                    {label: "defaultmaxuptake", tag: 'input', type:'text', 
                        placeholder: 'required', val: '0', id: 'defaultmaxuptake', required: true},

                    {label: "simplethermoconst", tag: 'checkbox', type:'checkbox', placeholder: 'optional', id: 'simplethermoconst'},
                    {label: "thermoconst", tag: 'checkbox', type:'checkbox', placeholder: 'optional', id: 'thermoconst'},
                    {label: "nothermoerror", tag: 'checkbox', type:'checkbox', placeholder: 'optional', id: 'nothermoerror'},
                    {label: "minthermoerror", tag: 'checkbox', type:'checkbox', placeholder: 'optional', id: 'minthermoerror'},                        
                    ];

        var form = form_builder(test)
        panel_body.append(form)

        /*
        media_id media;
        list<compound_id> additionalcpds;
        prommodel_id prommodel;
        workspace_id prommodel_workspace;
        workspace_id media_workspace;
        float objfraction;

        bool allreversible;
        bool maximizeObjective;
        list<term> objectiveTerms;
        list<feature_id> geneko;
        list<reaction_id> rxnko;
        list<bound> bounds;
        list<constraint> constraints;
        mapping<string,float> uptakelim;

        float defaultmaxflux;
        float defaultminuptake;
        float defaultmaxuptake;
        bool simplethermoconst;
        bool thermoconst;
        bool nothermoerror;
        bool minthermoerror;
        */
       


        function form_builder(objs) {
            var form = $('<form class="form-horizontal" role="form">');

            console.log(objs)
            for (var i in objs) {
                var obj = objs[i]

                if (obj.tag == 'input') {
                    var group = $('<div class="form-group">');
                    var label = $('<label for="'+obj.id+'" class="col-lg-4 control-label">'+obj.label+'</label>')
                    group.append(label)

                    var grid = $('<div class="col-lg-8">');
                    if (obj.required) {
                        grid.append('<input type="'+obj.type+'" id="'+obj.id+
                            '" class="form-control"  value="'+obj.val+'" required>');
                    } else {
                        grid.append('<input type="'+obj.type+'" id="'+obj.id+'" class="form-control" placeholder="'+obj.placeholder+'">');
                    }


                    group.append(grid)
                    form.append(group);                    
                } else if (obj.tag == 'checkbox') {
                    var group = $('<div class="form-group">');
                    var label = $('<label for="'+obj.id+'" class="col-lg-4 control-label">'+obj.label+'</label>')
                    group.append(label)

                    var grid = $('<div class="col-lg-8">');
                    grid.append('<input type="'+obj.type+'" id="'+obj.id+'" class="form-control" placeholder="'+obj.placeholder+'">')

                    group.append(grid)
                    form.append(group);       
                }
            }

            return form
        }

        //this._rewireIds(this.$elem, this);
        return this;
    }  //end init
})
}( jQuery ) );
