


app.service('favoriteService', function() {
    var state_name = 'favorites';
    var state_key = 'queue';
    var status_ele = $('.fav-loading');
    var fav_count_ele = $('.favorite-count');

    this.add = function(ws, id, type) {
        console.log('adding', ws, id, type)

        status_ele.loading();
        var get_state_prom = kb.ujs.get_state(state_name, state_key, 0);
        var prom = $.when(get_state_prom).then(function(q) {
            if (!q) var q = [];

            var fav = {ws: ws, id: id, type: type}

            var isNew = true;
            /*for (var i in q) {
                if (angular.equals(fav, q[i])) {
                    isNew = false;
                    break;
                }
            }*/

            if (isNew) {
                q.push(fav);

                set_ui_count(q.length);            

                var p = kb.ujs.set_state(state_name, state_key, q);
                return p;            
            }

        }).fail(function() {
            var p = kb.ujs.set_state(state_name, state_key, []);

        });

        $.when(prom).then(function() {
            status_ele.rmLoading();
        })        

        return prom;
    }

    this.addFavs = function(fav_list) {
        console.log('adding fav list', fav_list)
        status_ele.loading();
        var get_state_prom = kb.ujs.get_state(state_name, state_key, 0);
        var prom = $.when(get_state_prom).then(function(q) {
            if (!q) var q = [];

            for (var i in fav_list) {
                var fav = fav_list[i];
                var isNew = true;

                if (isNew) q.push(fav);
            }

            set_ui_count(q.length);

            console.log('calling set state with', q)
            var p = kb.ujs.set_state(state_name, state_key, q);
            return p;
        }).fail(function() {
            console.error('error setting fav state')
        });

        $.when(prom).then(function() {
            status_ele.rmLoading();
        })

        return prom;
    }   

    this.remove = function(ws, id, type) {
        console.log('removing', ws, id, type)
        status_ele.loading();
        var get_state_prom = kb.ujs.get_state(state_name, state_key, 0);
        var prom = $.when(get_state_prom).then(function(q) {
            if (!q) q = [];

            for (var i = 0; i < q.length; i++) {
                if (q[i].ws == ws && q[i].id == id 
                    && q[i].type == type) {
                    q.splice(i, 1);
                }
            }

            set_ui_count(q.length);
            var p = kb.ujs.set_state(state_name, state_key, q);
            return p;
        });

        $.when(prom).then(function() {
            status_ele.rmLoading();
        })

        return prom;
    }

    this.clear = function() {
        status_ele.loading();
        var p = kb.ujs.set_state(state_name, state_key, []);

        $.when(p).then(function(){
            set_ui_count(0);
            status_ele.rmLoading();
        })
        return p;
    }
   

    function set_ui_count(count) { 
        fav_count_ele.text(count);
        status_ele.rmLoading();
    }

});


app.service('MVService', function() {
    this.org_name;


})
 

