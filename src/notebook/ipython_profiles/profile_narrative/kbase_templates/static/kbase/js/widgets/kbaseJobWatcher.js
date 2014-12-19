"use strict";

(function( $, undefined ) {
    $.KBWidget({
        name: 'kbaseJobWatcher',
        parent: 'kbaseWidget',
        version: '1.0.0',
        options: {
            loadingImage: '../images/ajax-loader.gif',
            jobId: null,
            jobInfo: null
        },
        currentJobInfo: null,

        init: function(options) {
            this._super(options);
            if (this.options.jobId) {
                // do something with it.
            }
            this.render();

            return this;
        },

        render: function() {
            if (this.options.jobInfo) {
                this.refresh(this.options.jobInfo);
            }
            else
                this.$elem.html('Job Watching!');
        },

        /**
         * @method
         * Expects (and requires) a job_info tuple from the User and Job State
         * service.
         *
         * Just renders it as a simple table for now.
         */
        refresh: function(currentJobInfo) {
            this.currentJobInfo = currentJobInfo;

            var job = currentJobInfo;
            var $table = $('<table>').addClass('table table-striped table-bordered kbujs-jobs-table');
            var rows = [];

            var tableRow = function(elems) {
                var row = $("<tr>");
                for (var i=0; i<elems.length; i++) {
                    row.append($("<td>").append(elems[i]));
                }
                return row;
            };

            $table.append(tableRow(['Job ID', job[0]]));
            $table.append(tableRow(['Service', job[1]]));
            $table.append(tableRow(['Description', job[12]]));
            $table.append(tableRow(['Stage', this.parseStage(job[2])]));
            $table.append(tableRow(['Status', job[4]]));
            $table.append(tableRow(['Started', this.parseTimestamp(job[3]) + ' (' + this.calcTimeDifference(job[3]) + ')']));

            // rows.push({'Job ID' : job[0]});
            // rows.push({'Service' : job[1]});
            // rows.push({'Description' : job[12]});
            // rows.push({'Stage' : this.parseStage(job[2])});
            // rows.push({'Status' : job[4]});
            // rows.push({'Started' : this.parseTimestamp(job[3]) + ' (' + this.calcTimeDifference(job[3]) + ')'});

            var progress = this.makeProgressBarElement(job, true);
            if (progress)
                $table.append(tableRow(['Progress', progress]));
                // rows.push({'Progress' : progress});

            $table.append(tableRow(['Last Update', this.parseTimestamp(job[5]) + ' (' + this.calcTimeDifference(job[5]) + ')']));
            // rows.push({'Last Update' : this.parseTimestamp(job[5]) + ' (' + this.calcTimeDifference(job[5]) + ')'});


            this.$elem.append($table);
//            $table.kbaseTable({ structure: { rows: rows }});
        },

        parseStage: function(stage) {
            if (stage.toLowerCase() === 'error') {
                var $btn = $('<span/>')
                           .addClass('kbujs-error')
                           .append($('<span/>')
                                   .addClass('glyphicon glyphicon-exclamation-sign'))
                           .append(' Error');

                return $('<div>')
                       .addClass('kbujs-error-cell')
                       .append($btn);
            }
            return stage;
        },

        /**
         * @method makeProgressBarElement
         * Makes a Bootstrap 3 Progress bar from the given job object.
         *
         * @param job - the job object
         * @param showNumber - if truthy, includes the numberical portion of what's being shown in the progressbar, separately.
         * @return A div containing a Bootstrap 3 progressbar, and, optionally, text describing the numbers in progress.
         * @private
         */
        makeProgressBarElement: function(job, showNumber) {
            var type = job[8].toLowerCase();
            var max = job[7] || 0;
            var progress = job[6] || 0;

            if (type === "percent") {
                var bar = "";
                if (showNumber)
                    bar += progress + "%";

                return bar + "<div class='progress' style='margin-bottom: 0;'>" + 
                           "<div class='progress-bar' role='progressbar' aria-valuenow='" + 
                               progress + "' aria-valuemin='0' aria-valuemax='100' style='width: " + 
                               progress + "%;'>" +
                               "<span class='sr-only'>" + progress + "% Complete" + "</span>" +
                           "</div>" +
                       "</div>";
            }
            else {
                var bar = "";
                if (showNumber)
                    bar += progress + " / " + max;
                return bar + "<div class='progress' style='margin-bottom: 0;'>" + 
                           "<div class='progress-bar' role='progressbar' aria-valuenow='" + 
                           progress + "' aria-valuemin='0' aria-valuemax='" + max + "' style='width: " + 
                           (progress / max * 100) + "%;'>" +
                               "<span class='sr-only'>" + progress + " / " + max + "</span>" +
                           "</div>" +
                       "</div>";
            }
            return "<div></div>";
        },

        /**
         * @method parseTimestamp
         * Parses the user_and_job_state timestamp and returns it as a user-
         * readable string in the UTC time.
         *
         * This assumes that the timestamp string is in the following format:
         * 
         * YYYY-MM-DDThh:mm:ssZ, where Z is the difference
         * in time to UTC in the format +/-HHMM, eg:
         *   2012-12-17T23:24:06-0500 (EST time)
         *   2013-04-03T08:56:32+0000 (UTC time)
         * 
         * If the string is not in that format, this method returns the unchanged
         * timestamp.
         *        
         * @param {String} timestamp - the timestamp string returned by the service
         * @returns {String} a parsed timestamp in the format "YYYY-MM-DD HH:MM:SS" in the browser's local time.
         * @private
         */
        parseTimestamp: function(timestamp, dateObj) {
            var d = null;
            if (timestamp)
                d = this.parseDate(timestamp);
            else if(dateObj)
                d = dateObj;

            if (d === null)
                return timestamp;

            var addLeadingZeroes = function(value) {
                value = String(value);
                if (value.length === 1)
                    return "0" + value;
                return value;
            };

            return d.getFullYear() + "-" + 
                   addLeadingZeroes((d.getMonth() + 1)) + "-" + 
                   addLeadingZeroes(d.getDate()) + " " + 
                   addLeadingZeroes(d.getHours()) + ":" + 
                   addLeadingZeroes(d.getMinutes()) + ":" + 
                   addLeadingZeroes(d.getSeconds());
        },

        /**
         * @method calcTimeDifference
         * From two timestamps (i.e. Date.parse() parseable), calculate the
         * time difference and return it as a human readable string.
         *
         * @param {String} time - the timestamp to calculate a difference from
         * @returns {String} - a string representing the time difference between the two parameter strings
         */
        calcTimeDifference: function(timestamp, dateObj) {
            var now = new Date();
            var time = null;

            if (timestamp)
                time = this.parseDate(timestamp);
            else if(dateObj)
                time = dateObj;

            if (time === null)
                return "Unknown time";

            // start with seconds
            var timeRem = Math.abs((time - now) / 1000 );
            var unit = " sec";

            // if > 60 seconds, go to minutes.
            if (timeRem >= 60) {
                timeRem /= 60;
                unit = " min";

                // if > 60 minutes, go to hours.
                if (timeRem >= 60) {
                    timeRem /= 60;
                    unit = " hrs";

                    // if > 24 hours, go to days
                    if (timeRem >= 24) {
                        timeRem /= 24;
                        unit = " days";
                    }

                    // now we're in days. if > 364.25, go to years)
                    if (timeRem >= 364.25) {
                        timeRem /= 364.25;
                        unit = " yrs";

                        // now we're in years. just for fun, if we're over a century, do that too.
                        if (timeRem >= 100) {
                            timeRem /= 100;
                            unit = " centuries";

                            // ok, fine, i'll do millennia, too.
                            if (timeRem >= 10) {
                                timeRem /= 10;
                                unit = " millennia";
                            }
                        }
                    }
                }
            }


            var timediff = "~" + timeRem.toFixed(1) + unit;
            if (time > now)
                timediff += " from now";
            else
                timediff += " ago";

            return timediff;
        },

        /**
         * VERY simple date parser.
         * Returns a valid Date object if that time stamp's real. 
         * Returns null otherwise.
         * @param {String} time - the timestamp to convert to a Date
         * @returns {Object} - a Date object or null if the timestamp's invalid.
         */
        parseDate: function(time) {
            var t = time.split(/[^0-9]/);
            while (t.length < 7) {
                t.append(0);
            }
            var d = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5], t[6]);
            if (Object.prototype.toString.call(d) === '[object Date]') {
                if (isNaN(d.getTime())) {
                    return null;
                }
                else {
                    d.setFullYear(t[0]);
                    return d;
                }
            }
            return null;
        },
    });

})( jQuery );