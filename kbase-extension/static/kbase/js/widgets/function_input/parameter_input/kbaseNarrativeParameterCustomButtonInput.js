 /**
 * @author Pavel Novichkov <psnovichkov@lbl.gov>
 *
 * This shows button with label defined in ui_name
 * The dataModel should have fetchData method onButtonClick().
 *
 */
define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'select2'
	], function(
		KBWidget,
		bootstrap,
		$,
		select2
	) {
    
    return KBWidget({
        name: "kbaseNarrativeParameterCustomButtonInput",
        parent : kbaseNarrativeParameterInput,  
        version: "1.0.0",
        options: {
            loadingImage: "../images/ajax-loader.gif",
            isInSidePanel: false,
            dataModel: null
        },
        
        $rowDiv: null,
        $errorDiv: null,
        $feedbackDiv: null,
        $button: null,
        
        enabled: true,
        active: false,
        value: false,
                        
        render: function() {
            var self = this;
            var spec = self.spec;            
            
            var nameColClass  = "col-md-2";
            var inputColClass = "col-md-5";
            var hintColClass  = "col-md-5";
            
            self.$button = $('<button type="button">' + spec.ui_name + '</button>')
                    .addClass('btn btn-default ')
                    .prop('disabled', true);
            self.deactivate();
            
            self.$feedbackDiv = $("<span>")
                    .addClass('kb-method-parameter-required-glyph glyphicon glyphicon-arrow-left')
                    .prop("title","required field");
            
            self.$rowDiv = $('<div>').addClass("row kb-method-parameter-row")
                            .hover(function(){$(this).toggleClass('kb-method-parameter-row-hover');});
            var $nameCol = $('<div>').addClass(nameColClass).addClass("kb-method-parameter-name")
                                .append('');
            var $inputCol = $('<div>').addClass(inputColClass).addClass("kb-method-parameter-input")
                            .append($('<div>').css({"width":"100%","display":"inline-block"}).append(self.$button))
                            .append($('<div>').css({"display":"inline-block"}).append(self.$feedbackDiv));
            var $hintCol  = $('<div>').addClass(hintColClass).addClass("kb-method-parameter-hint")
                            .append(spec.short_hint);
            self.$rowDiv.append($nameCol).append($inputCol).append($hintCol);

            var $errorPanel = $('<div>').addClass("kb-method-parameter-error-mssg").hide();
            self.$errorDiv = $('<div>').addClass('row')
                                .append($('<div>').addClass(nameColClass))
                                .append($errorPanel.addClass(inputColClass));

            self.$mainPanel.append(self.$rowDiv);
            self.$mainPanel.append(self.$errorDiv);
            
            self.$button.click(function(){
                self.options.dataModel.onButtonClick();
                self.setParameterValue(true);
            });
            
            self.isValid();            
        }, 
        
        // What will be saved in the narrative
        getState: function() {
            var state = {
                value:  this.getParameterValue(),
                active : this.active
            };
            return state;
        },
        loadState: function(state) {
            this.setParameterValue(state.value);
            if(state.active){
                this.activate();
            } else{
                this.deactivate();
            }
        },
        
        // it can be called at any time..
        refresh: function() { 
        },
        isValid: function() {
            var self = this;
            var errorMessages = [];
            var valid = self.getParameterValue();
            
            if(!valid){
                errorMessages.push("Button "+self.spec.ui_name+" needs to be clicked.");
            }
            
            // Update $feedbackDiv
            if(self.$feedbackDiv){
                self.$feedbackDiv.removeClass();
                if(self.enabled){
                    if(valid){
                        self.$feedbackDiv.addClass('kb-method-parameter-accepted-glyph glyphicon glyphicon-ok');                
                    } else{
                        self.$feedbackDiv
                            .addClass('kb-method-parameter-required-glyph glyphicon glyphicon-arrow-left')
                            .prop("title","required field");
                    }
                }
                self.$feedbackDiv.show();
            }
            
            return { isValid: valid, errormssgs:errorMessages};            
        },
        disableParameterEditing: function() { 
//            console.log('-----kbaseNarrativeParameterCustomButtonInput: disableParameterEditing');
            this.enabled = false;
            this.$button.prop('disabled', true);
            this.isValid();
        },
        enableParameterEditing: function() {
            this.$button.prop('disabled', false);
            this.isValid();
        },
        setParameterValue: function(value) {
            this.value = value;
            this.isValid();
        },  
        getParameterValue: function() {
            return this.value;
        },
        prepareValueBeforeRun: function(methodSpec) {
        },
        lockInputs: function() {
            this.disableParameterEditing();
        },
        unlockInputs: function() {
            this.enableParameterEditing();
        },
        activate: function() {
            this.active = true;
            this.$button.prop('disabled', false);
        },
        deactivate: function() {
            this.active = false;
            this.$button.prop('disabled', true);
        },       
        addInputListener: function(onChangeFunc) {
            this.$elem.find("#"+this.spec.id).on("change",onChangeFunc);
        }        
    });
});    
