/**
 *  kbaseCard.js -- used for creating narrative cards layouts
 *
 *  Authors: zzheng@lbl.gov
 *
 *   This the templating function for creating consistent card. Should be called through card 
 *    creating function such as kbaseDataCard.  
 *
 *   Expected options:
 *     options : {
 *          logo:  jqeuery object containing stylized logo,
 *          actionButtonText: jquery obejct of content to be shown on button,
 *          actionButtonClick :callback attached to actionButton,
 *          title: jquery object containing text to be shown on title line,
 *          subcontent: jquery object containing text to be below title line,
 *          moreContent jquery object shown when expanding card
 *      }
*/

define ([
    'jquery',

    'bootstrap'
], (
    $
) => {
    'use strict';
    function KbaseCardLayout(options) {
        //partitions
        const $card = $('<div>').addClass('narrative-card-row');
        const $mainContent = $('<div>').addClass('narrative-card-row-main');
        const $moreContent = $('<div>').addClass('narrative-card-row-more').hide();
        const $info = $('<div>').addClass('kb-data-list-info');
            
        const $toggleAdvancedViewBtn =$('<div>');

        //if have sub content, add toggle    
        if (options.moreContent) {
            $moreContent.append(options.moreContent);
            $toggleAdvancedViewBtn
                .hide()
                .html($('<button class="btn btn-xs btn-default pull-right" aria-hidden="true">')
                    .append('<span class="fa fa-ellipsis-h" style="color:#888" />'));
        }
        const $actionButtonWrapper = $('<div>')
            .addClass('narrative-card-action-button-wrapper');

        const $actionButton = $('<button>')
            .addClass('kb-primary-btn')
            .addClass('narrative-card-action-button')
            .append($('<span>').addClass('fa fa-chevron-circle-left'))
            .append($('<div>').append(options.actionButtonText).addClass('narrative-card-action-button-name'));
                
        $actionButtonWrapper.append($actionButton);

        const $logo = options.logo.addClass('narrative-card-logo');
        const $title = options.title;
        const $subcontent = options.subcontent;

        $info.append($title)
            .append($subcontent);
            
        if (options.actionButtonClick){
            $actionButtonWrapper.click(options.actionButtonClick);
        }
        if (options.actionButtonText) {
            $mainContent.append($actionButtonWrapper);
        }
          
        $mainContent.append($logo)
            .append($info)
            .append($('<div>').addClass('narrative-card-ellipsis')
                .append($toggleAdvancedViewBtn))
            .mouseenter(() => {
                $toggleAdvancedViewBtn.show();
                $actionButton.show();
            })
            .mouseleave(() => {
                $toggleAdvancedViewBtn.hide();
                $actionButton.hide();

            })
            .click(() => {
                $moreContent.slideToggle('fast');
                if (options.onOpen) {
                    try {
                        options.onOpen();
                    } catch (ex) {
                        console.error('Error calling onOpen', ex);
                    }
                }
            });
                
        $card.append($mainContent);
        if (options.moreContent) {
            $card.append($moreContent);
        }    

        return $card;
    }
    return KbaseCardLayout;  
});
