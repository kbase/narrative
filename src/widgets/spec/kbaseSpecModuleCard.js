(function( $, undefined ) { 
    $.KBWidget({ 
        name: "KBaseSpecModuleCard", 
        parent: "kbaseWidget", 
        version: "1.0.0",

        options: {
            id: "",
            name: "",
            width: 600,
            token: null
        },

        init: function(options) {
            this._super(options);
            var self = this;
            var container = this.$elem;
            self.$elem.append('<p class="muted loader-table"><img src="assets/img/ajax-loader.gif"> loading...</p>');

            var kbws = new Workspace(newWorkspaceServiceUrlForSpec, {token: options.token});
            var moduleName = this.options.id;
            var moduleVer = null;
            if (moduleName.indexOf('-') >= 0) {
            	moduleVer = moduleName.substring(moduleName.indexOf('-') + 1);
            	moduleName = moduleName.substring(0, moduleName.indexOf('-'));
            }
        	self.options.name = moduleName;
        	var pref = generateSpecPrefix();
        	
            kbws.get_module_info({mod: moduleName, ver:moduleVer}, function(data) {
            	$('.loader-table').remove();

            	// build tabs
            	var tabNames = ['Overview', 'Spec-file', 'Types', 'Functions', 'Included modules', 'Versions'];
            	var tabIds = ['overview', 'spec', 'types', 'funcs', 'incs', 'vers'];
            	var tabs = $('<ul id="'+pref+'table-tabs" class="nav nav-tabs"/>');
                tabs.append('<li class="active"><a href="#'+pref+tabIds[0]+'" data-toggle="tab" >'+tabNames[0]+'</a></li>');
            	for (var i=1; i<tabIds.length; i++) {
                	tabs.append('<li><a href="#'+pref+tabIds[i]+'" data-toggle="tab">'+tabNames[i]+'</a></li>');
            	}
            	container.append(tabs);

            	// tab panel
            	var tab_pane = $('<div id="'+pref+'tab-content" class="tab-content">');
            	tab_pane.append('<div class="tab-pane in active" id="'+pref+tabIds[0]+'"/>');
            	for (var i=1; i<tabIds.length; i++) {
                	var tableDiv = $('<div class="tab-pane in" id="'+pref+tabIds[i]+'"> ');
                	tab_pane.append(tableDiv);
            	}
            	container.append(tab_pane);
            
            	// event for showing tabs
            	$('#'+pref+'table-tabs a').click(function (e) {
            		e.preventDefault();
            		$(this).tab('show');
            	});

            	////////////////////////////// Overview Tab //////////////////////////////
            	$('#'+pref+'overview').append('<table class="table table-striped table-bordered" \
                        style="margin-left: auto; margin-right: auto;" id="'+pref+'overview-table"/>');
            	var overviewLabels = ['Name', 'Owners', 'Version', 'Upload time'];
            	moduleVer = data.ver;
            	var overviewData = [moduleName, data.owners, moduleVer, "" + (new Date(data.ver))];
                var overviewTable = $('#'+pref+'overview-table');
                for (var i=0; i<overviewData.length; i++) {
                	overviewTable.append('<tr><td>'+overviewLabels[i]+'</td> \
                                  <td>'+overviewData[i]+'</td></tr>');
                }
            	overviewTable.append('<tr><td>Description</td><td><textarea style="width:100%;" cols="2" rows="5" readonly>'+data.description+'</textarea></td></tr>');

            	////////////////////////////// Spec-file Tab //////////////////////////////
            	var specText = $('<div/>').text(data.spec).html();
            	$('#'+pref+'spec').append(
            			'<div style="width:100%; overflow-y: auto; height: 300px;"><pre class="prettyprint lang-spec">' + specText + '</pre></div>'
            	);
            	prettyPrint();
            	
            	////////////////////////////// Types Tab //////////////////////////////
            	$('#'+pref+'types').append('<table cellpadding="0" cellspacing="0" border="0" id="'+pref+'types-table" \
                		class="table table-bordered table-striped" style="width: 100%;"/>');
            	var typesData = [];
            	for (var typeId in data.types) {
            		var typeName = typeId.substring(typeId.indexOf('.') + 1, typeId.indexOf('-'));
            		var typeVer = typeId.substring(typeId.indexOf('-') + 1);
            		typesData[typesData.length] = {name: '<a onclick="specClicks[\''+pref+'types-click\'](this,event); return false;" data-typeid="'+typeId+'">'+typeName+'</a>', ver: typeVer};
            	}
                var typesSettings = {
                        "sPaginationType": "full_numbers",
                        "iDisplayLength": 10,
                        "aoColumns": [{sTitle: "Type name", mData: "name"}, {sTitle: "Type version", mData: "ver"}],
                        "aaData": [],
                        "oLanguage": {
                            "sSearch": "Search type:",
                            "sEmptyTable": "No types registered."
                        }
                    };
                var typesTable = $('#'+pref+'types-table').dataTable(typesSettings);
                typesTable.fnAddData(typesData);
                specClicks[pref+'types-click'] = function(elem, e) {
                    var typeId = $(elem).data('typeid');
                    self.trigger('showSpecElement', 
                    		{
                    			kind: "type", 
                    			id : typeId,
                    			token: options.token,
                    			event: e
                    		});
                };

            	////////////////////////////// Functions Tab //////////////////////////////
            	$('#'+pref+'funcs').append('<table cellpadding="0" cellspacing="0" border="0" id="'+pref+'funcs-table" \
        				class="table table-bordered table-striped" style="width: 100%;"/>');
            	var funcsData = [];
            	for (var i in data.functions) {
            		var funcId = data.functions[i];
            		var funcName = funcId.substring(funcId.indexOf('.') + 1, funcId.indexOf('-'));
            		var funcVer = funcId.substring(funcId.indexOf('-') + 1);
            		funcsData[funcsData.length] = {name: '<a onclick="specClicks[\''+pref+'funcs-click\'](this,event); return false;" data-funcid="'+funcId+'">'+funcName+'</a>', ver: funcVer};
            	}
                var funcsSettings = {
                        "sPaginationType": "full_numbers",
                        "iDisplayLength": 10,
                        "aoColumns": [{sTitle: "Function name", mData: "name"}, {sTitle: "Function version", mData: "ver"}],
                        "aaData": [],
                        "oLanguage": {
                            "sSearch": "Search function:",
                            "sEmptyTable": "No functions registered."
                        }
                    };
                var funcsTable = $('#'+pref+'funcs-table').dataTable(funcsSettings);
                funcsTable.fnAddData(funcsData);
                specClicks[pref+'funcs-click'] = function(elem, e) {
                    var funcId = $(elem).data('funcid');
                    self.trigger('showSpecElement', 
                    		{
                    			kind: "function", 
                    			id : funcId,
                    			token: options.token,
                    			event: e
                    		});
                };

            	////////////////////////////// Includes Tab //////////////////////////////
            	$('#'+pref+'incs').append('<table cellpadding="0" cellspacing="0" border="0" id="'+pref+'incs-table" \
        				class="table table-bordered table-striped" style="width: 100%;"/>');
            	var incsData = [];
            	for (var incName in data.included_spec_version) {
            		var incVer = data.included_spec_version[incName];
            		var incId = incName + "-" + incVer;
            		incsData[incsData.length] = {name: '<a onclick="specClicks[\''+pref+'incs-click\'](this,event); return false;" data-incid="'+incId+'">'+incName+'</a>', ver: incVer};
            	}
                var incsSettings = {
                        "sPaginationType": "full_numbers",
                        "iDisplayLength": 10,
                        "aoColumns": [{sTitle: "Module name", mData: "name"}, {sTitle: "Module version", mData: "ver"}],
                        "aaData": [],
                        "oLanguage": {
                            "sSearch": "Search module:",
                            "sEmptyTable": "No included modules used."
                        }
                    };
                var incsTable = $('#'+pref+'incs-table').dataTable(incsSettings);
                incsTable.fnAddData(incsData);
                specClicks[pref+'incs-click'] = function(elem,e) {
                    var incId = $(elem).data('incid');
                    self.trigger('showSpecElement', 
                    		{
                    			kind: "module", 
                    			id : incId,
                    			token: options.token,
                    			event: e
                    		});
                };

                var wsAJAX2 = kbws.list_module_versions({mod: moduleName});
                $.when(wsAJAX2).done(function(data){

                	////////////////////////////// Versions Tab //////////////////////////////
                	$('#'+pref+'vers').append('<table cellpadding="0" cellspacing="0" border="0" id="'+pref+'vers-table" \
            				class="table table-bordered table-striped" style="width: 100%;"/>');
                	var versData = [];
                	for (var i in data.vers) {
                		var ver = data.vers[i];
                		var verDate = "" + (new Date(ver));
                		var link = null;
                		if (ver === moduleVer) {
                			link = "" + ver + " (current)";
                		} else {
                			link = '<a onclick="specClicks[\''+pref+'vers-click\'](this,event); return false;" data-verid="'+moduleName+'-'+ver+'">'+ver+'</a>';
                		}
                		versData[versData.length] = {ver: link, date: verDate};
                	}
                    var versSettings = {
                            "sPaginationType": "full_numbers",
                            "iDisplayLength": 10,
                            "aoColumns": [{sTitle: "Module version", mData: "ver"}, {sTitle: "Upload date", mData: "date"}],
                            "aaData": [],
                            "oLanguage": {
                                "sSearch": "Search version:",
                                "sEmptyTable": "No versions registered."
                            }
                        };
                    var versTable = $('#'+pref+'vers-table').dataTable(versSettings);
                    versTable.fnAddData(versData);
                    specClicks[pref+'vers-click'] = function(elem,e) {
                        var modId = $(elem).data('verid');
                        self.trigger('showSpecElement', 
                        		{
                        			kind: "module", 
                        			id : modId,
                        			token: options.token,
                        			event: e
                        		});
                    };

                });

            }, function(data) {
            	$('.loader-table').remove();
                self.$elem.append('<p>[Error] ' + data.error.message + '</p>');
                return;
            });            	
            
            return this;
        },
        
        getData: function() {
            return {
                type: "KBaseSpecModuleCard",
                id: this.options.name,
                workspace: '',
                title: "Spec-document Module"
            };
        }
    });
})( jQuery );
