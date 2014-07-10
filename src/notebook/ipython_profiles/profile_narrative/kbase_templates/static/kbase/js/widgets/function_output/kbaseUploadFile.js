/**
 * KBase widget to upload content.
 */
(function($, undefined) {
    $.KBWidget({
        name: 'UploadFileWidget',
        version: '1.0.0',
        options: {
            url: null,
            auth: null,
            name: null
        },
        init: function(options) {
            this._super(options);
            return this.render();
        },
        render: function() {
            // creater main comtainer
            var main = $('<div>');
            // add uploader
            if ((this.options.url !== null) && (this.options.auth !== null) && (this.options.name !== null)) {
                main.append($('<p>').text("Coming soon."));
            } else {
                main.append($('<p>').text("Error: Unable to connect to invocation server."));
            }
            // put container in cell
            this.$elem.append(main);
            return this;
        }
    });
})(jQuery);