/*global define*/
/*jslint white:true,browser:true*/

define([
    'kb_common/html',
    'common/props',
    'common/runtime',
    'narrativeConfig'
], function (html, Props, Runtime, narrativeConfig) {
    'use strict';

    var t = html.tag,
        span = t('span'), img = t('img');

    function makeAppIcon(appSpec) {
        // icon is in the spec ...
        var runtime = Runtime.make(),
            nmsBase = runtime.config('services.narrative_method_store_image.url'),
            iconUrl = Props.getDataItem(appSpec, 'info.icon.url');

        if (iconUrl) {
            return span({class: 'fa-stack fa-2x', style: {padding: '2px 3px 3px 3px'}}, [
                img({src: nmsBase + iconUrl, style: {maxWidth: '50px', maxHeight: '50px', margin: '0x'}})
            ]);
        }

        return span({style: ''}, [
            span({class: 'fa-stack fa-2x', style: {textAlign: 'center', color: 'rgb(103,58,183)', 'padding-top': '5px'}}, [
                span({class: 'fa fa-square fa-stack-2x', style: {color: 'rgb(103,58,183)'}}),
                span({class: 'fa fa-inverse fa-stack-1x fa-cube'})
            ])
        ]);
    }

    function makeGenericIcon(fontAwesomeIconName, color) {
        var iconColor = color || 'silver';

        return span({style: ''}, [
            span({class: 'fa-stack fa-2x', style: {textAlign: 'center', color: iconColor}}, [
                span({class: 'fa fa-square fa-stack-2x', style: {color: iconColor}}),
                span({class: 'fa fa-inverse fa-stack-1x fa-' + fontAwesomeIconName})
            ])
        ]);
    }
    
    function parseType(typeId) {
        var parsed = typeId.split('-'),
            typeId = parsed[0].split('.'),
            module = typeId[0],
            name = typeId[1],
            version = parsed[1];
        return {
            name: name,
            module: module,
            version: version
        };
    }

    function makeTypeIcon(typeId) {
        var type = parseType(typeId),
            iconSpec = narrativeConfig.get('icons'), 
            color, iconDef, icon;
        
        if (iconSpec) {
            color = iconSpec.color_mapping[type.name];
            iconDef = iconSpec.data[type.name];
        }
        
        if (iconDef) {
            icon = iconDef[0];
        } else {
            icon = iconSpec.data.DEFAULT[0];
        }
        
        if (!color) {
            color = 'black';
        }
        
        return span([
            span({class: 'fa-stack fa-2x', style: {textAlign: 'center', color: color}}, [
                span({class: 'fa fa-circle fa-stack-2x', style: {color: color}}),
                span({class: 'fa fa-inverse fa-stack-1x ' + icon})
            ])
        ]);
    }

    return {
        makeAppIcon: makeAppIcon,
        makeGenericIcon: makeGenericIcon,
        makeTypeIcon: makeTypeIcon
    };
});