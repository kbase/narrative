define([], function() {
    function copyValue(obj) {
        if (obj !== undefined) {
            return JSON.parse(JSON.stringify(obj));
        }
    }

    return Object.freeze({
        copy: copyValue
    });
});