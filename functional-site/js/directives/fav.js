
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
        link: function(scope, ele, attrs) {

        }
    };
})
.directive('favoriteviewer', function($location) {
    return {
        link: function(scope, ele, attrs) {


            scope.drawPathways = function() {
                console.log('called')
                $(ele).append('<div pathways></div>')
            }

        }
    };
})

.directive('favoritetable', function($location, $compile) {
    return {

        link: function(scope, element, attrs, compile) {
            // retrieve again
            function showWidgets(data) {
                for (var i in data) {
                    var obj = data[i];
                    if (obj == null) continue;
                    scope.ws = obj.ws; 
                    scope.id = obj.id;
                    var el = $compile( '<div '+obj.widget+' class="widget widget-type-'+obj.type+'"></div>' )( scope ); 
                    $('#sortable-landing').append( el );
                }

                $( "#sortable-landing" ).sortable({placeholder: "drag-placeholder", 
                    start: function() {
                        $(this).find('.panel-body').addClass('hide');
                        $(this).sortable('refreshPositions');
                },
                    stop: function() {
                        $(this).find('.panel-body').removeClass('hide');
                      }
                });

                $( "#sortable-landing" ).disableSelection();
            }
        }
    };
})






