/**
 *  kbaseAppCard.js -- used making App cards in narrative
 *
 *  Authors: diane.z.zheng@gmail.com
 *
 *   Example and expected out put:
 *
 *     var $card = new kbaseDataCard(
                {   
                    //expected values
                    app: app,
                    self: self
                    favorite: app.favorite,

                    //values with default, passing in value will override default
                    date: date,
                    createdBy: author,
                    type: type,

                    //optional values
                    moreContent: $moreContent,
                });
 *
*/

define (
    [
        'bootstrap',
        'util/icon',
        'bluebird',
        'util/bootstrapDialog',
        'util/display',
        'kbase/js/widgets/narrative_core/kbaseCardLayout',
        'narrativeConfig',
        'jquery'
    ], function(
        bootstrap,
        Icon,
        Promise,
        BootstrapDialog,
        DisplayUtil,
        kbaseCardLayout,
        Config,
        $
    ) {
        function KbaseAppCard(entry) {
            var self = entry.self;
            var favorite = entry.app.favorite;
            var app = entry.app.info;
            
            var shortName = entry.name ? entry.name : app.name;
            var authors = entry.createdBy ? entry.createdBy : app.authors.join(', ');
            var type = entry.version ? entry.version : ('v' + app.ver);
            if (app.module_name && (entry.version === undefined)) {
                type = '<a href="' + self.options.moduleLink + '/' + app.module_name + '" target="_blank">' +
                    app.namespace + '</a> ' + type;
            }

            var $star = $('<i>').addClass('fa fa-star kbcb-star-default');
            if (favorite) {
                $star.addClass('fa fa-star kbcb-star-favorite').append('&nbsp;');
            }

            $star.click(function(e){
                e.stopPropagation();
                var params = {};
                if (app.module_name) {
                    params['module_name'] = app.module_name;
                    params['id'] = app.id.split('/')[1];
                } else {
                    params['id'] = app.id;
                }

                if (favorite) {
                    Promise.resolve(self.catalog.remove_favorite(params))
                        .then(function () {
                            $star.removeClass('kbcb-star-favorite');
                            app.favorite = null; // important to set this if we don't refresh the panel
                        })
                        .catch(function (error) {
                            console.error(error);
                        });
                } else {
                    Promise.resolve(self.catalog.add_favorite(params))
                        .then(function () {
                            $star.addClass('kbcb-star-favorite');
                            app.favorite = new Date().getTime(); // important to set this if we don't refresh the panel
                        })
                        .catch(function (error) {
                            console.error(error);
                        });
                }            
            })
                .tooltip({
                    title: 'Add or remove from your favorites',
                    container: 'body',
                    placement: 'bottom',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                });

            var $logo = $('<div>');
            if (app.icon && app.icon.url) {
                var url = self.options.methodStoreURL.slice(0, -3) + app.icon.url;
                $logo.append(DisplayUtil.getAppIcon({ url: url, cursor: 'pointer', setColor: true, size: '50px' }));
            } else {
                $logo.append(DisplayUtil.getAppIcon({ cursor: 'pointer', setColor: true }));
            }
                   
            var $name = $('<span>').addClass('kb-data-list-name').append(shortName);
            var $type = $('<div>').addClass('kb-data-list-type').append(type);
            var $date = $('<span>').addClass('kb-data-list-date');
            var $authors = $('<span>').addClass('kb-data-list-edit-by').append(authors);

            var $title = $('<div>').append($name).append($star);

            var $subcontent = $('<div>')
                .addClass('kb-data-list-subcontent')
                .append($type)
                .append($date)
                .append($authors);
          
            var layout = {
                logo: $logo,
                title: $title,
                subcontent: $subcontent,
                moreContent : entry.moreContent
            };

            var $card = new kbaseCardLayout(layout);

            return $card;
        }
        return KbaseAppCard;  //end init
    });
