/**
 *  kbaseDataCard.js -- used making object cards in narrative
 *
 *  Authors: zzheng@lbl.gov, wjriehl@lbl.gov
 *
 *  Example and expected outputs
 *
 *  var $card = new kbaseDataCard({
 *      // required values
 *      object_info: object_info (array)
 *
 *      //values with default, enter falsey value to hide; passing in value will override default
 *      version: str or integer, the version of the object
 *      narrative: str, the name of the narrative that object is in
 *      date: str, the date when it was last saved
 *      editBy: str, the username of the person who saved the object
 *      type: str, the shortened type of object. E.g., if it's KBaseGenomes.Genome-2.1, then "Genome"
 *      viewType: str, the viewed object type. Mainly for Genomes that should have the scientific name appended.
 *
 *      //optional values
 *      moreContent: jquery object,
 *      is_set: boolean, true if this is a Set object,
 *      max_name_length: int, overrides the Config'd max_name_length if present (chops down the
 *                       objects name to some maximum number of characters)
 *  });
 */

define ([
    'util/icon',
    'bluebird',
    'util/bootstrapDialog',
    'util/timeFormat',
    'kbase/js/widgets/narrative_core/kbaseCardLayout',
    'narrativeConfig',
    'jquery',

    'bootstrap'
], function(
    Icon,
    Promise,
    BootstrapDialog,
    TimeFormat,
    kbaseCardLayout,
    Config,
    $
) {
    'use strict';
    function KbaseDataCard(entry) {
        var self = this,
            object_info = entry.object_info,
            maxNameLength = Config.get('data_panel').max_name_length;
        if (entry.max_name_length) {
            maxNameLength = entry.max_name_length;
        }

        //params
        var name = entry.name ? entry.name : object_info[1],
            version = entry.version ? entry.version : ('v' + object_info[4]),
            date = entry.date ? entry.date : TimeFormat.getTimeStampStr(object_info[3]),
            editBy = entry.editedBy ? entry.editedBy : (' by ' + object_info[5]);

        // in order - entry.viewType > entry.type > parsing it out of the object_info type string.
        var objectType = entry.type ? entry.type : object_info[2].split('.')[1].split('-')[0],
            viewType = entry.viewType;
        if (!viewType) {
            if (entry.type) {
                viewType = entry.type;
            }
            else {
                viewType = objectType;
            }
        }

        //shorten name if applicable
        var $name = $('<span>').addClass('kb-data-list-name');
        if ((maxNameLength && name) && name.length > maxNameLength) {
            $name.append(name.substring(0, maxNameLength - 3) + '...');
            $name.tooltip({
                title: name,
                placement: 'bottom',
                delay: {
                    show: Config.get('tooltip').showDelay,
                    hide: Config.get('tooltip').hideDelay
                }
            });
        } else {
            $name.append(name)
        }

        var $logo = $('<div>');
        Icon.buildDataIcon($logo, objectType, entry.is_set, 0);

        var $version = $('<span>').addClass('kb-data-list-version').append(version),
            $type = $('<div>').addClass('kb-data-list-type').append(viewType),
            $date = $('<span>').addClass('kb-data-list-date').append(date);

        //no default
        var $byUser = $('<span>').addClass('kb-data-list-edit-by').append(editBy),
            $narrative = $('<div>').addClass('kb-data-list-narrative').append(entry.narrative),
            $title = $('<div>').append($name),
            $subcontent = $('<div>')
                .addClass('narrative-data-list-subcontent');

        $title.append($version);
        $subcontent.append($type)
            .append($narrative)
            .append($date)
            .append($byUser);
        $byUser
            .click(function (object_info, e) {
                e.stopPropagation();
                window.open('/#people/' + object_info[5]);
            }.bind(null, object_info));

        //create card
        var actionButtonClick = function (e) {
            if (!entry.ws_name) {
                return;
            }
            e.stopPropagation();
            var updateButton = function () {
                var className = '.' + object_info[1].split('.').join('\\.');
                var btns = $(className);
                var thisHolder = this;
                var $thisBtn = $($(this).children()[0]);
                $(this).html('<img src="' + Config.get('loading_gif') + '">');
                Promise.resolve(self.serviceClient.sync_call(
                    'NarrativeService.copy_object',
                    [{
                        ref: object_info[6] + '/' + object_info[0],
                        target_ws_name: entry.ws_name,
                    }]
                ))
                    .then(function () {
                        var $button;
                        for(var i = 0 ; i< btns.length; i++){
                            $button = btns[i];
                            $($button).find('div').text(' Copy');
                        }
                        $(thisHolder).html('');
                        $(thisHolder).append($thisBtn);
                        self.trigger('updateDataList.Narrative');
                    })
                    .catch(function (error) {
                        $(this).html('Error');
                        var $importError = $('<div>').css({ 'color': '#F44336', 'width': '500px' });
                        if (error.error && error.error.message) {
                            if (error.error.message.indexOf('may not write to workspace') >= 0) {
                                $importError.append('Error: you do not have permission to add data to this Narrative.');
                            } else {
                                $importError.append('Error: ' + error.error.message);
                            }
                        } else {
                            $importError.append('Unknown error!');
                        }
                        self.options.$importStatus.html($importError);
                        console.error(error);
                    });
            };
            if ($(this).text().split(' ')[1] === 'Copy') {
                var dialog = new BootstrapDialog({
                    title: 'An item with this name already exists in this Narrative.',
                    body: 'Do you want to override the existing copy?',
                    buttons: [$('<a type="button" class="btn btn-default">')
                        .append('Yes')
                        .click(function () {
                            dialog.hide();
                            updateButton.call(this);

                        }.bind(this))
                        , $('<a type="button" class="btn btn-default">')
                        .append('No')
                        .click(function () {
                            dialog.hide();
                        })
                    ],
                    closeButton: true
                });
                dialog.show();
            } else {
                updateButton.call(this);
            }

        };
        var layout = {
            actionButtonText: entry.actionButtonText,
            actionButtonClick: actionButtonClick,
            logo: $logo,
            title: $title,
            subcontent: $subcontent,
            moreContent : entry.moreContent,
            onOpen: entry.onOpen
        };

        var $card = new kbaseCardLayout(layout);

        var $renderedActionButton = $card.find('.narrative-card-action-button');
        $renderedActionButton.addClass(function () {
            return object_info[1].split('.').join('.');
        })
            .hide();

        return $card;
    }
    return KbaseDataCard;  //end init
});
