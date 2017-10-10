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
        'util/icon',
        'kbase/js/widgets/narrative_core/kbaseCardLayout',
        'jquery'
    ], function(
        bootstrap,
        Icon,
        kbaseCardLayout,
        $
    ) {
        function KbaseDataCard(options) {
            //add more content
            // var layout = {
            //     actionButton: undefined,
            //     logo: undefined,
            //     title: undefined,
            //     subcontent: undefined
            // };
            //partitions

            var $logo = $('<div>');
            Icon.buildDataIcon($logo, options.type, options.is_set, 0);
            
                
            //main content
            var $name = $('<span>').addClass('kb-data-list-name').append(options.name);
            var $version = $('<span>').addClass('kb-data-list-version').append(options.version);
            var $type = $('<div>').addClass('kb-data-list-type').append(options.type);
            var $date = $('<span>').addClass('kb-data-list-date').append(options.date);
            var $byUser = $('<span>').addClass('kb-data-list-edit-by').append( options["edit-by"]);
            
            var $title = $('<div>').append($name).append($version);
            var $subcontent = $('<div>').addClass('kb-data-list-subcontent')
                                     .append($type)
                                     .append($date)
                                     .append($byUser);

            var layout = {
                actionButton: undefined,
                logo: $logo,
                title: $title,
                subcontent: $subcontent
            };


            var $card = new kbaseCardLayout(layout);

            return $card;
        }
        return KbaseDataCard;  //end init
    });
