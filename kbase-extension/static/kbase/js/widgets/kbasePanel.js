/*
    kbasePanel

    This is a helper widget for drawing panels.
    The panels are removable and minimizable

    API Example:
        var panel =  new kbasePanel(this.$elem, {title: 'Model Details',
                                           rightLabel: 'Super Workspace,
                                           subText: 'kb|g.super.genome '});
*/define (
	[
		'kbwidget',
		'bootstrap',
		'jquery'
	], (
		KBWidget,
		bootstrap,
		$
	) => {


return KBWidget({
    name: "kbasePanel",
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        const self = this;
        const title = options.title ? options.title : "Default Panel Heading";
        const subText = options.subText;
        const right_label = options.rightLabel;
        const body = options.body;
        const fav = options.fav;

        const id = options.id ? options.id : options.subText;
        const ws = options.ws ? options.ws : options.rightLabel;
        const type = options.type;
        const widget = options.widget;

        const drag = options.drag;

        const container = $('<div class="panel panel-default">'+
                                '<div class="panel-heading">'+
                                    '<span class="panel-title"></span>'+
                                    '<a class="pull-right btn-rm-panel text-muted hide"><span class="fa fa-times"></span></a>'+
                                    '<a class="pull-right btn-min-panel text-muted hide"><span class="fa fa-minus"></span></a> '+
                                    '<a class="btn-favorite pull-right" data-ws="'+ws+'" data-id="'+id+'" data-type="'+type+'">'+
                                    '</a>'+
                                    '<br>'+
                                    '<div class="panel-subtitle pull-left"></div>'+
                                '</div>'+
                                '<div class="panel-body"></div>'+
                           '</div>');

        const panel_header = container.find('.panel-heading');
        const panel_title = container.find('.panel-title');
        const panel_subtitle = container.find('.panel-subtitle');
        const panel_body = container.find('.panel-body');
        const fav_btn = container.find('.btn-favorite');
        const rm_panel_btn = container.find('.btn-rm-panel');
        const min_panel_btn = container.find('.btn-min-panel');

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
            const starred = fav_btn.find('span').hasClass('fa-star')
            console.log('starred', starred)
            fav_btn.find('span').toggleClass('fa-star-o');
            fav_btn.find('span').toggleClass('fa-star');
        }

        if (title) this.title(title);
        if (body) this.body(body);
        if (subText) panel_subtitle.append(subText);
        if (right_label) {
            panel_header.append('<span class="label label-primary pull-right">'
                                    +right_label+'</span><br>');
        }

        // change header cursor on only this widget
        panel_header.css('cursor', 'move')

        // event for removing panel
        rm_panel_btn.click(() => {
            container.slideUp(400, function(){
                $(this).remove();
            })
        });

        // event for minimizing panel
        min_panel_btn.click(() => {
            console.log('clicked')
            panel_body.slideToggle(400);
        });

        // event for hover on panel header
        panel_header.hover(function() {
            $(this).find('.fa').parent().toggleClass('hide');
        })


        rm_panel_btn.tooltip({title: 'Remove panel', placement: 'bottom', delay: {show: 700}});
        min_panel_btn.tooltip({title: 'Minimize panel', placement: 'bottom', delay: {show: 700}});

        // This is just a function for debugging purposes
        function resetQueue() {
            const p = kb.ujs.remove_state('favorites', 'queue');
        }

        //resetQueue();  //****THIS WILL DELETE the User's Favorites ****

        self.$elem.append(container);

        return this;
    }  //end init
})
});
