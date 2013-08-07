/*


*/

(function( $, undefined ) {

    $.kbWidget("kbaseIrisProcessList", 'kbaseWidget', {
        version: "1.0.0",
        _accessors : ['processList'],
        options: {
            processList : {},
        },

        init: function (options) {

            this._super(options);

            $(document).on(
                'updateIrisProcess.kbaseIris',
                $.proxy(function (e, params) {
                    this.updateProcess(e, params);
                }, this)
            );

            $(document).on(
                'removeIrisProcess.kbaseIris',
                $.proxy(function (e, pid) {
                    this.removeProcess(e, pid);
                }, this)
            );

            this.appendUI(this.$elem);

            return this;

        },

        updateProcess : function (e, params) {

            var pid = params.pid;

            if (pid == undefined) {
                throw "Cannot update process w/o pid";
            }

            this.pendingLi().remove();

            var $processElem = this.processList()[pid] != undefined
                ? this.processList()[pid]
                : $.jqElem('li');

            $processElem.empty();
            if (params.msg) {
                $processElem.text(params.msg);
            }
            else if (params.content) {
                $processElem.append(params.content);
            }

            if (this.processList()[pid] == undefined) {
                this.$elem.find('ul').append($processElem);
                this.processList()[pid] = $processElem;
            }

            return $processElem;

        },

        removeProcess : function (e, pid) {

            if (pid == undefined) {
                throw "Cannot update process w/o pid";
            }

            var $processElem = this.processList()[pid];

            if ($processElem == undefined) {
                return;
            }

            $processElem.remove();
            if (this.$elem.find('ul').children().length == 0) {
                this.$elem.find('ul').append(this.pendingLi());
            }

            this.processList()[pid] = undefined;

            return pid;

        },

        appendUI : function($elem) {

            var $box = $elem.kbaseBox(
                {
                    'title' : 'Running processes',
                    'content' :
                        $('<ul></ul>')
                            .addClass('unstyled')
                            .append(this.pendingLi()),
                }
            );

            return this;

        },

        pendingLi : function() {
            if (this.data('pendingLi') == undefined) {
                this.data('pendingLi',
                    $('<li></li>')
                        .css('font-style', 'italic')
                        .text('No processes running')
                );
            }

            return this.data('pendingLi');
        },


    });

}( jQuery ) );
