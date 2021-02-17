define([
    'common/props'
], (Props) => {
    'use strict';

    describe('Props core functions', () => {
        it('Is alive', () => {
            let alive;
            if (Props) {
                alive = true;
            } else {
                alive = false;
            }
            expect(alive).toBeTruthy();
        });
        it('Set and get a simple string property', () => {
            const props = Props.make();
            props.setItem('color', 'green');
            expect(props.getItem('color')).toEqual('green');
        });
        it('Set and reset a simple string property', () => {
            const props = Props.make();
            props.setItem('color', 'green');
            expect(props.getItem('color')).toEqual('green');
            props.reset();
            expect(props.getItem('color')).toBeUndefined();
        });
        it('Set and get a simple number property', () => {
            const props = Props.make();
            props.setItem('themeaningoflife', 42);
            expect(props.getItem('themeaningoflife')).toEqual(42);
        });
        it('Set and get a simple boolean property', () => {
            const props = Props.make();
            props.setItem('buggy', true);
            expect(props.getItem('buggy')).toEqual(true);
        });

        it('Set and get a simple object property', () => {
            const props = Props.make();
            props.setItem('pet', {type: 'dog', name: 'peet'});
            expect(props.getItem('pet')).toEqual({type: 'dog', name: 'peet'});
        });
        it('Set two object propertyes', () => {
            const props = Props.make();
            props.setItem(['pet', 'coco'], 'yellow');
            props.setItem(['pet', 'peet'], 'black');
            expect(props.getItem('pet.coco')).toEqual('yellow');
            expect(props.getItem('pet.peet')).toEqual('black');
        });

        it('Push a value onto a property', () => {
            const props = Props.make();
            props.setItem('array.prop', []);
            props.pushItem('array.prop', 123);
            expect(props.getItem('array.prop')).toEqual([123]);
            expect(props.popItem('array.prop')).toEqual(123);
            expect(props.getItem('array.prop')).toEqual([]);
        });

        it('Push a value onto an empty', () => {
            const props = Props.make();
            props.pushItem('array.prop', 123);
            expect(props.getItem('array.prop')).toEqual([123]);
            expect(props.popItem('array.prop')).toEqual(123);
            expect(props.getItem('array.prop')).toEqual([]);
        });


        it('History should be undefined', () => {
            const props = Props.make();
            expect(props.getHistoryCount()).toBeUndefined;
        });
//        it('History should be 1 after one change', function() {
//            var props = Props.make();
//            props.setItem('color', 'red');
//            expect(props.getHistoryCount()).toEqual(1);
//        });

        it('Update callback should be called', (done) => {
            const props = Props.make({
                onUpdate: function () {
                    expect(true).toEqual(true);
                    done();
                }
            });
            props.setItem('color', 'red');

        });

        it('History should be 1 after one change', (done) => {
            const props = Props.make({
                onUpdate: function (_props) {
                    // if (_props.getHistoryCount() === 1) {
                        expect(_props.getHistoryCount()).toEqual(1);
                        done();
                    // }
                }
            });
            props.setItem('color', 'red');

        });
        it('Set and get a simple string property, check last value', (done) => {
            const props = Props.make({
                onUpdate: function (_props) {
                    if (_props.getHistoryCount() === 1) {
                        _props.setItem('color', 'green');
                        return;
                    }
                    const last = _props.getLastRawObject();

                    expect(last.color).toEqual('red');
                    done();
                }
            });
            props.setItem('color', 'red');
        });

        it('Copy a property -- it is unaffected by changes to the original', () => {
            const props = Props.make({
                data: {
                    prop1: {
                        propA: 42
                    }
                }
            }),
                propCopy = props.copyItem('prop1');

            props.setItem('prop1.propA', 53);

            expect(propCopy.propA).toEqual(42);
            expect(props.getItem('prop1.propA')).toEqual(53);
        });
        it('Set and get a simple string property using data methods', () => {
            const data = {};
            Props.setDataItem(data, 'color', 'green');
            expect(Props.getDataItem(data, 'color')).toEqual('green');
        });
    });

});
