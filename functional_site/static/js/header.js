$(function() {
	$("#search_terms").on("keypress", function (evt) {
        if (evt.keyCode === 13) {
            var input = $.trim($('#searchspan input')[0].value);
            if (input !== null && input !== '') {
                var einput = encodeURIComponent(input);
	            var myUrl = "/search.shtml?q=" + einput;
		        window.location = myUrl;
            }
        }
    });
});
