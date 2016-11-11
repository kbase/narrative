define([], function() {
    function copyValue(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    return Object.freeze({
        copy: copyValue
    });
});