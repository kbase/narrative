/*


*/

define('kbaseIrisFileEditor',
    [
        'jquery',
        'kbaseAuthenticatedWidget',
        'kbasePrompt',
    ],
    function ($) {


    $.KBWidget({

		  name: "kbaseIrisFileEditor",
		parent: 'kbaseAuthenticatedWidget',

        version: "1.0.0",
        _accessors : [
            'client',
            {name : 'file', 'setter' : 'setFile'},
            'rows',
            'cols',
            'content',
            'loadedContent',
            'saveFileCallback',
            'cancelSaveFileCallback',
        ],

        options: {
            rows : 50,
            cols : 85,
        },

        init: function (options) {

            this._super(options);

            this.appendUI(this.$elem);

            return this;

        },

        setFile : function (newFile) {
            this.setValueForKey('file', newFile);
            this.appendUI(this.$elem);
        },

        save : function() {

            var fileParts = this.file().split('/');
            var fileName = fileParts.pop();
            var uploadDir = fileParts.join('/');

            if (this.content() == this.loadedContent()) {
                return;
            }

            this.client().put_file(
                this.sessionId(),
                fileName,
                this.content(),
                uploadDir,
                jQuery.proxy( function (res) {
                    this.dbg("saved file");
                }, this),
                jQuery.proxy( function (res) {
                    throw("Could not save file " + res.error.message);
                }, this)
            );
        },

        appendUI : function ($elem) {

            $elem.empty();
            $elem
                .append('Loading file ' + this.file() + '...<br>please wait...')
                .append($.jqElem('br'))
                .append(
                    $.jqElem('div')
                        .attr('align', 'center')
                        .append($.jqElem('i').addClass('fa fa-spinner').addClass('fa fa-spin fa fa-4x'))
                )
            ;

            this.client().get_file(
                this.sessionId(),
                this.file(),
                '/',
                $.proxy(
                    function (res) {

                        var $ui = $.jqElem('textarea')
                            .attr('rows', this.rows())
                            .attr('cols', this.cols())
                            .css('width', '720px')
                            .kb_bind(
                                this,
                                'content'
                            );

                        this.content(res);
                        this.loadedContent(this.content());

                        $elem.empty();
                        $elem.append($ui);


                    },
                    this
                ),
                $.proxy(function (err) {
                    var $ui = $.jqElem('textarea')
                        .attr('rows', this.rows())
                        .attr('cols', this.cols())
                        .css('width', '720px')
                        .kb_bind(
                            this,
                            'content'
                        );

                    $elem.empty();
                    $elem.append($ui);

                }, this)
            );

        },

        savePrompt : function() {

            if (this.content() == this.loadedContent()) {
                if (this.saveFileCallback) {
                    this.saveFileCallback()(this.file());
                }
                return;
            }

            var $saveModal = $.jqElem('div').kbasePrompt(
                    {
                        title : 'Save changes',
                        body : 'Save changes to <strong>' + this.file() + '</strong> before closing?',
                        controls : [
                            {
                                name: 'Close without save',
                                callback : $.proxy(function (e, $prompt) {
                                    $prompt.closePrompt();
                                    if (this.cancelSaveFileCallback) {
                                        this.cancelSaveFileCallback()(this.file());
                                    }
                                }, this)
                            },
                            {
                                name : 'Close and save',
                                type : 'primary',
                                callback : $.proxy(function(e, $prompt) {
                                    $prompt.closePrompt();
                                    this.save();
                                    if (this.saveFileCallback) {
                                        this.saveFileCallback()(this.file());
                                    }
                                }, this)
                            }
                        ],
                    }
                )
            ;

            $saveModal.openPrompt();
        },

    });

});
