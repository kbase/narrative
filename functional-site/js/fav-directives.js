
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
            template: '<div class="fav-filters">'+
                          '<a data-type="all">Display All</a><br>'+
                          '<a data-type="Genome">Genomes</a><br>'+            
                          '<a data-type="Model">Models</a><br><br>'+
                          '<a data-type="Media">Media</a><br><br>'+                          
                          'options/filtering are in the works.'+
                      '</div>',
            link: function(scope, element, attrs) {
                $('.fav-filters a').click(function() {
                    console.log('click')
                    $('.widget').hide();                    

                    var type = $(this).data('type');
                    console.log(type)
                    if (type == "all") {
                        $('.widget').show();                         
                    } else {
                        $('.widget-type-'+type).show();                        
                    }
                })

            }
        };
    })


    .directive('favoritetable', function($location, $compile) {
        return {

            link: function(scope, element, attrs, compile) {
                // retrieve again
                var prom = kb.ujs.get_state('favorites', 'queue', 0);
                $.when(prom).done(function(data) {
                    scope.favorites = data
                    showWidgets(data)
                })

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



function addFavorite(ws, id, type) {
    var get_state_prom = kb.ujs.get_state('favorites', 'queue');
    var prom = $.when(prom).then(function(queue) {
        queue.push({ws: ws, id: id, type: type});
        var p = kb.ujs.set_state('favorites', 'queue', queue);
        return p;
    });

    return prom;
}



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
