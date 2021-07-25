define(['jquery'], ($) => {
    'use strict';

    function $TextIn(text, tag = 'div') {
        return $(document.createElement(tag)).text(text);
    }

    function $HTMLIn(html, tag = 'div') {
        return $(document.createElement(tag)).append(html);
    }

    return { $TextIn, $HTMLIn };
});
