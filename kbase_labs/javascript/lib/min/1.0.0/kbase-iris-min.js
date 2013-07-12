(function($,undefined){$.kbWidget("kbaseIrisCommands",'kbaseAccordion',{version:"1.0.0",options:{link:function(evt){alert("clicked on "+$(evt.target).text());},englishCommands:0,fontSize:'90%',overflow:true,sectionHeight:'300px',},init:function(options){this._super(options);if(options.client){this.client=options.client;}
this.commands=[];this.commandCategories={};return this;},completeCommand:function(command){var completions=[];var commandRegex=new RegExp('^'+command+'.*');for(var idx=0;idx<this.commands.length;idx++){if(this.commands[idx].match(commandRegex)){completions.push(this.commands[idx]);}}
return completions;},commonPrefix:function(str1,str2){var prefix='';for(var idx=0;idx<str1.length&&idx<str2.length;idx++){var chr1=str1.charAt(idx);var chr2=str2.charAt(idx);if(chr1==chr2){prefix=prefix+chr1;}
else{break;}};return prefix;},commonCommandPrefix:function(commands){var prefix='';if(commands.length>1){prefix=this.commonPrefix(commands[0],commands[1]);for(var idx=2;idx<commands.length;idx++){prefix=this.commonPrefix(prefix,commands[idx]);}}
else{prefix=commands[0];}
return prefix;},commandsMatchingRegex:function(regex){var matches=[];for(var idx=0;idx<this.commands.length;idx++){if(this.commands[idx].match(regex)){matches.push(this.commands[idx]);}}
return matches.sort();},appendUI:function($elem){this.client.valid_commands($.proxy(function(res){var commands=[];$.each(res,$.proxy(function(idx,group){group.title;var $ul=$('<ul></ul>')
.addClass('unstyled')
.css('max-height',this.options.overflow?this.options.sectionHeight:'5000px')
.css('overflow',this.options.overflow?'auto':'visible');$.each(group.items,$.proxy(function(idx,val){var label=val.cmd;if(this.options.englishCommands){var metaFunc=MetaToolInfo(val.cmd);if(metaFunc!=undefined){var meta=metaFunc(val.cmd);label=meta.label;}}
this.commands.push(val.cmd);if(this.commandCategories[group.name]==undefined){this.commandCategories[group.name]=[];}
this.commandCategories[group.name].push(val.cmd);$ul.append(this.createLI(val.cmd,label));},this));commands.push({'title':group.title,'category':group.name,'body':$ul});},this));this.loadedCallback($elem,commands);},this));},createLI:function(cmd,label,func){if(label==undefined){label=cmd;}
if(func==undefined){func=this.options.link;}
var $li=$('<li></li>')
.append($('<a></a>')
.attr('href','#')
.attr('title',cmd)
.data('type','invocation')
.text(label)
.bind('click',func));$li.kbaseButtonControls({context:this,controls:[{icon:'icon-question',callback:function(e,$ic){if($ic.options.terminal!=undefined){$ic.options.terminal.run(cmd+' -h');}},id:'helpButton','tooltip':{title:label+' help',placement:'bottom'},},]});return $li;},loadedCallback:function($elem,commands){var that=this;$('input,textarea').on('focus.kbaseIrisCommands',$.proxy(function(e){if($(':focus').get(0)!=undefined&&$(':focus').get(0)!=this.data('searchField').get(0)){this.data('focused',$(':focus'));}},this));this.data('focused',$(':focus'));var $div=$('<div></div>')
.css('max-height',this.options.overflow?this.options.sectionHeight:'5000px')
.css('overflow',this.options.overflow?'auto':'visible')
.append($('<div></div>')
.css('right','0px')
.css('top','24px')
.css('position','absolute')
.css('z-index','999')
.css('display','none')
.attr('id','searchFieldBox')
.append($('<input></input')
.attr('type','text')
.addClass('input-medium search-query')
.attr('name','search')
.css('padding-top','1px')
.css('padding-bottom','1px')
.attr('id','searchField')
.keypress($.proxy(function(e){if(e.which==13){var regex=new RegExp(this.data('searchField').val(),'i');var commands=this.commandsMatchingRegex(regex);$.each(commands,$.proxy(function(idx,cmd){this.data('searchResults').append(this.createLI(cmd,cmd,function(e){that.options.link.call(this,e);}));},this));if(!commands.length){this.data('searchResults').append($('<li></li>')
.css('font-style','italic')
.text('No matching commands found'));};this.data('deleteSearchResults').show();this.data('searchFieldBox').hide();if(!commands.length){this.data('focused').focus();}};},this))));var $box=$div.kbaseBox({'title':'Command list','content':$('<ul></ul>')
.css('font-size',this.options.fontSize)
.css('padding-left','15px')
.attr('id','searchResults')
.addClass('unstyled'),'controls':[{'icon':'icon-search',tooltip:{title:'search for a command',placement:'bottom',container:'body'},},]});$elem.append($div);this._rewireIds($div,this);this._superMethod('appendUI',$div.kbaseBox('content'),commands);this.data('accordion').css('margin-bottom','0px');},});}(jQuery));(function($,undefined){$.kbWidget("kbaseIrisFileBrowser",'kbaseDataBrowser',{version:"1.0.0",options:{title:'File Browser','root':'/',types:{file:{controls:[{icon:'icon-minus',callback:function(e,$fb){$fb.deleteFile($(this).data('id'),'file');},id:'removeButton',tooltip:'delete this file',},{icon:'icon-eye-open',callback:function(e,$fb){$fb.openFile($(this).data('id'));},id:'viewButton','tooltip':'view this file',},{icon:'icon-pencil',callback:function(e){console.log("clicked on edit");console.log($(this).data('id'));},id:'editButton',tooltip:'edit this file',},{icon:'icon-arrow-right',callback:function(e,$fb){if($fb.$terminal){$fb.$terminal.kbaseIrisTerminal('appendInput',$(this).data('id')+' ');}},id:'addButton','tooltip':'add this file to terminal input',},],},folder:{childrenCallback:function(path,callback){this.listDirectory(path,function(results){callback(results);});},controls:[{icon:'icon-minus','tooltip':'delete this folder',callback:function(e,$fb){$fb.deleteFile($(this).data('id'),'folder');},id:'removeDirectoryButton'},{icon:'icon-plus','tooltip':'add a subdirectory',callback:function(e,$fb){$fb.addDirectory($(this).data('id'));},id:'addDirectoryButton'},{icon:'icon-arrow-up','tooltip':'upload a file',callback:function(e,$fb){$fb.data('active_directory',$(this).data('id'));$fb.data('fileInput').trigger('click');},id:'uploadFileButton'},],}},},init:function(options){if(options.client){this.client=options.client;}
if(options.$terminal){this.$terminal=options.$terminal;}
this._super(options);this.listDirectory(this.options.root,$.proxy(function(results){this.appendContent(results,this.data('ul-nav'))},this));return this;},prepareRootContent:function(){var $ul=this._super();$ul.css('height',(parseInt(this.options.height)-25)+'px');var $pc=$('<div></div>').css('margin-top','2px')
$pc.kbaseButtonControls({onMouseover:false,context:this,controls:[{'icon':'icon-plus','tooltip':'add directory',callback:function(e,$fb){$fb.addDirectory('/');},},{'icon':'icon-arrow-up','tooltip':'upload a file',callback:function(e,$fb){$fb.data('active_directory',$(this).data('id'));$fb.data('fileInput').trigger('click');}},]});return $('<div></div>')
.css('height',this.options.height)
.append($ul)
.append($pc)
.append($('<input></input>')
.attr('type','file')
.attr('id','fileInput')
.css('display','none')
.bind('change',$.proxy(this.handleFileSelect,this)))},sessionId:function(){return this.$terminal.sessionId;},refreshDirectory:function(path){if(this.sessionId()==undefined){this.data('ul-nav').empty();return;}
var $target=path=='/'?this.data('ul-nav'):this.targets[path].next();var pathRegex=new RegExp('^'+path);var openTargets=[];for(var subPath in this.targets){if(subPath.match(pathRegex)&&!this.targets[subPath].next().is(':hidden')&&this.targets[subPath].next().is('ul')){openTargets.push(subPath);}}
if(!$target.is(':hidden')){this.listDirectory(path,$.proxy(function(results){$target.empty();this.appendContent(results,$target)},this),openTargets);}
$.each(openTargets,$.proxy(function(idx,subPath){var $target=this.targets[subPath].next();this.listDirectory(subPath,$.proxy(function(results){$target.empty();this.appendContent(results,$target)
$target.show();},this));},this));},listDirectory:function(path,callback){this.client.list_files(this.sessionId(),'/',path,jQuery.proxy(function(filelist){var dirs=filelist[0];var files=filelist[1];var results=[];var $fb=this;jQuery.each(dirs.sort(this.sortByKey('name')),$.proxy(function(idx,val){val['full_path']=val['full_path'].replace(/\/+/g,'/');results.push({'type':'folder','id':val['full_path'],'label':val['name'],'open':$fb.openTargets[val['full_path']]})},this));jQuery.each(files.sort(this.sortByKey('name')),$.proxy(function(idx,val){val['full_path']=val['full_path'].replace(/\/+/g,'/');results.push({'type':'file','id':val['full_path'],'label':val['name'],})},this));results=results.sort(this.sortByKey('label'));callback(results);},this),$.proxy(function(err){this.dbg(err)},this));},handleFileSelect:function(evt){evt.stopPropagation();evt.preventDefault();var files=evt.target.files||evt.originalEvent.dataTransfer.files||evt.dataTransfer.files;$.each(files,jQuery.proxy(function(idx,file){var reader=new FileReader();var upload_dir='/';if(this.data('active_directory')){upload_dir=this.data('active_directory');}
var $processElem;if(this.options.processList){$processElem=this.options.processList.addProcess('Uploading '+file.name);reader.onprogress=$.proxy(function(e){this.options.processList.removeProcess($processElem);$processElem=this.options.processList.addProcess('Uploading '+file.name+' '+(100*e.loaded/e.total).toFixed(2)+'%')
this.dbg('progress '+(e.loaded/e.total));this.dbg(e);},this)}
reader.onload=jQuery.proxy(function(e){this.client.put_file(this.sessionId(),file.name,e.target.result,upload_dir,jQuery.proxy(function(res){if(this.options.processList){this.options.processList.removeProcess($processElem);}
this.refreshDirectory(upload_dir)},this),jQuery.proxy(function(res){if(this.options.processList){this.options.processList.removeProcess($processElem);}
this.dbg(res);},this));},this);reader.readAsText(file);},this));this.data('fileInput').val('');},openFile:function(file){var win=window.open();win.document.open();this.client.get_file(this.sessionId(),file,'/',$.proxy(function(res){try{var obj=JSON.parse(res);res=JSON.stringify(obj,undefined,2);}
catch(e){this.dbg("FAILURE");this.dbg(e);}
win.document.write($('<div></div>').append($('<div></div>')
.css('white-space','pre')
.append(res))
.html());win.document.close();},this),function(err){this.dbg("FILE FAILURE");this.dbg(err)});},deleteFile:function(file,type){var deleteMethod=type=='file'?'remove_files':'remove_directory';file=file.replace(/\/+$/,'');var matches=file.match(/(.+)\/[^/]+$/);var active_dir='/';if(matches!=undefined&&matches.length>1){active_dir=matches[1];}
var that=this;var promptFile=file.replace(this.options.root,'');var $deleteModal=$('<div></div>').kbaseDeletePrompt({name:promptFile,callback:function(e,$prompt){$prompt.closePrompt();that.client[deleteMethod](that.sessionId,'/',file,function(res){that.refreshDirectory(active_dir)},function(){});}});$deleteModal.openPrompt();},addDirectory:function(parentDir){var that=this;var displayDir=parentDir.replace(this.options.root,'/');var $addDirectoryModal=$('<div></div>').kbasePrompt({title:'Create directory',body:$('<p></p>')
.append('Create directory ')
.append($('<span></span>')
.css('font-weight','bold')
.text(displayDir))
.append(' ')
.append($('<input></input>')
.attr('type','text')
.attr('name','dir_name')
.attr('size','20')),controls:['cancelButton',{name:'Create directory',type:'primary',callback:function(e,$prompt){$prompt.closePrompt();that.client.make_directory(that.sessionId,parentDir,$addDirectoryModal.dialogModal().find('input').val(),function(res){that.refreshDirectory(parentDir)},function(){});}}]});$addDirectoryModal.openPrompt();},});}(jQuery));(function($,undefined){$.kbWidget("kbaseIrisGrammar",'kbaseWidget',{version:"1.0.0",options:{defaultGrammarURL:'http://www.prototypesite.net/iris-dev/grammar.json',},init:function(options){this._super(options);if(this.options.$loginbox!=undefined){this.$loginbox=this.options.$loginbox;}
this.appendUI($(this.$elem));this.retrieveGrammar(this.options.defaultGrammarURL);return this;},appendUI:function($elem){},tokenize:function(string){var tokens=[];var partial='';var quote=undefined;var escaped=false;for(var idx=0;idx<string.length;idx++){var chr=string.charAt(idx);if(quote==undefined){if(chr.match(/[?;]/)){continue;}}
if(chr.match(/\S/)||quote!=undefined){partial=partial+chr;}
else{if(partial.length){tokens.push(partial);partial='';}
continue;}
if(quote!=undefined){if(chr==quote&&!escaped){partial=partial.substring(1,partial.length-1);tokens.push(partial);partial='';quote=undefined;continue;}}
if(quote==undefined){if(chr=='"'||chr=="'"){quote=chr;}}
if(chr=='\\'){escaped=true;}
else{escaped=false;}}
if(partial.length){tokens.push(partial)}
return tokens;},evaluate:function(string,callback){var tokens=this.tokenize(string);var grammar=this.grammar;if(grammar==undefined){this.retrieveGrammar(this.options.defaultGrammarURL,$.proxy(function(){this.evaluate(string,callback);},this));return;}
var execute=undefined;var tokenVariables=undefined;var variables={};var returnObj={parsed:'',string:string,grammar:grammar._root,};if(tokens[0]=='explain'){tokens.shift();returnObj.explain=1;}
for(var idx=0;idx<tokens.length;idx++){var token=tokens[idx];var childFound=false;for(child in returnObj.grammar.children){if(child.match(/^\$/)){}
var info=returnObj.grammar.children[child];if(info.regex&&token.match(info.regex)){returnObj.grammar=returnObj.grammar.children[child];childFound=true}
else if(child.match(/^\$/)){returnObj.grammar=returnObj.grammar.children[child];childFound=true;}
else if(token==child){returnObj.grammar=returnObj.grammar.children[child];childFound=true;}
else if(!info.caseSensitive){var regex=new RegExp('^'+child+'$','i');if(token.match(regex)){returnObj.grammar=returnObj.grammar.children[child];childFound=true;}}
if(childFound){if(child.match(/^\$/)){variables[child]=token;}
if(returnObj.parsed.length){returnObj.parsed=returnObj.parsed+' '+token;}
else{returnObj.parsed=token;}
returnObj.grammar=info;returnObj.execute=info.execute;break;}}
if(!childFound&&!returnObj.grammar.childrenOptional){console.log("COULD NOT FIND CHILD = "+token);returnObj.tail=tokens.splice(idx,tokens.length-idx).join(' ');console.log(returnObj.tail);break;}}
if(returnObj.grammar.children!=undefined&&Object.keys(returnObj.grammar.children).length&&!returnObj.grammar.childrenOptional){returnObj.error="Parse error at "+token;returnObj.fail=1;delete returnObj.execute;returnObj.token=token;returnObj.tail=tokens.splice(idx,tokens.length-idx).join(' ');var next=[];if(returnObj.grammar.children!=undefined){for(prop in returnObj.grammar.children){next.push(this.nextForGrammar(prop,returnObj.grammar.children));}}
returnObj.next=next.sort();if(callback){callback(returnObj);}
return returnObj;}
returnObj.rawExecute=returnObj.execute;for(var variable in variables){returnObj.execute=returnObj.execute.replace(variable,variables[variable]);}
if(returnObj.tail){var m;if(m=returnObj.tail.match(/^into\s+(\S+)/)){returnObj.execute=returnObj.execute+' > '+m[1];}
else{returnObj.fail=1;returnObj.error='Extra characters - '+returnObj.tail;}}
if(callback){callback(returnObj);};return returnObj;},nextForGrammar:function(next,grammar){if(next==undefined){next='';}
var nextGrammar=grammar[next].children;var ng;var throttle=1000;while(nextGrammar!=undefined&&throttle-->0){if(Object.keys(nextGrammar).length==1){var prop=Object.keys(nextGrammar)[0];next=next.length?next+' '+prop:prop;nextGrammar=nextGrammar[prop].children;}}
return next;},allQuestions:function(filter){var questions=["Display the dna sequence of contig $contig_id from $max to $min","Display the dna sequence of gene $gene_id","What type of family is $family","What is the function of family $family","What fids are in family $family","Display sequences in family $family as fasta","Display sequences in family $family","What is the function of feature $feature_id","What fids in k12 have attached publications","What publications have been connected to gene thrB","Show the DNA sequence of fid thrB","Display the protein sequence of fid thrB","Which protein families contain gene $gene_id","Is fid thrB in an atomic regulon","Which fids appear to have correlated expression with gene thrB","What is the location of feature thrB","What protein sequence corresponds to fid $fid","Which contigs are in genome $genome","What is the size of genome $genome","What is the KBase id of SEED genome $genome","What is the KBase id of SEED feature $feature","What is the source of genome $genome","Which are the closest genomes to $genome","What is the name of genome $genome","Which genomes have models","Which models exist for genome $genome","Which reactions exist in genome $genome","Which reactions are in model $model","What reactions connect to role $role","What roles relate to reaction $reaction","What complexes implement reaction $reaction","What reactions does complex $complex implement","Describe the biomass reaction for model kb|fm.0","What compounds are connected to model $model","What media are known","What compounds are considered part of media $media","show reactions that connect to compound $compound","How many otus exist","What otus exist","What otu contains $otu","What genomes are in OTU $otu","What annotations are known for protein sequence $sequence","What roles are used in models","What roles are used in subsystem $subsystem","What subsystems include role $role","What features in $feature implement role $role","What families implement role $role","What roles occur in subsystem $subsystem","What roles are in subsystem $subsystem","What genomes are in subsystem $subsystem","What subsystems are in genome $genome","what is the taxonomy of genome $genome","What is the taxonomic group id of $group_id","What genomes are in taxonomic group $group",];if(filter==undefined){return questions;}
else{var filteredQ=[];var qRegex=new RegExp(filter);for(var idx=0;idx<questions.length;idx++){var q=questions[idx];console.log(q+' match '+qRegex);if(q.match(qRegex)){filteredQ.push(q);}}
return filteredQ;}},XXXallQuestionsBOGUS:function(grammar,prefix){if(prefix==undefined){prefix='';}
console.log("CALL AQ");console.log(this.grammar);if(grammar==undefined){if(this.grammar==undefined){this.retrieveGrammar(this.options.defaultGrammarURL,$.proxy(function(){this.allQuestions();},this));return;}
else{grammar=this.grammar._root.children;}}
console.log("checks it now!");console.log(grammar);for(var child in grammar){var childPrefix=prefix.length?prefix+' '+child:child;console.log(childPrefix);}},retrieveGrammar:function(url,callback){var token=undefined;$.ajax({async:true,dataType:"text",url:url,crossDomain:true,beforeSend:function(xhr){if(token){xhr.setRequestHeader('Authorization',token);}},success:$.proxy(function(data,status,xhr){var json=JSON.parse(data);this.grammar=json;if(callback){callback();}},this),error:$.proxy(function(xhr,textStatus,errorThrown){this.dbg(textStatus);throw xhr;},this),type:'GET',});}});}(jQuery));(function($,undefined){$.kbWidget("kbaseIrisProcessList",'kbaseWidget',{version:"1.0.0",options:{},init:function(options){this._super(options);this.appendUI(this.$elem);return this;},appendUI:function($elem){var $box=$elem.kbaseBox({'title':'Running processes','content':$('<ul></ul>')
.addClass('unstyled')
.append(this.pendingLi()),});return this;},pendingLi:function(){if(this.data('pendingLi')==undefined){this.data('pendingLi',$('<li></li>')
.css('font-style','italic')
.text('No processes running'));}
return this.data('pendingLi');},addProcess:function(process){this.pendingLi().remove();var $li=$('<li></li>')
.text(process);this.$elem.find('ul').append($li);return $li;},removeProcess:function($li){$li.remove();if(this.$elem.find('ul').children().length==0){this.$elem.find('ul').append(this.pendingLi());}}});}(jQuery));(function($,undefined){$.kbWidget("kbaseIrisTerminal",'kbaseWidget',{version:"1.0.0",options:{invocationURL:'http://localhost:5000',searchURL:'https://kbase.us/services/search-api/search/$category/$keyword?start=$start&count=$count&format=json',searchStart:1,searchCount:10,searchFilter:{literature:'link,pid'},maxOutput:100,scrollSpeed:750,terminalHeight:'500px',promptIfUnauthenticated:1,},init:function(options){this._super(options);$.fn.setCursorPosition=function(position){if(this.length==0)return this;return $(this).setSelection(position,position);}
$.fn.setSelection=function(selectionStart,selectionEnd){if(this.length==0)return this;input=this[0];if(input.createTextRange){var range=input.createTextRange();range.collapse(true);range.moveEnd('character',selectionEnd);range.moveStart('character',selectionStart);range.select();}else if(input.setSelectionRange){input.focus();input.setSelectionRange(selectionStart,selectionEnd);}
return this;}
$.fn.focusEnd=function(){this.setCursorPosition(this.val().length);return this;}
$.fn.getCursorPosition=function(){if(this.length==0)return this;input=this[0];return input.selectionEnd;}
if(this.options.client){this.client=this.options.client;}
else{this.client=new InvocationService(this.options.invocationURL,undefined,jQuery.proxy(function(){var cookie_obj=this.$loginbox.kbaseLogin('get_kbase_cookie');if(cookie_obj){var token=cookie_obj['token'];this.dbg("returning token from auth_cb "+token);return token;}
else{this.dbg("returning undef from auth_cb ");return undefined;}},this));}
this.$loginbox=$("<div></div>").kbaseLogin({style:'text',login_callback:jQuery.proxy(function(args){if(args.success){this.client.start_session(args.user_id,jQuery.proxy(function(newsid){this.set_session(args.user_id);this.loadCommandHistory();this.out("Authenticated as "+args.name);this.out_line();this.scroll();},this),jQuery.proxy(function(err){this.out("<i>Error on session_start:<br>"+
err.message.replace("\n","<br>\n")+"</i>");},this));this.sessionId=args.kbase_sessionid;this.input_box.focus();this.refreshFileBrowser();}},this),logout_callback:jQuery.proxy(function(){this.sessionId=undefined;this.cwd='/';this.dbg("LOGOUT CALLBACK");this.refreshFileBrowser();this.terminal.empty();},this)});this.tutorial=$('<div></div>').kbaseIrisTutorial();this.commandHistory=[];this.commandHistoryPosition=0;this.path='.';this.cwd="/";this.variables={};this.aliases={};this.appendUI($(this.$elem));var cookie;if(cookie=this.$loginbox.get_kbase_cookie()){var $commandDiv=$("<div></div>").css('white-space','pre');this.terminal.append($commandDiv);if(cookie.user_id){this.out_line();this.out_to_div($commandDiv,'Already authenticated as '+cookie.name+"\n");this.set_session(cookie.user_id);this.loadCommandHistory();}
else if(this.options.promptIfUnauthenticated){this.$loginbox.kbaseLogin('openDialog');}}
else if(this.options.promptIfUnauthenticated){this.$loginbox.kbaseLogin('openDialog');}
this.fileBrowsers=[];if(this.options.fileBrowser){this.addFileBrowser(this.options.fileBrowser);}
else{this.addFileBrowser($('<div></div>').kbaseIrisFileBrowser({client:this.client,$terminal:this,externalControls:false,}))};return this;},addFileBrowser:function($fb){this.fileBrowsers.push($fb);},open_file:function(file){this.fileBrowsers[0].openFile(file);},refreshFileBrowser:function(){for(var idx=0;idx<this.fileBrowsers.length;idx++){this.fileBrowsers[idx].refreshDirectory(this.cwd);}},loginbox:function(){return this.$loginbox;},getClient:function(){return this.client;},authToken:function(){var cookieObj=this.$loginbox.kbaseLogin('get_kbase_cookie');if(cookieObj!=undefined){return cookieObj['token'];}
else{return undefined;}},appendInput:function(text,spacer){if(this.input_box){var space=spacer==undefined?' ':'';if(this.input_box.val().length==0){space='';};this.input_box.val(this.input_box.val()+space+text);this.input_box.focusEnd();}},appendUI:function($elem){var $block=$('<div></div>')
.append($('<div></div>')
.attr('id','terminal')
.css('height',this.options.terminalHeight)
.css('overflow','auto')
.css('padding','5px')
.css('font-family','monospace'))
.append($('<textarea></textarea>')
.attr('id','input_box')
.attr('style','width : 95%;')
.attr('height','3'))
.append($('<div></div>')
.attr('id','file-uploader'))
.append($('<div></div>')
.attr('id','panel')
.css('display','none'));;this._rewireIds($block,this);$elem.append($block);this.terminal=this.data('terminal');this.input_box=this.data('input_box');this.out("Welcome to the interactive KBase terminal!<br/>\n"
+"Please click the 'Sign in' button in the upper right to get started.<br/>\n"
+"Type <b>commands</b> for a list of commands.<br/>\n"
+"For usage information about a specific command, type the command name with -h or --help after it.<br/>\n"
+"Please visit <a href = 'http://kbase.us/for-users/tutorials/navigating-iris/' target = '_blank'>http://kbase.us/for-users/tutorials/navigating-iris/</a> or type <b>tutorial</b> for an IRIS tutorial.",0,1);this.out_line();this.input_box.bind('keypress',jQuery.proxy(function(event){this.keypress(event);},this));this.input_box.bind('keydown',jQuery.proxy(function(event){this.keydown(event)},this));this.input_box.bind("onchange",jQuery.proxy(function(event){this.dbg("change");},this));this.data('input_box').focus();$(window).bind("resize",jQuery.proxy(function(event){this.resize_contents(this.terminal)},this));this.resize_contents(this.terminal);},saveCommandHistory:function(){this.client.put_file(this.sessionId,"history",JSON.stringify(this.commandHistory),"/",function(){},function(){});},loadCommandHistory:function(){this.client.get_file(this.sessionId,"history","/",jQuery.proxy(function(txt){this.commandHistory=JSON.parse(txt);this.commandHistoryPosition=this.commandHistory.length;},this),jQuery.proxy(function(e){this.dbg("error on history load : "+e);},this));},set_session:function(session){this.sessionId=session;},resize_contents:function($container){},keypress:function(event){if(event.which==13){event.preventDefault();var cmd=this.input_box.val();cmd=cmd.replace(/^ +/,'');cmd=cmd.replace(/ +$/,'');this.dbg("Run ("+cmd+')');this.out_cmd(cmd);var exception=cmd+cmd;var m;if(m=cmd.match(/^\s*(\$\S+)/)){exception=m[1];}
for(variable in this.variables){if(variable.match(exception)){continue;}
var escapedVar=variable.replace(/\$/,'\\$');var varRegex=new RegExp(escapedVar,'g');cmd=cmd.replace(varRegex,this.variables[variable]);}
this.run(cmd);this.scroll();this.input_box.val('');}},keydown:function(event){if(event.which==38){event.preventDefault();if(this.commandHistoryPosition>0){this.commandHistoryPosition--;}
this.input_box.val(this.commandHistory[this.commandHistoryPosition]);}
else if(event.which==40){event.preventDefault();if(this.commandHistoryPosition<this.commandHistory.length){this.commandHistoryPosition++;}
this.input_box.val(this.commandHistory[this.commandHistoryPosition]);}
else if(event.which==39){if(this.options.commandsElement){var input_box_length=this.input_box.val().length;var cursorPosition=this.input_box.getCursorPosition();if(cursorPosition!=undefined&&cursorPosition<input_box_length){this.selectNextInputVariable(event);return;}
event.preventDefault();var toComplete=this.input_box.val().match(/([^\s]+)\s*$/);if(toComplete.length){toComplete=toComplete[1];var ret=this.options.grammar.evaluate(this.input_box.val());if(ret!=undefined&&ret['next']&&ret['next'].length){var nextRegex=new RegExp('^'+toComplete);var newNext=[];for(var idx=0;idx<ret['next'].length;idx++){var n=ret['next'][idx];if(n.match(nextRegex)){newNext.push(n);}}
if(newNext.length||ret.parsed.length==0){ret['next']=newNext;if(ret['next'].length==1){var toCompleteRegex=new RegExp('\s*'+toComplete+'\s*$');this.input_box.val(this.input_box.val().replace(toCompleteRegex,''));}}
if(ret['next'].length==1){var pad=' ';if(this.input_box.val().match(/\s+$/)){pad='';}
this.appendInput(pad+ret['next'][0]+' ',0);this.selectNextInputVariable();return;}
else if(ret['next'].length){var shouldComplete=true;var regex=new RegExp(toComplete+'\\s*$');for(prop in ret.next){if(!prop.match(regex)){shouldComplete=false;}}
this.displayCompletions(ret['next'],toComplete);return;}}
var completions=this.options.commandsElement.kbaseIrisCommands('completeCommand',toComplete);if(completions.length==1){var completion=completions[0].replace(new RegExp('^'+toComplete),'');this.appendInput(completion+' ',0);}
else if(completions.length){this.displayCompletions(completions,toComplete);}}}}},selectNextInputVariable:function(e){var match;var pos=this.input_box.getCursorPosition();if(match=this.input_box.val().match(/(\$\S+)/)){if(e!=undefined){e.preventDefault();}
var start=this.input_box.val().indexOf(match[1]);var end=this.input_box.val().indexOf(match[1])+match[1].length;this.input_box.setSelection(start,end);this.input_box.setSelection(start,end);}},search_json_to_table:function(json,filter){var $div=$('<div></div>');var filterRegex=new RegExp('.');if(filter){filterRegex=new RegExp(filter.replace(/,/g,'|'));};$.each(json,$.proxy(function(idx,record){var $tbl=$('<table></table>')
.css('border','1px solid black')
.css('margin-bottom','2px');var keys=Object.keys(record).sort();for(var idx=0;idx<keys.length;idx++){var prop=keys[idx];if(prop.match(filterRegex)){$tbl
.append($('<tr></tr>')
.css('text-align','left')
.append($('<th></th>').append(prop))
.append($('<td></td>').append(record[prop])))}}
$div.append($tbl);},this));return $div;},displayCompletions:function(completions,toComplete){var prefix=this.options.commandsElement.kbaseIrisCommands('commonCommandPrefix',completions);if(prefix!=undefined&&prefix.length){this.input_box.val(this.input_box.val().replace(new RegExp(toComplete+'\s*$'),prefix));}
else{prefix=toComplete;}
var $commandDiv=$('<div></div>');this.terminal.append($commandDiv);var $tbl=$('<table></table>')
.attr('border',1)
.css('margin-top','10px')
.append($('<tr></tr>')
.append($('<th></th>')
.text('Suggested commands')));jQuery.each(completions,jQuery.proxy(function(idx,val){$tbl.append($('<tr></tr>')
.append($('<td></td>')
.append($('<a></a>')
.attr('href','#')
.text(val)
.bind('click',jQuery.proxy(function(evt){evt.preventDefault();this.input_box.val(this.input_box.val().replace(new RegExp(prefix+'\s*$'),''));this.appendInput(val+' ');},this)))));},this));$commandDiv.append($tbl);this.scroll();},out_cmd:function(text){var $wrapperDiv=$('<div></div>')
.css('white-space','pre')
.css('position','relative')
.append($('<span></span>')
.addClass('command')
.text(">"+this.cwd+" "+text))
.mouseover(function(e){$(this).children().first().show();})
.mouseout(function(e){$(this).children().first().hide();});$wrapperDiv.kbaseButtonControls({controls:[{icon:'icon-download-alt',callback:function(e){var win=window.open();win.document.open();var output=$('<div></div>')
.append($('<div></div>')
.css('white-space','pre')
.css('font-family','monospace')
.append($(this).parent().parent().next().clone()));$.each(output.find('a'),function(idx,val){$(val).replaceWith($(val).html());});win.document.write(output.html());win.document.close();},},{icon:'icon-remove',callback:function(e){$(this).parent().parent().next().remove();$(this).parent().parent().next().remove();$(this).parent().parent().remove();}},]});this.terminal.append($wrapperDiv);},out:function(text,scroll,html){this.out_to_div(this.terminal,text,scroll,html);},out_to_div:function($div,text,scroll,html){if(!html&&typeof text=='string'){text=text.replace(/</g,'&lt;');text=text.replace(/>/g,'&gt;');}
$div.append(text);if(scroll){this.scroll(0);}},out_line:function(text){var $hr=$('<hr/>');this.terminal.append($hr);this.scroll(0);},scroll:function(speed){if(speed==undefined){speed=this.options.scrollSpeed;}
this.terminal.animate({scrollTop:this.terminal.prop('scrollHeight')-this.terminal.height()},speed);},run:function(command){if(command=='help'){this.out('There is an introductory Iris tutorial available <a target="_blank" href="http://kbase.us/developer-zone/tutorials/iris/introduction-to-the-kbase-iris-interface/">on the KBase tutorials website</a>.',0,1);return;}
var $commandDiv=$('<div></div>').css('white-space','pre');this.terminal.append($commandDiv);this.out_line();var m;if(m=command.match(/^log[io]n\s*(.*)/)){var args=m[1].split(/\s+/);this.dbg(args.length);if(args.length!=1){this.out_to_div($commandDiv,"Invalid login syntax.");return;}
sid=args[0];this.client.start_session(sid,jQuery.proxy(function(newsid){this.set_session(sid);this.loadCommandHistory();this.out_to_div($commandDiv,"Unauthenticated logged in as "+sid);this.refreshFileBrowser();},this),jQuery.proxy(function(err){this.out_to_div($commandDiv,"<i>Error on session_start:<br>"+
err.message.replace("\n","<br>\n")+"</i>");},this));this.scroll();return;}
if(m=command.match(/^authenticate\s*(.*)/)){var args=m[1].split(/\s+/)
if(args.length!=1){this.out_to_div($commandDiv,"Invalid login syntax.");return;}
sid=args[0];this.$loginbox.kbaseLogin('data','passed_user_id',sid);this.$loginbox.data('passed_user_id',sid);this.$loginbox.kbaseLogin('openDialog');return;}
if(m=command.match(/^unauthenticate/)){this.$loginbox.kbaseLogin('logout');this.scroll();return;}
if(m=command.match(/^logout/)){this.sessionId=undefined;this.scroll();return;}
if(!this.sessionId){this.out_to_div($commandDiv,"You are not logged in.");this.scroll();return;}
this.commandHistory.push(command);this.saveCommandHistory();this.commandHistoryPosition=this.commandHistory.length;if(command=='clear'){this.terminal.empty();return;}
if(command=='history'){var $tbl=$('<table></table>');jQuery.each(this.commandHistory,jQuery.proxy(function(idx,val){$tbl.append($('<tr></tr>')
.append($('<td></td>')
.text(idx))
.append($('<td></td>')
.css('padding-left','10px')
.append($('<a></a>')
.attr('href','#')
.text(val)
.bind('click',jQuery.proxy(function(evt){evt.preventDefault();this.appendInput(val+' ');},this)))));},this));this.out_to_div($commandDiv,$tbl);return;}
else if(m=command.match(/^!(\d+)/)){command=this.commandHistory.item(m[1]);}
if(m=command.match(/^cd\s*(.*)/)){var args=m[1].split(/\s+/)
if(args.length!=1){this.out_to_div($commandDiv,"Invalid cd syntax.");return;}
dir=args[0];this.client.change_directory(this.sessionId,this.cwd,dir,jQuery.proxy(function(path){this.cwd=path;},this),jQuery.proxy(function(err){var m=err.message.replace("/\n","<br>\n");this.out_to_div($commandDiv,"<i>Error received:<br>"+err.code+"<br>"+m+"</i>");},this));return;}
if(m=command.match(/^(\$\S+)\s*=\s*(\S+)/)){this.variables[m[1]]=m[2];this.out_to_div($commandDiv,m[1]+' set to '+m[2]);return;}
if(m=command.match(/^alias\s+(\S+)\s*=\s*(\S+)/)){this.aliases[m[1]]=m[2];this.out_to_div($commandDiv,m[1]+' set to '+m[2]);return;}
if(m=command.match(/^search\s+(\S+)\s+(\S+)(?:\s*(\S+)\s+(\S+)(?:\s*(\S+))?)?/)){var parsed=this.options.grammar.evaluate(command);var searchVars={};var searchURL=this.options.searchURL;searchVars.$category=m[1];searchVars.$keyword=m[2];searchVars.$start=m[3]||this.options.searchStart;searchVars.$count=m[4]||this.options.searchCount;var filter=m[5]||this.options.searchFilter[searchVars.$category];for(prop in searchVars){searchURL=searchURL.replace(prop,searchVars[prop]);}
$.support.cors=true;$.ajax({type:"GET",url:searchURL,dataType:"json",crossDomain:true,xhrFields:{withCredentials:true},xhrFields:{withCredentials:true},beforeSend:function(xhr){xhr.withCredentials=true;},success:$.proxy(function(data,res,jqXHR){this.out_to_div($commandDiv,$('<i></i>').html("Command completed."));this.out_to_div($commandDiv,$('<br/>'));this.out_to_div($commandDiv,$('<span></span>')
.append($('<b></b>').html(data.found))
.append(" records found."));this.out_to_div($commandDiv,$('<br/>'));this.out_to_div($commandDiv,this.search_json_to_table(data.body,filter));var res=this.search_json_to_table(data.body,filter);this.scroll();},this),error:$.proxy(function(jqXHR,textStatus,errorThrown){this.out_to_div($commandDiv,errorThrown);},this),});return;}
if(m=command.match(/^cp\s*(.*)/)){var args=m[1].split(/\s+/)
if(args.length!=2){this.out_to_div($commandDiv,"Invalid cp syntax.");return;}
from=args[0];to=args[1];this.client.copy(this.sessionId,this.cwd,from,to,$.proxy(function(){this.refreshFileBrowser();},this),jQuery.proxy(function(err){var m=err.message.replace("\n","<br>\n");this.out_to_div($commandDiv,"<i>Error received:<br>"+err.code+"<br>"+m+"</i>");},this));return;}
if(m=command.match(/^mv\s*(.*)/)){var args=m[1].split(/\s+/)
if(args.length!=2){this.out_to_div($commandDiv,"Invalid mv syntax.");return;}
from=args[0];to=args[1];this.client.rename_file(this.sessionId,this.cwd,from,to,$.proxy(function(){this.refreshFileBrowser();},this),jQuery.proxy(function(err){var m=err.message.replace("\n","<br>\n");this.out_to_div($commandDiv,"<i>Error received:<br>"+err.code+"<br>"+m+"</i>");},this));return;}
if(m=command.match(/^mkdir\s*(.*)/)){var args=m[1].split(/\s+/)
if(args.length!=1){this.out_to_div($commandDiv,"Invalid mkdir syntax.");return;}
dir=args[0];this.client.make_directory(this.sessionId,this.cwd,dir,$.proxy(function(){this.refreshFileBrowser();},this),jQuery.proxy(function(err){var m=err.message.replace("\n","<br>\n");this.out_to_div($commandDiv,"<i>Error received:<br>"+err.code+"<br>"+m+"</i>");},this));return;}
if(m=command.match(/^rmdir\s*(.*)/)){var args=m[1].split(/\s+/)
if(args.length!=1){this.out_to_div($commandDiv,"Invalid rmdir syntax.");return;}
dir=args[0];this.client.remove_directory(this.sessionId,this.cwd,dir,$.proxy(function(){this.refreshFileBrowser();},this),jQuery.proxy(function(err){var m=err.message.replace("\n","<br>\n");this.out_to_div($commandDiv,"<i>Error received:<br>"+err.code+"<br>"+m+"</i>");},this));return;}
if(m=command.match(/^rm\s*(.*)/)){var args=m[1].split(/\s+/)
if(args.length!=1){this.out_to_div($commandDiv,"Invalid rm syntax.");return;}
file=args[0];this.client.remove_files(this.sessionId,this.cwd,file,$.proxy(function(){this.refreshFileBrowser();},this),jQuery.proxy(function(err){var m=err.message.replace("\n","<br>\n");this.out_to_div($commandDiv,"<i>Error received:<br>"+err.code+"<br>"+m+"</i>");},this));return;}
if(command=="next"){this.tutorial.goToNextPage();command="show_tutorial";}
if(command=="back"){this.tutorial.goToPrevPage();command="show_tutorial";}
if(command=="tutorial"){this.tutorial.currentPage=0;command="show_tutorial";}
if(command=='tutorial list'){var list=this.tutorial.list();$.each(list,$.proxy(function(idx,val){$commandDiv.append($('<a></a>')
.attr('href','#')
.append(val)
.bind('click',$.proxy(function(e){e.preventDefault();e.stopPropagation();this.out_to_div($commandDiv,'Set tutorial to <i>'+val+'</i><br>',0,1);this.tutorial=$('<div></div>').kbaseIrisTutorial({tutorial:val});this.input_box.focus();},this))
.append('<br>'));},this));this.scroll();return;}
if(command=='show_tutorial'){var $page=this.tutorial.contentForCurrentPage().clone();var headerCSS={'text-align':'left','font-size':'100%'};$page.find('h1').css(headerCSS);$page.find('h2').css(headerCSS);if(this.tutorial.currentPage>0){$page.append("<br>Type <i>back</i> to move to the previous step in the tutorial.");}
if(this.tutorial.currentPage<this.tutorial.pages.length-1){$page.append("<br>Type <i>next</i> to move to the next step in the tutorial.");}
$page.append("<br>Type <i>tutorial list</i> to see available tutorials.");$commandDiv.css('white-space','');this.out_to_div($commandDiv,$page,0,1);this.scroll();return;}
if(command=='commands'){this.client.valid_commands(jQuery.proxy(function(cmds){var $tbl=$('<table></table>');jQuery.each(cmds,function(idx,group){$tbl.append($('<tr></tr>')
.append($('<th></th>')
.attr('colspan',2)
.html(group.title)));for(var ri=0;ri<group.items.length;ri+=2){$tbl.append($('<tr></tr>')
.append($('<td></td>')
.html(group.items[ri].cmd))
.append($('<td></td>')
.html(group.items[ri+1]!=undefined?group.items[ri+1].cmd:'')));}});$commandDiv.append($tbl);this.scroll();},this));return;}
if(m=command.match(/^questions\s*(\S+)?/)){var questions=this.options.grammar.allQuestions(m[1]);var $tbl=$('<table></table>');$.each(questions,$.proxy(function(idx,question){$tbl.append($('<tr></tr>')
.append($('<td></td>')
.append($('<a></a>')
.attr('href','#')
.text(question)
.bind('click',jQuery.proxy(function(evt){evt.preventDefault();this.input_box.val(question);this.selectNextInputVariable();},this)))));},this));$commandDiv.append($tbl);this.scroll();return;}
if(d=command.match(/^ls\s*(.*)/)){var args=d[1].split(/\s+/)
var obj=this;if(args.length==0){d=".";}
else{if(args.length!=1){this.out_to_div($commandDiv,"Invalid ls syntax.");return;}
else{d=args[0];}}
this.client.list_files(this.sessionId,this.cwd,d,jQuery.proxy(function(filelist){var dirs=filelist[0];var files=filelist[1];var $tbl=$('<table></table>')
jQuery.each(dirs,function(idx,val){$tbl.append($('<tr></tr>')
.append($('<td></td>')
.text('0'))
.append($('<td></td>')
.html(val['mod_date']))
.append($('<td></td>')
.html(val['name'])));});jQuery.each(files,jQuery.proxy(function(idx,val){var url=this.options.invocationURL+"/download/"+val['full_path']+"?session_id="+this.sessionId;console.log("URL IS "+url);$tbl.append($('<tr></tr>')
.append($('<td></td>')
.text(val['size']))
.append($('<td></td>')
.html(val['mod_date']))
.append($('<td></td>')
.append($('<a></a>')
.text(val['name'])
.attr('href','#')
.bind('click',jQuery.proxy(function(event){event.preventDefault();this.open_file(val['full_path']);},this))
)));},this));$commandDiv.append($tbl);this.scroll();},this),function(err)
{var m=err.message.replace("\n","<br>\n");obj.out_to_div($commandDiv,"<i>Error received:<br>"+err.code+"<br>"+m+"</i>");});return;}
var parsed=this.options.grammar.evaluate(command);if(parsed!=undefined){if(!parsed.fail&&parsed.execute){command=parsed.execute;if(parsed.explain){$commandDiv.append(parsed.execute);return;}}
else if(parsed.parsed.length&&parsed.fail){$commandDiv.append($('<i></i>').html(parsed.error));return;}}
command=command.replace(/\\\n/g," ");command=command.replace(/\n/g," ");var $pendingProcessElem;if(this.data('processList')){$pendingProcessElem=this.data('processList').addProcess(command);}
this.client.run_pipeline(this.sessionId,command,[],this.options.maxOutput,this.cwd,jQuery.proxy(function(runout){if(this.data('processList')){this.data('processList').removeProcess($pendingProcessElem);}
if(runout){var output=runout[0];var error=runout[1];this.refreshFileBrowser();if(output.length>0&&output[0].indexOf("\t")>=0){var $tbl=$('<table></table>')
jQuery.each(output,jQuery.proxy(function(idx,val){var parts=val.split(/\t/);var $row=$('<tr></tr>')
jQuery.each(parts,jQuery.proxy(function(idx,val){$row.append($('<td></td>')
.html(val));if(idx>0){$row.children().last().css('padding-left','15px')}
if(idx<parts.length-1){$row.children().last().css('padding-right','15px')}},this));$tbl.append($row);},this));$commandDiv.append($tbl);}
else{jQuery.each(output,jQuery.proxy(function(idx,val){this.out_to_div($commandDiv,val,0);},this));if(error.length){jQuery.each(error,jQuery.proxy(function(idx,val){this.out_to_div($commandDiv,$('<i></i>').html(val));},this));}
else{this.out_to_div($commandDiv,$('<i></i>').html("Command completed."));}}}
else{this.out_to_div($commandDiv,"Error running command.");}
this.scroll();},this));}});}(jQuery));(function($,undefined){$.kbWidget("kbaseIrisTutorial",'kbaseWidget',{version:"1.0.0",options:{configURL:'http://www.prototypesite.net/iris-dev/tutorial.cfg',},list:function(){var output=[];for(key in this.dispatch){output.push(key);}
return output.sort();},init:function(options){this._super(options);this.pages=[];this.currentPage=-1;$.getJSON(this.options.configURL,$.proxy(function(data){this.dispatch=data.dispatch;if(this.options.tutorial==undefined){this.options.tutorial=data.default;}
this.retrieveTutorial(this.options.tutorial);},this));return this;},retrieveTutorial:function(tutorial){var url=this.dispatch[tutorial];this.pages=[];var token=undefined;$.ajax({async:true,dataType:"text",url:url,crossDomain:true,beforeSend:function(xhr){if(token){xhr.setRequestHeader('Authorization',token);}},success:$.proxy(function(data,status,xhr){var $resp=$('<div></div>').append(data);$resp=$resp.find('#tutorial');$resp.find('a').attr('target','_blank');var children=$resp.children();this.$title=$(children[0]);this.$summary=$(children[1]);var $pages=$(children[2]);this.pages.push({title:this.$title,content:this.$summary});$.each($pages.children(),$.proxy(function(idx,page){var $head=$(page).find('h2');var $content=$(page).find('div');$(page).find('.example').remove();$head.remove();this.pages.push({title:$head,content:$(page)});},this));this.renderAsHTML();},this),error:$.proxy(function(xhr,textStatus,errorThrown){throw xhr;},this),type:'GET',});},renderAsHTML:function(){this.$elem.empty();this.$elem.append(this.$title);this.$elem.append(this.$summary);$.each(this.pages,$.proxy(function(idx,val){this.$elem.append(val.title);this.$elem.append(val.content);},this));},lastPage:function(){return this.pages.length-1;},currentPage:function(){page=this.currentPage;if(this.currentPage<0){page=0;}
return this.pages[page];},goToPrevPage:function(){var page=this.currentPage-1;if(page<0){page=0;}
this.currentPage=page;return page;},goToNextPage:function(){var page=this.currentPage+1;if(page>=this.pages.length){page=this.pages.length-1;}
this.currentPage=page;return page;},contentForPage:function(idx){return $('<div></div>')
.append(this.pages[this.currentPage].title)
.append(this.pages[this.currentPage].content);},contentForCurrentPage:function(){return this.contentForPage(this.currentPage);},});}(jQuery));