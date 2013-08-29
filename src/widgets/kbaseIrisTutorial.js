/*

*/

(function( $, undefined ) {


    $.KBWidget({

		  name: "kbaseIrisTutorial",

        version: "1.0.0",
        options: {
            configURL : 'http://www.kbase.us/docs/tutorials.cfg',
            tutorial : 'http://www.kbase.us/docs/getstarted/getstarted_iris/getstarted_iris.html',
        },

        format_tutorial_url : function (doc_format_string, repo, filespec) {
            var url = doc_format_string;
            url = url.replace(/\$repo/, repo);
            url = url.replace(/\$filespec/, filespec);

            return url;
        },

        list : function() {
            var output = [];
            for (key in this.repos) {

                for (var idx = 0; idx < this.repos[key].length; idx++) {
                    var tutorial = this.repos[key][idx];

                    var url = this.format_tutorial_url(
                        this.doc_format_string,
                        key,
                        tutorial.file
                    );

                    output.push(
                        {
                            title : tutorial.title,
                            url : url,
                        }
                    );
                }
            }

            return output.sort(this.sortByKey('title', 'insensitively'));
        },

        init : function (options) {
            this._super(options);

            this.pages = [];
            this.currentPage = -1;

            $.getJSON(
                this.options.configURL,
                $.proxy(function(data) {
                    this.repos = data.repos;
                    this.doc_format_string = data.doc_format_string;
                    if (this.options.tutorial == undefined) {
                        this.options.tutorial = data.default;
                    }

                    if (this.options.tutorial) {
                        this.retrieveTutorial(this.options.tutorial);
                    }

                }, this)
            );


            return this;
        },

        retrieveTutorial : function(url) {

            this.pages = [];

            var token = undefined;

            $.ajax(
                {
    		        async : true,
            		dataType: "text",
            		url: url,
            		crossDomain : true,
            		beforeSend: function (xhr) {
		                if (token) {
                			xhr.setRequestHeader('Authorization', token);
		                }
            		},
            		success: $.proxy(function (data, status, xhr) {

            		    var $resp = $('<div></div>').append(data);

            		    $.each(
            		        $resp.children(),
            		        $.proxy( function(idx, page) {
            		            $(page).find('.example').remove();
                                this.pages.push($(page));
            		        }, this)
            		    );

            		    this.renderAsHTML();
		            }, this),
            		error: $.proxy(function(xhr, textStatus, errorThrown) {
            		    this.dbg(xhr);
                        throw xhr;
		            }, this),
                    type: 'GET',
    	        }
    	    );

        },

        renderAsHTML : function() {
            this.$elem.empty();
            $.each(
                this.pages,
                $.proxy(function (idx, page) {
                    this.$elem.append(page);
                }, this)
            );
        },

        lastPage : function() {
            return this.pages.length - 1;
        },

        currentPage : function() {
            page = this.currentPage;
            if (this.currentPage < 0) {
                page = 0;
            }
            return this.pages[page];
        },

        goToPrevPage : function () {
            var page = this.currentPage - 1;
            if (page < 0) {
                page = 0;
            }
            this.currentPage = page;
            return page;
        },

        goToNextPage : function () {
            var page = this.currentPage + 1;
            if (page >= this.pages.length) {
                page = this.pages.length - 1;
            }
            this.currentPage = page;
            return page;
        },

        contentForPage : function(idx) {
            if (this.pages.length == 0) {
                return undefined;
            }
            else {
                return this.pages[this.currentPage];
            }
        },

        contentForCurrentPage : function () {
            return this.contentForPage(this.currentPage);
        },

    });

}( jQuery ) );
