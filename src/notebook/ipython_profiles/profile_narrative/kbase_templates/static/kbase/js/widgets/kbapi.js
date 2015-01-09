

//https://kbase.us/services/fba_model_services/ //production fba service not deployed

// This saves a request by service name, method, params, and promise
// Todo: Make as module
function Cache() {
    var cache = [];

    this.get = function(service, method, params) {
        for (var i in cache) {
            var obj = cache[i];
            if (service != obj['service']) continue;
            if (method != obj['method']) continue;
            if ( angular.equals(obj['params'], params) ) { return obj; }
        }
        return undefined;
    }

    this.put = function(service, method, params, prom) {
        var obj = {};
        obj['service'] = service;
        obj['method'] = method;
        obj['prom'] = prom;
        obj['params'] = params;
        cache.push(obj);
        //console.log('Cache after the last "put"', cache)
    }
}


// this is another experiment in caching but for particular objects.
function WSCache() {
    // Todo: only retrieve and store by object ids.

    // cache object
    var c = {};

    this.get = function(params) {

        if (params.ref) {
            return c[params.ref];
        } else {
            var ws = params.ws,
                type = params.type,
                name = params.name;

            if (ws in c && type in c[ws] && name in c[ws][type]) {
                return c[ws][type][name];
            }
        }
    }

    this.put = function(params) {
        // if reference is provided
        if (params.ref) {
            if (params.ref in c) {
                return false;
            } else {
                c[params.ref] = params.prom;
                return true;
            }

        // else, use strings
        } else {
            var ws = params.ws,
                name = params.name,
                type = params.type;

            if (ws in c && type in c[ws] && name in c[ws][type]) {
                return false;
            } else {
                if ( !(ws in c) ) c[ws] = {};
                if ( !(type in c[ws]) ) c[ws][type] = {};
                c[ws][type][name] = params.prom;
                return true;
            }
        }
    }
}


function KBCacheClient(token) {
    var self = this;
    var auth = {};
    auth.token = token;

    /*
    if (typeof configJSON != 'undefined') {
        if (configJSON.setup == 'dev') {
            fba_url = configJSON.dev.fba_url;
            ws_url = configJSON.dev.workspace_url;
            ujs_url = configJSON.dev.user_job_state_url;
        } else if (configJSON.setup == 'prod') {
            fba_url = configJSON.prod.fba_url;
            ws_url = configJSON.prod.workspace_url;
            ujs_url = configJSON.prod.user_job_state_url;
        }
    } else {
        fba_url = "http://kbase.us/services/KBaseFBAModeling/"
        ws_url = "https://kbase.us/services/ws/"
        ujs_url = "http://140.221.84.180:7083"
    }*/

    fba_url = "http://kbase.us/services/KBaseFBAModeling/";
    //ws_url = "https://kbase.us/services/ws/"
    ws_url = "http://dev04.berkeley.kbase.us:7058";
    ujs_url = "http://140.221.84.180:7083";

    console.log('FBA URL is:', fba_url);
    console.log('Workspace URL is:', ws_url);
    console.log('User Job State URL is:', ujs_url);

    var fba = new fbaModelServices(fba_url, auth);
    var kbws = new Workspace(ws_url, auth);
    var ujs = new UserAndJobState(ujs_url, auth);

    var cache = new Cache();

    self.fba = fba;
    self.ws = kbws;
    self.ujs = ujs
    //self.nar = new ProjectAPI(ws_url, token);
    self.token = token;
    self.ui = new UIUtils();

    self.req = function(service, method, params) {
        if (service == 'fba') {
            // use whatever workspace server that was configured.
            // this makes it possible to use the production workspace server
            // with the fba server.   Fixme: fix once production fba server is ready.
            params.wsurl = ws_url;
        }

        // see if api call has already been made
        var data = cache.get(service, method, params);

        // return the promise ojbect if it has
        if (data) return data.prom;

        // otherwise, make request
        var prom = undefined;
        if (service == 'fba') {
            console.log('Making request:', 'fba.'+method+'('+JSON.stringify(params)+')');
            var prom = fba[method](params);
        } else if (service == 'ws') {
            console.log('Making request:', 'kbws.'+method+'('+JSON.stringify(params)+')');
            var prom = kbws[method](params);
        }

        // save the request and it's promise objct
        cache.put(service, method, params, prom)
        return prom;
    }

    self.narrative_prom = undefined;
    self.my_narratives = false;
    self.shared_narratives = false;
    self.public_narratives = false;

    this.getNarratives = function() {
        // if narratives have been cached, return;
        //if (self.narratives) {
        //    return self.narratives;
        //}

        // get all workspaces, filter by mine, shared, and public
        var prom = kb.ws.list_workspace_info({});
        var p = $.when(prom).then(function(workspaces) {
            var my_list = [];
            var shared_list = [];
            var public_list = [];

            for (var i in workspaces) {
                var a = workspaces[i];
                var ws = a[1];
                var owner = a[2];
                var perm = a[5];
                var global_perm = a[6]

                if (owner == USER_ID) {
                    my_list.push(ws)
                }

                // shared lists need to be filtered again, as a shared narrative
                // is any narrative you have 'a' or 'w', but also not your own
                if ( (perm == 'a' || perm == 'w') && owner != USER_ID) {
                    shared_list.push(ws)
                }
                if (global_perm == 'r') {
                    public_list.push(ws)
                }
            }


            return [my_list, shared_list, public_list];
        })


        /*
        var next_prom = $.when(p).then(function(data) {
            var my_list = data[0];
            var shared_list = data[1];
            var public_list = data[2];

            var my_prom = kb.ws.list_objects({workspaces: my_list,
                                               type: 'KBaseNarrative.Metadata',
                                               showHidden: 1});

            var shared_prom = kb.ws.list_objects({workspaces: shared_list,
                                               type: 'KBaseNarrative.Metadata',
                                               showHidden: 1});

            var public_prom = kb.ws.list_objects({workspaces: public_list,
                                               type: 'KBaseNarrative.Metadata',
                                               showHidden: 1});

            var p = $.when(my_prom, shared_prom, public_prom).then(function(d1, d2, d3) {
                var my_nars_ws = [];
                var shared_nars_ws = [];
                var public_nars_ws = [];

                for (var i in d1) {
                    var a = d1[i]
                    var ws = a[7];
                    my_nars_ws.push(ws);
                }

                for (var i in d2) {
                    var a = d2[i]
                    var ws = a[7];
                    shared_nars_ws.push(ws);
                }

                for (var i in d3) {
                    var a = d3[i]
                    var ws = a[7];
                    public_nars_ws.push(ws);
                }

                return [my_nars_ws, shared_nars_ws, public_nars_ws];
            })

            return p;
        });*/


        // next get all narratives from these "project" workspaces
        // fixme: backend!
        var last_prom = $.when(p).then(function(data) {
            var mine_ws = data[0];
            var shared_ws = data[1];
            var public_ws = data[2];

            var my_prom = kb.ws.list_objects({workspaces: mine_ws,
                                              type: 'KBaseNarrative.Narrative',
                                              showHidden: 1});

            var shared_prom = kb.ws.list_objects({workspaces: shared_ws,
                                                  type: 'KBaseNarrative.Narrative',
                                                  showHidden: 1});

            var public_prom = kb.ws.list_objects({workspaces: public_ws,
                                                  type: 'KBaseNarrative.Narrative',
                                                  showHidden: 1});

            // get permissions on all workspaces if logged in
            var perm_proms = [];
            var all_ws = mine_ws.concat(shared_ws, public_ws);
            if (USER_ID) {
                for (var i in all_ws) {
                    var prom =  kb.ws.get_permissions({workspace: all_ws[i]});
                    perm_proms.push(prom);
                }
            } else {
                for (var i in all_ws) {
                    perm_proms.push(undefined);
                }
            }


            var all_proms = [my_prom, shared_prom, public_prom].concat(perm_proms)

            var p = $.when.apply($, all_proms).then(function() {
                // fill counts now (since there's no api for this)

                var mine = arguments[0];
                var shared = arguments[1];
                var pub = arguments[2];

                var perms = {};

                if (USER_ID) {
                    for (var i = 0; i<all_ws.length; i++) {
                        perms[all_ws[i]] = arguments[3+i]
                    }
                } else {
                    for (var i = 0; i<all_ws.length; i++) {
                        perms[all_ws[i]] = {'Everybody': 'r'}
                    }
                }

                $('.my-nar-count').text(mine.length);
                $('.shared-nar-count').text(shared.length);
                $('.public-nar-count').text(pub.length);

                return {my_narratives: mine,
                        shared_narratives: shared,
                        public_narratives: pub,
                        perms: perms};
            });

           return p;
        })

        // cache prom
        //self.narratives = last_prom;

        // bam, return promise for [my_nars, shared_nars, public_nars]
        self.narrative_prom = last_prom
        return last_prom;
    }

    // cached objects
    var c = new WSCache();
    self.get_fba = function(ws, name) {

        // if reference, get by ref
        if (ws.indexOf('/') != -1) {
            // if prom already exists, return it
            //var prom = c.get({ref: ws});
            //if (prom) return prom;

            var p = self.ws.get_objects([{ref: ws}]);
            //c.put({ref: ws, prom: p});
        } else {
            //var prom = c.get({ws: ws, name: name, type: 'FBA'});
            //if (prom) return prom;

            var p = self.ws.get_objects([{workspace: ws, name: name}]);
            //c.put({ws: ws, name:name, type: 'FBA', prom: prom});
        }

        // get fba object
        var prom =  $.when(p).then(function(f_obj) {
            var model_ref = f_obj[0].data.fbamodel_ref;

            // get model object from ref in fba object
            var modelAJAX = self.get_model(model_ref).then(function(m) {
                var rxn_objs = m[0].data.modelreactions
                var cpd_objs = m[0].data.modelcompounds

                // for each reaction, get reagents and
                // create equation by using the model compound objects
                var eqs = self.createEQs(cpd_objs, rxn_objs, 'modelReactionReagents')

                // add equations to fba object
                var rxn_vars = f_obj[0].data.FBAReactionVariables;
                for (var i in rxn_vars) {
                    var obj = rxn_vars[i];
                    var id = obj.modelreaction_ref.split('/')[5];
                    obj.eq = eqs[id]
                }

                // fixme: hack to get org name, should be on backend
                f_obj[0].org_name = m[0].data.name;

                return f_obj;
            })
            return modelAJAX;
        })

        return prom;
    }

    self.get_model = function(ws, name){
        if (ws && ws.indexOf('/') != -1) {
            //var prom = c.get({ref: ws});
            //if (prom) return prom;

            var p = self.ws.get_objects([{ref: ws}]);
            //c.put({ref: ws, prom: p});
        } else {
            //var prom = c.get({ws: ws, name: name, type: 'Model'});
            //if (prom) return prom;

            var p = self.ws.get_objects([{workspace: ws, name: name}]);
            //c.put({ws: ws, name:name, type:'Model', prom:p});
        }

        var prom = $.when(p).then(function(m) {
            var m_obj = m[0].data
            var rxn_objs = m_obj.modelreactions;
            var cpd_objs = m_obj.modelcompounds

            // for each reaction, get reagents and
            // create equation by using the model compound objects
            var eqs = self.createEQs(cpd_objs, rxn_objs, 'modelReactionReagents')

            // add equations to modelreactions object
            var rxn_vars = m_obj.modelreactions;
            for (var i in rxn_vars) {
                var obj = rxn_vars[i];
                obj.eq = eqs[obj.id];
            }

            // add equations to biomasses object
            var biomass_objs = m_obj.biomasses;
            var eqs = self.createEQs(cpd_objs, biomass_objs, 'biomasscompounds')
            for (var i in biomass_objs) {
                var obj = biomass_objs[i];
                obj.eq = eqs[obj.id];
            }

            return m;
        })

        return prom;
    }


    self.createEQs = function(cpd_objs, rxn_objs, key) {
        // create a mapping of cpd ids to names
        var mapping = {};
        for (var i in cpd_objs) {
            mapping[cpd_objs[i].id.split('_')[0]] = cpd_objs[i].name.split('_')[0];
        }

        var eqs = {}
        for (var i in rxn_objs) {
            var rxn_obj = rxn_objs[i];
            var rxn_id = rxn_obj.id;
            var rxnreagents = rxn_obj[key];
            var direction = rxn_obj.direction;

            var lhs = []
            var rhs = []
            for (var j in rxnreagents) {
                var reagent = rxnreagents[j];
                var coef = reagent.coefficient;
                var ref = reagent.modelcompound_ref;
                var cpd = ref.split('/')[3].split('_')[0]
                var human_cpd = mapping[cpd];
                var compart = ref.split('_')[1]

                if (coef < 0) {
                    lhs.push( (coef == -1 ? human_cpd+'['+compart+']'
                                : '('+(-1*coef)+')'+human_cpd+'['+compart+']') );
                } else {
                    rhs.push( (coef == 1 ? human_cpd+'['+compart+']'
                                : '('+coef+')'+human_cpd+'['+compart+']')  );
                }
            }

            var arrow;
            switch (direction) {
                case '=': arrow = ' <=> ';
                case '<': arrow = ' <= ';
                case '>': arrow = ' => ';
            }

            var eq = lhs.join(' + ')+arrow+rhs.join(' + ');
            eqs[rxn_id] = eq
        }
        return eqs
    }


    self.getWorkspaceSelector = function(all) {
        if (all) {
            var p = self.ws.list_workspace_info({});
        } else {
            var p = self.ws.list_workspace_info({perm: 'w'});
        }

        var prom = $.when(p).then(function(workspaces){
            var workspaces = workspaces.sort(compare)

            function compare(a,b) {
                var t1 = Date.parse(b[3])
                var t2 = Date.parse(a[3])
                if (t1 < t2) return -1;
                if (t1 > t2) return 1;
                return 0;
            }

            var wsSelect = $('<form class="form-horizontal" role="form">'+
                                '<div class="form-group">'+
                                    '<label class="col-sm-5 control-label">Destination Workspace</label>'+
                                    '<div class="input-group col-sm-5">'+
                                        '<input type="text" class="select-ws-input form-control focusedInput" placeholder="search">'+
                                        '<span class="input-group-btn">'+
                                            '<button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown">'+
                                                '<span class="caret"></span>'+
                                            '</button>'+
                                        '</span>'+
                                    '</div>'+
                            '</div>');

            var select = $('<ul class="dropdown-menu select-ws-dd" role="menu">');
            for (var i in workspaces) {
                select.append('<li><a>'+workspaces[i][1]+'</a></li>');
            }

            wsSelect.find('.input-group-btn').append(select);

            var dd = wsSelect.find('.select-ws-dd');
            var input = wsSelect.find('input');

            var not_found = $('<li class="select-ws-dd-not-found"><a><b>Not Found</b></a></li>');
            dd.append(not_found);
            input.keyup(function() {
                dd.find('li').show();

                wsSelect.find('.input-group-btn').addClass('open');

                var input = $(this).val();
                dd.find('li').each(function(){
                    if ($(this).text().toLowerCase().indexOf(input.toLowerCase()) != -1) {
                        return true;
                    } else {
                        $(this).hide();
                    }
                });

                if (dd.find('li').is(':visible') == 1) {
                    not_found.hide();
                } else {
                    not_found.show();
                }
            })

            dd.find('li').click(function() {
                dd.find('li').removeClass('active');

                if (!$(this).hasClass('select-ws-dd-not-found')) {
                    $(this).addClass('active');

                    var val = $(this).text();
                    input.val(val);
                }
            })

            return wsSelect;
        })

        return prom;
    }
}


// Collection of simple (Bootstrap/jQuery based) UI helper methods
function UIUtils() {

    // this method will display an absolutely position notification
    // in the app on the 'body' tag.  This is useful for api success/failure
    // notifications
    this.notify = function(text, type, keep) {
        var ele = $('<div id="notification-container">'+
                        '<div id="notification" class="'+type+'">'+
                            (keep ? ' <small><div class="close">'+
                                        '<span class="glyphicon glyphicon-remove pull-right">'+
                                        '</span>'+
                                    '</div></small>' : '')+
                            text+
                        '</div>'+
                    '</div>');

        $(ele).find('.close').click(function() {
             $('#notification').animate({top: 0}, 200, 'linear');
        })

        $('body').append(ele)
        $('#notification')
              .delay(200)
              .animate({top: 50}, 400, 'linear',
                        function() {
                            if (!keep) {
                                $('#notification').delay(2000)
                                                  .animate({top: 0}, 200, 'linear', function() {
                                                    $(this).remove();
                                                  })

                            }
                        })
    }



    var msecPerMinute = 1000 * 60;
    var msecPerHour = msecPerMinute * 60;
    var msecPerDay = msecPerHour * 24;
    var dayOfWeek = {0: 'Sun', 1: 'Mon', 2:'Tues',3:'Wed',
                     4:'Thurs', 5:'Fri', 6: 'Sat'};
    var months = {0: 'Jan', 1: 'Feb', 2: 'March', 3: 'April', 4: 'May',
                  5:'June', 6: 'July', 7: 'Aug', 8: 'Sept', 9: 'Oct',
                  10: 'Nov', 11: 'Dec'};
    this.relativeTime = function(timestamp) {
        var date = new Date()

        var interval =  date.getTime() - timestamp;

        var days = Math.floor(interval / msecPerDay );
        interval = interval - (days * msecPerDay);

        var hours = Math.floor(interval / msecPerHour);
        interval = interval - (hours * msecPerHour);

        var minutes = Math.floor(interval / msecPerMinute);
        interval = interval - (minutes * msecPerMinute);

        var seconds = Math.floor(interval / 1000);

        if (days == 0 && hours == 0 && minutes == 0) {
            return seconds + " secs ago.";
        } else if (days == 0 && hours == 0) {
            if (minutes == 1) return "1 min ago";
            return  minutes + " mins ago";
        } else if (days == 0) {
            if (hours == 1) return "1 hour ago";
            return hours + " hours ago"
        } else if (days == 1) {
            var d = new Date(timestamp);
            var t = d.toLocaleTimeString().split(':');
            return 'yesterday at ' + t[0]+':'+t[1]+' '+t[2].split(' ')[1]; //check
        } else if (days < 7) {
            var d = new Date(timestamp);
            var day = dayOfWeek[d.getDay()]
            var t = d.toLocaleTimeString().split(':');
            return day + " at " + t[0]+':'+t[1]+' '+t[2].split(' ')[1]; //check
        } else  {
            var d = new Date(timestamp);
            return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(); //check
        }
    }


    this.objTable = function(table_id, obj, keys, labels) {
        var table = $('<table class="table table-striped table-bordered" \
                              style="margin-left: auto; margin-right: auto;"></table>');
        for (var i in keys) {
            var key = keys[i];
            var row = $('<tr>');

            var label = $('<td>'+labels[i]+'</td>')
            var value = $('<td>')

            if (key.type == 'bool') {
                value.append((obj[key.key] == 1 ? 'True' : 'False'))
            } else {
                value.append(obj[key.key])
            }
            row.append(label, value);

            table.append(row);
        }

        return table;
    }

    this.listTable = function(table_id, array, labels, bold) {
        var table = $('<table id="'+table_id+'" class="table table-striped table-bordered" \
                              style="margin-left: auto; margin-right: auto;"></table>');
        for (var i in labels) {
            table.append('<tr><td>'+(bold ? '<b>'+labels[i]+'</b>' : labels[i])+'</td> \
                          <td>'+array[i]+'</td></tr>');
        }

        return table;
    }

    // this takes a list of refs and creates <workspace_name>/<object_name>
    // if links is true, hrefs are returned as well
    this.translateRefs = function(reflist, links) {
        var obj_refs = []
        for (var i in reflist) {
            obj_refs.push({ref: reflist[i]})
        }

        var prom = kb.ws.get_object_info(obj_refs)
        var p = $.when(prom).then(function(refinfo) {
            var refhash = {};
            for (var i=0; i<refinfo.length; i++) {
                var item = refinfo[i];
                var full_type = item[2];
                var module = full_type.split('.')[0];
                var type = full_type.slice(full_type.indexOf('.')+1);
                var kind = type.split('-')[0];
                var label = item[7]+"/"+item[1];
		var route;

                switch (kind) {
                    case 'FBA':
                        route = 'ws.fbas';
                        break;
                    case 'FBAModel':
                        route = 'ws.mv.model';
                        break;
                    case 'Media':
                        route = 'media/';
                        break;
                    case 'Genome':
                        route = 'genomes/';
                        break;
                    case 'MetabolicMap':
                        route = 'ws.maps';
                        break;
                    case 'PhenotypeSet':
                        route = 'ws.phenotype';
                        break;
                }

                var link = '<a href="#/'+route+label+'">'+label+'</a>'
                refhash[reflist[i]] = {link: link, label: label};
            }
            return refhash
        })
        return p;
    }

    this.formatUsers = function(perms, mine) {
        var users = []
        for (var user in perms) {
            if (user == USER_ID && !mine && !('*' in perms)) {
                users.push('You');
                continue;
            } else if (user == USER_ID) {
                continue;
            }
            users.push(user);
        }

        // if not shared, return 'nobody'
        if (users.length == 0) {
            return 'Nobody';
        };

        // number of users to show before +x users link
        var n = 3;
        var share_str = ''
        if (users.length > n) {
            /*if (users.slice(n).length == 1) {*/
                share_str = users.slice(0, n).join(', ')+', '+
                        ' <a class="btn-share-with" data-users="'+users+'">+'
                        +users.slice(n).length+' user</a>';
            /*} else if (users.slice(2).length > 1) {
                share_str = users.slice(0, n).join(', ')+ ', '+
                        ' <a class="btn-share-with" data-users="'+users+'"> +'
                        +users.slice(n).length+' users</a>';
            }*/

        } else if (users.length > 0 && users.length <= n) {
            share_str = users.slice(0, n).join(', ');
        }
        return share_str;
    }



    // jQuery plugins that you can use to add and remove a
    // loading giff to a dom element.  This is easier to maintain, and likely less
    // code than using CSS classes.
    $.fn.loading = function(text, big) {
        $(this).rmLoading()

        if (big) {
            if (typeof text != 'undefined') {
                $(this).append('<p class="text-center text-muted loader"><br>'+
                     '<img src="../../static/kbase/images/ajax-loader.gif"> '+text+'</p>');
            } else {
                $(this).append('<p class="text-center text-muted loader"><br>'+
                     '<img src="../../static/kbase/images/ajax-loader.gif"> loading...</p>')
            }
        } else {
            if (typeof text != 'undefined') {
                $(this).append('<p class="text-muted loader">'+
                     '<img src="../../static/kbase/images/ajax-loader.gif"> '+text+'</p>');
            } else {
                $(this).append('<p class="text-muted loader">'+
                     '<img src="../../static/kbase/images/ajax-loader.gif"> loading...</p>')
            }

        }



        return this;
    }

    $.fn.rmLoading = function() {
        $(this).find('.loader').remove();
    }


}



function getBio(type, loaderDiv, callback) {
    var fba = new fbaModelServices('https://kbase.us/services/fba_model_services/');
//    var kbws = new workspaceService('http://kbase.us/services/workspace_service/');
//    var kbws = new workspaceService('http://140.221.84.209:7058');

    var kbws = new Workspace('http://kbase.us/services/ws');

    // This is not cached yet; waiting to compare performanced.
    loaderDiv.append('<div class="progress">\
          <div class="progress-bar" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style="width: 3%;">\
          </div>\
        </div>')

    var bioAJAX = fba.get_biochemistry({});

    var chunk = 250;
    k = 1;
    $.when(bioAJAX).done(function(d){
        if (type == 'cpds') {
            var objs = d.compounds;
        } else if (type == 'rxns') {
            var objs = d.reactions;
        }
        var total = objs.length;
        var iterations = parseInt(total / chunk);
        var data = [];
        for (var i=0; i<iterations; i++) {
            var cpd_subset = objs.slice( i*chunk, (i+1)*chunk -1);
            if (type == 'cpds') {
                var prom = fba.get_compounds({compounds: cpd_subset });
            } else if (type == 'rxns') {
                var prom = fba.get_reactions({reactions: cpd_subset });
            }

            $.when(prom).done(function(obj_data){
                k = k + 1;
                data = data.concat(obj_data);
                var percent = (data.length / total) * 100+'%';
                $('.progress-bar').css('width', percent);

                if (k == iterations) {
                    $('.progress').remove();
                    callback(data)
                }
            });
        }
    })
}

