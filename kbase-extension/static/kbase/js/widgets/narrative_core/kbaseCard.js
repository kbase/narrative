/**
 *  kbaseCard.js -- used for all modeling related modals
 *
 *  Authors:
 *      nconrad@anl.gov
 *
 *   This is a helper widget for rendering modals using bootstrap v3.0.0+
 *   The aim here is to have the simplest and maintainable API.
 *
 *   API
 *
 *   Basic Modal:
 *
 *      var modal =  new kbaseCard($('<div>'), {
 *         title: 'Model Details',
 *         subText: 'some subtext under title'
 *      });
 *
 *   See public methods below for rest of API.  It is self-documenting.
 *
*/

define (
    [
        'kbwidget',
        'bootstrap',
        'jquery'
    ], function(
        KBWidget,
        bootstrap,
        $
    ) {
        return KBWidget({
            name: 'kbaseCard',
            version: '1.0.0',
            options: {
            },
            init: function(options) {
                this._super(options);
                var self = this;
                
                //partitions
                var $content = $('<div/>', { 'class': 'kb-data-list-obj-row-main' });
                var $logo = $('<div>');
                var $main = $('<div/>', { 'class': 'kb-data-list-obj-row-main' });
                
                //main content
                var $name = $('<span>').addClass('kb-data-list-name').append(options.name);
                var $version = $('<span>').addClass('kb-data-list-version').append(options.version);
                var $type = $('<div>').addClass('kb-data-list-type').append(options.type);
                var $date = $('<span>').addClass('kb-data-list-date').append(options.date);
                var $byUser = $('<span>').addClass('kb-data-list-edit-by').append( options["edit-by"]);


                var $toggleAdvancedViewBtn =
                    $('<span>').addClass('kb-data-list-more') //.addClass('btn btn-default btn-xs kb-data-list-more-btn')
                        // .hide()
                        .html($('<button class="btn btn-xs btn-default pull-right" aria-hidden="true">')
                            .append('<span class="fa fa-ellipsis-h" style="color:#888" />'));
                $main.append($name)
                    .append($version)
                    //append palleteIcon and toggleIcon
                    .append('<br>')
                    .append($('<table>').css({ width: '100%' })
                        .append($('<tr>')
                            .append($('<td>').css({ width: '80%' })
                                .append($type).append($date).append($byUser))
                            .append($('<td>')
                                .append($toggleAdvancedViewBtn))));


                //create card
                $content.append($main);
                this.content = $content;
                return this;
            }  //end init
        });
    });
