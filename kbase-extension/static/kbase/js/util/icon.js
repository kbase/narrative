define([
    'jquery',
    'underscore',
    'narrativeConfig'
], function (
    $,
    _,
    Config
) {
    'use strict';

    var icons = Config.get('icons'),
        dataIcons = icons.data,
        iconColors = icons.colors,
        iconColorMapping = icons.color_mapping;

    function overwriteDataIcon(params) {
        return buildDataIcon(params.elt, params.type, params.stacked, params.indent);
    }

    function buildDataIcon($logo, type, stacked, indent) {
        if (indent === undefined || indent === null) {
            indent = 0;
        }
        indent = 0;

        var icons = dataIcons;
        var icon = _.has(icons, type) ? icons[type] : icons.DEFAULT;
        // background circle
        $logo.addClass("fa-stack fa-2x").css({
            'cursor': 'pointer'
        });

        // For 'stacked' (set) icons, add a shifted-over
        // circle first, as the bottom layer, then also add a border
        // to the top one.
        var baseIcon = 'circle';
        var circle_classes = 'fa fa-' + baseIcon + ' fa-stack-2x';
        var circle_color = logoColorLookup(type);
        var cmax = function(x) { return x > 255 ? 255 : x; };
        if (stacked) {
            var parsed_color, r, g, b;
            var cstep = 20; // color-step for overlapped circles
            var num_stacked_circles = 1; // up to 2
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
            for (var i=num_stacked_circles; i > 0; i--) {
                var stacked_color = 'rgb(' + cmax(r + i * cstep)  + ',' +
                    cmax(g + i * cstep) + ',' + cmax(b + i * cstep) + ')';
                $logo.append($('<i>')
                    .addClass(circle_classes + ' kb-data-list-logo-shiftedx' + i)
                    .css({'color': stacked_color}));
                $logo.append($('<i>')
                    .addClass(circle_classes + ' kb-data-list-logo-shifted' + i)
                    .css({'color': 'white'}));
            }
        }
        // Assume there are CSS rules for levels of indent we care about..
        if (indent > 0) {
            $logo.addClass('kb-data-list-level1');
        }
        else if ($logo.hasClass('kb-data-list-level1')) {
            $logo.removeClass('kb-data-list-level1');
        }

        $logo.append($('<i>')
                .addClass(circle_classes)
                .css({'color': circle_color}));
        // to avoid repetition, define the func. here that will
        // add one set of icons
        var addLogoFunc = function(fa_icon, $logo, cls) {
            $logo.append($('<i>')
                .addClass(fa_icon + ' fa-inverse fa-stack-1x ' + cls));
        };
        if (isCustomIcon(icon)) {
            // add custom icons (more than 1 will look weird, though)
            _.each(icon, function(cls) { addLogoFunc('icon', $logo, cls); });
        } else {
            // add stack of font-awesome icons
            _.each(icon, function(cls) { addLogoFunc('fa', $logo, cls); });
        }
        return $logo;
    }

    /**
     * Whether the stack of icons is using font-awesome
     * or our own custom set.
     *
     * @param iconList {list of str} Icon classes, from icons.json
     * @returns {boolean}
     */
    function isCustomIcon(iconList) {
        return (iconList.length > 0 && iconList[0].length > 4 &&
            iconList[0].substring(0, 4) == 'icon');
    }

    /**
     * Get color for data or method icon.
     * @param type
     * @returns {string} Color code
     */
    function logoColorLookup (type) {
        var color = iconColorMapping[type];
        if ( color === undefined) {
            // fall back to primitive hack that just guesses
            var code = 0;
            for (var i = 0; i < type.length; code += type.charCodeAt(i++));
            color = iconColors[code % iconColors.length];
        }
        return color;
    }

    return {
        overwriteDataIcon: overwriteDataIcon,
        buildDataIcon: buildDataIcon
    }
});
