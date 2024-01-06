define(['preact', 'htm', '../components/Main'], (preact, htm, Main) => {
    'use strict';

    const { h } = preact;
    const html = htm.bind(h);

    function Root({ hostNodeId, cellId, state, moduleName, appName, params, isDynamicService }) {
        const container = document.createElement('div');
        container.classList.add('nbextensions-serviceWidgetCell-Root');

        const hostNode = document.getElementById(hostNodeId);

        if (hostNode === null) {
            console.error(`Cannot find host node with id "${hostNodeId}`);
        }

        hostNode.appendChild(container);

        const content = html`
            <${Main}
                moduleName=${moduleName}
                isDynamicService=${true}
                cellId=${cellId}
                state=${state}
                appName=${appName}
                params=${params}
                isDynamicService=${isDynamicService}
            />
        `;
        preact.render(content, container);
    }

    return Root;
});
