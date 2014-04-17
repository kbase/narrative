
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
            link: function(scope, element, attrs) {


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



/*


                var auth = {token: USER_TOKEN}

                $('.btn-favorite').click(function() {
                    console.log('setting data with')
                    var prom = kb.ujs.set_state('favorites', 'test', 'foo');
                    $.when(prom).done(function(data){
                        console.log('set data: ', data);
                    })
                })

                var prom = kb.ujs.get_state('favorites', 'test', 0);
                $.when(prom).done(function(data){
                    console.log('found data:', data)
                })

                */
