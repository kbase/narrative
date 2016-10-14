
/*
 *  Base class for workspace objects related to modeling
*/
function KBModeling(token) {
    var self = this;

    this.token = token;

    this.kbapi = function(service, method, params) {
        var url, method;
        if (service == 'ws') {
            url = window.kbconfig.urls.workspace || "https://ci.kbase.us/services/ws/";
            method = 'Workspace.'+method;
        } else if (service == 'fba') {
            url = "https://kbase.us/services/KBaseFBAModeling/";
            method = 'fbaModelServices.'+method;
        }

        var rpc = {
            params: [params],
            method: method,
            version: "1.1",
            id: String(Math.random()).slice(2),
        };

        var prom = $.ajax({
            url: url,
            type: 'POST',
            processData: false,
            data: JSON.stringify(rpc),
            beforeSend: function (xhr) {
                if (self.token)
                    xhr.setRequestHeader("Authorization", self.token);
            }
        }).then(function(data) {
            return data.result[0];
        })

        return prom;
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
