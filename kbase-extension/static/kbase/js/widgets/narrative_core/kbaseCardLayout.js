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
            var $moreContent = $('<div/>', { 'class': 'narrative-card-row-more' }).hide();               
            var $info = $('<div/>', { 'class': 'kb-data-list-info' });
            var $toggleAdvancedViewBtn =
                $('<div>').addClass('narrative-card-ellipsis');

            //if have sub content, add toggle    
            if(options.moreContent) {
                $moreContent.append(options.moreContent);
                $toggleAdvancedViewBtn.hide()
                    .html($('<button class="btn btn-xs btn-default pull-right" aria-hidden="true">')
                        .append('<span class="fa fa-ellipsis-h" style="color:#888" />'));
            }
            
            var $actionButton = options.actionButton;
            var $logo = options.logo;
            var $title = options.title;
            var $subcontent = options.subcontent;

            $info.append($title)
                //append palleteIcon and toggleIcon
                .append($subcontent);
                
            if($actionButton) $mainContent.append($actionButton);



            //moreContent;
          
            $mainContent.append($logo)
                .append($info)
                .append($toggleAdvancedViewBtn)
                .mouseenter(function () {
                    $toggleAdvancedViewBtn.show();
                })
                .mouseleave(function () {
                    $toggleAdvancedViewBtn.hide();
                })
                .click(function(){
                    $moreContent.toggle();
                });
            $card.append($mainContent);
            $card.append($moreContent);
            

            return $card;
        }
        return KbaseCardLayout;  //end init
    });
