define([
    'react',
    'prop-types',
    'widgets/function_output/KBaseSets/SetElementLoader',

    // For effect
    'bootstrap',
    'css!./SetViewer.css'
], (
    React,
    PropTypes,
    SetElement
) => {
    'use strict';

    const { createElement: e, Component } = React;

    /**
     * A class implementing the base behavior for a browser for any set type
     * in the KBaseSets type module.
     * 
     */

    class SetViewer extends Component {
        constructor(props) {
            super(props);
            this.state = {
                // NB assumes always have items.
                selectedItem: this.props.items[0]
            };

        }

        /**
         * Renders a set element as a rotated table of summary properties.
         * Must be implemented by a subclass.
         * @abstract
         * @returns {void} nothing useful
         */
        renderSetElement() {
            return e(SetElement, {
                setType: this.props.setType,
                item: this.state.selectedItem
            });
        }

        selectItem(event) {
            const selectControl = event.target;
            this.setState((state) => {
                return {
                    ...state,
                    selectedItem: this.props.items[parseInt(selectControl.value)]
                };
            });
        }

        renderItemType() {
            // Note that the type is set when the set is first loaded, and will be
            // null if there are no set items. The type is derived from the object
            // referred to by a set item.
            if (this.props.elementType === null) {
                return e('i', null, 'n/a');
            } else {
                return e('a', {
                    href: `/#spec/type/${this.props.elementType}`,
                    target: '_blank'
                }, this.props.elementType);
            }
        }

        renderSelector() {
            return [
                e('div', {
                    className: 'Col',
                }, 'Select alignment to view:'),
                e('div', {
                    className: 'form-inline Col',
                }, e('div', { className: 'form-group' }, e('select', {
                    onChange: this.selectItem.bind(this),
                    className: 'form-control'
                }, this.props.items.map(({ label, ref, objectInfo }, index) => {
                    if (label) {
                        return e('option', { value: String(index), key: ref }, objectInfo.name, ' (', label, ')');
                    } else {
                        return e('option', { value: String(index), key: ref }, objectInfo.name);
                    }
                }))
                ))
            ];
        }

        renderHeader() {
            return e('div', {
                className: 'HeaderTable',
            }, ...[
                e('div', {
                    className: 'Row',
                }, ...[
                    e('div', {
                        className: 'Col',
                    }, 'Description:'),
                    e('div', {
                        className: 'Col',
                    }, this.props.description)
                ]),
                e('div', {
                    className: 'Row',
                }, ...[
                    e('div', {
                        className: 'Col',
                    }, 'Alignment type:'),
                    e('div', {
                        className: 'Col',
                    }, this.renderItemType())
                ]),
                e('div', {
                    className: 'Row',
                }, ...this.renderSelector()),
            ]);
        }

        renderNoItems() {
            return e('div', null, 'Sorry, no items');
        }
        render() {
            return e('div', {
                className: 'KBaseSets'
            }, ...[
                this.renderHeader(),
                this.renderSetElement()
            ]);
        }
    }

    SetViewer.propTypes = {
        description: PropTypes.string.isRequired,
        setType: PropTypes.string.isRequired,
        elementType: PropTypes.string.isRequired,
        items: PropTypes.arrayOf(PropTypes.shape({
            label: PropTypes.string,
            ref: PropTypes.string,
            info: PropTypes.array,
            objectInfo: PropTypes.object
        }))
    };

    return SetViewer;
});
