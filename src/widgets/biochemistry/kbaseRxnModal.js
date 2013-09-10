(function( $, undefined ) {

$.KBWidget({
    name: "kbaseRxnModal",
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;
        var token = options.auth;

        var fba = new fbaModelServices('https://kbase.us/services/fba_model_services/');
        var kbws = new workspaceService('http://kbase.us/services/workspace_service/');        

        this.show = function(options) {
            var rxns = options.rxns
            var model_id = options.model_id;

            var modal = self.$elem.kbaseModal({title: "Reaction Info", 
                    subText: "Note: this view is currently under development."})
            var modal_body = modal.body('<p class="muted loader-rxn"> \
                    <img src="assets/img/ajax-loader.gif"> loading...</p>');

            modal.show();

            var selection_list = $('<ul id="rxn-tabs" class="sub-nav nav nav-tabs">');    
            for (var i in rxns) {
                var link = $('<a href="#'+rxns[i]+'" data-toggle="tab" >'+rxns[i]+'</a>');
                var li = $('<li>');
                if (i == 0 ) {
                    li.addClass('active');
                }
                li.append(link);
                selection_list.append(li);
            }

            modal_body.append(selection_list);
            
            var fbaAJAX = fba.get_reactions({reactions: rxns, auth: token})
            $.when(fbaAJAX).done(function(data){
                if (model_id) {
                    model_rxn_tab(modal_body, data);
                } else {
                    rxn_tab(modal_body, data)
                }
            })
        }

        function rxn_tab(container, data) {
            container.find('.loader-rxn').remove();

            for (var i in data) {
                var rxn = data[i];
                var cpds = get_cpds(rxn['equation']);
                var rxn_tab = $('<div id="'+rxn.id+'" class="tab-pane in"></div>');
                if (i != 0) {
                    rxn_tab.hide()
                }

                rxn_tab.append('<h4>'+rxn['name']+'</h4>');

                for (var i =0; i < cpds.left.length; i++) {
                    var cpd = cpds.left[i]                        
                    var img_url = 'http://bioseed.mcs.anl.gov/~chenry/jpeg/'+cpd+'.jpeg';
                    rxn_tab.append('<div class="pull-left text-center">\
                                        <img src="'+img_url+'" width=150 ><br>'
                                        +cpd+
                                    '</div>');

                    var plus = $('<div class="pull-left text-center">+</div>');
                    plus.css('margin', '30px 0 0 0');

                    if (i < cpds.left.length-1) {
                        rxn_tab.append(plus)
                    }
                }

                var direction = $('<div class="pull-left text-center">'+'<=>'+'</div>');
                direction.css('margin', '25px 0 0 0');
                rxn_tab.append(direction)

                for (var i =0; i < cpds.right.length; i++) {
                    var cpd = cpds.right[i]                        
                    var img_url = 'http://bioseed.mcs.anl.gov/~chenry/jpeg/'+cpd+'.jpeg';
                    rxn_tab.append('<div class="pull-left text-center">\
                                        <img src="'+img_url+'" width=150 ><br>'
                                        +cpd+
                                    '</div>');

                    var plus = $('<div class="pull-left text-center">+</div>');
                    plus.css('margin', '25px 0 0 0');

                    if (i < cpds.right.length-1) {
                        rxn_tab.append(plus)
                    }
                }

                rxn_tab.append('<br>')

                var table = $('<table class="table table-striped table-bordered">')
                for (var key in rxn) {
                    if (key == 'id') continue;
                    if (key == 'aliases') {
                        var value = rxn[key].join('<br>')
                    } else {
                        var value = rxn[key];
                    }
                    table.append('<tr><td>'+key+'</td><td>'+value+'</td></tr>');
                }
                rxn_tab.append(table)

                container.append(rxn_tab);
            }

        }

        function model_rxn_tab(data) {
            
        }

        function get_cpds(equation) {
            var cpds = {}
            var sides = equation.split('=');
            cpds.left = sides[0].match(/cpd\d*/g);
            cpds.right = sides[1].match(/cpd\d*/g);
            return cpds;
        }

        function get_genome_id(ws_id) {
            var pos = ws_id.indexOf('.');
            var ws_id = ws_id.slice(0, ws_id.indexOf('.', pos+1));
            return ws_id;
        }

        $('#rxn-tabs a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        })

        //this._rewireIds(this.$elem, this);
        return this;
    }  //end init
})
}( jQuery ) );
