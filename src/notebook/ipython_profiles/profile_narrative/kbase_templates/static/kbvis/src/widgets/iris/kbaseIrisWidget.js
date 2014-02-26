/*


*/

define('kbaseIrisWidget',
    [
        'jquery',
        'kbaseAuthenticatedWidget',
    ],
    function ($) {



    $.KBWidget(
        {

            name: "kbaseIrisWidget",
            parent: 'kbaseAuthenticatedWidget',

            version: "1.0.0",
            _accessors : [
                'promise',
                'subWidgets',
                {name : 'isSelected', setter : 'setIsSelected'},
                {name : 'pid', setter : 'setPid'},
                {name : 'isHidden', setter : 'setIsHidden'},
                {name : 'input', setter : 'setInput'},
                {name : 'output', setter : 'setOutput'},
                {name : 'error', setter : 'setError'},
                {name : 'value', setter : 'setValue'},
                {name : 'cwd', setter : 'setCwd'},
                {name : 'subCommand', setter : 'setSubCommand'},
            ],
            options: {
                subWidgets : [],
            },

            init: function(options) {

                this._super(options);

                this.$elem.on(
                    'removeWidget.kbaseIris',
                    $.proxy(function (e, params) {
                        this.removeWidget(params.$widget);
                    }, this)
                );

                this.$elem.on(
                    'toggleWidgetSelection.kbaseIris',
                    $.proxy(function (e, $widget) {
                        e.stopPropagation();e.preventDefault();
                        this.$elem.parent().trigger('toggleWidgetSelection', this);
                        //this.toggleSelection();
                    }, this)
                );

                this.appendUI( $( this.$elem ) );

                return this;

            },

            render : function() {},

            toggleSelection : function() {
                this.trigger('toggleWidgetSelection', this);
            },

            setIsSelected : function(newIsSelected) {
                this.setValueForKey('isSelected', newIsSelected);
                if (this.isSelected()) {
                    this.$elem.css('border', '1px solid green');
                }
                else {
                    this.$elem.css('border', '')
                }
            },

            setSubCommand : function(subCommand) {
                this.setValueForKey('subCommand', subCommand);
            },

            setPid : function(newVal) {
                this.setValueForKey('pid', newVal);
            },

            setIsHidden : function(newVal) {
                this.setValueForKey('isHidden', newVal);
                if (newVal) {
                    this.$elem.css('display', 'none');
                }
                else {
                    this.$elem.css('display', '');
                }
            },

            setValue : function(newVal) {
                this.setValueForKey('value', newVal);
            },

            setInput : function (newVal) {
                this.setValueForKey('input', newVal);
            },

            setOutput : function (newVal) {
                this.setValueForKey('output', newVal);
            },

            setError : function (newVal) {
                this.setValueForKey('error', newVal);
                if ( typeof newVal == 'string' && newVal.match(/error/i) ) {
                    this.$elem.css('display', '');
                }
            },

            setCwd : function (newVal) {
                this.setValueForKey('cwd', newVal);
            },

            escapeText : function (newVal) {

                if (typeof newVal == 'string') {
                    newVal = newVal.replace(/&/g, '&amp;');
                    newVal = newVal.replace(/</g, '&lt;');
                    newVal = newVal.replace(/>/g, '&gt;');
                    newVal = $.jqElem('span')
                        .append(
                            $.jqElem('span')
                            .css('white-space', 'pre')
                            .append(newVal)
                        );
                }
                else {
                    newVal = $.jqElem('span').append(newVal);
                }

                return newVal;
            },

            viewOutput : function() {

                var win = window.open();
                win.document.open();
                var output =
                    $.jqElem('div')
                        .append(
                            $.jqElem('div')
                                .css('white-space', 'pre')
                                .css('font-family' , 'monospace')
                                .append(
                                    this.output().clone()
                                )
                        )
                ;
                $.each(
                    output.find('a'),
                    function (idx, val) {
                        $(val).replaceWith($(val).html());
                    }
                );

                win.document.write(output.html());
                win.document.close();
            },

            acceptInput : function($widget, refuse) {

                this.kb_bind(
                    $widget,
                    'value',
                    function (e, $target, vals) {
                        this.setInput(vals.newValue);
                        this.render();
                    }
                );
                if ($widget.value() != undefined && ! refuse) {
                    this.setInput($widget.value());
                }
            },

            startThinking : function() {},
            stopThinking : function() {},
            freeze : function() {
                return {
                    error : 'this widget could not be frozen!'
                }
            },

            thaw : function () {
                this.setError("This widget could not be unfrozen!");
            },

            freeze : function () {

                var json = {
                    type        : this.name,
                    input       : typeof this.input() == 'object' ? $.jqElem('div').append(this.input().clone()).html() : this.input(),
                    output      : typeof this.output() == 'object' ? $.jqElem('div').append(this.output().clone()).html() : this.output(),
                    error       : typeof this.error() == 'object' ? $.jqElem('div').append(this.error().clone()).html() : this.error(),
                    value       : this.value(),
                    pid         : this.pid(),
                    isHidden    : this.isHidden(),
                    cwd         : this.cwd(),
                    subCommand  : this.subCommand(),
                    subWidgets  : [],
                    inputObj : typeof this.input()  == 'object',
                    outputObj : typeof this.output() == 'object',
                    errorObj : typeof this.error()  == 'object',
                };

                $.each(
                    this.subWidgets(),
                    function (idx, $sub) {
                        json.subWidgets.push($sub.freeze());
                    }
                );

                return json;
            },

            thaw : function (json) {

                var $widget = $.jqElem('div')[json.type]();

                $widget.setSubCommand(json.subCommand);
                $widget.setCwd(json.cwd);
                $widget.setIsHidden(json.isHidden);
                $widget.setPid(json.pid);
                $widget.setValue(json.value);
                $widget.setInput(
                    json.inputObj
                        ? $.jqElem('div').append(json.input)
                        : json.input
                );
                $widget.setOutput(
                    json.outputObj
                        ? $.jqElem('div').append(json.output)
                        : json.output
                );
                $widget.setError(
                    json.errorObj
                        ? $.jqElem('div').append(json.error)
                        : json.error
                );

                $.each(
                    json.subWidgets,
                    $.proxy(function (idx, wdgt) {
                        $widget.appendWidget(this.thaw(wdgt));
                    }, this)
                );

                return $widget;
            },

            appendWidget: function($widget) {
                if (this.output() == undefined) {
                    this.setOutput($.jqElem('div'));
                }

                var isSubWidget = false;

                $.each(
                    this.subWidgets(),
                    $.proxy(function (idx, $wdgt) {
                        if ($wdgt === $widget) {
                            isSubWidget = true;
                            return;
                        }
                    }, this)
                );

                if (! isSubWidget && this.data('subWidgets')) {
                    this.data('subWidgets').append($widget.$elem);
                    this.subWidgets().push($widget);
                }
            },

            removeWidget : function($widget) {

                for (var idx = 0; idx < this.subWidgets().length; idx++) {
                    if (this.subWidgets()[idx] === $widget) {
                        this.subWidgets().splice(idx,1);
                        $widget.$elem.remove();
                        break;
                    }
                }

            },

        }

    );

});
