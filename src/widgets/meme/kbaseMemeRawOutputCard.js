(function($, undefined) {
    $.KBWidget({
        name: "KBaseMemeRawOutputCard",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            title: "MEME raw output",
            isInCard: false,
            width: 800,
            height: 600
        },
//        workspaceURL: "https://kbase.us/services/workspace",

        init: function(options) {
            this._super(options);
            var self = this;

            if (this.options.memeOutput === null) {
                //throw an error
                return;
            }

            self.memeOutput = this.options.memeOutput;
            self.$elem.append($("<div />").append($("<pre />").append(this.options.memeOutput)));

            return this;
        },
        getData: function() {
            return {
                type: "MemeRunResult",
//                id: this.options.meme_run_result_id,
                workspace: this.options.workspace_id,
                title: "MEME raw output"
            };
        }

    });
})(jQuery);
