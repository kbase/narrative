
/*  NCTour - a twitter bootstrap "plugin" for doing dom-based, interactive tours
 *
 *  Author: Neal Conrad <nealconrad@gmail.com>
 * 
 *  Requirements: 
 *      - jQuery (tested on 10.8?)
 *      - bootstrap 3.x
 *      - nc-tour.css (for styling)
 *
 *  Todo:
 *   - add ability to change times (using bootstrap event broadcasts)
 *
 *  Demo: (coming soon)
 *
 */

function Tour(settings) {
    var tour = settings.tour;
    var exit_callback = settings.exit_callback;
    var position = settings.position

    var options = ('<div class="tour">\
                        <a class="glyphicon glyphicon-remove pull-right text-muted btn-exit-tour"></a>\
                        <div class="tour-options">\
                            <div class="tour-controls">\
                                <a class="btn btn-default btn-xs btn-prev-tour">\
                                    <span class="glyphicon glyphicon-backward"></span>\
                                </a>\
                                <a class="btn btn-default btn-xs btn-pause-tour">\
                                    <span class="glyphicon glyphicon-pause"></span>\
                                </a>\
                                <a class="btn btn-default btn-primary btn-xs btn-play-tour">\
                                    <span class="glyphicon glyphicon-play"></span>\
                                </a>\
                                <a class="btn btn-default btn-xs btn-next-tour">\
                                    <span class="glyphicon glyphicon-forward"></span>\
                                </a>\
                            </div>\
                            <div class="tour-controls2">\
                                <a class="btn btn-primary btn-start-tour">Start Tour</a>\
                                <a class="btn btn-danger btn-exit-tour hide">Exit Tour</a>\
                            </div>\
                        </div>\
                    </div>');

    $('body').append('<div class="modal-backdrop tour-modal-backdrop in"></div>')
    $('body').prepend(options)

    var loop;
    var i = 0;
    var bVisibles = [];
    $('.btn-start-tour').click(function() {
        clearInterval(loop);

        $(this).text('Restart Tour')

        $('.btn-pause-tour').addClass('btn-primary');
        $('.btn-play-tour').removeClass('btn-primary');

        i = 0; 
        showTourTip(tour[i])
        tourLoop();
    })

    $('.btn-exit-tour').click(function() {
        clearInterval(loop);
        $('.tour, .tour-modal-backdrop, .popover').remove();
        for (var i in bVisibles) {
            bVisibles[i].addClass('hide');
        }
        exit_callback();
    })

    $('.btn-pause-tour').click(function() {
        clearInterval(loop);
        $(this).removeClass('btn-primary');
        $('.btn-play-tour').addClass('btn-primary')        
    })

    $('.btn-play-tour').click(function() {
        // if first play, show tip right away. #poetry
        if (i == 0) {
            showTourTip(tour[i]);
            i++;
        }

        tourLoop();
        $(this).toggleClass('btn-primary')        
        $('.btn-pause-tour').toggleClass('btn-primary')
    });

    $('.btn-prev-tour').click(function() {
        clearInterval(loop);
        if (i > 1) {
            i = i-1; // i is already i+1 :)
        } else if (i == 1) {
             i = 0;
        }

        showTourTip(tour[i])
        //if (i == 0) i = i-1;
        $('.btn-pause-tour').removeClass('btn-primary');
        $('.btn-play-tour').addClass('btn-primary');
    })

    $('.btn-next-tour').click(function() {
        clearInterval(loop);

        // i is already i+1, for case 0
        i++;
        showTourTip(tour[i]);
        $('.btn-pause-tour').removeClass('btn-primary');
        $('.btn-play-tour').addClass('btn-primary')        
    })    

    function tourLoop() {
        loop = setInterval(function(){
            i++;
            showTourTip(tour[i])

            // stop interval after tour.
            if (i >= tour.length) {
                clearInterval(loop);
                $('.btn-exit-tour').removeClass('hide');
                $('.btn-pause-tour').removeClass('btn-primary');
                $('.btn-play-tour').addClass('btn-primary')                 
            }
        }, 3000)        
    }

    function showTourTip(exhibit) {
        // remove all popovers
        $('.popover').remove();

        // aww, shucks, no more exhibits to visit?  Then, leave the museum;
        if (!exhibit) return;

        // if something needs to happen before the exhibit, make it happen
        if (exhibit.event) exhibit.event();

        // select the nth element if supplied
        var n = exhibit.n;
        var ele = n ? $(exhibit.element).eq(n) : $(exhibit.element);        

        var text = exhibit.text;
        var hover = exhibit.bVisible;
        var placement = exhibit.placement ? exhibit.placement : 'bottom';

        if (hover) {
            ele.removeClass('hide');
            bVisibles.push(ele);
        }

        ele.tooltip('destroy'); // destroy the regular tooltips
        ele.popover('destroy')

        if (text) {
            ele.popover({content: '<div class="tour-text">'+text+'</div>', placement: placement, 
                                  trigger:'manual', html: true, container: 'body'});
            ele.popover('show');            
        }
        $('.popover').css('z-index', 9999);

    }
}