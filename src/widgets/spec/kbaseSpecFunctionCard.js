(function( $, undefined ) { 
    $.KBWidget({ 
        name: "KBaseSpecFunctionCard", 
        parent: "kbaseWidget", 
        version: "1.0.0",

        options: {
            id: "",
            name: "",
            width: 600
        },

        init: function(options) {
            this._super(options);
            var self = this;
            var container = this.$elem;
            self.$elem.append('<p class="muted loader-table"><img src="assets/img/ajax-loader.gif"> loading...</p>');

            var kbws = new Workspace(newWorkspaceServiceUrlForSpec);
            var funcName = this.options.id;
            var funcVer = null;
            if (funcName.indexOf('-') >= 0) {
            	funcVer = funcName.substring(funcName.indexOf('-') + 1);
            	funcName = funcName.substring(0, funcName.indexOf('-'));
            }
        	self.options.name = funcName;
        	var pref = (new Date()).getTime();
        	
            kbws.get_func_info(this.options.id, function(data) {
            	$('.loader-table').remove();

            	// build tabs
            	var tabNames = ['Overview', 'Spec-file', 'Sub-types', 'Versions'];
            	var tabIds = ['overview', 'spec', 'subs', 'vers'];
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
            	funcVer = data.func_def;
            	funcVer = funcVer.substring(funcVer.indexOf('-') + 1);
                var overviewTable = $('#'+pref+'overview-table');
                overviewTable.append('<tr><td>Name</td><td>'+funcName+'</td></tr>');
                overviewTable.append('<tr><td>Version</td><td>'+funcVer+'</td></tr>');
                var moduleName = funcName.substring(0, funcName.indexOf('.'));
                var moduleLinks = [];
                for (var i in data.module_vers) {
                	var moduleVer = data.module_vers[i];
                	var moduleId = moduleName + '-' + moduleVer;
                	moduleLinks[moduleLinks.length] = '<a class="'+pref+'modver-click" data-moduleid="'+moduleId+'">'+moduleVer+'</a>';
                }
                overviewTable.append('<tr><td>Module version(s)</td><td>'+moduleLinks+'</td></tr>');
            	overviewTable.append('<tr><td>Description</td><td><textarea style="width:100%;" cols="2" rows="7" readonly>'+data.description+'</textarea></td></tr>');
                $('.'+pref+'modver-click').click(function() {
                    var moduleId = $(this).data('moduleid');
                    self.trigger('showSpecElement', 
                    		{
                    			kind: "module", 
                    			id : moduleId,
                    			event: event
                    		});
                });
            	
            	////////////////////////////// Spec-file Tab //////////////////////////////
                var specText = $('<div/>').text(data.spec_def).html();
                specText = replaceMarkedTypeLinksInSpec(moduleName, specText, pref+'links-click');
            	$('#'+pref+'spec').append(
            			'<div style="width:100%; overflow-y: auto; height: 300px;"><pre style="height:95%;">' + specText + "</pre></div>"
            	);
                $('.'+pref+'links-click').click(function() {
                    var aTypeId = $(this).data('typeid');
                    self.trigger('showSpecElement', 
                    		{
                    			kind: "type", 
                    			id : aTypeId,
                    			event: event
                    		});
                });
            	
            	////////////////////////////// Sub-types Tab //////////////////////////////
            	$('#'+pref+'subs').append('<table cellpadding="0" cellspacing="0" border="0" id="'+pref+'subs-table" \
                		class="table table-bordered table-striped" style="width: 100%;"/>');
            	var subsData = [];
            	for (var i in data.used_type_defs) {
            		var aTypeId = data.used_type_defs[i];
            		var aTypeName = aTypeId.substring(0, aTypeId.indexOf('-'));
            		var aTypeVer = aTypeId.substring(aTypeId.indexOf('-') + 1);
            		subsData[subsData.length] = {name: '<a class="'+pref+'subs-click" data-typeid="'+aTypeId+'">'+aTypeName+'</a>', ver: aTypeVer};
            	}
                var subsSettings = {
                        "sPaginationType": "full_numbers",
                        "iDisplayLength": 10,
                        "aoColumns": [{sTitle: "Type name", mData: "name"}, {sTitle: "Type version", mData: "ver"}],
                        "aaData": [],
                        "oLanguage": {
                            "sSearch": "Search type:",
                            "sEmptyTable": "No types used by this type."
                        }
                    };
                var subsTable = $('#'+pref+'subs-table').dataTable(subsSettings);
                subsTable.fnAddData(subsData);
                $('.'+pref+'subs-click').click(function() {
                    var aTypeId = $(this).data('typeid');
                    self.trigger('showSpecElement', 
                    		{
                    			kind: "type", 
                    			id : aTypeId,
                    			event: event
                    		});
                });
            	
            	////////////////////////////// Versions Tab //////////////////////////////
            	$('#'+pref+'vers').append('<table cellpadding="0" cellspacing="0" border="0" id="'+pref+'vers-table" \
                		class="table table-bordered table-striped" style="width: 100%;"/>');
            	var versData = [];
            	for (var i in data.func_vers) {
            		var aFuncId = data.func_vers[i];
                	var aFuncVer = aFuncId.substring(aFuncId.indexOf('-') + 1);
                	var link = null;
                	if (funcVer === aFuncVer) {
                		link = aFuncId;
                	} else {
                		link = '<a class="'+pref+'vers-click" data-funcid="'+aFuncId+'">'+aFuncId+'</a>';
                	}
            		versData[versData.length] = {name: link};
            	}
                var versSettings = {
                        "sPaginationType": "full_numbers",
                        "iDisplayLength": 10,
                        "aoColumns": [{sTitle: "Function version", mData: "name"}],
                        "aaData": [],
                        "oLanguage": {
                            "sSearch": "Search version:",
                            "sEmptyTable": "No versions registered."
                        }
                    };
                var versTable = $('#'+pref+'vers-table').dataTable(versSettings);
                versTable.fnAddData(versData);
                $('.'+pref+'vers-click').click(function() {
                    var aFuncId = $(this).data('funcid');
                    self.trigger('showSpecElement', 
                    		{
                    			kind: "function", 
                    			id : aFuncId,
                    			event: event
                    		});
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
                type: "KBaseSpecFunctionCard",
                id: this.options.name,
                workspace: '',
                title: "Spec-document Function"
            };
        }
    });
})( jQuery );
