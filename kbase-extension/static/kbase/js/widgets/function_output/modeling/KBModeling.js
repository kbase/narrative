
/*
 *  Base class for workspace objects related to modeling
*/
function KBModeling(token) {
    var self = this;

    this.token = token;

    this.kbapi = function(service, method, params) {
        var call_ajax = function(_url, _method, _params, _callback) {
            if (! _callback){
                _callback = function(data) {
                    return data.result[0];
                }
            }
            var rpc = {
                params: [_params],
                method: _method,
                version: "1.1",
                id: String(Math.random()).slice(2),
            };

            var prom = $.ajax({
                url: _url,
                type: 'POST',
                processData: false,
                data: JSON.stringify(rpc),
                beforeSend: function (xhr) {
                    if (self.token)
                        xhr.setRequestHeader("Authorization", self.token);
                }
            }).then(_callback);
            return prom;
        }

        var url, method;
        if (service == 'ws') {
            url = window.kbconfig.urls.workspace || "https://ci.kbase.us/services/ws/";
            method = 'Workspace.'+method;
            return call_ajax(url, method, params)
        } else if (service == 'fba') {
            url = "https://kbase.us/services/KBaseFBAModeling/";
            method = 'fbaModelServices.'+method;
            return call_ajax(url, method, params)
        } else if (service == 'biochem') {
            s_url = window.kbconfig.urls.service_wizard || 'https://ci.kbase.us/services/service_wizard';
            s_params = {'module_name' : "BiochemistryAPI", 'version' : 'beta'};
            s_method = 'ServiceWizard.get_service_status';
            callback = function(service_status_ret) {
                srv_url = service_status_ret['result'][0]['url'];
                console.log(srv_url);
                return call_ajax(srv_url, 'BiochemistryAPI.'+method, params);
            }
            return call_ajax(s_url, s_method, s_params, callback);
        }
    }
}


(function() {

    // these helper methods add and remove a 'loading gif',
    // independent of anything else that is happening in the container
    $.fn.loading = function(text, big) {
        $(this).rmLoading()

        if (big) {
            if (typeof text !== 'undefined') {
                $(this).append('<p class="text-center text-muted loader"><br>'+
                     '<img src="../img/ajax-loader-big.gif"> '+text+'</p>');
            } else {
                $(this).append('<p class="text-center text-muted loader"><br>'+
                     '<img src="../img/ajax-loader-big.gif"> loading...</p>')
            }
        } else {
            if (typeof text !== 'undefined') {
                $(this).append('<p class="text-muted loader">'+
                     '<img src="//narrative.kbase.us/narrative/static/kbase/images/ajax-loader.gif"> '+text+'</p>');
            } else {
                $(this).append('<p class="text-muted loader">'+
                     '<img src="//narrative.kbase.us/narrative/static/kbase/images/ajax-loader.gif"> loading...</p>')
            }
        }

        return this;
    }

    $.fn.rmLoading = function() {
        $(this).find('.loader').remove();
    }

}());
