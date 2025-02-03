define([], () => {
    'use strict';

    function createBodyElement(name = 'div') {
        const element = document.createElement(name);
        document.body.appendChild(element);
        return element;
    }

    return { createBodyElement };
});
