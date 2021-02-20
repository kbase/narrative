/*jslint
 browser: true,
 white: true
 */
define([
    'uuid'
], (
    Uuid
) => {
    'use strict';

    const TAGS = {}

    const div = tag('div'),
        span = tag('span'),
        i = tag('i'),
        table = tag('table'),
        thead = tag('thead'),
        tbody = tag('tbody'),
        tr = tag('tr'),
        th = tag('th'),
        td = tag('td'),
        ul = tag('ul'),
        li = tag('li'),
        a = tag('a');

    function jsonToHTML(node) {
        const nodeType = typeof node;
        let out;
        if (nodeType === 'string') {
            return node;
        }
        if (nodeType === 'boolean') {
            if (node) {
                return 'true';
            }
            return 'false';
        }
        if (nodeType === 'number') {
            return String(node);
        }
        if (Array.isArray(node)) {
            out = '';
            node.forEach((item) => {
                out += jsonToHTML(item);
            });
            return out;
        }
        if (nodeType === 'object') {
            if (node === null) {
                return '';
            }
            out = '';
            out += '<' + nodeType.tag;
            if (node.attributes) {
                node.attributes.keys().forEach((key) => {
                    out += key + '="' + node.attributes[key] + '"';
                });
            }
            out += '>';
            if (node.children) {
                out += jsonToHTML(node.children);
            }
            out += '</' + node.tag + '>';
            return out;
        }
    }

    /**
     * Given a simple object of keys and values, create a string which 
     * encodes them into a form suitable for the value of a style attribute.
     * Style attribute values are themselves attributes, but due to the limitation
     * of html attributes, they are embedded in a string:
     * The format is
     * key: value;
     * Note that values are not quoted, and the separator between fields is
     * a semicolon
     * Note that we expect the value to be embedded withing an html attribute
     * which is quoted with double-qoutes; but we don't do any escaping here.
     * @param {type} attribs
     * @returns {String}
     */
    function camelToKebab(s) {
        return s.replace(/[A-Z]/g, (m) => {
            return '-' + m.toLowerCase();
        });
    }
    function makeStyleAttribs(attribs) {
        return Object.keys(attribs)
            .map((rawKey) => {
                const rawValue = attribs[rawKey],
                    key = camelToKebab(rawKey);

                const value = (() => {
                    switch (typeof rawValue) {
                        case 'string':
                            return rawValue;
                        case 'number':
                            return String(rawValue);
                        case 'boolean':
                            return false;
                        case 'undefined':
                            return false;
                        case 'object':
                            return false;
                    }
                })();

                if (typeof value === 'string') {
                    return `${key}: ${value}`;
                }
                return false;
            })
            .filter((field) => {
                return field ? true : false;
            })
            .join('; ');
    }


    /**
     * Given a simple object of keys and values, create a string which 
     * encodes a set of html tag attributes.
     * String values escape the "
     * Boolean values either insert the attribute name or not
     * Object values are interpreted as "embedded attributes" (see above)
     * @param {type} attribs
     * @returns {String}
     */
    function makeTagAttribs(attribs) {
        const quoteChar = '"';
        let escapedValue;
        return Object.keys(attribs)
            .map((key) => {
                let value = attribs[key];
                const attribName = camelToKebab(key);
                // The value may itself be an object, which becomes a special string.
                // This applies for "style" and "data-bind", each of which have a 
                // structured string value.
                // Another special case is an array, useful for space-separated
                // attributes, esp. "class".
                if (typeof value === 'object') {
                    if (value === null) {
                        // null works just like false.
                        value = false;
                    } else if (Array.isArray(value)) {
                        value = value.join(' ');
                    } else {
                        switch (attribName) {
                            case 'style':
                                value = makeStyleAttribs(value);
                                break;
                            default:
                                value = false;
                        }
                    }
                }
                switch (typeof value) {
                    case 'string':
                        escapedValue = value.replace(new RegExp('\\' + quoteChar, 'g'), '\\' + quoteChar);
                        return attribName + '=' + quoteChar + escapedValue + quoteChar;
                    case 'boolean':
                        if (value) {
                            return attribName;
                        }
                        return false;
                    case 'number':
                        return attribName + '=' + quoteChar + String(value) + quoteChar;

                    case 'undefined':
                        return false;
                }
            })
            .filter((field) => {
                return field ? true : false;
            })
            .join(' ');
    }

    function renderContent(children) {
        if (children) {
            if (typeof children === 'string') {
                return children;
            }
            if (typeof children === 'number') {
                return String(children);
            }
            if (Array.isArray(children)) {
                return children.map((item) => {
                    return renderContent(item);
                }).join('');
            }
        } else {
            return '';
        }
    }
    function merge(obj1, obj2) {
        function isObject(x) {
            if (typeof x === 'object' &&
                x !== null &&
                !(x instanceof Array)) {
                return true;
            }
            return false;
        }
        function merger(aObj, bObj) {
            Object.keys(bObj).forEach((key) => {
                if (isObject(aObj) && isObject(bObj)) {
                    aObj[key] = merger(aObj[key], bObj[key]);
                }
                aObj[key] = bObj[key];
            });
            return aObj;
        }
        return merger(obj1, obj2);
    }
    function isSimpleObject(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return false;
        }
        return Object.getPrototypeOf(obj) === Object.getPrototypeOf({});
    }
    function tag(tagName, options) {
        options = options || {};
        let tagAttribs;
        if (TAGS[tagName] && !options.ignoreCache) {
            return TAGS[tagName];
        }
        const tagFun = function (attribs, children) {
            let node = '<' + tagName;
            switch (typeof attribs) {
                case 'string':
                    // skip attribs, just go to children.
                    children = attribs;
                    attribs = null;
                    break;
                case 'number':
                    children = String(attribs);
                    attribs = null;
                    break;
                case 'boolean':
                    if (attribs) {
                        children = 'true';
                    } else {
                        children = 'false';
                    }
                    attribs = null;
                    break;
                case 'undefined':
                    if (!children) {
                        children = '';
                    }
                    break;
                case 'object':
                    if (Array.isArray(attribs)) {
                        // skip attribs, just go to children.
                        children = attribs;
                        attribs = null;
                    } else if (attribs === null) {
                        if (!children) {
                            children = '';
                        }
                    } else if (isSimpleObject(attribs)) {
                        if (options.attribs) {
                            attribs = merge(merge({}, options.attribs), attribs);
                        }
                    } else {
                        throw 'Cannot make tag ' + tagName + ' from a ' + (typeof attribs);
                    }
                    break;
            }

            attribs = attribs || options.attribs;
            if (attribs) {
                tagAttribs = makeTagAttribs(attribs);
                if (tagAttribs && tagAttribs.length > 0) {
                    node += ' ' + tagAttribs;
                }
            }

            node += '>';
            if (options.close !== false) {
                node += renderContent(children);
                node += '</' + tagName + '>';
            }
            return node;
        };
        if (!options.ignoreCache) {
            TAGS[tagName] = tagFun;
        }
        return tagFun;
    }
    function genId() {
        return 'kb_html_' + (new Uuid(4)).format();
    }
    function makeTable(arg) {
        let id;
        arg = arg || {};
        if (arg.id) {
            id = arg.id;
        } else {
            id = genId();
            arg.generated = { id: id };
        }
        const attribs = { id: id };
        if (arg.class) {
            attribs.class = arg.class;
        } else if (arg.classes) {
            attribs.class = arg.classes.join(' ');
        }
        return table(attribs, [
            thead(tr(arg.columns.map((x) => {
                return th(x);
            }))),
            tbody(arg.rows.map((row) => {
                return tr(row.map((x) => {
                    return td(x);
                }));
            }))
        ]);
    }

    function bsPanel(title, content) {
        return div({ class: 'panel panel-default' }, [
            div({ class: 'panel-heading' }, [
                span({ class: 'panel-title' }, title)
            ]),
            div({ class: 'panel-body' }, [
                content
            ])
        ]);
    }

    function makePanel(arg) {

        const klass = arg.class || 'default';

        return div({ class: 'panel panel-' + klass }, [
            div({ class: 'panel-heading' }, [
                span({ class: 'panel-title' }, arg.title)
            ]),
            div({ class: 'panel-body' }, [
                arg.content
            ])
        ]);
    }

    function loading(msg) {
        const prompt = msg ? `${msg}... &nbsp &nbsp` : '';
        return span([
            prompt,
            i({ class: 'fa fa-spinner fa-pulse fa-2x fa-fw margin-bottom' })
        ]);
    }

    /*
     * 
     */
    function makeTableRotated(arg) {
        function columnLabel(column) {
            let key;
            if (typeof column === 'string') {
                key = column;
            } else {
                if (column.label) {
                    return column.label;
                }
                key = column.key;
            }
            return key
                .replace(/(id|Id)/g, 'ID')
                .split(/_/g).map((word) => {
                    return word.charAt(0).toUpperCase() + word.slice(1);
                })
                .join(' ');
        }
        function formatValue(rawValue, column) {
            if (typeof column === 'string') {
                return rawValue;
            }
            if (column.format) {
                return column.format(rawValue);
            }
            if (column.type) {
                switch (column.type) {
                    case 'bool':
                        // yuck, use truthiness
                        if (rawValue) {
                            return 'True';
                        }
                        return 'False';
                    default:
                        return rawValue;
                }
            }
            return rawValue;
        }

        const id = genId(),
            attribs = { id: id };
        if (arg.class) {
            attribs.class = arg.class;
        } else if (arg.classes) {
            attribs.class = arg.classes.join(' ');
        }

        return table(attribs,
            arg.columns.map((column, index) => {
                return tr([
                    th(columnLabel(column)),
                    arg.rows.map((row) => {
                        return td(formatValue(row[index], column));
                    })
                ]);
            }));
    }

    function makeRotatedTable(data, columns) {
        function columnLabel(column) {
            let key;
            if (column.label) {
                return column.label;
            }
            if (typeof column === 'string') {
                key = column;
            } else {
                key = column.key;
            }
            return key
                .replace(/(id|Id)/g, 'ID')
                .split(/_/g).map((word) => {
                    return word.charAt(0).toUpperCase() + word.slice(1);
                })
                .join(' ');
        }
        function columnValue(row, column) {
            const rawValue = row[column.key];
            if (column.format) {
                return column.format(rawValue);
            }
            if (column.type) {
                switch (column.type) {
                    case 'bool':
                        // yuck, use truthiness
                        if (rawValue) {
                            return 'True';
                        }
                        return 'False';
                    default:
                        return rawValue;
                }
            }
            return rawValue;
        }

        return table({ class: 'table table-stiped table-bordered' },
            columns.map((column) => {
                return tr([
                    th(columnLabel(column)), data.map((row) => {
                        return td(columnValue(row, column));
                    })
                ]);
            }));
    }

    function properCase(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function makeObjTable(data, options) {
        const tableData = (data instanceof Array && data) || [data],
            columns = (options && options.columns) || Object.keys(tableData[0]).map((key) => {
                return {
                    key: key,
                    label: properCase(key)
                };
            }),
            classes = (options && options.classes) || ['table-striped', 'table-bordered'];

        function columnValue(row, column) {
            const rawValue = row[column.key];
            if (column.format) {
                return column.format(rawValue);
            }
            if (column.type) {
                switch (column.type) {
                    case 'bool':
                        // yuck, use truthiness
                        if (rawValue) {
                            return 'True';
                        }
                        return 'False';
                    default:
                        return rawValue;
                }
            }
            return rawValue;
        }
        if (options && options.rotated) {
            return table({ class: 'table ' + classes.join(' ') },
                columns.map((column) => {
                    return tr([
                        th(column.label),
                        tableData.map((row) => {
                            return td({ dataElement: column.key }, columnValue(row, column));
                        })
                    ]);
                }));
        }
        return table({ class: 'table ' + classes.join(' ') },
            [tr(columns.map((column) => {
                return th(column.label);
            }))].concat(tableData.map((row) => {
                return tr(columns.map((column) => {
                    return td({ dataElement: column.key }, columnValue(row, column));
                }));
            })));
    }

    function makeObjectTable(data, options) {
        function columnLabel(column) {
            let key;
            if (column.label) {
                return column.label;
            }
            if (typeof column === 'string') {
                key = column;
            } else {
                key = column.key;
            }
            return key
                .replace(/(id|Id)/g, 'ID')
                .split(/_/g).map((word) => {
                    return word.charAt(0).toUpperCase() + word.slice(1);
                })
                .join(' ');
        }
        function columnValue(row, column) {
            const rawValue = row[column.key];
            if (column.format) {
                return column.format(rawValue);
            }
            if (column.type) {
                switch (column.type) {
                    case 'bool':
                        // yuck, use truthiness
                        if (rawValue) {
                            return 'True';
                        }
                        return 'False';
                    default:
                        return rawValue;
                }
            }
            return rawValue;
        }
        let columns, classes;
        if (!options) {
            options = {};
        } else if (options.columns) {
            columns = options.columns;
        } else {
            columns = options;
            options = {};
        }
        if (!columns) {
            columns = Object.keys(data).map((columnName) => {
                return {
                    key: columnName
                };
            });
        } else {
            columns = columns.map((column) => {
                if (typeof column === 'string') {
                    return {
                        key: column
                    };
                }
                return column;
            });
        }
        if (options.classes) {
            classes = options.classes;
        } else {
            classes = ['table-striped', 'table-bordered'];
        }

        return table({ class: 'table ' + classes.join(' ') },
            columns.map((column) => {
                return tr([
                    th(columnLabel(column)),
                    td(columnValue(data, column))
                ]);
            }));
    }

    function flatten(html) {
        if (typeof html === 'string') {
            return html;
        }
        if (Array.isArray(html)) {
            return html.map((h) => {
                return flatten(h);
            }).join('');
        }
        throw new Error('Not a valid html representation -- must be string or list');
    }

    function makeList(arg) {
        if (Array.isArray(arg.items)) {
            return ul(arg.items.map((item) => {
                return li(item);
            }));
        }
        return 'Sorry, cannot make a list from that';
    }

    /**
     * Make a bootstrap tabset:
     * arg.tabs.id
     * arg.tabs.label
     * arg.tabs.name
     * arg.tabs.content
     * 
     * @param {type} arg
     * @returns {unresolved}
     */
    function reverse(arr) {
        const newArray = [];
        for (let i = arr.length - 1; i >= 0; i -= 1) {
            newArray.push(arr[i]);
        }
        return newArray;
    }

    function makeTabs(arg) {
        const tabsId = arg.id,
            tabsAttribs = {},
            tabClasses = ['nav', 'nav-tabs'],
            tabStyle = {},
            tabs = arg.tabs.filter((tab) => {
                return (tab ? true : false);
            });

        let activeIndex, tabTabs;

        if (tabsId) {
            tabsAttribs.id = tabsId;
        }
        tabs.forEach((tab) => {
            tab.id = genId();
        });
        if (arg.alignRight) {
            tabTabs = reverse(tabs);
            tabStyle.float = 'right';
            activeIndex = tabs.length - 1;
        } else {
            tabTabs = tabs;
            activeIndex = 0;
        }
        return div(tabsAttribs, [
            ul({ class: tabClasses.join(' '), role: 'tablist' },
                tabTabs.map((tab, index) => {
                    const attribs = {
                        role: 'presentation'
                    };
                    if (index === activeIndex) {
                        attribs.class = 'active';
                    }
                    attribs.style = tabStyle;
                    return li(attribs, a({
                        href: '#' + tab.id,
                        ariaControls: 'home',
                        role: 'tab',
                        dataToggle: 'tab'
                    }, tab.label));
                })),
            div({ class: 'tab-content' },
                tabs.map((tab, index) => {
                    const attribs = {
                        role: 'tabpanel',
                        class: 'tab-pane',
                        id: tab.id
                    };
                    if (tab.name) {
                        attribs['data-name'] = tab.name;
                    }
                    if (index === 0) {
                        attribs.class += ' active';
                    }
                    return div(attribs, tab.content);
                })
            )
        ]);
    }

    return Object.freeze({
        html: jsonToHTML,
        camelToKebab,
        tag,
        makeTable,
        makeTableRotated,
        makeRotatedTable,
        makeObjectTable,
        makeObjTable,
        genId,
        bsPanel,
        panel: bsPanel,
        makePanel,
        loading,
        flatten,
        makeList,
        makeTabs
    });
});