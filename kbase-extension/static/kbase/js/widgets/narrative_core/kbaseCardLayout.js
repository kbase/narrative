/**
 *  kbaseCard.js -- used for creating narrative cards
 *
 *  Authors:
 *      zzheng@lbl.gov
 *
 *   This the templating function for creating consistent card. Should be called through card 
 *    creating function such as kbaseDataCard.  
 * 
 *   API
 *
 *   Expected options:
 *      
 *     options : {
 *          actionButton (optional),
 *          logo,
 *          title,
 *          subcontent
 *          moreContent (optional)
 *      }
 *   
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
            var $toggleAdvancedViewBtn =$('<div>');

            //if have sub content, add toggle    
            if(options.moreContent) {
                $moreContent.append(options.moreContent);
                $toggleAdvancedViewBtn
                    .hide()
                    .html($('<button class="btn btn-xs btn-default pull-right" aria-hidden="true">')
                        .append('<span class="fa fa-ellipsis-h" style="color:#888" />'));
            }
            // .css({ 'white-space': 'nowrap', padding: '10px 15px' })
            var $actionButtonWrapper = $('<div>')
                .addClass('narrative-card-action-button-wrapper');

            var $actionButton = $('<button>')
                .addClass('kb-primary-btn')
                .addClass('narrative-card-action-button')
                .append($('<span>').addClass('fa fa-chevron-circle-left'))
                .append(options.actionButton);
            $actionButtonWrapper.append($actionButton);

            var $logo = options.logo.addClass('narrative-card-logo');
            var $title = options.title;
            var $subcontent = options.subcontent;

            $info.append($title)
                //append palleteIcon and toggleIcon
                .append($subcontent);
            
            if(options.actionButtonClick){
                $actionButtonWrapper.click(options.actionButtonClick);
            }
            if(options.actionButton) {
                $mainContent.append($actionButtonWrapper);
            }
          
            $mainContent.append($logo)
                .append($info)
                .append($('<div>').addClass('narrative-card-ellipsis')
                    .append($toggleAdvancedViewBtn))
                .mouseenter(function () {
                    $toggleAdvancedViewBtn.show();
                    $actionButton.show();
                })
                .mouseleave(function () {
                    $toggleAdvancedViewBtn.hide();
                    $actionButton.hide();
                }).click(function () {
                    $moreContent.slideToggle('fast');
                });
                
            $card.append($mainContent);
            if(options.moreContent) {
                $card.append($moreContent);
            }
            

            return $card;
        }
        return KbaseCardLayout;  //end init
    });
