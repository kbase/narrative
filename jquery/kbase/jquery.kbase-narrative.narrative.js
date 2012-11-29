/*


*/


(function( $, undefined ) {


    $.widget("kbase-narrative.narrative", {
        version: "1.0.0",
        options: {
            invocationURL : 'http://bio-data-1.mcs.anl.gov/services/invocation',
            name : 'New Narrative',
            blockCounter : 0,
        },

        _create : function() {
            this.client = new InvocationService(this.options.invocationURL);

            this.user_id = window.$ld.login('session').user_id;
            this.wd = '/narratives/' + this.options.name;


            this.appendUI( $( this.element ) );

            if (this.options.output) {
                this.appendOutputUI(this.options.output);
            }

            try {
                this.client.make_directory(this.user_id, '/', 'narratives');
            }
            catch (e) {
                //already has narratives directory
                //console.log("already has narrative");console.log(e);
            }

            var previouslySaved = 0;

            try{
                var res = this.client.list_files(this.user_id, this.wd);

                if (res) {
                    previouslySaved = 1;
                }
            }
            catch(e) {
                this.client.make_directory(this.user_id, this.wd);
                this.addComment({'value' : 'Click on a command on the left to add it to the queue.\nDrag and drop to re-arrange if you forgot something!'});
            }

            if (previouslySaved) {
                //console.log('loading prior narrative');

                try {
                    var savedNarrative = this.client.get_file(this.user_id, 'narrative.data', this.wd);
                    var instructions = JSON.parse(savedNarrative);

                    this.options.blockCounter = instructions.blockCounter;
                    this.options.name = instructions.name;
                    this.user_id = instructions.owner;
                    this.wd = instructions.wd;

                    $.each(
                        instructions.elements,
                        $.proxy(
                            function(idx, val) {
                                if (val.type == 'comment') {
                                    this.addComment(
                                        {
                                            value   : val.comment,
                                            id      : val.id,
                                            noSave  : true,
                                        }
                                    );
                                }
                                else if (val.type == 'narrativeBlock') {

                                    var $block = this.addBlock(
                                        {
                                            name : val.name,
                                            fields : val.fields,
                                            inputType : val.inputType,
                                            outputType : val.outputType,
                                            id : val.id,
                                            outputTruncate : val.outputTruncate,
                                            values : val.values,
                                            lastRun : val.lastRun,
                                            noSave : true,
                                        }
                                    );

                                    this.client.get_file_async(
                                        this.user_id,
                                        val.id,
                                        this.wd,
                                        $.proxy(
                                            function (res) {
                                                this.narrativeBlock('appendOutputUI', res);
                                            },
                                            $block
                                        ),
                                        function (err) { console.log("FILE FAILURE"); console.log(err) }
                                    );

                                }
                            },
                            this
                        )
                    );

                }
                catch(e) {
                    console.log(e);
                }
            }

            $(window).bind(
                'resize',
                $.proxy(
                    function(evt) {
                        this.reposition(evt);
                    },
                    this
                )
            );

            $(this.element).data('isNarrative', 1);

            //THIS IS A TEMPORARY HACK!
            setTimeout(function() {$('#commandcontext').commandcontext('refresh')}, 500);

            return this;
        },

        save : function() {
            var output = {
                name            : this.options.name,
                wd              : this.wd,
                owner           : this.user_id,
                blockCounter    : this.options.blockCounter,
                elements        : [],
            };

            $.each(
                this.data('workspace').children(),
                function (idx, val) {
                    var blockType = $(val).data('blockType');
                    if ($(val)[blockType]) {
                        output.elements.push($(val)[blockType]('blockDefinition'));
                    }
                }
            );

            var json = JSON.stringify(output);

            this.client.put_file(this.user_id, 'narrative.data', json, this.wd);
        },

        data : function (key, val) {
            if (this.options._storage == undefined) {
                this.options._storage = {};
            }

            if (arguments.length == 2) {
                this.options._storage[key] = val;
            }

            if (key != undefined) {
                return this.options._storage[key];
            }
            else {
                return this.options._storage;
            }
        },

        _rewireIds : function($elem, $target) {

            if ($target == undefined) {
                $target = $elem;
            }

            if ($elem.attr('id')) {
                $target.data($elem.attr('id'), $elem);
                $elem.removeAttr('id');
            }

            $.each(
                $elem.find('[id]'),
                function(idx) {
                    $target.data($(this).attr('id'), $(this));
                    $(this).removeAttr('id');
                    }
            );

            return $elem;
        },

        generateBlockID: function () {
            return this.options.name + '-' + this.options.blockCounter++;
        },

        addBlock : function(options) {

            if (options == undefined) {
                options = {};
            }

            if (options.activateCallback == undefined) {
                options.activateCallback = $.proxy( this.blockActivateCallback, this);
            }
            if (options.deactivateCallback == undefined) {
                options.deactivateCallback = $.proxy( this.blockDeactivateCallback, this);
            }

            if (options.id == undefined) {
                options.id = this.generateBlockID();
            }

            options.narrative = this;

            var metaFunc = MetaToolInfo(options.name);

            if (metaFunc != undefined) {
                var meta = metaFunc(options.name);
                for (key in meta) {
                    options[key] = meta[key];
                }
            }

            var $block = $('<div></div>').narrativeBlock(options);

            if (this.data('activeBlock')) {
                this.data('activeBlock').element.after($block);
            }
            else {
                this.data('workspace').append($block);
            }

            if (! options.noSave) {
                this.save();
            }

            $block.narrativeBlock('reposition');

            //THIS IS A TEMPORARY HACK!
            $('#commandcontext').commandcontext('refresh');

            return $block;
        },

        addComment : function(options) {

            if (options == undefined) {
                options = {};
            }

            if (options.id == undefined) {
                options.id = this.generateBlockID();
            }

            options.narrative = this;

            var $comment = $('<div></div>').comment(options);

            if (this.data('activeBlock')) {
                this.data('activeBlock').element.after($comment);
            }
            else {
                this.data('workspace').append($comment);
            }

            if (! options.noSave) {
                this.save();
            }

            return $comment;
        },

        activeBlock : function () {
            if (this.data('activeBlock')) {
                return this.data('activeBlock');
            }
            else {
                return this.data('workspace').children().last();
            }
        },

        blockActivateCallback : function ($block) {

            if (this.data('activeBlock') != undefined) {
                this.data('activeBlock').deactivate();
            }

            this.data('activeBlock', $block);

            //THIS IS A TEMPORARY HACK!
            $('#commandcontext').commandcontext('refresh');

        },

        blockDeactivateCallback : function ($block) {
            this.data('activeBlock', undefined);

            //THIS IS A TEMPORARY HACK!
            $('#commandcontext').commandcontext('refresh');
        },

        appendUI : function($elem) {

            var $container = $elem
                .append(
                    $('<div></div>')
                        .attr('id', 'workspace')
                );


            this._rewireIds($container, this);

            this.data('workspace').sortable({cancel: ':input,button,.editor'});

            return $container;

        },

        reposition : function(evt) {
            $.each(
                this.data('workspace').children(),
                function (idx, val) {
                    var blockType = $(val).data('blockType');
                    if (blockType == 'narrativeBlock') {
                        $(val).narrativeBlock('reposition');
                    }
                }
            );
        },


    });

}( jQuery ) );
