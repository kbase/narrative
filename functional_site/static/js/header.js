$(function() {
	$("#search_terms").on("keypress", function (evt) {
        if (evt.keyCode === 13) {
            var input = $.trim($('#search_terms')[0].value);
            if (input !== null && input !== '') {
	            var myUrl = "/search.shtml?q=" + encodeURIComponent(input);
		        window.location = myUrl;
            }
        }
    });
});
