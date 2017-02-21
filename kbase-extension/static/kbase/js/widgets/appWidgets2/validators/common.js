define([], function() {
    function isEmptyString(value) {
        if (value === null) {
            return true;
        }
        if (typeof value === 'string' && value.trim() === '') {
            return true;
        }
        return false;
    }
    return {
        isEmptyString: isEmptyString
    }
});