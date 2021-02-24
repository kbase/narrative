 /**
 * @author Harry Yoo <hsyoo@anl.gov>
 *
 * This shows dropdown basing on the ajaxConfig provided in the options.
 * See the example of ajaxConfig https://select2.github.io/examples.html#data-ajax
 *
 */
define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'narrativeConfig',
		'kbaseNarrativeParameterCustomTextSubdataInput'
	], (
		KBWidget,
		bootstrap,
		$,
		Config,
		kbaseNarrativeParameterCustomTextSubdataInput
	) => {

    return KBWidget({
        name: "kbaseNarrativeParameterAjaxTextSubdataInput",
        parent : kbaseNarrativeParameterCustomTextSubdataInput,
        version: "1.0.0",
        options: {
            isInSidePanel: false,
            ajaxConfig: null
        },

        render: function() {
            const self = this;
            const spec = self.spec;

            self.$dropdown = $('<input id="' + spec.id + '" type="text" style="width:100%" />')
                                .on("change",() => { self.isValid() });

            self.$feedbackDiv = $("<span>");

            const nameColClass  = "col-md-2";
            const inputColClass = "col-md-5";
            const hintColClass  = "col-md-5";

            self.$rowDiv = $('<div>').addClass("row kb-method-parameter-row")
                            .hover(function(){$(this).toggleClass('kb-method-parameter-row-hover');});
            const $nameCol = $('<div>').addClass(nameColClass).addClass("kb-method-parameter-name")
                                .append(spec.ui_name);
            const $inputCol = $('<div>').addClass(inputColClass).addClass("kb-method-parameter-input")
                            .append($('<div>').css({"width":"100%","display":"inline-block"}).append(self.$dropdown))
                            .append($('<div>').css({"display":"inline-block"}).append(self.$feedbackDiv));
            const $hintCol  = $('<div>').addClass(hintColClass).addClass("kb-method-parameter-hint")
                            .append(spec.short_hint);
            self.$rowDiv.append($nameCol).append($inputCol).append($hintCol);

            const $errorPanel = $('<div>').addClass("kb-method-parameter-error-mssg").hide();
            self.$errorDiv = $('<div>').addClass('row')
                                .append($('<div>').addClass(nameColClass))
                                .append($errorPanel.addClass(inputColClass));

            self.$mainPanel.append(self.$rowDiv);
            self.$mainPanel.append(self.$errorDiv);
            /// changed here
            self.setupSelect2(self.$dropdown, self.options.ajaxConfig);
            self.isValid();
        },

        setupSelect2: function ($input, $ajax) {
            $input.select2($ajax);
        },

        isValid: function() {
            const self = this;
            const value = self.getParameterValue();
            const errorMessages = [];
            let valid = !$.isEmptyObject(value);
            if( !this.spec.optional && this.spec.allow_multiple ){
                valid = value.length > 1 || value[0] != '';
            }

            if(!valid){
                errorMessages.push("required field "+self.spec.ui_name+" missing.");
            }

            // Update $feedbackDiv
            self.$feedbackDiv.removeClass();
            if(this.enabled){
                if(valid){
                    self.$feedbackDiv.addClass('kb-method-parameter-accepted-glyph glyphicon glyphicon-ok');
                } else{
                    self.$feedbackDiv
                        .addClass('kb-method-parameter-required-glyph glyphicon glyphicon-arrow-left')
                        .prop("title","required field");
                }
            }
            self.$feedbackDiv.show();

            return { isValid: valid, errormssgs: errorMessages};
        }
    });
});    
