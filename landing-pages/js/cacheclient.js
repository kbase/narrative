

// This saves a request by service name, method, params, and promise
// Todo: Make as module
function Cache() {
    var cache = [];

    this.get = function(service, method, params) {
        for (var i in cache) {
            var obj = cache[i];
            if (service != obj['service']) continue;
            if (method != obj['method']) continue;
            if ( angular.equals(obj['params'], params) ) return obj;
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
        console.log('cache', cache)
    }
}


function KBCacheClient(token) {
    var fba = new fbaModelServices('https://kbase.us/services/fba_model_services/', token);
    var kbws = new workspaceService('http://kbase.us/services/workspace_service/', token);

    var cache = new Cache();    

    this.req = function(service, method, params) {
        if (!params) var params = {};

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

    this.fbaAPI = function() {
        return fba;
    }

    this.kbwsAPI = function() {
        return kbws;
    }
}




function getBio(type, loaderDiv, callback) {
    var fba = new fbaModelServices('https://kbase.us/services/fba_model_services/');
    var kbws = new workspaceService('http://kbase.us/services/workspace_service/');

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

