/**
 * Implements a simple search input box with an attached icon button. The icon switches from
 * the magnifying glass to an X when something is input.
 *
 * Like most other KBase widgets, this follows this paradigm:
 * let $div = $('<div>');
 * let searchInput = new BootstrapSearch($div, options);
 *
 * Options:
 * placeholder - placeholder text
 * emptyIcon - font-awesome icon name (either fa-xxx or just xxx), placed when the input field is
 *             empty.
 * filledIcon - font-awesome icon name as above, placed when there's text present.
 * inputFunction - gets fired off when a user inputs something.
 * addonFunction - gets fired off when a user clicks the addon area. default = clear input.
 * escFunction - gets fired off if escape (key 27) is hit while the input is focused.
 * delay - time in ms before firing the input function (default 300)
 */

define(['jquery', 'bluebird', 'base/js/namespace', 'bootstrap'], ($, Promise, Jupyter) => {
    'use strict';

    const BootstrapSearch = function ($target, options) {
        options = options || {};

        if (!options.placeholder) {
            options.placeholder = '';
        }
        if (!options.emptyIcon) {
            options.emptyIcon = 'fa-times';
        }
        if (!options.emptyIcon.startsWith('fa-')) {
            options.emptyIcon = 'fa-' + options.emptyIcon;
        }
        if (!options.filledIcon) {
            options.filledIcon = 'fa-times';
        }
        if (!options.filledIcon.startsWith('fa-')) {
            options.filledIcon = 'fa-' + options.filledIcon;
        }
        if (!options.delay) {
            options.delay = 300;
        }

        this.options = options;
        this.initialize($target);
    };

    BootstrapSearch.prototype.initialize = function ($target) {
        const self = this;

        // structure.
        const $input = $('<input type="text">')
            .attr('Placeholder', this.options.placeholder)
            .addClass('form-control');

        const $addonBtn = $('<span>')
            .addClass('input-group-addon btn btn-default kb-method-search-clear')
            .attr('type', 'button')
            .css({
                border: '1px solid #ccc',
                'border-radius': '2px',
                'border-left': 'none',
            });

        const $addonIcon = $('<span>').addClass('fa ' + this.options.emptyIcon);

        $addonBtn.append($addonIcon);

        const $container = $('<div>').addClass('input-group').append($input).append($addonBtn);

        $target.append($container);

        // event bindings.
        $input
            .on('focus', () => {
                if (Jupyter && Jupyter.narrative) {
                    Jupyter.narrative.disableKeyboardManager();
                }
            })
            .on('blur', () => {
                if (Jupyter && Jupyter.narrative) {
                    Jupyter.narrative.disableKeyboardManager();
                }
            })
            .on('input', (e, ignoreDelay) => {
                if ($input.val()) {
                    $addonIcon.removeClass(self.options.emptyIcon);
                    $addonIcon.addClass(self.options.filledIcon);
                } else {
                    $addonIcon.removeClass(self.options.filledIcon);
                    $addonIcon.addClass(self.options.emptyIcon);
                }
                if (self.options.inputFunction) {
                    if (self.delayTimeout) {
                        clearTimeout(self.delayTimeout);
                    }
                    if (ignoreDelay) {
                        return self.options.inputFunction(e);
                    }
                    self.delayTimeout = setTimeout(
                        () => self.options.inputFunction(e),
                        self.options.delay
                    );
                }
            })
            .on('keyup', (e) => {
                if (e.keyCode === 27) {
                    if (self.options.escFunction) {
                        self.options.escFunction(e);
                    }
                }
            });

        $addonBtn.click((e) => {
            if (!self.options.addonFunction) {
                $input.val('');
                $input.trigger('input', [true]);
            } else {
                self.options.addonFunction(e);
            }
        });

        this.$input = $input;
        this.$container = $container;
    };

    BootstrapSearch.prototype.val = function (val) {
        let retVal;
        if (val === undefined || val === null) {
            retVal = this.$input.val();
        } else {
            retVal = this.$input.val(val);
            this.$input.trigger('input', [true]);
        }
        return retVal;
    };

    BootstrapSearch.prototype.focus = function () {
        this.$input.focus();
    };

    return BootstrapSearch;
});
