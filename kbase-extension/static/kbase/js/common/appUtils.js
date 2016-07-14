/*global define*/
/*jslint white:true,browser:true*/

define([
    'kb_common/html',
    'common/props',
    'common/runtime'
], function (html, Props, Runtime) {
    'use strict';
    
    var t = html.tag,
        span = t('span'), img = t('img');
    
    function makeAppIcon(appSpec) {
        // icon is in the spec ...
        var runtime = Runtime.make(),
            nmsBase = runtime.config('services.narrative_method_store.image_url'),
            iconUrl = Props.getDataItem(appSpec, 'info.icon.url');

        if (iconUrl) {
            return span({class: 'fa-stack fa-2x', style: {padding: '0 3px 3px 3px'}}, [
                img({src: nmsBase + iconUrl, style: {maxWidth: '50px', maxHeight: '50px', margin: '0x'}})
            ]);
        }

        return span({style: ''}, [
            span({class: 'fa-stack fa-2x', style: {textAlign: 'center', color: 'rgb(103,58,183)'}}, [
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

    return {
        makeAppIcon: makeAppIcon,
        makeGenericIcon: makeGenericIcon
    };
});