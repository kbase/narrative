(function( $, undefined ) {

$.KBWidget({
    name: "kbaseRunFba",
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;
        var ws = options.ws;
        var id = options.id;
        var formulation = options.formulation;


        var fba = new fbaModelServices('http://140.221.85.73:4043/');
        var kbws = new workspaceService('http://kbase.us/services/workspace_service/');


        var container = $('<div id="kbase-run-fba">')

        var body = $('<div class="fba-run-info"><b>Model:</b> '+id+'<br><br></div>')
        var fba_button = $('<button type="button" class="btn btn-primary run-fba-btn" disabled="disabled">Run FBA</button>');
        body.append(fba_button)

        var panel = container.kbasePanel({title: 'Run FBA', body: body.html()});

        self.$elem.append(container);

        $('.run-fba-btn').click(function() {
            var fbaAJAX = fba.queue_runfba({model: id, formulation: formulation, workspace: ws})
            self.$elem.append('<p class="muted loader-rxn"> \
                <img src="../common/img/ajax-loader.gif"> loading...</p>');
            $.when(fbaAJAX).done(function(data){
                console.log(data);
            })

        })




        //this._rewireIds(this.$elem, this);
        return this;
    }  //end init
})
}( jQuery ) );
