define([
    'underscore',
    'kb_common/html',
    'common/props',
    'common/runtime',
    'narrativeConfig',
], function (
    _,
    html,
    Props,
    Runtime,
    NarrativeConfig
) {
    'use strict';

    const iconSpec = NarrativeConfig.get('icons'),
        runtime = Runtime.make(),
        nmsBase = runtime.config('services.narrative_method_store_image.url'),
        t = html.tag,
        span = t('span'),
        img = t('img'),
        cssBaseName = 'kb-icon';

    /**
     * @method _makeIconFromUrl
     * @private
     * Generates the HTML for an image icon, given an image URL
     * The icons generated have class `kb-icon__container--image`
     *
     * @param {string} iconURL  URL for the image to be used as an icon
     *
     * @returns {string}        HTML string for the icon
     */
    function _makeIconFromUrl(iconUrl) {
        const iconType = 'image';
        return span({
            class: `${cssBaseName}__container--${iconType}`,
        }, [
            img({
                src: iconUrl,
                class: `${cssBaseName}__img--${iconType}`,
            })
        ]);
    }

    /**
     * @method _makeStackLayers
     * @private
     * Amends an exist array of icon layers to add in stack layers
     * @param {string} shape      shape for the icon background;
     *                              typically 'square' or 'circle'
     * @param {string} color      colour for the icon background (hex or RGB)
     *
     * @returns {array}           array of HTML strings representing the extra icon layers
     */

    function _makeStackLayers(shape = 'square', color = null) {
        // For 'stacked' (set) icons, add a shifted-over
        // circle first, as the bottom layer, then also add a border
        // to the top one.
        const layers = [],
            cmax = function(x) { return x > 255 ? 255 : x; },
            cstep = 20, // color-step for overlapped circles
            num_stacked_circles = 1; // up to 2
        let parsed_color, r, g, b;

        // XXX: Assume color is in form '#RRGGBB'
        if (color[0] == '#') {
            parsed_color = color.match(/#(..)(..)(..)/);
            r = parseInt(parsed_color[1], 16);
            g = parseInt(parsed_color[2], 16);
            b = parseInt(parsed_color[3], 16);
        }
        // XXX: Assume color is in form "rgb(#,#,#)"
        else {
            parsed_color = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
            r = parsed_color[1];
            g = parsed_color[2];
            b = parsed_color[3];
        }
        // Add circles with lighter colors
        for (let i=num_stacked_circles; i > 0; i--) {
            let stacked_color = color
                ? 'rgb(' + cmax(r + i * cstep)  + ',' +
                    cmax(g + i * cstep) + ',' + cmax(b + i * cstep) + ')'
                : '';
            let style = color ? { color: stacked_color } : {};
            layers.push(
                span({
                    class: `${cssBaseName}__stack--l${i} fa fa-stack-2x fa-${shape}`,
                    style: style,
                }),
                // white separator
                span({
                    class: `${cssBaseName}__outline--l${i} fa fa-stack-2x fa-${shape}`,
                })
            );
        }
        return layers;
    }

    /**
     * @method _makeIcon
     * @private
     * Creates an HTML string that renders an icon
     * @param {string} iconType  the type of icon to produce,
     *                              e.g. 'app', 'app-toolbar', 'data', 'generic', etc.
     * @param {object} iconClass  the class of the icon, e.g. 'fa-cube'
     * @param {string} shape      shape for the icon background;
     *                              typically 'square' or 'circle'
     * @param {string} color      colour for the icon background (hex or RGB)
     * @param {bool}   stacked    whether or not the icon should be stacked
     */

    function _makeIcon(iconType, iconClass, shape = 'square', color = null, stacked = false) {

        const style = color ? {color: color} : {};
        const layers = stacked ? _makeStackLayers(shape, color) : [];
        iconClass = iconClass.replace('icon ', '');

        return span({
            class: `${cssBaseName}__container--${iconType} fa-stack`,
        }, layers.concat(
            span({
                class: `${cssBaseName}__icon_background--${iconType} fa fa-${shape} fa-stack-2x`,
                style: style,
            }),
            span({
                class: `${cssBaseName}__icon--${iconType} fa fa-inverse fa-stack-1x ${iconClass}`,
            })
        ));
    }

    /**
     * @method
     * @public
     * Builds a data icon for a given data type
     * @param {string} type The shortened type of object to fetch the icon for. E.g. "Genome" not
     * "KBaseGenomes.Genome-2.1"
     * @param {boolean} stacked If true, creates a stacked effect of multiple 'icons'.
     */
    function makeDataIcon(type, stacked) {
        const iconType = stacked ? 'data-stack' : 'data',
            color = _.has(iconSpec.color_mapping, type)
                ? iconSpec.color_mapping[type]
                : logoColorLookup(type),
            icon = _.has(iconSpec.data, type)
                ? iconSpec.data[type]
                : iconSpec.data.DEFAULT;
        return _makeIcon(iconType, icon[0], 'circle', color, stacked);
    }

    /**
     * @method
     * @public
     * Builds a data icon in the given $logo div.
     * @param {object} $logo jQuery element in which to insert an icon.
     * @param {string} type The shortened type of object to fetch the icon for. E.g. "Genome" not
     * "KBaseGenomes.Genome-2.1"
     * @param {boolean} stacked If true, creates a stacked effect of multiple 'icons'.
     * @param {int} indent -- deprecated
     */
    function buildDataIcon($logo, type, stacked, indent) {
        const iconStr = makeDataIcon(type, stacked);
        $logo.append(iconStr);
        return $logo;
    }

    /**
     * Legacy code that overwrites any existing DOM elements in params.elt. Used for passing in
     * a set of parameters to makeDataIcon as an object instead of a list.
     * @param {object} params - The set of parameters to use.
     * @param {object} params.elt - The JQuery element containing the logo to overwrite.
     * @param {string} params.type - The type of object to build a logo from.
     * @param {boolean} params.stacked - If true, creates a stacked effect of multiple icons on each other
     */
    function overwriteDataIcon(params) {
        return buildDataIcon(params.elt, params.type, params.stacked);
    }

    /**
     * Get color for data or method icon.
     * @param {string} type String that gets "hashed" into a color.
     * @returns {string} Color code
     */
    function logoColorLookup (type) {
        let color;
        // fall back to primitive hack that just guesses
        let code = 0;
        for (let i = 0; i < type.length; code += type.charCodeAt(i++));
        color = iconSpec.colors[code % iconSpec.colors.length];
        return color;
    }

    function makeAppIcon(appSpec = {}, isToolbarIcon = false) {
        // icon is in the spec
        const iconUrl = Props.getDataItem(appSpec, 'info.icon.url');

        if (iconUrl) {
            return _makeIconFromUrl(nmsBase + iconUrl);
        }
        return _makeIcon(isToolbarIcon ? 'app-toolbar' : 'app', 'fa-cube', 'square');
    }

    function makeToolbarAppIcon(appSpec) {
        return makeAppIcon(appSpec, true);
    }

    function makeGenericIcon(faIconName = 'cube', color = null) {
        return _makeIcon('generic', `fa-${faIconName}`, 'square', color);
    }

    function makeToolbarGenericIcon(faIconName = 'cube', color = null) {
        return _makeIcon('generic-toolbar', `fa-${faIconName}`, 'square', color);
    }

    function parseTypeName(_typeId) {
        const parsed = _typeId.split('-'),
            typeId = parsed[0].split('.');
        return typeId[1] || null;
    }

    function makeTypeIcon(typeId, isToolbarIcon) {
        const typeName = parseTypeName(typeId),
            iconType = isToolbarIcon ? 'type-toolbar' : 'type';
        let color,
            iconDef,
            icon;

        if (typeName) {
            color = iconSpec.color_mapping[typeName] || logoColorLookup(typeName);
            iconDef = iconSpec.data[typeName];
        }

        icon = iconDef ? iconDef[0] : iconSpec.data.DEFAULT[0];

        return _makeIcon(iconType, icon, 'square', color);
    }

    function makeToolbarTypeIcon(typeId) {
        return makeTypeIcon(typeId, true);
    }

    return {
        cssBaseName: cssBaseName,
        makeAppIcon: makeAppIcon,
        makeGenericIcon: makeGenericIcon,
        makeToolbarAppIcon: makeToolbarAppIcon,
        makeToolbarGenericIcon: makeToolbarGenericIcon,
        makeTypeIcon: makeTypeIcon,
        makeToolbarTypeIcon: makeToolbarTypeIcon,
        makeDataIcon: makeDataIcon,
        // legacy methods
        overwriteDataIcon: overwriteDataIcon,
        buildDataIcon: buildDataIcon,
    };
});
