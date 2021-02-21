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
        ul = tag('ul'),
        li = tag('li'),
        a = tag('a');

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

        return Object.entries(attribs)
            .map(([key, value]) => {
                const attribName = camelToKebab(key);
                // The value may itself be an object, which becomes a special string.
                // This applies for "style" and "data-bind", each of which have a 
                // structured string value.
                // Another special case is an array, useful for space-separated
                // attributes, esp. "class".

                // We first ensure that values passed as objects are pre-processed.
                // There are three use cases supported:
                // - setting the value to null (equivalent to false or undefined)
                // - a simple object which defines styles
                // - an array of class names
                const attribValue = (() => {
                    if (typeof value === 'object') {
                        if (value === null) {
                            // null works just like false.
                            return false;
                        }
                        // Special handling of specific attribute types.
                        if (isSimpleObject(value) && attribName === 'style') {
                            return makeStyleAttribs(value);

                        } else if (Array.isArray(value) && attribName === 'class') {
                            return value.join(' ');
                        } else {
                            // other types of objects are not supported.
                            return false;
                        }
                    } else {
                        // Just pass non-objects.
                        return value;
                    }
                })();
                switch (typeof attribValue) {
                    case 'string': {
                        const escapedValue = attribValue.replace(new RegExp('\\' + quoteChar, 'g'), '\\' + quoteChar);
                        return `${attribName}=${quoteChar}${escapedValue}${quoteChar}`;
                    }
                    case 'boolean':
                        return attribValue ? attribName : false;
                    case 'number':
                        return `${attribName}=${quoteChar}${String(attribValue)}${quoteChar}`;
                    case 'undefined':
                        return false;
                }
            })
            .filter((field) => {
                return field;
            })
            .join(' ');
    }

    function renderContent(children) {
        switch (typeof children) {
            case 'string': return children;
            case 'number': return String(children);
            case 'boolean': return '';
            case 'undefined': return '';
            case 'object':
                if (Array.isArray(children)) {
                    return children.map((item) => {
                        return renderContent(item);
                    }).join('');
                } else if (children === null) {
                    return '';
                } else {
                    return '';
                }
        }
    }

    function merge(obj1, obj2) {
        function merger(aObj, bObj) {
            Object.keys(bObj).forEach((key) => {
                if (isSimpleObject(aObj[key]) && isSimpleObject(bObj[key])) {
                    aObj[key] = merger(aObj[key], bObj[key]);
                } else {
                    aObj[key] = bObj[key];
                }
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

            if (isSimpleObject(attribs)) {
                if (options.attribs) {
                    attribs = merge(merge({}, options.attribs), attribs);
                }
            } else {
                children = children || attribs;
                attribs = null;
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
        const prompt = msg ? `${msg} &nbsp;&nbsp;` : '';
        return span([
            prompt,
            i({ class: 'fa fa-spinner fa-pulse fa-2x fa-fw margin-bottom' })
        ]);
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
        for (let index = arr.length - 1; index >= 0; index -= 1) {
            newArray.push(arr[index]);
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
        camelToKebab,
        genId,
        isSimpleObject,
        loading,
        makePanel,
        makeTabs,
        merge,
        tag
    });
});