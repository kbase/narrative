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
        'narrativeConfig',
        'jquery'
    ], function(
        bootstrap,
        Icon,
        kbaseCardLayout,
        Config,
        $
    ) {
        function KbaseDataCard(entry) {
            var $logo = $('<div>');
            Icon.buildDataIcon($logo, entry.type, entry.is_set, 0);
            var shortName = entry.name;
            var isShortened = false;
            if (entry.max_name_length && shortName.length > entry.max_name_length) {
                shortName = shortName.substring(0, entry.max_name_length - 3) + '...';
                isShortened = true;
            }
                
            var $name = $('<span>').addClass('kb-data-list-name').append(shortName);
            var $version = $('<span>').addClass('kb-data-list-version').append(entry.version);
            var $type = $('<div>').addClass('kb-data-list-type').append(entry.type);
            var $date = $('<span>').addClass('kb-data-list-date').append(entry.date);
            var $byUser = $('<span>').addClass('kb-data-list-edit-by').append( entry['edit-by']);
            
            var $title = $('<div>').append($name);
            if(entry.version) $title.append($version);

            var $subcontent = $('<div>')
                .addClass('kb-data-list-subcontent')
                .append($type);
            if(entry.date) $subcontent.append($date);
            if(entry['edit-by']) $subcontent.append($byUser);

            //tooltip for long title
            if (isShortened) {
                $name.tooltip({
                    title: entry.name,
                    placement: 'bottom',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                });
            }
            //create card
            var layout = {
                actionButton: entry.actionButton,
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
