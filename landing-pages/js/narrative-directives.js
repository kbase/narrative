
/*
 *  Directives
 *  
 *  These can be thought of as the 'widgets' on a page.  
 *  Scope comes from the controllers.
 *
*/


angular.module('narrative-directives', []);
angular.module('narrative-directives')
    .directive('recentnarratives', function($location) {
        return {
            template: "blah blah blah",
            link: function(scope, element, attrs) {
                $(element).append('blah blah blah')
            }  /* end link */
        };
    })






    .directive('recentprojects', function($location) {
        return {

            link: function(scope, element, attrs) {
                
            }

        };
    })






