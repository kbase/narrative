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
        'bootstrap',
        'jquery'
    ], function(
        bootstrap,
        $
    ) {
        function KbaseCardLayout(options) {
            var self = this;
            //partitions
            var $card = $('<div/>', { 'class': 'narrative-card-row' });
            var $mainContent = $('<div/>', { 'class': 'narrative-card-row-main' });
            var $moreContent = $('<div/>', { 'class': 'narrative-card-row-more' });               

            var $info = $('<div/>', { 'class': 'kb-data-list-info' });

            var $actionButton = options.actionButton;
            var $logo = options.logo;
            var $title = options.title;
            var $subcontent = options.subcontent;
            var $toggleAdvancedViewBtn;

            $info.append($title)
                //append palleteIcon and toggleIcon
                .append($subcontent);
                
            if($actionButton) $mainContent.append($actionButton);


            //moreContent;
            var $toggleAdvancedViewBtn =
                $('<span>').addClass('narrative-card-more') //.addClass('btn btn-default btn-xs kb-data-list-more-btn')
                    // .hide()
                    .html($('<button class="btn btn-xs btn-default pull-right" aria-hidden="true">')
                        .append('<span class="fa fa-ellipsis-h" style="color:#888" />'));
            
            $mainContent.append($logo)
                .append($info)
                .append($toggleAdvancedViewBtn);

            $card.append($mainContent);
            
            if($moreContent){
                    //add toggle function
                $card.append($moreContent);
            }
            return $card;
        }
        return KbaseCardLayout;  //end init
    });
