/*


*/

define('kbaseIrisContainerWidget',
    [
        'jquery',
        'kbaseIrisWidget',
        'kbaseButtonControls',
    ],
    function ($) {


    $.KBWidget(
        {

            name: "kbaseIrisContainerWidget",
            parent: 'kbaseIrisWidget',

            version: "1.0.0",

            options : {
                inputType : 'string',
            },

            _accessors : [

            ],

            setInput : function( newInput) {

                if (this.options.inputType == 'string') {
                    this.setValueForKey('input', newInput);
                    this.options.widget.setInput(newInput);
                }
                else if ( this.options.inputType.match(/file|json/) ) {
                    this.$terminal.client().get_file(
                        this.$terminal.sessionId(),
                        newInput,
                        this.$terminal.cwd,
                        $.proxy(
                            function (inputFile) {
                                if (this.options.inputType == 'json') {
                                    inputFile = JSON.parse(inputFile);
                                }

                                this.setValueForKey('input',  inputFile);
                                this.options.widget.setInput(inputFile);
                            },
                            this
                        ),
                        $.proxy(function (e) {
                            this.setError('No such input file');
                        }, this)
                    );

                }

            },

            setOutput : function( newVal) {
                this.setValueForKey('output', newVal);
                this.options.widget.setOutput(newVal);
            },

            setError : function( newVal) {
                this.setValueForKey('error', newVal);
                this.options.widget.setError(newVal);
            },

            setValue : function( newVal) {
                this.setValueForKey('value', newVal);
                this.options.widget.setValue(newVal);
            },

            init : function (options) {
                this._super(options);

//            observe : function($target, attribute, callback) {
                this.observe(
                    this.options.widget,
                    'didChangeValueForInput',
                    function (e, $target, vals) {
                        this.setValueForKey('input', vals.newValue);
                    }
                );

                this.observe(
                    this.options.widget,
                    'didChangeValueForOutput',
                    function (e, $target, vals) {
                        this.setValueForKey('output', vals.newValue);
                    }
                );

                this.observe(
                    this.options.widget,
                    'didChangeValueForError',
                    function (e, $target, vals) {
                        this.setValueForKey('error', vals.newValue);
                    }
                );

                this.observe(
                    this.options.widget,
                    'didChangeValueForValue',
                    function (e, $target, vals) {
                        this.setValueForKey('value', vals.newValue);
                    }
                );

                return this;
            },

            render : function () {
                if (this.options.widget.render) {
                    this.options.widget.render();
                }
            },

            appendUI : function($elem) {

                $elem.kbaseButtonControls(
                    {
                        context : this,
                        controls : [
                            /*{
                                icon : 'fa fa-eye',
                                callback :
                                    function (e, $it) {
                                        $it.viewOutput();
                                    },
                            },*/
                            {
                                icon : 'fa fa-times',
                                callback :
                                    function (e) {
                                        $elem.remove();
                                    }
                            },

                        ]
                    }
                );

                $elem.append( this.options.widget.$elem)
                ;

                this._rewireIds($elem, this);

                return $elem;

            },

        }

    );

});
