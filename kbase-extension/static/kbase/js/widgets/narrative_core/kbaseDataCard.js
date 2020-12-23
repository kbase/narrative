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
 *      targetWsName: the target workspace for copying any objects.
 *  });
 */

define([
    'util/icon',
    'bluebird',
    'util/bootstrapDialog',
    'util/timeFormat',
    'kbase/js/widgets/narrative_core/kbaseCardLayout',
    'narrativeConfig',
    'jquery',
    'api/dataProvider',
    'bootstrap',
], function (Icon, Promise, BootstrapDialog, TimeFormat, kbaseCardLayout, Config, $, DataProvider) {
    'use strict';
    function KbaseDataCard(entry) {
        const objectInfo = entry.object_info;
        let maxNameLength = Config.get('data_panel').max_name_length;
        if (entry.max_name_length) {
            maxNameLength = entry.max_name_length;
        }

        //params
        var name = entry.name ? entry.name : objectInfo[1],
            version = entry.version ? entry.version : 'v' + objectInfo[4],
            date = entry.date ? entry.date : TimeFormat.getTimeStampStr(objectInfo[3]),
            editBy = entry.editedBy ? entry.editedBy : ' by ' + objectInfo[5];

        // in order - entry.viewType > entry.type > parsing it out of the objectInfo type string.
        var objectType = entry.type ? entry.type : objectInfo[2].split('.')[1].split('-')[0],
            viewType = entry.viewType || entry.type || objectType;

        //shorten name if applicable
        var $name = $('<span>').addClass('kb-data-list-name');
        if (maxNameLength && name && name.length > maxNameLength) {
            $name.append(name.substring(0, maxNameLength - 3) + '...');
            $name.tooltip({
                title: name,
                placement: 'bottom',
                delay: {
                    show: Config.get('tooltip').showDelay,
                    hide: Config.get('tooltip').hideDelay,
                },
            });
        } else {
            $name.append(name);
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
            $subcontent = $('<div>').addClass('narrative-data-list-subcontent');

        $title.append($version);
        $subcontent.append($type).append($narrative).append($date).append($byUser);
        $byUser.click(
            function (objectInfo, e) {
                e.stopPropagation();
                window.open('/#people/' + objectInfo[5]);
            }.bind(null, objectInfo)
        );

        /**
         * This is intended to be the function that gets called when the "Copy" button gets
         * clicked. It'll be in the scope of the button itself, and gets passed the
         * click event.
         * @param {event} e - the click event that gets passed to this function on click
         */
        var actionButtonClick = function (e) {
            if (!entry.copyFunction) {
                return;
            }
            e.stopPropagation();

            /**
             * if there's already something with this name, warn the user.
             * if user says no, quit.
             * if user says yes,
             *      hide btn with spinner
             *      get all buttons attached to objects with this name
             *      do the copy
             *      update button texts
             *      remove spinner, but btn back
             *      trigger updateDataList.Narrative
             */

            function doObjectCopy() {
                var className = '.' + objectInfo[1].split('.').join('\\.');
                var btns = $(className);
                var thisHolder = e.currentTarget;
                var $thisBtn = $($(thisHolder).children()[0]);
                $(thisHolder).html('<img src="' + Config.get('loading_gif') + '">');
                entry
                    .copyFunction()
                    .then(() => {
                        btns.each(function () {
                            $(this).find('div').text(' Copy');
                        });
                        $(thisHolder).html('').append($thisBtn);
                        $(document).trigger('updateDataList.Narrative');
                    })
                    .catch((error) => {
                        var $importError = $('<div>').css({ color: '#F44336', width: '500px' });
                        if (error.error && error.error.message) {
                            if (error.error.message.indexOf('may not write to workspace') >= 0) {
                                $importError.append(
                                    'Error: you do not have permission to add data to this Narrative.'
                                );
                            } else {
                                $importError.append('Error: ' + error.error.message);
                            }
                        } else {
                            $importError.append('Unknown error!');
                        }
                        new BootstrapDialog({
                            title: 'An error occurred while copying.',
                            body: $importError,
                            alertOnly: true,
                        }).show();
                        console.error(error);
                    });
            }

            function showCopyWarningDialog() {
                var dialog = new BootstrapDialog({
                    title: 'An item with this name already exists in this Narrative.',
                    body: 'Do you want to overwrite the existing copy?',
                    buttons: [
                        $('<a type="button" class="btn btn-default">')
                            .append('Yes')
                            .click(() => {
                                dialog.hide();
                                doObjectCopy();
                            }),
                        $('<a type="button" class="btn btn-default">')
                            .append('No')
                            .click(() => {
                                dialog.hide();
                            }),
                    ],
                    closeButton: true,
                });
                dialog.show();
            }

            DataProvider.getDataByName().then((data) => {
                if (data.hasOwnProperty(objectInfo[1])) {
                    showCopyWarningDialog();
                } else {
                    doObjectCopy();
                }
            });
        };
        var layout = {
            actionButtonText: entry.actionButtonText,
            actionButtonClick: actionButtonClick,
            logo: $logo,
            title: $title,
            subcontent: $subcontent,
            moreContent: entry.moreContent,
            onOpen: entry.onOpen,
        };

        var $card = new kbaseCardLayout(layout);
        $card
            .find('.narrative-card-action-button')
            .addClass(() => objectInfo[1].split('.').join('.'))
            .hide();

        return $card;
    }
    return KbaseDataCard; //end init
});
