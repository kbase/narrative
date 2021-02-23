/*global define*/
/**
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'narrativeConfig',
		'kbaseNarrativeParameterInput'
	], (
		KBWidget,
		bootstrap,
		$,
		Config,
		kbaseNarrativeParameterInput
	) => {
    'use strict';
    return KBWidget({
        name: "kbaseNarrativeParameterTextareaInput",
        parent : kbaseNarrativeParameterInput,
        version: "1.0.0",
        options: {
            loadingImage: Config.get('loading_gif'),
            parsedParameterSpec: null,
            isInSidePanel: false
        },
        IGNORE_VERSION: true,

        // properties inherited from kbaseNarrativeParameterInput
        // $mainPanel:null,
        // spec:null,

        enabled: true,
        required: true,
        rowDivs: null,

        render: function() {
            const self = this;
            const spec = self.spec;

            // check if we need to allow multiple values
            let allow_multiple = false;
            if (spec.allow_multiple) {
                if (spec.allow_multiple===true || spec.allow_multiple===1) {
                    allow_multiple = true;
                }
            }

            self.rowDivs = [];
            if (!allow_multiple) {
                // just one field, phew, this one should be easy
                const d = spec.default_values;

                // check if this is a required field
                self.required= true;
                if (spec.optional) {
                    self.required=false;
                }

                const defaultValue = (d[0] !== "" && d[0] !== undefined) ? d[0] : "";
                const form_id = spec.id;

                let rows = 3; let placeholder="";
                if(spec.textarea_options) {
                    if (spec.textarea_options.n_rows) {
                        rows = spec.textarea_options.n_rows;
                    }
                    if(spec.textarea_options.placeholder) {
                        placeholder = spec.textarea_options.placeholder;
                    }
                }
                const $textArea= $('<textarea id="'+form_id+'">').addClass("form-control")
                                .css({width:"100%",resize:"vertical"})
                                .attr('rows',rows)
                                .attr('placeholder',placeholder)
                                .append(defaultValue)
                                .on("input",() => { self.isValid() });

                const $feedbackTip = $("<span>").removeClass();
                if (self.required) {
                    $feedbackTip.addClass('kb-method-parameter-required-glyph glyphicon glyphicon-arrow-left').prop("title","required field");
                }

                // set the widths of the columns
                let nameColClass  = "col-md-2";
                let inputColClass = "col-md-5";
                let hintColClass  = "col-md-5";
                if (self.options.isInSidePanel) {
                    nameColClass  = "col-md-12";
                    inputColClass = "col-md-12";
                    hintColClass  = "col-md-12";
                }

                const $row = $('<div>').addClass("row kb-method-parameter-row")
                                .hover(function(){$(this).toggleClass('kb-method-parameter-row-hover');});
                const $nameCol = $('<div>').addClass(nameColClass).addClass("kb-method-parameter-name")
                                    .append(spec.ui_name);
                if (self.options.isInSidePanel)
                	$nameCol.css({'text-align': 'left', 'padding-left': '10px'});
                const $inputCol = $('<div>').addClass(inputColClass).addClass("kb-method-parameter-input")
                                .append($('<div>').css({"width":"100%","display":"inline-block"}).append($textArea))
                                .append($('<div>').css({"display":"inline-block"}).append($feedbackTip));
                const $hintCol  = $('<div>').addClass(hintColClass).addClass("kb-method-parameter-hint")
                                .append(spec.short_hint);
		if (spec.description && spec.short_hint !== spec.description) {
		    $hintCol.append($('<span>').addClass('fa fa-info kb-method-parameter-info')
					.tooltip({title:spec.description, html:true, container: 'body'}));
		}
                $row.append($nameCol).append($inputCol).append($hintCol);

                const $errorPanel = $('<div>').addClass("kb-method-parameter-error-mssg").hide();
                const $errorRow = $('<div>').addClass('row')
                                    .append($('<div>').addClass(nameColClass))
                                    .append($errorPanel.addClass(inputColClass));

                self.$mainPanel.append($row);
                self.$mainPanel.append($errorRow);
                self.rowDivs.push({$row:$row, $error:$errorPanel, $feedback:$feedbackTip});

                this.isValid();

            } else {
                // need to handle multiple fields- do something better!
                self.$mainPanel.append("<div>multiple dropdown fields not yet supported</div>");
            }
        },


        refresh: function() {
            // we don't allow types in textareas, so we don't have to refresh
        },




        /*
         * This is called when this method is run to allow you to check if the parameters
         * that the user has entered is correct.  You need to return an object that indicates
         * if the input is valid, or if not, if there are any error messages.  When this is
         * called, you should visually indicate which parameters are invalid by marking them
         * red (see kbaseNarrativeMethodInput for default styles).
         */
        isValid: function() {
            const self = this;
            if (!self.enabled) {
                return { isValid: true, errormssgs:[]}; // do not validate if disabled
            }
            let p= self.getParameterValue();
	    if (p===null) { return { isValid: true, errormssgs:[]}; }
            let errorDetected = false;
            const errorMessages = [];
            if(p instanceof Array) {
                // todo: handle this case when there are multiple fields
            } else {
                p = p.trim();
                // if it is a required selection and is empty, keep the required icon around but we have an error
                if (p==='' && self.required) {
                    self.rowDivs[0].$row.removeClass("kb-method-parameter-row-error");
                    self.rowDivs[0].$feedback.removeClass().addClass('kb-method-parameter-required-glyph glyphicon glyphicon-arrow-left').prop("title","required field");
                    self.rowDivs[0].$feedback.show();
                    self.rowDivs[0].$error.hide();
                    errorDetected = true;
                    errorMessages.push("required field "+self.spec.ui_name+" missing.");
                }

                // no error, so we hide the error if any, and show the "accepted" icon if it is not empty
                if (!errorDetected) {
                    if (self.rowDivs[0]) {
                        self.rowDivs[0].$row.removeClass("kb-method-parameter-row-error");
                        self.rowDivs[0].$error.hide();
                        self.rowDivs[0].$feedback.removeClass();
                        if (p!=='') {
                            self.rowDivs[0].$feedback.removeClass().addClass('kb-method-parameter-accepted-glyph glyphicon glyphicon-ok');
                        }
                    }
                }
            }
            return { isValid: !errorDetected, errormssgs:errorMessages};
        },

        /*
         * Necessary for Apps to disable editing parameters that are automatically filled
         * from a previous step.  Returns nothing.
         */
        disableParameterEditing: function() {
            // disable the input
            this.enabled = false;
            this.$elem.find("#"+this.spec.id).prop('disabled',true);
            // stylize the row div
            if (this.rowDivs) {
                this.rowDivs[0].$feedback.removeClass();
            }
        },

        /*
         * Allows those parameters to be renabled, which may be an option for advanced users.
         */
        enableParameterEditing: function() {
            // enable the input
            this.enabled = true;
            this.$elem.find("#"+this.spec.id).prop('disabled', false);
            this.isValid();
        },


        lockInputs: function() {
            if (this.enabled) {
                this.$elem.find("#"+this.spec.id).prop('disabled',true);
            }
            // stylize the row div
            if (this.rowDivs) {
                this.rowDivs[0].$feedback.removeClass();
            }
        },

        unlockInputs: function() {
            if (this.enabled) {
                this.$elem.find("#"+this.spec.id).prop('disabled',false);
            }
            this.isValid();
        },

        addInputListener: function(onChangeFunc) {
            this.$elem.find("#"+this.spec.id).on("input",onChangeFunc);
        },

        /*
         * An App (or a narrative that needs to auto populate certain fields) needs to set
         * specific parameter values based on the App spec, so we need a way to do this.
         */
        setParameterValue: function(value) {
            // todo: handle case where this is a multiple, we need to check if value array matches number of elements,
            // and if not we must do something special   ...
            this.$elem.find("#"+this.spec.id).val(value);
            this.isValid();
        },

        /*
         * We need to be able to retrieve any parameter value from this method.  Valid parameter
         * values may be strings, numbers, objects, or lists, but must match what is declared
         * in the method spec.
         */
        getParameterValue: function() {
            const value = this.$elem.find("#"+this.spec.id).val();
	    if (this.spec.optional === 1) {
		if (value.trim().length===0) {
		    return null;
		}
	    }
            return value;
        }

    });
});
