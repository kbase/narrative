/* 
    kbasePanel

    This is a helper widget for drawing panels.

    API Example:
        var panel = this.$elem.kbasePanel({title: 'Model Details', 
                                           rightLabel: 'Super Workspace,
                                           subText: 'kb|g.super.genome '});
*/

(function( $, undefined ) {

$.KBWidget({
    name: "kbasePanel",
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;
        var title = options.title ? options.title : "Default Panel Heading";
        var subText = options.subText;
        var right_label = options.rightLabel;
        var body = options.body;
        var fav = options.fav;

        var id = options.id ? options.id : options.subText;
        var ws = options.ws ? options.ws : options.rightLabel;
        var type = options.type;
        var widget = options.widget;

        var drag = options.drag;

        var container = $('<div class="panel panel-default">'+
                                '<div class="panel-heading">'+
                                    '<span class="panel-title"></span>'+
                                    '<a class="pull-right btn-rm-panel text-muted"><span class="glyphicon glyphicon-remove"></span></a>'+
                                    '<a class="btn-favorite pull-right" data-ws="'+ws+'" data-id="'+id+'" data-type="'+type+'">'+
                                    (fav ? '<span class="glyphicon glyphicon-star"></span>'  :
                                        '<span class="glyphicon glyphicon-star-empty"></span>')+
                                    '</a>'+
                                    '<div class="panel-subtitle"></div>'+
                                '</div>'+
                                '<div class="panel-body"></div>'+
                           '</div>');

        var panel_header = container.find('.panel-heading');
        var panel_title = container.find('.panel-title');
        var panel_subtitle = container.find('.panel-subtitle');        
        var panel_body = container.find('.panel-body');
        var fav_btn = container.find('.btn-favorite');
        var rm_panel_btn = container.find('.btn-rm-panel');        

        this.header = function(data) {
            if (data) panel_header.html(data);
            return panel_header;
        }

        this.title = function(data) {
            if (data) panel_title.html(data);
            return panel_title;
        }

        this.subText = function(data) {
            if (data) panel_subtitle.html(data)
            return panel_subtitle;            
        }

        this.body = function(data) {
            if (data) panel_body.html(data); 
            this.rmLoading();         
            return panel_body;
        }

        this.loading = function() {
            panel_body.html('<p class="muted ajax-loader"> \
                <img src="assets/img/ajax-loader.gif"> loading...</p>');
        }

        // deprecated?  I think this method could be handy
        this.rmLoading = function() {
            panel_body.find('.ajax-loader').remove();
        }

        this.toggleFavorite = function() {
            var starred = fav_btn.find('span').hasClass('glyphicon-star')
            console.log('starred', starred)
            fav_btn.find('span').toggleClass('glyphicon-star-empty');
            fav_btn.find('span').toggleClass('glyphicon-star');
        }

        if (title) this.title(title);
        if (body) this.body(body); 
        if (subText) panel_header.append(subText)

        if (right_label) {
            panel_header.append('<span class="label label-primary pull-right">'
                                    +right_label+'</span><br>');
        }

        kb = new KBCacheClient(USER_TOKEN);
        function addFavorite(ws, id, type, widget) {
            var get_state_prom = kb.ujs.get_state('favorites', 'queue', 0);
            var prom = $.when(get_state_prom).then(function(queue) {
                console.log('queue', queue)
                if (!queue) var queue = [];

                queue.push({ws: ws, id: id, widget: widget, type: type});
                console.log('saving queue', queue)
                var p = kb.ujs.set_state('favorites', 'queue', queue);
                return p;
            }).fail(function() {
                var p = kb.ujs.set_state('favorites', 'queue', []);

            });

            return prom;
        }

        function rmFavorite(ws, id, type, widget) {
            var get_state_prom = kb.ujs.get_state('favorites', 'queue', 0);
            var prom = $.when(get_state_prom).then(function(q) {
                if (!q) q = [];

                for (var i = 0; i < q.length; i++) {
                    if (q[i].ws == ws && q[i].id == id 
                        && q[i].widget == widget && q[i].type == type) {
                        q.splice(q.indexOf(i), 1);
                    }
                }

                var p = kb.ujs.set_state('favorites', 'queue', q);
                return p;
            });

            return prom;
        }        

        // mark as favorite, if found in user job state service
        var prom = kb.ujs.get_state('favorites', 'queue', 0);
        $.when(prom).done(function(queue) {
            var favorites = queue;

            for (var i in favorites) { 
                if (favorites[i].ws == ws && favorites[i].id == id && favorites[i].widget == widget) {
                    fav_btn.find('span').removeClass('glyphicon-star-empty');
                    fav_btn.find('span').addClass('glyphicon-star');
                }
            }
        })


        // event for favoriting 
        fav_btn.find('span').unbind('click');
        fav_btn.find('span').click(function() {
            if (fav_btn.find('span').hasClass('glyphicon-star-empty')) {
                console.log('adding favorite: ', ws, id, type, widget)
                addFavorite(ws, id, type, widget);
                self.toggleFavorite();
                $('.favorite-count').text(parseInt($('.favorite-count').text())+1)                
            } else {
                rmFavorite(ws, id, type, widget);
                self.toggleFavorite();
                $('.favorite-count').text(parseInt($('.favorite-count').text())-1)
                container.remove()
            }
        })

        // event for removing panel
        rm_panel_btn.click(function() {
            container.slideUp(400, function(){
                $(this).remove();
            })
        })

        // This is just a function for debugging purposes
        function resetQueue() {
            var p = kb.ujs.remove_state('favorites', 'queue');
        }
        //resetQueue();  //****THIS WILL DELETE the User's Favorites ****

        self.$elem.append(container);

        return this;
    }  //end init
})
}( jQuery ) );

