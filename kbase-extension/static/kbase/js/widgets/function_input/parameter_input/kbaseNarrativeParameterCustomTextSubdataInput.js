 /**
 * @author Pavel Novichkov <psnovichkov@lbl.gov>
 *
 * This shows dropdown basing on the dataModel provided in the options. 
 * The dataModel should have fetchData method accepting doneCallback method as a parameter.
 *
 */
define(['jquery', 
        'narrativeConfig',
        'kbwidget', 
        'select2'],
    function( $, Config ) {
    
    var workspaceUrl = Config.url('workspace');
    var loadingImage = Config.get('loading_gif');
    
    $.KBWidget({
        name: "kbaseNarrativeParameterCustomTextSubdataInput",
        parent: "kbaseNarrativeParameterInput",  
        version: "1.0.0",
        options: {
            isInSidePanel: false,
            dataModel: null
        },
        
        enabled: true,
        $rowDiv: null,
        $errorDiv: null,
        $feedbackDiv: null,
        $dropdown: null,
                        
        render: function() {
            var self = this;
            var spec = self.spec;            
            
            self.$dropdown = $('<input id="' + spec.id + '" type="text" style="width:100%" />')
                                    .on("change",function() { self.isValid() });
            
            self.$feedbackDiv = $("<span>");
            
            var nameColClass  = "col-md-2";
            var inputColClass = "col-md-5";
            var hintColClass  = "col-md-5";

            self.$rowDiv = $('<div>').addClass("row kb-method-parameter-row")
                            .hover(function(){$(this).toggleClass('kb-method-parameter-row-hover');});
            var $nameCol = $('<div>').addClass(nameColClass).addClass("kb-method-parameter-name")
                                .append(spec.ui_name);
            var $inputCol = $('<div>').addClass(inputColClass).addClass("kb-method-parameter-input")
                            .append($('<div>').css({"width":"100%","display":"inline-block"}).append(self.$dropdown))
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
            self.setupSelect2(self.$dropdown);
            self.isValid();            
        },  
        
        setupSelect2: function ($input) {
            var self = this;
            var noMatchesFoundStr = "No matching data found.";
            $input.select2({
                minimumResultsForSearch: -1,
                selectOnBlur: true,
                multiple:  self.spec.allow_multiple ?  "multiple" : "",
                formatSelection: function(object, container) {
                    var display = '<span class="kb-parameter-data-selection">'+object.text+'</span>';
                    return display;
                },                
                query: function (query) {                    
                    self.options.dataModel.fetchData(
                        function(dataItems){
                            query.callback({
                                results: dataItems,
                                more: false 
                            });
                        }
                    );
                }
            });
        },                
        getState: function() {
            return this.getParameterValue();
        },
        loadState: function(state) {
            if (!state)
                return;
            this.setParameterValue(state);
        },
        refresh: function() { 
        },
        isValid: function() {
            var self = this;
            var value = self.getParameterValue();
            var errorMessages = [];
            var valid = !$.isEmptyObject(value);
            if( this.spec.allow_multiple ){
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
            
            return { isValid: valid, errormssgs:errorMessages};            
        },
        disableParameterEditing: function() { 
            this.enabled = false;
            this.$elem.find("#"+this.spec.id).select2('disable',true);
            this.isValid();
        },
        enableParameterEditing: function() {
            this.enabled = true;
            this.$elem.find("#"+this.spec.id).select2('enable',true);
            this.isValid();
        },
        setParameterValue: function(value) {
            
            if(value == ''){
                if(this.spec.allow_multiple){
                    value = [];
                }
                
                this.$elem.find("#"+this.spec.id).select2("data",value);
            } else{
                var data = null;
                if(this.spec.allow_multiple){
                    data = [];
                    for(var i in value){
                        data.push({id:value[i], text:value[i]});
                    }
                } else{
                    data = {id:value, text:value};
                }
                
                if (this.enabled) {
                    this.$elem.find("#"+this.spec.id).select2("data",data);
                } else {
                    this.$elem.find("#"+this.spec.id).select2('disable',true);
                    this.$elem.find("#"+this.spec.id).select2("data",data);
                    this.$elem.find("#"+this.spec.id).select2('disable',false);
                }
            }
            
            this.isValid();
        },        
        getParameterValue: function() {
            var value = this.$elem.find("#"+this.spec.id).val();
            if(this.spec.allow_multiple){
                value = value.split(',');
            }
            return value; 
        },
        prepareValueBeforeRun: function(methodSpec) {
        },
        lockInputs: function() {
            this.disableParameterEditing();
        },
        unlockInputs: function() {
            this.enableParameterEditing();
        },       
        addInputListener: function(onChangeFunc) {
            this.$elem.find("#"+this.spec.id).on("change",onChangeFunc);
        }        
    });
});    
