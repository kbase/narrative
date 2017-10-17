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
            var authors = entry.name ? entry.name : app.authors.join(', ');
            var version = entry.version ? entry.version : ('v' + app.ver);
            if (app.module_name) {
                version = '<a href="' + self.options.moduleLink + '/' + app.module_name + '" target="_blank">' +
                    app.namespace + '</a> ' + version;
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
            var $version = $('<span>').addClass('kb-data-list-version').append(version);

            //no default
            var $authors = $('<div>').addClass('kb-data-list-edit-by').append(authors);
            var $title = $('<div>').append($name).append($star);

            var $subcontent = $('<div>')
                .addClass('kb-data-list-subcontent')
                .append($version)
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
