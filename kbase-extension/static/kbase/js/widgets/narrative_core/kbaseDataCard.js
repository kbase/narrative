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
        function KbaseDataCard(entry) {
            //add more content
            //partitions

            var $logo = $('<div>');
            Icon.buildDataIcon($logo, entry.type, entry.is_set, 0);
                
            //main content
            var $name = $('<span>').addClass('kb-data-list-name').append(entry.name);
            var $version = $('<span>').addClass('kb-data-list-version').append(entry.version);
            var $type = $('<div>').addClass('kb-data-list-type').append(entry.type);
            var $date = $('<span>').addClass('kb-data-list-date').append(entry.date);
            var $byUser = $('<span>').addClass('kb-data-list-edit-by').append( entry['edit-by']);
            
            var $title = $('<div>').append($name).append($version);
            var $subcontent = $('<div>')
                .addClass('kb-data-list-subcontent')
                .append($type)
                .append($date)
                .append($byUser);


                
            var layout = {
                actionButton: undefined,
                logo: $logo,
                title: $title,
                subcontent: $subcontent,
                moreContent : entry.moreContent
            };


            var $card = new kbaseCardLayout(layout);

            return $card;
        }
        return KbaseDataCard;  //end init
    });
