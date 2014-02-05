(function( $, undefined ) {

$.KBWidget({
    name: "kbaseCpd",
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;
        var data = options.data;
        var ids = options.ids;
        console.log(data)
        var container = this.$elem;

        var cpds = [];
        for (var i in data) {
            if (data[i] == null) {
                container.append('<div class="alert alert-danger">'
                    +ids[i]+' not found</div>')
                continue;
            }
            cpds.push(data[i].id);
        }

        var selection_list = $('<ul id="cpd-tabs" class="nav nav-tabs">');    
        for (var i in cpds) {
            var link = $('<a href="#'+cpds[i]+'" data-toggle="tab">'+cpds[i]+'</a>');
            var li = $('<li>');
            if (i == 0 ) li.addClass('active');

            li.append(link);
            selection_list.append(li);
        }

        container.append(selection_list);
        
        cpd_tabs(data);


        function cpd_tabs(data, id) {
            var tabs = $('<div class="tab-content"></div>')

            for (var i in data) {
                var cpd = data[i];

                var tab = $('<div id="'+cpd.id+'" class="tab-pane"></div>');
                if (i == 0 ) tab.addClass('active');

                var name = cpd['name'];
                tab.append('<h4>'+name+'</h4>');

                var img_url = 'http://bioseed.mcs.anl.gov/~chenry/jpeg/'+cpd.id+'.jpeg';
                tab.append('<div class="pull-left text-center">\
                                    <img src="'+img_url+'" width=300 ><br>\
                                    <div class="cpd-id" data-cpd="'+cpd.id+'">'+name+'</div>\
                                </div>');

                var plus = $('<div class="pull-left text-center">+</div>');
                plus.css('margin', '30px 0 0 0');


                var table = $('<table class="table table-striped table-bordered">');
                for (var key in cpd) {
                    if (key == 'id') continue;
                    if (key == 'aliases') {
                        var value = cpd[key].join('<br>')
                    } else {
                        var value = cpd[key];
                    }
                    table.append('<tr><td>'+key+'</td><td>'+value+'</td></tr>');
                }
                tab.append(table)

                tabs.append(tab)
            }
            container.append(tabs);


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

        //this._rewireIds(this.$elem, this);
        return this;
    }  //end init
})
}( jQuery ) );
