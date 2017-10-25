/**
 *  kbaseDataCard.js -- used making object cards in narrative
 *
 *  Authors: zzheng@lbl.gov
 *
 *   Example and expected out put:s
 *
 *     var $card = new kbaseDataCard(
                {   
                    //expected values
                    object_info: object_info (array)

                    //values with default, enter falsey value to hide; passing in value will override default
                    version: str or integer,
                    narrative: str,
                    date: str,
                    editBy: str,
                    type: str,

                    //optional values
                    moreContent: jquery object,
                    is_set: boolean,
                    max_name_length: int,

                });

                // object_info:
            // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
            // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
            // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
            // [9] : int size // [10] : usermeta meta
 *
*/

define (
    [
        'bootstrap',
        'util/icon',
        'bluebird',
        'util/bootstrapDialog',
        'util/timeFormat',
        'kbase/js/widgets/narrative_core/kbaseCardLayout',
        'narrativeConfig',
        'jquery'
    ], function(
        bootstrap,
        Icon,
        Promise,
        BootstrapDialog,
        TimeFormat,
        kbaseCardLayout,
        Config,
        $
    ) {
        function KbaseDataCard(entry) {
            var self = this;
            var object_info = entry.object_info;
            
            //params
            var shortName = entry.name ? entry.name : object_info[1];
            var version = entry.version ? entry.version : ('v' + object_info[4]);
            var date = entry.date ? entry.date : TimeFormat.getTimeStampStr(object_info[3]);
            var type = entry.type;
            var editBy = entry.editedBy ? entry.editedBy : (' by ' + object_info[5]);
            if(!entry.type){
                var type_tokens = object_info[2].split('.');
                type = entry.type ? entry.type : type_tokens[1].split('-')[0];
            }

            //shorten name if applicable
            var isShortened = false;
            if ((entry.max_name_length && shortName) && shortName.length > entry.max_name_length) {
                shortName = shortName.substring(0, entry.max_name_length - 3) + '...';
                isShortened = true;
            }

            var $logo = $('<div>');
            Icon.buildDataIcon($logo, type, entry.is_set, 0);
                
            var $name = $('<span>').addClass('kb-data-list-name').append(shortName);
            var $version = $('<span>').addClass('kb-data-list-version').append(version);
            var $type = $('<div>').addClass('kb-data-list-type').append(type);
            var $date = $('<span>').addClass('kb-data-list-date').append(date);

            //no default
            var $byUser = $('<span>').addClass('kb-data-list-edit-by').append(editBy);
            var $narrative = $('<div>').addClass('kb-data-list-narrative').append(entry.narrative);
            
            var $title = $('<div>').append($name);
            var $subcontent = $('<div>')
                .addClass('narrative-data-list-subcontent');
            
            if(entry.version === undefined || entry.version) {
                $title.append($version);
            }
            
            if(entry.type === undefined || entry.type) {
                $subcontent.append($type);
            }
            if(entry.narrative === undefined || entry.narrative) {
                $subcontent.append($narrative);
            }
            if(entry.date === undefined || entry.date) {
                $subcontent.append($date);
            }

            if(entry.editedBy === undefined || entry.editedBy) {
                $byUser
                    .click(function (object_info, e) {
                        e.stopPropagation();
                        window.open('/#people/' + object_info[5]);
                    }.bind( null, object_info));
                $subcontent.append($byUser);
            }

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
            var actionButtonClick = function (e) {
                if(!entry.ws_name){
                    return;
                }
                e.stopPropagation(); 
                var updateButton = function () {
                    var className = '.' + object_info[1].split('.').join('\\.');
                    var btns = $(className);
                    var thisHolder = this;
                    var $thisBtn = $($(this).children()[0]);
                    $(this).html('<img src="' + self.options.loadingImage + '">');
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
                            if (error.error && error.error.message) {
                                if (error.error.message.indexOf('may not write to workspace') >= 0) {
                                    self.options.$importStatus.html($('<div>').css({ 'color': '#F44336', 'width': '500px' }).append('Error: you do not have permission to add data to this Narrative.'));
                                } else {
                                    self.options.$importStatus.html($('<div>').css({ 'color': '#F44336', 'width': '500px' }).append('Error: ' + error.error.message));
                                }
                            } else {
                                self.options.$importStatus.html($('<div>').css({ 'color': '#F44336', 'width': '500px' }).append('Unknown error!'));
                            }
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
                moreContent : entry.moreContent
            };

            var $card = new kbaseCardLayout(layout);

            var $renderedActionButton = $card.find('.narrative-card-action-button');

            $renderedActionButton.addClass(function () { return object_info[1].split('.').join('\.'); })
                .hide();

            return $card;
        }
        return KbaseDataCard;  //end init
    });
