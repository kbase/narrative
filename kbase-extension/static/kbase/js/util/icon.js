define(['jquery', 'underscore', 'narrativeConfig'], ($, _, Config) => {
    'use strict';

    const icons = Config.get('icons'),
        dataIcons = icons.data,
        iconColors = icons.colors,
        iconColorMapping = icons.color_mapping;

    /**
     * Legacy code that overwrites any existing DOM elements in params.elt. Used for passing in
     * a set of parameters to buildDataIcon as an object instead of a list.
     * @param {object} params - The set of parameters to use.
     * @param {object} params.elt - The JQuery element containing the logo to overwrite.
     * @param {string} params.type - The type of object to build a logo from.
     * @param {boolean} params.stacked - If true, creates a stacked effect of multiple icons on each other
     * @param {int} params.indent - How many spaces to indent (can be null or undefined)
     */
    function overwriteDataIcon(params) {
        return buildDataIcon(params.elt, params.type, params.stacked, params.indent);
    }

    /**
     * @method
     * @public
     * Builds a data icon in the given $logo div.
     * @param {object} $logo The div in which to insert an icon.
     * @param {string} type The shortened type of object to fetch the icon for. E.g. "Genome" not
     * "KBaseGenomes.Genome-2.1"
     * @param {boolean} stacked If true, creates a stacked effect of multiple 'icons'.
     * @param {int} indent How many spaces to indent the icon (typically 0 or just null)
     */
    function buildDataIcon($logo, type, stacked, indent) {
        if (indent === undefined || indent === null) {
            indent = 0;
        }
        indent = 0;

        const icons = dataIcons;
        const icon = _.has(icons, type) ? icons[type] : icons.DEFAULT;
        // background circle
        $logo.addClass('fa-stack fa-2x').css({
            cursor: 'pointer',
        });

        // For 'stacked' (set) icons, add a shifted-over
        // circle first, as the bottom layer, then also add a border
        // to the top one.
        const baseIcon = 'circle';
        const circle_classes = 'fa fa-' + baseIcon + ' fa-stack-2x';
        const circle_color = logoColorLookup(type);
        const cmax = function (x) {
            return x > 255 ? 255 : x;
        };
        if (stacked) {
            let parsed_color, r, g, b;
            const cstep = 20; // color-step for overlapped circles
            const num_stacked_circles = 1; // up to 2
            $logo.addClass('kb-data-list-logo-font' + num_stacked_circles);
            // XXX: Assume color is in form '#RRGGBB'
            if (circle_color[0] == '#') {
                parsed_color = circle_color.match(/#(..)(..)(..)/);
                r = parseInt(parsed_color[1], 16);
                g = parseInt(parsed_color[2], 16);
                b = parseInt(parsed_color[3], 16);
            }
            // XXX: Assume color is in form "rgb(#,#,#)"
            else {
                parsed_color = circle_color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
                r = parsed_color[1];
                g = parsed_color[2];
                b = parsed_color[3];
            }
            // Add circles with lighter colors
            for (let i = num_stacked_circles; i > 0; i--) {
                const stacked_color =
                    'rgb(' +
                    cmax(r + i * cstep) +
                    ',' +
                    cmax(g + i * cstep) +
                    ',' +
                    cmax(b + i * cstep) +
                    ')';
                $logo.append(
                    $('<i>')
                        .addClass(circle_classes + ' kb-data-list-logo-shiftedx' + i)
                        .css({ color: stacked_color })
                );
                $logo.append(
                    $('<i>')
                        .addClass(circle_classes + ' kb-data-list-logo-shifted' + i)
                        .css({ color: 'white' })
                );
            }
        }
        // Assume there are CSS rules for levels of indent we care about..
        if (indent > 0) {
            $logo.addClass('kb-data-list-level1');
        } else if ($logo.hasClass('kb-data-list-level1')) {
            $logo.removeClass('kb-data-list-level1');
        }

        $logo.append($('<i>').addClass(circle_classes).css({ color: circle_color }));
        // to avoid repetition, define the func. here that will
        // add one set of icons
        const addLogoFunc = function (fa_icon, $logo, cls) {
            $logo.append($('<i>').addClass(fa_icon + ' fa-inverse fa-stack-1x ' + cls));
        };
        if (isCustomIcon(icon)) {
            // add custom icons (more than 1 will look weird, though)
            _.each(icon, (cls) => {
                addLogoFunc('icon', $logo, cls);
            });
        } else {
            // add stack of font-awesome icons
            _.each(icon, (cls) => {
                addLogoFunc('fa', $logo, cls);
            });
        }
        return $logo;
    }

    /**
     * Whether the stack of icons is using font-awesome
     * or our own custom set.
     *
     * @param {list of str} iconList  Icon classes, from icons.json
     * @returns {boolean}
     */
    function isCustomIcon(iconList) {
        return (
            iconList.length > 0 && iconList[0].length > 4 && iconList[0].substring(0, 4) == 'icon'
        );
    }

    /**
     * Get color for data or method icon.
     * @param {string} type String that gets "hashed" into a color.
     * @returns {string} Color code
     */
    function logoColorLookup(type) {
        let color = iconColorMapping[type];
        if (color === undefined) {
            // fall back to primitive hack that just guesses
            let code = 0;
            for (let i = 0; i < type.length; code += type.charCodeAt(i++));
            color = iconColors[code % iconColors.length];
        }
        return color;
    }

    return {
        overwriteDataIcon: overwriteDataIcon,
        buildDataIcon: buildDataIcon,
    };
});
