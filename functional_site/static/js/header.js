$(function() {
	$("#searchspan input").on("keypress", function (evt) {
        if (evt.keyCode === 13) {
            var input = $.trim($(this).val());
            console.log(input);
            if (input !== null && input !== '') {
                var einput = encodeURIComponent(input);
	            var myUrl = "/search.shtml?q=" + einput;
		        window.location = myUrl;
            }
        }
    });
});
