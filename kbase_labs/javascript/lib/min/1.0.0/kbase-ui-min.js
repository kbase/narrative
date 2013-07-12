(function($,undefined){var widgetRegistry={};if(window.KBase==undefined){window.KBase={};}
function subclass(constructor,superConstructor){function surrogateConstructor(){}
surrogateConstructor.prototype=superConstructor.prototype;var prototypeObject=new surrogateConstructor();prototypeObject.constructor=constructor;constructor.prototype=prototypeObject;}
$.kbObject=function(name,parent,def,asPlugin){if(asPlugin==undefined){asPlugin=false;}
return $.kbWidget(name,parent,def,asPlugin);}
$.kbWidget=function(name,parent,def,asPlugin){if(asPlugin==undefined){asPlugin=true;}
if(widgetRegistry[name]!=undefined){return;}
var Widget=function($elem){this.$elem=$elem;this.options=$.extend(true,{},def.options,this.constructor.prototype.options);return this;}
var directName=name;directName=directName.replace(/^kbase/,'');directName=directName.charAt(0).toLowerCase()+directName.slice(1);KBase[directName]=function(options,$elem){var $w=new Widget();$w.$elem=$elem;$w.init(options);$w._init=true;return $w;}
widgetRegistry[name]=Widget;if(def==undefined){def=parent;parent='kbaseWidget';if(def==undefined){def={};}}
if(parent){subclass(Widget,widgetRegistry[parent]);}
var defCopy=$.extend(true,{},def);for(var prop in defCopy){if($.isFunction(defCopy[prop])){Widget.prototype[prop]=(function(methodName,method){var _super=function(){throw"No parent method defined! Play by the rules!";}
var _superMethod=function(){throw"No parent method defined! Play by the rules!";}
if(parent){var _super=function(){return widgetRegistry[parent].prototype[methodName].apply(this,arguments);}
var _superMethod=function(superMethodName){return widgetRegistry[parent].prototype[superMethodName].apply(this,Array.prototype.slice.call(arguments,1));}}
return function(){var _oSuper=this._super;var _oSuperMethod=this._superMethod;this._super=_super;this._superMethod=_superMethod;var retValue=method.apply(this,arguments);this._super=_oSuper;this._superMethod=_oSuperMethod;return retValue;}})(prop,defCopy[prop]);}
else{Widget.prototype[prop]=defCopy[prop];}}
if(parent){Widget.prototype.options=$.extend(true,{},widgetRegistry[parent].prototype.options,Widget.prototype.options);}
if(asPlugin){$.fn[name]=function(method,args){if(this.data(name)==undefined){this.data(name,new Widget(this));}
if(Widget.prototype[method]){return Widget.prototype[method].apply(this.data(name),Array.prototype.slice.call(arguments,1));}else if(typeof method==='object'||!method){var args=arguments;$w=this.data(name);if(!$w._init){$w=Widget.prototype.init.apply($w,arguments);}
$w._init=true;return $w;}else{$.error('Method '+method+' does not exist on '+name);}
return this;};}
Widget.prototype[name]=function(){return $.fn[name].apply(this.$elem,arguments);}
return $.fn[name];}
$.kbWidget('kbaseWidget',{options:{},element:function(){return this;},dbg:function(txt){if(window.console)console.log(txt);},init:function(args){var opts=$.extend(true,{},this.options);this.options=$.extend(true,{},opts,args);return this;},alert:function(msg){if(msg==undefined){msg=this.data('msg');}
this.data('msg',msg);return this;},popper:function(){alert("pop, pop");},data:function(key,val){if(this.options._storage==undefined){this.options._storage={};}
if(arguments.length==2){this.options._storage[key]=val;}
if(key!=undefined){return this.options._storage[key];}
else{return this.options._storage;}},_rewireIds:function($elem,$target){if($target==undefined){$target=$elem;}
if($elem.attr('id')){$target.data($elem.attr('id'),$elem);$elem.removeAttr('id');}
$.each($elem.find('[id]'),function(idx){$target.data($(this).attr('id'),$(this));$(this).removeAttr('id');});return $elem;},sortCaseInsensitively:function(a,b){if(a.toLowerCase()<b.toLowerCase()){return-1}
else if(a.toLowerCase()>b.toLowerCase()){return 1}
else{return 0}},sortByKey:function(key){return function(a,b){if(a[key]<b[key]){return-1}
else if(a[key]>b[key]){return 1}
else{return 0}}},trigger:function(){this.$elem.trigger.apply(this.$elem,arguments);},on:function(){this.$elem.on.apply(this.$elem,arguments);},});}(jQuery));(function($,undefined){$.kbWidget("kbaseAuthenticatedWidget",'kbaseWidget',{version:"1.0.0",options:{},init:function(options){this._super(options);if(options.$loginbox){this.$loginbox=options.$loginbox;}
else{throw"Cannot create authenticated widget w/o login box!";}
return this;},sessionId:function(){return this.$loginbox.sessionId();},});}(jQuery));(function($,undefined){$.kbWidget("kbaseAccordion",'kbaseWidget',{version:"1.0.0",options:{fontSize:'100%',},init:function(options){this._super(options);if(this.options.client){this.client=this.options.client;}
this.appendUI($(this.$elem));return this;},appendUI:function($elem,elements){if(elements==undefined){elements=this.options.elements;}
var fontSize=this.options.fontSize;var $block=$('<div></div>')
.addClass('accordion')
.css('font-size',fontSize)
.attr('id','accordion');$.each(elements,$.proxy(function(idx,val){$block.append($('<div></div>')
.addClass('accordion-group')
.append($('<div></div>')
.addClass('accordion-heading')
.append($('<i></i>')
.css('margin-right','5px')
.css('margin-left','3px')
.addClass('icon-chevron-right')
.addClass('pull-left')
.css('height','22px')
.css('line-height','22px')
.css('color','gray'))
.append($('<a></a>')
.addClass('accordion-toggle')
.css('padding','0px')
.attr('href','#')
.attr('title',val.title)
.css('height','22px')
.css('line-height','22px')
.append(val.title)
.bind('click',function(e){e.preventDefault();var $opened=$(this).closest('.accordion').find('.in');var $target=$(this).parent().next();if($opened!=undefined){$opened.collapse('hide');var $i=$opened.parent().first().find('i');$i.removeClass('icon-chevron-down');$i.addClass('icon-chevron-right');}
if($target.get(0)!=$opened.get(0)){$target.collapse('show');var $i=$(this).parent().find('i');$i.removeClass('icon-chevron-right');$i.addClass('icon-chevron-down');}})))
.append($('<div></div>')
.addClass('accordion-body')
.append($('<div></div>')
.addClass('accordion-inner')
.append(val.body))));},this));this._rewireIds($block,this);$elem.append($block);$block.find('.accordion-body').collapse('hide');},});}(jQuery));(function($,undefined){$.kbWidget("kbaseBox",'kbaseWidget',{version:"1.0.0",options:{canCollapse:true,canCollapseOnDoubleClick:false,controls:[],bannerColor:'lightgray',boxColor:'lightgray',},init:function(options){this._super(options);if(this.options.canCollapse){this.options.controls.push({icon:'icon-caret-up','icon-alt':'icon-caret-down','tooltip':{title:'collapse / expand',placement:'bottom'},callback:$.proxy(function(e){this.data('content').slideToggle();},this)});}
this.appendUI($(this.$elem));return this;},setBannerColor:function(color){this.data('banner').css('background-color',color);},startThinking:function(){this.data('banner').addClass('progress progress-striped active')},stopThinking:function(){this.data('banner').removeClass('progress progress-striped active')},appendUI:function($elem){var canCollapse=this.options.canCollapse;var $div=$('<div></div>')
.append($('<div></div>')
.css('text-align','left')
.css('font-size','70%')
.css('color','gray')
.append(this.options.precontent))
.append($('<div></div>')
.css('border','1px solid '+this.options.boxColor)
.css('padding','2px')
.append($('<div></div>')
.attr('id','banner')
.css('width','100%')
.css('height','24px')
.css('margin-bottom','0px')
.css('box-shadow','none')
.css('background-color',this.options.bannerColor)
.css('border-radius','0px')
.append($('<h5></h5>')
.attr('id','banner-text')
.addClass('text-left')
.css('text-align','left')
.css('text-shadow','none')
.css('color','black')
.css('font-size','14px')
.addClass('bar')
.css('padding','2px')
.css('margin','0px')
.css('position','relative')
.css('width','100%')
.bind('dblclick',function(e){e.preventDefault();e.stopPropagation();if(canCollapseOnDoubleClick){$(this).parent().parent().children().last().collapse('toggle');}})
.append($('<span></span>')
.attr('id','title'))))
.append($('<div></div>')
.attr('id','content')))
.append($('<div></div>')
.css('text-align','right')
.css('font-size','70%')
.css('color','gray')
.append(this.options.postcontent));this._rewireIds($div,this);if(this.options.controls){this.data('banner-text').kbaseButtonControls({onMouseover:false,controls:this.options.controls})}
this.setTitle(this.options.title);this.setContent(this.options.content);$elem.append($div);return this;},setTitle:function(title){this.data('title').empty();this.data('title').append(title);},setContent:function(content){this.data('content').empty();this.data('content').append(content);},content:function(){return this.data('content');},controls:function(control){return this.data('banner-text').kbaseButtonControls('controls',control);},});}(jQuery));(function($,undefined){$.kbWidget("kbaseButtonControls",'kbaseWidget',{version:"1.0.0",options:{controls:[],onMouseover:true,},init:function(options){this._super(options);this._controls={};this.appendUI($(this.$elem));return this;},appendUI:function($elem){$elem
.css('position','relative')
.prepend($('<div></div>')
.addClass('btn-group')
.attr('id','control-buttons')
.css('right','0px')
.css('top','0px')
.css('position','absolute')
.css('margin-right','3px'));this._rewireIds($elem,this);if(this.options.onMouseover){$elem
.mouseover(function(e){$(this).children().first().show();})
.mouseout(function(e){$(this).children().first().hide();})
.children().first().hide();};this.setControls(this.options.controls);return this;},controls:function(control){if(control){return this._controls[control];}
else{return this._controls;}},setControls:function(controls){this.data('control-buttons').empty();for(control in this._controls){this._controls[control]=undefined;}
var $buttonControls=this;$.each(controls,$.proxy(function(idx,val){var btnClass='btn btn-mini';if(val.type){btnClass=btnClass+' btn-'+val.type;}
tooltip=val.tooltip;if(typeof val.tooltip=='string'){tooltip={title:val.tooltip};}
if(tooltip!=undefined&&tooltip.container==undefined){}
var $button=$('<button></button>')
.attr('href','#')
.css('padding-top','1px')
.css('padding-bottom','1px')
.attr('class',btnClass)
.append($('<i></i>').addClass(val.icon))
.tooltip(tooltip)
.bind('click',function(e){e.preventDefault();e.stopPropagation();if(val['icon-alt']){$(this).children().first().toggleClass(val.icon);$(this).children().first().toggleClass(val['icon-alt']);}
val.callback.call(this,e,$buttonControls.options.context);});if(val.id){this._controls[val.id]=$button;}
if(this.options.id){$button.data('id',this.options.id);}
this.data('control-buttons').append($button);},this));},});}(jQuery));(function($,undefined){$.kbWidget("kbasePrompt",'kbaseWidget',{version:"1.0.0",options:{controls:['cancelButton','okayButton']},init:function(options){this._super(options);return this;},openPrompt:function(){this.dialogModal().modal({'keyboard':true});},closePrompt:function(){this.dialogModal().modal('hide');},cancelButton:function(){return{name:'Cancel',callback:function(e,$prompt){$prompt.closePrompt();}}},okayButton:function(){return{name:'Okay',type:'primary',callback:function(e,$prompt){$prompt.closePrompt();}}},dialogModal:function(){if(this.data('dialogModal')!=undefined){return this.data('dialogModal');}
var $dialogModal=$('<div></div>')
.attr('class','modal hide fade')
.attr('tabindex','-1')
.append($('<div></div>')
.attr('class','modal-header')
.append($('<button></button>')
.attr('type','button')
.attr('class','close')
.attr('data-dismiss','modal')
.attr('aria-hidden','true')
.append('x\n'))
.append($('<h3></h3>')
.attr('id','title')))
.append($('<div></div>')
.attr('class','modal-body')
.attr('id','body'))
.append($('<div></div>')
.attr('class','modal-footer')
.append($('<div></div>')
.addClass('row-fluid')
.addClass('form-horizontal')
.append($('<div></div>')
.addClass('span6')
.addClass('text-left')
.attr('id','footer'))
.append($('<div></div>')
.addClass('span6')
.attr('id','controls')
.css('white-space','nowrap'))));$dialogModal.unbind('keypress');$dialogModal.keypress(function(e){if(e.keyCode==13){e.stopPropagation();e.preventDefault();$('a:last',$dialogModal).trigger("click");}});this._rewireIds($dialogModal,$dialogModal);if(this.options.title){$dialogModal.data('title').append(this.options.title);}
if(this.options.body){$dialogModal.data('body').append(this.options.body);}
if(this.options.footer){$dialogModal.data('footer').append(this.options.footer);}
var $prompt=this;$.each(this.options.controls,function(idx,val){if(typeof val=='string'){val=$prompt[val]();}
var btnClass='btn';if(val.type){btnClass=btnClass+' btn-'+val.type;}
var $button=$('<a></a>')
.attr('href','#')
.attr('class',btnClass)
.append(val.name)
.bind('click',function(e){e.preventDefault();e.stopPropagation();val.callback.call(this,e,$prompt);});if(val.id){$button.attr('id',val.id);}
$dialogModal.data('controls').append($button);})
this._rewireIds($dialogModal,$dialogModal);this.data('dialogModal',$dialogModal);var $firstField=undefined;var selection=false;$dialogModal.on('shown',$.proxy(function(){$.each($dialogModal.find('input[type=text],input[type=password],textarea'),function(idx,val){if($firstField==undefined){$firstField=$(val);}
if($(val).is("input")&&$(val).val()==undefined){$(val).focus();selection=true;return;}
else if($(val).is("textarea")&&$(val).text().length==0){$(val).focus();selection=true;return;}});if(!selection&&$firstField!=undefined){$firstField.focus();}},this));return $dialogModal;},});}(jQuery));(function($,undefined){$.kbWidget("kbaseDeletePrompt",'kbasePrompt',{version:"1.0.0",options:{controls:['cancelButton','okayButton']},init:function(options){this._super(options);return $('<div></div>').kbasePrompt({title:'Confirm deletion',body:'Really delete <strong>'+this.options.name+'</strong>?',controls:['cancelButton',{name:'Delete',type:'primary',callback:this.options.callback}],})},});}(jQuery));(function($,undefined){$.kbWidget("kbaseErrorPrompt",'kbasePrompt',{version:"1.0.0",options:{controls:['cancelButton','okayButton']},init:function(options){this._super(options);return $('<div></div>').kbasePrompt({title:options.title,body:$('<div></div>')
.attr('class','alert alert-error')
.append($('<div></div>')
.append($('<div></div>')
.addClass('pull-left')
.append($('<i></i>')
.addClass('icon-warning-sign')
.attr('style','float: left; margin-right: .3em;')))
.append($('<div></div>')
.append($('<strong></strong>').append(options.message)))),controls:['okayButton'],});},});}(jQuery));(function($,undefined){$.kbWidget("kbaseFormBuilder",'kbaseWidget',{version:"1.0.0",options:{elements:[],defaultSize:50,defaultRowSize:5,defaultMultiSelectSize:5,dispatch:{text:'buildTextField',textarea:'buildTextArea',password:'buildSecureTextField',checkbox:'buildCheckbox',select:'buildSelectbox',multiselect:'buildSelectbox',radio:'buildRadioButton',string:'buildTextField',secure:'buildSecureTextField',enum:'buildSelectbox',boolean:'buildCheckbox',},},init:function(options){this._super(options);this.$elem.append(this._buildForm(this.options.elements));return this;},getFormValuesAsObject:function(){var values=this.getFormValues();var ret={};$.each(values,function(idx,val){ret[val[0]]=val.slice(1)});return ret;},getFormValues:function(){var ret=[];var formValues=this.data('formValues');var form=this.data('form').get(0);for(key in formValues){var val=formValues[key];var field=val.name;var type=val.type;var fields=[];if(form[field]=='[object NodeList]'){for(var i=0;i<form[field].length;i++){fields.push(form[field][i]);}}
else{fields=[form[field]];}
if(type=='checkbox'){if(form[field].checked){ret.push([key]);}}
else if(type=='multiselect'){var selectedValues=[key];var fieldValues=selectedValues;if(val.asArray){fieldValues=[];selectedValues.push(fieldValues);}
var hasSelection=0;for(var i=0;i<form[field].length;i++){if(form[field][i].selected){hasSelection=1;fieldValues.push(form[field][i].value);}}
if(hasSelection){ret.push(selectedValues);}}
else if(type=='radio'){var selectedValues=[key];var hasSelection=0;for(var i=0;i<form[field].length;i++){if(form[field][i].checked){hasSelection=1;selectedValues.push(form[field][i].value);}}
if(hasSelection){ret.push(selectedValues);}}
else{var res=[];for(var i=0;i<fields.length;i++){if(val.json){var json=JSON.parse(fields[i].value);if(val.asArray){json=[json];}
res.push(json);}
else{res.push(this.carve(fields[i].value,val.split,val.asArray));}}
if(res.length>0){if(res.length==1){res=res[0];if(res.length==0){continue;}}
ret.push([key,res]);}}}
if(this.options.returnArrayStructure!=undefined){var newRet=[];var keyed={};for(var i=0;i<ret.length;i++){keyed[ret[i][0]]=ret[i][1];}
for(var i=0;i<this.options.returnArrayStructure.length;i++){newRet.push(keyed[this.options.returnArrayStructure[i]]);}
ret=newRet;}
return ret;},carve:function(strings,delimiters,asArray){delimiters=delimiters==undefined
?[]
:typeof delimiters=='string'
?[delimiters]
:delimiters.slice(0);var delim=delimiters.shift();if(delim==undefined){if(asArray&&typeof strings=='string'){strings=[strings];}
return strings;}
var delimRegex=new RegExp(' *'+delim+' *');if(typeof strings=='string'){return this.carve(strings.split(delimRegex),delimiters,asArray);}
else{delimiters.push(delim);jQuery.each(strings,$.proxy(function(idx,str){strings[idx]=this.carve(str,delimiters,asArray);},this))}
return strings;},escapeValue:function(val){val=val.replace(/"/g,'\\"');return'"'+val+'"';},getFormValuesAsString:function(){var extractedFormValues=this.getFormValues();if(this.options.returnArrayStructure!=undefined){return JSON.stringify(extractedFormValues);}
var returnValue=[];for(var i=0;i<extractedFormValues.length;i++){var field=extractedFormValues[i];if(field.length==1){returnValue.push(field[0]);}
else{for(var j=1;j<field.length;j++){if(this.data('formValues')[field[0]].valOnly){returnValue.push(field[j]);}
else{if(typeof field[j]=='string'){returnValue.push(field[0]+' '+this.escapeValue(field[j]));}
else{returnValue.push(field[0]+' '+this.escapeValue(JSON.stringify(field[j])));}}}}}
return returnValue.join(' ');},_buildForm:function(data){var $form=$('<form></form>')
.addClass('form-horizontal')
.bind('submit',function(evt){return false});this.data('form',$form);var formValues=this.data('formValues',{});var $lastFieldset=undefined;var passedValues={};if(this.options.values!=undefined){$.each(this.options.values,function(idx,val){passedValues[val[0]]=val[1]||1;});}
$.each(data,$.proxy(function(idx,value){if(formValues[value.key]!=undefined){var errorMsg="FORM ERROR. KEY "+value.key+' IS DOUBLE DEFINED';$form=errorMsg;return false;}
formValues[value.key]=value;if(value.fieldset){if($lastFieldset==undefined||$lastFieldset.attr('name')!=value.fieldset){$lastFieldset=$('<fieldset></fieldset>')
.attr('name',value.fieldset)
.append($("<legend></legend>")
.append(value.fieldset));$form.append($lastFieldset);}}
else{$lastFieldset=$form;}
var labelText=value.label!=undefined?value.label:value.name;var $label=$('<label></label>')
.addClass('control-label')
.css('margin-right','10px')
.append($('<span></span>')
.attr('title',value.label||value.name)
.append(labelText)
.attr('title',value.description))
.bind('click',function(e){$(this).next().children().first().focus();});var $span=$label.find('span');if(value.description){$span.tooltip();}
if(passedValues[value.key]!=undefined){value.value=value.checked=value.selected=passedValues[value.key];}
var $field;if(this.options.dispatch[value.type]){$field=this[this.options.dispatch[value.type]](value);}
else if(value.type==undefined){var errorMsg="FORM ERROR. KEY "+value.key+' HAS NO TYPE';$form=errorMsg;return false;}
else{$field=this.buildTextField(value);}
var $container=$('<span></span>');$container.css('display','inline-block');$container.append($field);var $button=$('<button></button>')
.addClass('btn')
.attr('title','Add more')
.append($('<i></i>').addClass('icon-plus'))
.bind('click',function(evt){$container.append($('<br/>'));$container.append($field.clone());evt.stopPropagation();});if(value.multi){$container.append($button);}
$form.append($('<div></div>')
.addClass('control-group')
.append($label)
.append($container));},this));return $form;},buildTextField:function(data){return $('<input/>')
.attr('type','text')
.attr('size',data.size||this.options.defaultSize)
.attr('value',data.value)
.attr('name',data.name);},buildTextArea:function(data){return $('<textarea></textarea>')
.attr('cols',data.size||this.options.defaultSize)
.attr('rows',data.rows||this.options.defaultRowSize)
.attr('name',data.name)
.append(data.value);},buildSecureTextField:function(data){return $('<input/>')
.attr('type','password')
.attr('size',data.size||this.options.defaultSize)
.attr('value',data.value)
.attr('name',data.name);},buildCheckbox:function(data){var $checkbox=$('<input/>')
.attr('type','checkbox')
.attr('name',data.name)
.attr('value',data.value);;if(data.checked){$checkbox.attr('checked','checked');}
return $checkbox;},buildRadioButton:function(data){var $radioSpan=$('<span></span>')
.css('display','inline-block');$.each(data.values,$.proxy(function(idx,val){var $radio=$('<input/>')
.attr('type','radio')
.attr('name',data.name)
.attr('value',val);if(data.checked==val){$radio.attr('checked','checked');}
var $l=$('<label></label')
.append($radio)
.append(data.names[idx]||data.values[idx])
.css('clear','both')
.css('float','left');$radioSpan.append($l);},this));return $radioSpan;},buildSelectbox:function(data){var $selectbox=$('<select></select>')
.attr('name',data.name);if(data.type=='multiselect'){$selectbox
.attr('multiple','multiple')
.attr('size',data.size||this.options.defaultMultiSelectSize);}
if(data.names==undefined){data.names=[];}
$.each(data.values,function(idx,value){var name=data.names[idx]||data.values[idx];var $option=$('<option></option>')
.attr('value',value)
.append(name);if(typeof data.selected=='string'&&data.selected==value){$option.attr('selected','selected');}
else if(typeof data.selected=='object'){$.each(data.selected,function(idx,selectedValue){if(selectedValue==value){$option.attr('selected','selected');}});}
$selectbox.append($option);});return $selectbox;},});}(jQuery));(function($,undefined){$.kbWidget("kbaseLogin",'kbaseWidget',{version:"1.0.0",options:{style:'button',loginURL:"http://kbase.us/services/authorization/Sessions/Login",possibleFields:['verified','name','opt_in','kbase_sessionid','token','groups','user_id','email','system_admin'],fields:['name','kbase_sessionid','user_id','token'],},get_kbase_cookie:function(field){var chips={};var cookieString=$.cookie('kbase_session');if(cookieString==undefined){return chips;}
var pairs=cookieString.split('\|');for(var i=0;i<pairs.length;i++){var set=pairs[i].split('=');set[1]=set[1].replace(/PIPESIGN/g,'|');set[1]=set[1].replace(/EQUALSSIGN/g,'=');chips[set[0]]=set[1];}
chips.success=1;return field==undefined?chips:chips[field];},sessionId:function(){return this.get_kbase_cookie('kbase_sessionid');},token:function(){return this.get_kbase_cookie('token');},init:function(options){this._super(options);var kbaseCookie=this.get_kbase_cookie();this.$elem.empty();var style='_'+this.options.style+'Style';this.ui=this[style]();if(this.ui){this.$elem.append(this.ui);}
if(kbaseCookie.user_id){if(this.registerLogin){this.registerLogin(kbaseCookie);}
if(this.options.prior_login_callback){this.options.prior_login_callback.call(this,kbaseCookie);}
this.data('_session',kbaseCookie);}
return this;},registerLoginFunc:function(){return this.registerLogin},specificLogoutFunc:function(){return this.specificLogout},populateLoginInfo:function(args){if(args.success){this.data('_session',args);this._error=undefined;}
else{this.data('_session',{});this._error=args.message;}},session:function(key,value){if(this.data('_session')==undefined){this.data('_session',{});}
var session=this.data('_session');if(arguments.length==2){session[key]=value;}
if(arguments.length>0){return session[key];}
else{return session;}},error:function(new_error){if(new_error){this._error=new_error;}
return this._error;},openDialog:function(){if(this.data('loginDialog')){var $ld=this.data('loginDialog');$('form',$ld.dialogModal()).get(0).reset();$ld.dialogModal().data("user_id").val(this.session('user_id')||this.data('passed_user_id')||this.options.user_id);delete this.options.user_id;this.session('user_id',undefined);$ld.dialogModal().trigger('clearMessages');this.data('loginDialog').openPrompt();}},_textStyle:function(){this._createLoginDialog();this.$elem.css('padding','9px 15px 7px 10px');var $prompt=$('<span></span>')
.append($('<a></a>')
.attr('id','loginlink')
.attr('href','#')
.text('Sign In')
.bind('click',$.proxy(function(e){e.preventDefault();e.stopPropagation();this.openDialog();},this)))
.append($('<div></div>')
.addClass('btn-group')
.attr('id','userdisplay')
.css('display','none')
.append($('<button></button>')
.addClass('btn')
.addClass('btn-mini')
.addClass('dropdown-toggle')
.append($('<i></i>').addClass('icon-user'))
.append($('<i></i>').addClass('icon-caret-down'))
.bind('click',function(e){e.preventDefault();e.stopPropagation();$(this).next().slideToggle();console.log($(this).next());}
))
.append($('<ul></ul>')
.addClass('dropdown-menu')
.addClass('pull-right')
.css('padding','3px')
.attr('id','login-dropdown-menu')
.append($('<li></li>')
.css('border-bottom','1px solid lightgray')
.css('white-space','nowrap')
.append($('<span></span>')
.css('white-space','nowrap')
.append('Signed in as ')
.append($('<a></a>')
.attr('id','loggedinuser_id')
.css('font-weight','bold')
.attr('href','https://gologin.kbase.us/account/UpdateProfile')
.attr('target','_blank')
.css('padding-right','0px')
.css('padding-left','0px'))))
.append($('<li></li>')
.addClass('pull-right')
.append($('<span></span>')
.append($('<a></a>')
.css('padding-right','0px')
.css('padding-left','0px')
.append('Sign out'))
.bind('click',$.proxy(function(e){e.stopPropagation();e.preventDefault();this.data('login-dropdown-menu').slideUp();this.logout();},this))))));this._rewireIds($prompt,this);this.registerLogin=function(args){if(args.success){this.data("loginlink").hide();this.data('loggedinuser_id').text(args.name);this.data("userdisplay").show();this.data('loginDialog').closePrompt();}
else{this.data('loginDialog').dialogModal().trigger('error',args.message);}};this.specificLogout=function(args){this.data("userdisplay").hide();this.data("loginlink").show();};return $prompt;},_hiddenStyle:function(){this._createLoginDialog();this.registerLogin=function(args){if(args.success){this.data('loginDialog').closePrompt();}
else{this.data('loginDialog').dialogModal().trigger('error',args.message);}};return undefined;},_slimStyle:function(){this.data('loginDialog',undefined);var $prompt=$('<span></span>')
.addClass('form-inline')
.append($('<span></span>')
.attr('id','entrance')
.append($('<span></span>')
.addClass('input-prepend input-append')
.append($('<span></span>')
.addClass('add-on')
.append('username: ')
.bind('click',function(e){$(this).next().focus();}))
.append($('<input/>')
.attr('type','text')
.attr('name','user_id')
.attr('id','user_id')
.attr('size','20')
.val(this.options.user_id))
.append($('<span></span>')
.addClass('add-on')
.append(' password: ')
.bind('click',function(e){$(this).next().focus();}))
.append($('<input/>')
.attr('type','password')
.attr('name','password')
.attr('id','password')
.attr('size','20'))
.append($('<button></button>')
.attr('id','loginbutton')
.addClass('btn btn-primary')
.append($('<i></i>')
.attr('id','loginicon')
.addClass('icon-lock')))))
.append($('<span></span>')
.attr('id','userdisplay')
.attr('style','display : none;')
.addClass('input-prepend')
.append($('<span></span>')
.addClass('add-on')
.append('Logged in as ')
.append($('<span></span>')
.attr('id','loggedinuser_id')
.attr('style','font-weight : bold')
.append('user_id\n')))
.append($('<button></button>')
.addClass('btn')
.attr('id','logoutbutton')
.append($('<i></i>')
.attr('id','logouticon')
.addClass('icon-signout'))));this._rewireIds($prompt,this);this.data('password').keypress($.proxy(function(e){if(e.keyCode==13.){this.data('loginbutton').trigger("click");e.stopPropagation();}},this));this.registerLogin=function(args){this.data('loginicon').removeClass().addClass('icon-lock');if(args.success){this.data("entrance").hide();this.data('user_id').val('');this.data('password').val('');this.data("loggedinuser_id").text(args.name);this.data("userdisplay").show();}
else{var $errorModal=$('<div></div>').kbasePrompt({title:'Login failed',body:$('<div></div>')
.attr('class','alert alert-error')
.append($('<div></div>')
.append($('<div></div>')
.addClass('pull-left')
.append($('<i></i>')
.addClass('icon-warning-sign')
.attr('style','float: left; margin-right: .3em;')))
.append($('<div></div>')
.append($('<strong></strong>').append(args.message)))),controls:['okayButton'],});$errorModal.openPrompt();}};this.specificLogout=function(args){this.data("userdisplay").hide();this.data("entrance").show();};this.data('loginbutton').bind('click',$.proxy(function(evt){this.data('loginicon').removeClass().addClass('icon-refresh');this.login(this.data('user_id').val(),this.data('password').val(),function(args){this.registerLogin(args);if(this.options.login_callback){this.options.login_callback.call(this,args);}});},this));this.data('logoutbutton').bind('click',$.proxy(function(e){this.logout();this.data('user_id').focus();},this));return $prompt;},_microStyle:function(){var $prompt=$('<span></span>')
.append($('<button></button>')
.addClass('btn btn-primary')
.attr('id','loginbutton')
.append($('<i></i>')
.attr('id','loginicon')
.addClass('icon-lock')));this._rewireIds($prompt,this);this._createLoginDialog();this.data('loginbutton').bind('click',$.proxy(function(evt){this.openDialog();},this));this.registerLogin=function(args){if(args.success){this.data('loginDialog').dialogModal().trigger('clearMessages');this.data('loginDialog').closePrompt();this.data('loginbutton').tooltip({title:'Logged in as '+args.name});this.data('loginicon').removeClass().addClass('icon-user');this.data('loginbutton').bind('click',$.proxy(function(evt){this.logout();},this));}
else{this.data('loginDialog').dialogModal().trigger('error',args.message);}};this.specificLogout=function(){this.data('loginbutton').tooltip('destroy');this.data('loginicon').removeClass().addClass('icon-lock');};return $prompt;},_buttonStyle:function(){var $prompt=$('<div></div>')
.attr('style','width : 250px; border : 1px solid gray')
.append($('<h4></h4>')
.attr('style','padding : 5px; margin-top : 0px; background-color : lightgray ')
.addClass('text-center')
.append('User\n'))
.append($('<div></div>')
.attr('id','entrance')
.append($('<p></p>')
.attr('style','text-align : center')
.append($('<button></button>')
.attr('id','loginbutton')
.append('Login')
.addClass('btn btn-primary'))))
.append($('<div></div>')
.attr('id','userdisplay')
.attr('style','display : none;')
.append($('<p></p>')
.attr('style','text-align : center')
.append('Logged in as ')
.append($('<span></span>')
.attr('id','loggedinuser_id')
.attr('style','font-weight : bold')
.append('user_id\n'))
.append($('<button></button>')
.attr('id','logoutbutton')
.append('Logout\n')
.addClass('btn'))));this._rewireIds($prompt,this);this._createLoginDialog();this.data('loginbutton').bind('click',$.proxy(function(event){this.openDialog();},this));this.data('logoutbutton').bind('click',$.proxy(this.logout,this));this.registerLogin=function(args){if(args.success){this.data('loginDialog').dialogModal().trigger('clearMessages');this.data("entrance").hide();this.data("loggedinuser_id").text(args.name);this.data("userdisplay").show();this.data('loginDialog').closePrompt();}
else{this.data('loginDialog').dialogModal().trigger('error',args.message);}};this.specificLogout=function(args){this.data("userdisplay").hide();this.data("entrance").show();};return $prompt;},_createLoginDialog:function(){var $elem=this.$elem;var $ld=$('<div></div').kbasePrompt({title:'Login to KBase',controls:['cancelButton',{name:'Login',type:'primary',id:'loginbutton',callback:$.proxy(function(e){var user_id=this.data('loginDialog').dialogModal().data('user_id').val();var password=this.data('loginDialog').dialogModal().data('password').val();this.data('loginDialog').dialogModal().trigger('message',user_id);this.login(user_id,password,function(args){if(this.registerLogin){this.registerLogin(args);}
if(this.options.login_callback){this.options.login_callback.call(this,args);}});},this)}],body:$('<p></p>')
.append($('<form></form>')
.attr('name','form')
.attr('id','form')
.addClass('form-horizontal')
.append($('<fieldset></fieldset>')
.append($('<div></div>')
.attr('class','alert alert-error')
.attr('id','error')
.attr('style','display : none')
.append($('<div></div>')
.append($('<div></div>')
.addClass('pull-left')
.append($('<i></i>')
.addClass('icon-warning-sign')
.attr('style','float: left; margin-right: .3em;')))
.append($('<div></div>')
.append($('<strong></strong>')
.append('Error:\n'))
.append($('<span></span>')
.attr('id','errormsg')))))
.append($('<div></div>')
.attr('class','alert alert-success')
.attr('id','pending')
.attr('style','display : none')
.append($('<div></div>')
.append($('<div></div>')
.append($('<strong></strong>')
.append('Logging in as:\n'))
.append($('<span></span>')
.attr('id','pendinguser')))))
.append($('<div></div>')
.attr('class','control-group')
.append($('<label></label>')
.addClass('control-label')
.attr('for','user_id')
.css('margin-right','10px')
.append('Username:\n'))
.append($('<input/>')
.attr('type','text')
.attr('name','user_id')
.attr('id','user_id')
.attr('size','20')))
.append($('<div></div>')
.attr('class','control-group')
.append($('<label></label>')
.addClass('control-label')
.attr('for','password')
.css('margin-right','10px')
.append('Password:\n'))
.append($('<input/>')
.attr('type','password')
.attr('name','password')
.attr('id','password')
.attr('size','20'))))),footer:$('<span></span')
.append($('<a></a>')
.attr('href','https://gologin.kbase.us/ResetPassword')
.attr('target','_blank')
.text('Forgot password?'))
.append('&nbsp;|&nbsp;')
.append($('<a></a>')
.attr('href',' https://gologin.kbase.us/OAuth?response_type=code&step=SignUp&redirect_uri='+encodeURIComponent(location.href))
.attr('target','_blank')
.text('Sign up')),});this._rewireIds($ld.dialogModal(),$ld.dialogModal());this.data('loginDialog',$ld);$ld.dialogModal().bind('error',function(event,msg){$(this).trigger('clearMessages');$(this).data("error").show();$(this).data("errormsg").html(msg);});$ld.dialogModal().bind('message',function(event,msg){$(this).trigger('clearMessages');$(this).data("pending").show();$(this).data("pendinguser").html(msg);});$ld.dialogModal().bind('clearMessages',function(event){$(this).data("error").hide();$(this).data("pending").hide();});return $ld;},login:function(user_id,password,callback){var args={user_id:user_id,status:1};if(user_id.length==0){args.message='Cannot login w/o user_id';args.status=0;callback.call(this,args);}else if(password==undefined||password.length==0){args.message='Cannot login w/o password';args.status=0;if(callback!=undefined){callback.call(this,args);}}
else{args.password=password;args.cookie=1;args.fields=this.options.fields.join(',');$.support.cors=true;$.ajax({type:"POST",url:this.options.loginURL,data:args,dataType:"json",crossDomain:true,xhrFields:{withCredentials:true},success:$.proxy(function(data,res,jqXHR){if(data.kbase_sessionid){var cookieArray=[];var args={success:1};var fields=this.options.fields;for(var i=0;i<fields.length;i++){var value=data[fields[i]];args[fields[i]]=value;value=value.replace(/=/g,'EQUALSSIGN');value=value.replace(/\|/g,'PIPESIGN');cookieArray.push(fields[i]+'='+value);}
$.cookie('kbase_session',cookieArray.join('|'));this.populateLoginInfo(args);callback.call(this,args)}
else{$.removeCookie('kbase_session');this.populateLoginInfo({});callback.call(this,{status:0,message:data.error_msg});}},this),error:$.proxy(function(jqXHR,textStatus,errorThrown){if(textStatus=="error"){textStatus="Error connecting to KBase login server";}
this.populateLoginInfo({});callback.call(this,{status:0,message:textStatus})},this),xhrFields:{withCredentials:true},beforeSend:function(xhr){xhr.withCredentials=true;},});}},logout:function(){$.removeCookie('kbase_session');if(this.specificLogout){this.specificLogout();}
this.populateLoginInfo({});if(this.data('loginDialog')!=undefined){this.openDialog();}
if(this.options.logout_callback){this.options.logout_callback.call(this);}}});}(jQuery));(function($,undefined){$.kbWidget("kbaseTable",'kbaseWidget',{version:"1.0.0",options:{sortable:false,striped:true,hover:true,bordered:true,},init:function(options){this._super(options);this.appendUI($(this.$elem),this.options.structure);return this;},appendUI:function($elem,struct){$elem.empty();var $tbl=$('<table></table>')
.attr('id','table')
.addClass('table');if(this.options.tblOptions){this.addOptions($tbl,this.options.tblOptions);}
if(this.options.striped){$tbl.addClass('table-striped');}
if(this.options.hover){$tbl.addClass('table-hover');}
if(this.options.bordered){$tbl.addClass('table-bordered');}
if(this.options.caption){$tbl.append($('<caption></caption>')
.append(this.options.caption))}
if(struct.header){var $thead=$('<thead></thead>')
.attr('id','thead');var $tr=$('<tr></tr>')
.attr('id','headerRow');$.each(struct.header,$.proxy(function(idx,header){var h=this.nameOfHeader(header);var zed=new Date();var $th=$('<th></th>')
.append(h)
.bind('mouseover',function(e){console.log("H "+h);});if(typeof header!='string'){this.addOptions($th,header);if(header.sortable){var buttonId=h+'-sortButton';var $buttonIcon=$('<i></i>')
.addClass('icon-sort');var $button=$('<button></button>')
.addClass('btn btn-mini')
.attr('id',buttonId)
.css('display','none')
.css('float','right')
.append($buttonIcon)
.data('shouldHide',true);$button.bind('click',$.proxy(function(e){var $lastSort=this.data('lastSort');if($lastSort!=undefined&&$lastSort.get(0)!=$button.get(0)){$lastSort.children(':first').removeClass('icon-sort-up');$lastSort.children(':first').removeClass('icon-sort-down');$lastSort.children(':first').addClass('icon-sort');$lastSort.data('shouldHide',true);$lastSort.css('display','none');}
if($buttonIcon.hasClass('icon-sort')){$buttonIcon.removeClass('icon-sort');$buttonIcon.addClass('icon-sort-up');$button.data('shouldHide',false);this.sortAndLayoutOn(h,1);}
else if($buttonIcon.hasClass('icon-sort-up')){$buttonIcon.removeClass('icon-sort-up');$buttonIcon.addClass('icon-sort-down');$button.data('shouldHide',false);this.sortAndLayoutOn(h,-1);}
else if($buttonIcon.hasClass('icon-sort-down')){$buttonIcon.removeClass('icon-sort-down');$buttonIcon.addClass('icon-sort');$button.data('shouldHide',true);this.sortAndLayoutOn(undefined);}
this.data('lastSort',$button);},this));$th.append($button);$th.bind('mouseover',$.proxy(function(e){console.log(this);console.log(this.data());console.log(buttonId);$button.css('display','inline');},this));$th.bind('mouseout',$.proxy(function(e){console.log($button.data());if($button.data('shouldHide')){$button.css('display','none');}},this));}}
$tr.append($th);},this));$thead.append($tr);$tbl.append($thead);}
if(struct.rows){var $tbody=this.data('tbody',$('<tbody></tbody>'));this.layoutRows(struct.rows,struct.header);$tbl.append($tbody);}
if(struct.footer){var $tfoot=$('<tfoot></tfoot>')
.attr('id','tfoot');for(var idx=0;idx<struct.footer.length;idx++){$tfoot.append($('<td></td>')
.append(struct.footer[idx]));}
$tbl.append($tfoot);}
this._rewireIds($tbl,this);$elem.append($tbl);return $elem;},sortAndLayoutOn:function(header,dir){var sortedRows=this.options.structure.rows;if(header!=undefined){var h=this.nameOfHeader(header);sortedRows=this.options.structure.rows.slice().sort(function(a,b){var keyA=a[h];var keyB=b[h];keyA=typeof keyA=='string'?keyA.toLowerCase():keyA;keyB=typeof keyB=='string'?keyB.toLowerCase():keyB;if(keyA<keyB){return 0-dir}
else if(keyA>keyB){return dir}
else{return 0}});}
console.log("SORT");console.log(this.options.structure.rows);console.log(sortedRows);this.layoutRows(sortedRows,this.options.structure.header);console.log(header);},nameOfHeader:function(header){return typeof header=='string'?header:header.value;},layoutRows:function(rows,header){this.data('tbody').empty();for(var idx=0;idx<rows.length;idx++){this.data('tbody').append(this.createRow(rows[idx],header));}},addOptions:function($cell,options){if(options.style!=undefined){$cell.attr('style',options.style);}
if(options.class!=undefined){var classes=typeof options.class=='string'?[options.class]:options.class;$.each(classes,$.proxy(function(idx,cl){console.log("ADD CLASS "+cl);$cell.addClass(cl);},this));}
var events=['mouseover','mouseout','click'];$.each(events,$.proxy(function(idx,e){if(options[e]!=undefined){console.log("BINDS "+e+', '+options[e]);$cell.bind(e,options[e])}},this));if(options.colspan){$cell.attr('colspan',options.colspan);}
if(options.rowspan){$cell.attr('rowspan',options.rowspan);}},createRow:function(rowData,headers){var $tr=$('<tr></tr>');$.each(headers,$.proxy(function(hidx,header){var h=this.nameOfHeader(header);var $td=$('<td></td>');if(rowData[h]!=undefined){var value=typeof rowData[h]=='string'?rowData[h]:rowData[h].value;$td.append(value);if(typeof rowData[h]!='string'){this.addOptions($td,rowData[h]);}
console.log("APPEND "+h+' , ');console.log(rowData[h]);}
if(value!=undefined){$tr.append($td);}},this));return $tr;},deletePrompt:function(row){var $deleteModal=$('<div></div>').kbaseDeletePrompt({name:row,callback:this.deleteRowCallback(row),});$deleteModal.openPrompt();},deleteRowCallback:function(row){},shouldDeleteRow:function(row){return 1;},});}(jQuery));(function($,undefined){$.kbWidget("kbaseTabs",'kbaseWidget',{version:"1.0.0",options:{tabPosition:'top',canDelete:false,borderColor:'lightgray',},init:function(options){this._super(options);this.data('tabs',{});this.data('nav',{});this.appendUI($(this.$elem));return this;},appendUI:function($elem,tabs){if(tabs==undefined){tabs=this.options.tabs;}
var $block=$('<div></div>')
.addClass('tabbable');var $tabs=$('<div></div>')
.addClass('tab-content')
.attr('id','tabs-content');var $nav=$('<ul></ul>')
.addClass('nav nav-tabs')
.attr('id','tabs-nav');if(this.options.tabPosition=='top'){$block.addClass('tabs-above');$block.append($nav).append($tabs);}
else if(this.options.tabPosition=='bottom'){$block.addClass('tabs-below');$block.append($tabs).append($nav);}
else if(this.options.tabPosition=='left'){$block.addClass('tabs-left');$block.append($nav).append($tabs);}
else if(this.options.tabPosition=='right'){$block.addClass('tabs-right');$block.append($tabs).append($nav);}
this._rewireIds($block,this);$elem.append($block);if(tabs){$.each(tabs,$.proxy(function(idx,tab){this.addTab(tab);},this));}},addTab:function(tab){if(tab.canDelete==undefined){tab.canDelete=this.options.canDelete;}
var $tab=$('<div></div>')
.addClass('tab-pane fade')
.append(tab.content);if(this.options.border){$tab.css('border','solid '+this.options.borderColor);$tab.css('border-width','0px 1px 0px 1px');$tab.css('padding','3px');}
var $that=this;var $nav=$('<li></li>')
.css('white-space','nowrap')
.append($('<a></a>')
.attr('href','#')
.text(tab.tab)
.attr('data-tab',tab.tab)
.bind('click',function(e){e.preventDefault();e.stopPropagation();var previous=$that.data('tabs-nav').find('.active:last a')[0];$.fn.tab.Constructor.prototype.activate.call($(this),$(this).parent('li'),$that.data('tabs-nav'));$.fn.tab.Constructor.prototype.activate.call($(this),$tab,$tab.parent(),function(){$(this).trigger({type:'shown',relatedTarget:previous})});})
.append($('<button></button>')
.addClass('btn btn-mini')
.append($('<i></i>').addClass(this.closeIcon()))
.css('padding','0px')
.css('width','22px')
.css('height','22px')
.css('margin-left','10px')
.attr('title',this.deleteTabToolTip(tab.tab))
.tooltip()
.bind('click',$.proxy(function(e){e.preventDefault();e.stopPropagation();this.deletePrompt(tab.tab);},this))));if(!tab.canDelete){$nav.find('button').remove();}
this.data('tabs')[tab.tab]=$tab;this.data('nav')[tab.tab]=$nav;this.data('tabs-content').append($tab);this.data('tabs-nav').append($nav);var tabCount=0;for(t in this.data('tabs')){tabCount++;}
if(tab.show||tabCount==1){this.showTab(tab.tab);}},closeIcon:function(){return'icon-remove';},deleteTabToolTip:function(tabName){return'Remove '+tabName;},showTab:function(tab){if(this.shouldShowTab(tab)){this.data('nav')[tab].find('a').trigger('click');}},shouldShowTab:function(tab){return 1;},deletePrompt:function(tabName){var $deleteModal=$('<div></div>').kbaseDeletePrompt({name:tabName,callback:this.deleteTabCallback(tabName),});$deleteModal.openPrompt();},deleteTabCallback:function(tabName){return $.proxy(function(e,$prompt){if($prompt!=undefined){$prompt.closePrompt();}
var $tab=this.data('tabs')[tabName];var $nav=this.data('nav')[tabName];if($nav.hasClass('active')){if($nav.next('li').length){$nav.next().find('a').trigger('click');}
else{$nav.prev('li').find('a').trigger('click');}}
if(this.shouldDeleteTab(tabName)){$tab.remove();$nav.remove();}},this);},shouldDeleteTab:function(tabName){return 1;},activeTab:function(){var activeNav=this.data('tabs-nav').find('.active:last a')[0];return $(activeNav).attr('data-tab');},});}(jQuery));(function($,undefined){$.kbWidget("kbaseDataBrowser",'kbaseWidget',{version:"1.0.0",options:{'title':'Data Browser','canCollapse':true,'height':'200px','types':{'file':{'icon':'icon-file',},'folder':{'icon':'icon-folder-close-alt','icon-open':'icon-folder-open-alt','expandable':true,}},'content':[],},init:function(options){this.targets={};this.openTargets={};this._super(options);this.appendUI(this.$elem);return this;},sortByName:function(a,b){if(a['name'].toLowerCase()<b['name'].toLowerCase()){return-1}
else if(a['name'].toLowerCase()>b['name'].toLowerCase()){return 1}
else{return 0}},appendContent:function(content,$target){$.each(content,$.proxy(function(idx,val){var icon=val.icon;var iconOpen=val['icon-open'];if(icon==undefined&&val.type!=undefined){icon=this.options.types[val.type].icon;iconOpen=this.options.types[val.type]['icon-open'];}
if(val.expandable==undefined&&val.type!=undefined){val.expandable=this.options.types[val.type].expandable;}
var $button=$('<i></i>')
.addClass(val.open?iconOpen:icon)
.css('color','gray');var $li=$('<li></li>')
.attr('id',val.id)
.append($('<a></a>')
.append($button)
.append(' ')
.append(val.label));if(val.data){$li.data('data',val.data);}
if(val.id){$li.data('id',val.id);this.targets[val.id]=$li;}
$target.append($li);if(val.expandable){var $ul=$('<ul></ul>')
.addClass('nav nav-list');if(!val.open){$ul.hide();}
if(val.children!=undefined){this.appendContent(val.children,$ul);}
$target.append($ul);var callback=val.childrenCallback;if(val.children==undefined&&callback==undefined&&val.type!=undefined){callback=this.options.types[val.type].childrenCallback;}
$li.bind('click',$.proxy(function(e){e.preventDefault();e.stopPropagation();$button.toggleClass(iconOpen);$button.toggleClass(icon);if($ul.is(':hidden')&&callback!=undefined){callback.call(this,val.id,$.proxy(function(results){$ul.empty();this.appendContent(results,$ul);$ul.show('collapse');this.openTargets[val['id']]=true;},this));}
else{if($ul.is(':hidden')){$ul.show('collapse');this.openTargets[val['id']]=true;}
else{$ul.hide('collapse');this.openTargets[val['id']]=false;}}},this));if(val.open&&val.children==undefined&&callback!=undefined){$button.toggleClass(iconOpen);$button.toggleClass(icon);$ul.hide();$li.trigger('click');}}
var controls=val.controls;if(controls==undefined&&val.type!=undefined){controls=this.options.types[val.type].controls;}
if(controls){$li.kbaseButtonControls({controls:controls,id:val.id,context:this});}},this));this._rewireIds($target,this);return $target;},prepareRootContent:function(){return $('<ul></ul>')
.addClass('nav nav-list')
.css('height',this.options.height)
.css('overflow','auto')
.attr('id','ul-nav');},appendUI:function($elem){var $root=this.prepareRootContent();this._rewireIds($root,this);this.appendContent(this.options.content,this.data('ul-nav'));$elem.kbaseBox({title:this.options.title,canCollapse:this.options.canCollapse,content:$root,postcontent:this.options.postcontent});return $elem;},});}(jQuery));