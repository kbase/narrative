

// it would be really great if we had a restful service.
var fba = new fbaModelServices('https://kbase.us/services/fba_model_services/');
var kbws = new workspaceService('http://kbase.us/services/workspace_service/');


// This caches promise objects by key
// Could technically use angular's $cacheFactory for this instead.
function Cache() {
    var cache = {};

    this.get = function(key) {
        if (cache[key]) {
            return cache[key];
        } else {
            return undefined;
        }
    }

    this.put = function(key, prom) {
        var obj = {}
        if (prom) obj['prom'] = prom;
        cache[key] = obj;
    }
}



/*
 *  Helper function for making ajax requests.
 *  
 *  fbaGet() :  FBA service ajax calls
 *  wsGet()  :  Workspace service ajax calls
 *  getBio() :  Ajax calls related to getBioChemistry
 *              Fetching data related to the biochemistry often requires a 
 *              long time, so this includes a dynamic progress bar
*/
var cache = new Cache();
function fbaGet(type, ws, id) {
    var key = type+';'+ws+';'+id;

    var data = cache.get(key);

    // if data is already being fetched, return promise;
    if (data) return data.prom;

    var prom;
    if (type == 'Model') {
        prom = fba.get_models({models: [id],
                               workspaces: [ws]});
    } else if (type == 'FBA') {
        prom = fba.get_fbas({fbas: [id], 
                             workspaces: [ws]});
    } else if (type == 'Media') {

    } else if (type == 'Rxn') {
        prom = fba.get_reactions({reactions: id});        
    } else if (type == 'Cpd') {
        prom = fba.get_compounds({compounds: id});        
    }

    cache.put(key, prom);
    return prom;
}

function wsGet(method, type, ws, id) {
    var key = method+';'+type+';'+ws+';'+id;

    var data = cache.get(key);

    // if data is already being fetched, return promise;
    if (data) return data.prom;

    var prom;
    if (method == 'listWSObject') {
        var prom = kbws.list_workspace_objects({workspace: ws, 
                                                type: type});
    } else if (method == 'objectMeta') {
        var prom = kbws.get_objectmeta({type: type,
                                        workspace: ws, 
                                        id: id});
    }

    cache.put(key, prom);
    return prom;
}

function getBio(type, loaderDiv, callback) {
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

