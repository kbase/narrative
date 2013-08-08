(function( $, undefined ) {

$.kbWidget("kbaseRxnMeta", 'kbaseWidget', {
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var rxns = options.ids;
        var workspaces = options.workspaces;
        var token = options.auth;

        this.$elem.append('<div id="kbase-rxn-meta" class="panel">\
                                <div class="panel-heading"><b>Central Carbon Core Pathway</b><br> '
                                +models[0]+
                                ' <div style="float:right;">Workspace: '+workspaces[0]+'</div></div>\
                                <div id="core-model" style="overflow: auto;"><div>\
                           </div>');

        var container = $('#kbase-rxn-meta');

        container.append('<p class="muted loader-overview"> \
                <img src="../common/img/ajax-loader.gif"> loading...</p>')

        var fba = new fbaModelServices('https://kbase.us/services/fba_model_services/');
        var kbws = new workspaceService('http://kbase.us/services/workspace_service/');

        $('#rxn-modal').modal();
        $('#rxn-modal .modal-header').html('<h3>Reaction Info</h3><span class="text-error">Note: this view is currently under development.</span>');

        var selection_list = $('<ul class="sub-nav nav nav-tabs">');    
        for (var i in rxn_list) {
            var link = $('<a class="rxn-selection" data-rxn-selector="'+rxn_list[i]+'" >'+rxn_list[i]+'</a>');
            var li = $('<li>');
            if (i == 0 ) {
                li.addClass('active');
            }        
            li.append(link);
            selection_list.append(li);
        }

        $('#rxn-modal .modal-body').html(selection_list);

        var fbaAJAX = fba.get_reactions({reactions: rxn_list, auth: USER_TOKEN})
        $('#rxn-modal .modal-body').append('<p class="muted loader-rxn" > \
                          <img src="img/ajax-loader.gif"> loading...</p>');

        $.when(fbaAJAX).done(function(data){
             $('.loader-rxn').remove();

            for (var i in data) {
                var rxn = data[i];
                var cpds = get_cpds(rxn['equation']);
                var rxn_tab = $('<div id="rxn-tab-'+rxn.id+'" class="rxn-tab-view"></div>');
                if (i != 0) {
                    rxn_tab.addClass('hide')
                }

                rxn_tab.append('<h4>'+rxn['name']+'</h4>');

                for (var i in cpds) {
                    var img_url = 'http://bioseed.mcs.anl.gov/~chenry/jpeg/'+cpds[i]+'.jpeg';
                    rxn_tab.append('<img src="'+img_url+'" >');
                }

                var table = $('<table class="table">')
                for (var key in rxn) {
                    if (key == 'id') continue;
                    table.append('<tr><td>'+key+'</td><td>'+rxn[key]+'</td></tr>');
                }
                rxn_tab.append(table)

                $('#rxn-modal .modal-body').append(rxn_tab);
            }

            // if reaction info for a particular model
            if (model_id) {
                var genome = get_genome_id(model_id)
                console.log(genome)


            }

            $('.rxn-selection').click(function() {
                // switch selected tab
                $('.sub-nav li').removeClass('active')
                $(this).parent('li').addClass('active'); 

                // switch view
                $('.rxn-tab-view').hide();
                var rxn = $(this).data('rxn-selector');
                $('#rxn-tab-'+rxn).show();
            })
        })


        function get_cpds(equation) {
            var cpds = equation.match(/cpd\d*/g);
            return cpds;
        }



        function get_genome_id(ws_id) {
            var pos = ws_id.indexOf('.');
            var ws_id = ws_id.slice(0, ws_id.indexOf('.', pos+1));
            return ws_id;
        }

        function events() {
        }

        this.hideView = function(){
            container.hide()
        }

        this.showView = function(){
            container.show()
        }

        this.destroyView = function(){
            container.remove();
        }

        //this._rewireIds(this.$elem, this);

        return this;
    }  //end init
})
}( jQuery ) );
