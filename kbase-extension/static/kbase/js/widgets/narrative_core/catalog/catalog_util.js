define([
    'bluebird',
    'jquery',
    'kb/common/dom',
    'kb/common/html',
    'kb/widget/widgetSet'
], function (Promise, $, DOM, html, WidgetSet) {
    'use strict';

    function CatalogUtil() {

        // edited from: http://stackoverflow.com/questions/3177836/how-to-format-time-since-xxx-e-g-4-minutes-ago-similar-to-stack-exchange-site
        this.getTimeStampStr = function (objInfoTimeStamp) {
            var date = new Date(objInfoTimeStamp);
            var seconds = Math.floor((new Date() - date) / 1000);

            // f-ing safari, need to add extra ':' delimiter to parse the timestamp
            if (isNaN(seconds)) {
                var tokens = objInfoTimeStamp.split('+');  // this is just the date without the GMT offset
                var newTimestamp = tokens[0] + '+' + tokens[0].substr(0, 2) + ":" + tokens[1].substr(2, 2);
                date = new Date(newTimestamp);
                seconds = Math.floor((new Date() - date) / 1000);
                if (isNaN(seconds)) {
                    // just in case that didn't work either, then parse without the timezone offset, but
                    // then just show the day and forget the fancy stuff...
                    date = new Date(tokens[0]);
                    return this.monthLookup[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
                }
            }

            var interval = Math.floor(seconds / 31536000);
            if (interval > 1) {
                return this.monthLookup[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
            }
            interval = Math.floor(seconds / 2592000);
            if (interval > 1) {
                if (interval < 4) {
                    return interval + " months ago";
                } else {
                    return this.monthLookup[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
                }
            }
            interval = Math.floor(seconds / 86400);
            if (interval > 1) {
                return interval + " days ago";
            }
            interval = Math.floor(seconds / 3600);
            if (interval > 1) {
                return interval + " hours ago";
            }
            interval = Math.floor(seconds / 60);
            if (interval > 1) {
                return interval + " minutes ago";
            }
            return Math.floor(seconds) + " seconds ago";
        };

        this.getTimeStampStrAbsolute = function (objInfoTimeStamp) {
            var date = new Date(objInfoTimeStamp);
            var seconds = Math.floor((new Date() - date) / 1000);

            // f-ing safari, need to add extra ':' delimiter to parse the timestamp
            if (isNaN(seconds)) {
                var tokens = objInfoTimeStamp.split('+');  // this is just the date without the GMT offset
                var newTimestamp = tokens[0] + '+' + tokens[0].substr(0, 2) + ":" + tokens[1].substr(2, 2);
                date = new Date(newTimestamp);
                seconds = Math.floor((new Date() - date) / 1000);
                if (isNaN(seconds)) {
                    // just in case that didn't work either, then parse without the timezone offset, but
                    // then just show the day and forget the fancy stuff...
                    date = new Date(tokens[0]);
                    return this.monthLookup[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
                }
            }
            return date.getHours()+ ":"+ 
                    date.getMinutes()+":"+
                    date.getSeconds()+" " +
                    this.monthLookup[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
             
        };


        this.skipApp = function(categories) {
            for(var i=0; i<categories.length; i++) {
                if(categories[i]=='inactive') {
                    return true;
                }
                if(categories[i]=='viewers') {
                    return true;
                }
                if(categories[i]=='importers') {
                    return true;
                }
            }
            return false;
        };


        this.initLoadingPanel= function() {
            var $loadingPanel = $('<div>').addClass('kbcb-loading-panel-div');
            $loadingPanel.append($('<i>').addClass('fa fa-spinner fa-2x fa-spin'));
            return $loadingPanel;
        };



        this.monthLookup = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    }

    return CatalogUtil;
});