define(['kb_common/html', 'kb_common/format', './props', 'bootstrap'], (html, format, Props) => {
    'use strict';
    const t = html.tag,
        div = t('div');

    function makePanel(title, elementName) {
        return div({ class: 'panel panel-primary' }, [
            div({ class: 'panel-heading' }, [div({ class: 'panel-title' }, title)]),
            div({ class: 'panel-body' }, [
                div({ dataElement: elementName, class: 'container-fluid' }),
            ]),
        ]);
    }

    function buildPanel(args) {
        const style = {},
            type = args.type || 'primary';
        if (args.hidden) {
            style.display = 'none';
        }
        return div({ class: 'panel panel-' + type, dataElement: args.name, style: style }, [
            div({ class: 'panel-heading' }, [div({ class: 'panel-title' }, args.title)]),
            div({ class: 'panel-body' }, [args.body]),
        ]);
    }

    function getElement(container, names) {
        const selector = names
            .map((name) => {
                return '[data-element="' + name + '"]';
            })
            .join(' ');

        return container.querySelector(selector);
    }
    function createMeta(cell, initial) {
        const meta = cell.metadata;
        meta.kbase = initial;
        cell.metadata = meta;
    }
    function getMeta(cell, group, name) {
        if (!cell.metadata.kbase) {
            return;
        }
        if (name === undefined) {
            return cell.metadata.kbase[group];
        }
        if (!cell.metadata.kbase[group]) {
            return;
        }
        return cell.metadata.kbase[group][name];
    }
    function setMeta(cell, group, name, value) {
        /*
         * This funny business is because the trigger on setting the metadata
         * property (via setter and getter in core Cell object) is only invoked
         * when the metadata preoperty is actually set -- doesn't count if
         * properties of it are.
         */
        const temp = cell.metadata;
        // Handle the case of setting a group to an entire object
        if (value === undefined) {
            temp.kbase[group] = name;
        } else {
            if (!temp.kbase[group]) {
                temp.kbase[group] = {};
            }
            temp.kbase[group][name] = value;
        }
        cell.metadata = temp;
    }
    function setCellMeta(cell, path, value, forceRefresh) {
        if (!cell.metadata) {
            cell.metadata = {};
        }
        Props.setDataItem(cell.metadata, path, value);
        if (forceRefresh) {
            cell.metadata = cell.metadata;
        }
    }
    function getCellMeta(cell, path, defaultValue) {
        return Props.getDataItem(cell.metadata, path, defaultValue);
    }
    function pushMeta(cell, props, value) {
        const meta = Props.make(cell.metadata.kbase);
        meta.incrItem(props, value);
    }

    /*
     * Show elapsed time in a friendly fashion.
     */
    function formatTime(time) {
        if (time) {
            return format.niceElapsedTime(time);
        }
    }
    function horribleHackToHideElement(cell, selector, tries) {
        const prompt = cell.element.find(selector);
        if (prompt.length > 0) {
            prompt.css('visibility', 'hidden');
            return;
        }

        if (tries > 0) {
            tries -= 1;
            window.setTimeout(() => {
                horribleHackToHideElement(cell, tries);
            }, 100);
        } else {
            console.warn('Could not hide the prompt, sorry');
        }
    }

    function toBoolean(value) {
        if (value && value !== null) {
            return true;
        }
        return false;
    }

    return {
        makePanel: makePanel,
        buildPanel: buildPanel,
        getElement: getElement,
        createMeta: createMeta,
        getMeta: getMeta,
        setMeta: setMeta,
        getCellMeta: getCellMeta,
        setCellMeta: setCellMeta,
        pushMeta: pushMeta,
        formatTime: formatTime,
        horribleHackToHideElement: horribleHackToHideElement,
        toBoolean: toBoolean,
    };
});
