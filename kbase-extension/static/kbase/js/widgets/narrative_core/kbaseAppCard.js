/**
 *  kbaseAppCard.js -- used making App cards in narrative
 *
 *  Authors: zzheng@lbl.gov
 *
 *   Example and expected out put:
 *
 *     var $card = new kbaseAppCard(
                {   
                    //expected values
                    app: app (object with info object and favorite field),
                    favorite: app.favorite (number),

                    //values with default, passing in value will override default
                    createdBy: array of strs,
                    type: str,

                    //optional values
                    moreContent: jquery object,
                });
 *
 *             
        app.info:
        authors:["rsutormin"], categories:["annotation"], icon:{url:}, id: str,
        input_types: ['KbaseGenomeAnnotations.Assembly'], module_name: str,
        name: str, namespace: str, output_types:["KBaseGenomes.Genome"],
        subtitle: str, tooltip: str, ver: str
             
            
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
    ], (
        bootstrap,
        Icon,
        Promise,
        BootstrapDialog,
        DisplayUtil,
        kbaseCardLayout,
        Config,
        $
    ) => {
        function KbaseAppCard(entry) {
            const self = this;
            let favorite = entry.app.favorite;
            const app = entry.app.info;
            
            const shortName = entry.name ? entry.name : app.name;
            let authors = entry.createdBy; 
            const version = entry.version ? entry.version : ('v' + app.ver);
            let type;

            if(entry.createdBy === undefined){
                if(app.authors.length >2){
                    authors = app.authors.slice(0,2).join(', ') + '+ ' + (app.authors.length-2) + ' more';
                }else{
                    authors = app.authors.join(', ');
                }
            }
            if (app.module_name && (entry.version === undefined)) {
                type = '<a href="' + self.options.moduleLink + app.module_name + '" target="_blank">' +
                    app.namespace + '</a> ';
            }

            const $star = $('<i>').addClass('fa fa-star kbcb-star-default');
            if (favorite) {
                $star.addClass('fa fa-star kbcb-star-favorite').append('&nbsp;');
            }

            $star.click((e)=> {
                e.stopPropagation();
                const params = {};
                if (app.module_name) {
                    params['module_name'] = app.module_name;
                    params['id'] = app.id.split('/')[1];
                } else {
                    params['id'] = app.id;
                }

                if (favorite) {
                    Promise.resolve(self.catalog.remove_favorite(params))
                        .then(() => {
                            $star.removeClass('kbcb-star-favorite');
                            favorite = null; // important to set this if we don't refresh the panel
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                } else {
                    Promise.resolve(self.catalog.add_favorite(params))
                        .then(() => {
                            $star.addClass('kbcb-star-favorite');
                            favorite = new Date().getTime(); // important to set this if we don't refresh the panel
                        })
                        .catch((error) => {
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

            const $logo = $('<div>');
            if (app.icon && app.icon.url) {
                const url = Config.url('narrative_method_store_image')+ app.icon.url;
                $logo.append(DisplayUtil.getAppIcon({ url: url, cursor: 'pointer', setColor: true, size: '50px' }));
            } else {
                $logo.append(DisplayUtil.getAppIcon({ cursor: 'pointer', setColor: true }));
            }
                   
            const $name = $('<div>').addClass('kb-data-list-name').append(shortName);
            const $version = $('<span>').addClass('kb-data-list-version').append(version);
            const $type = $('<span>').addClass('kb-data-list-type').append(type).append($version);
            const $date = $('<span>').addClass('kb-data-list-date');
            const $authors = $('<span>').addClass('kb-data-list-edit-by').append(authors);

            const $title = $('<div>').append($name).append($star);

            const $subcontent = $('<div>')
                .addClass('narrative-data-list-subcontent')
                .append($('<span/>').append($star))
                .append($type)
                .append($date);
            
            if (entry.createdBy === undefined || entry.createdBy) {
                $subcontent.append($authors);
            }
          
            const layout = {
                logo: $logo,
                title: $title,
                subcontent: $subcontent,
                moreContent : entry.moreContent
            };

            const $card = new kbaseCardLayout(layout);

            return $card;
        }
        return KbaseAppCard;  //end init
    });
