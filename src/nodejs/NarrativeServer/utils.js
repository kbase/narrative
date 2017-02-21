module.exports.HttpError = Object.create({}, {
    init: {
        value: function (cfg) {
            this.isHttpError = true;
            this.code = cfg.code;
            this.message = cfg.message;
            this.content = cfg.content;
            return this;
        }
    },
    make: {
        value: function (code, message, content) {
            return this.init({
                code: code, message: message, content: content
            });
        }
    }
});