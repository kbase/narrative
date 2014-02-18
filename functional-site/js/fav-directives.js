
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
            }
        };
    })


    .directive('favoritetable', function($location) {
        return {

            link: function(scope, element, attrs) {
               

            }

        };
    })


