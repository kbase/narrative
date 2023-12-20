define([
    'preact',
    'htm',
    '../components/Main',

    // For effect
    'css!./Root.css'
], (
    preact,
    htm,
    Main,
) => {
    const {h} = preact;
    const html = htm.bind(h);

    function Root({hostNodeId, cellId, state, moduleName, appName, params, isDynamicService}) {
        const container = document.createElement('div');
        container.classList.add('nbextensions-serviceWidgetCell-Root');
        this.container = container;

        const hostNode = document.getElementById(hostNodeId);

        if (hostNode === null) {
            console.error(`Cannot find host node with id "${hostNodeId}`);
        }

        hostNode.appendChild(container);

        const content = html`
            <${Main} moduleName=${moduleName} 
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
