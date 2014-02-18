
/*
 *  Directives
 *  
 *  These can be thought of as the 'widgets' on a page.  
 *  Scope comes from the controllers.
 *
*/


angular.module('fav-directives', []);
angular.module('fav-directives')
    .directive('favoritesidebar', function($location) {
        return {
            template: '<div class="ws-selector">Fav sidebar </div>',
            link: function(scope, element, attrs) {
                var prom = kb.ujs.get_state('userstate');
                $.when(prom).done(function(data){
                    console.log('result', data)
                })

            }
        };
    })


    .directive('favoritetable', function($location) {
        return {

            link: function(scope, element, attrs) {
               

            }

        };
    })


