/*global define*/
/*jslint white:true,browser:true*/

define([
    
], function () {
   
   function factory(config) {
       var timer,
           ticks,
           resolution = config.resolution,
           bus = config.bus;
       
       function start() {
           ticks = 0;
           timer = window.setInterval(function () {
               ticks += 1;
               bus.emit('clock-tick', {
                   resolution: resolution,
                   count: ticks
               });
           }, resolution);
       }
       
       function stop() {
           if (timer) {
               window.clearInterval(timer);
               timer = null;
           }
       }
       
       return {
           start: start,
           stop: stop
       };
   }
   
   return {
       make: function (config) {
           return factory(config);
       }
   };
});