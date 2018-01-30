define([], function() {
    return {
        parameters: {
            layout: ['name', 'description', 'items'],
            specs: {
                name: {
                    id: 'name',

                    multipleItems: false,

                    ui: {
                        label: 'Reads Set Name',
                        description: 'Name of the reads set',
                        hint: 'The name of the set of sequence reads',
                        class: 'parameter',
                        control: null
                    },
                    data: {
                        type: 'string',
                        constraints: {
                            required: true,
                            rule: 'WorkspaceObjectName' // ws data_type
                        },
                        defaultValue: '',
                        nullValue: ''
                    }
                },
                description: {
                    id: 'description',
                    multipleItems: false,
                    ui: {
                        label: 'Description',
                        description: 'Description of the Reads Set',
                        hint: 'The description of the set of sequence reads',
                        class: 'parameter',
                        control: 'textarea',
                        rows: 5
                    },
                    data: {
                        type: 'string',
                        constraints: {
                            required: false,
                            multiLine: true
                        },
                        defaultValue: '',
                        nullValue: null
                    }
                },
                items: {
                    id: 'items',
                    ui: {
                        label: 'Items',
                        description: 'A set of Reads Objects',
                        hint: 'A set of Reads Objects',
                        class: 'parameter',
                        control: '',
                        layout: ['item']
                    },
                    data: {
                        type: 'sequence',
                        constraints: {
                            required: false
                        },
                        defaultValue: [],
                        nullValue: null
                    },
                    parameters: {
                        layout: ['item'],
                        specs: {
                            item: {
                                id: 'item',
                                multipleItems: false,
                                ui: {
                                    label: 'Item',
                                    description: 'A set of Reads Objects',
                                    hint: 'A set of Reads Objects',
                                    class: 'parameter',
                                    control: '',
                                    layout: ['ref', 'label']
                                },
                                data: {
                                    type: 'struct',
                                    constraints: {
                                        required: true
                                    },
                                    defaultValue: {
                                        ref: null,
                                        label: null
                                    },
                                    nullValue: null,
                                    zeroValue: {
                                        ref: null,
                                        label: null
                                    }
                                },
                                parameters: {
                                    layout: ['ref', 'label'],
                                    specs: {
                                        ref: {
                                            id: 'ref',

                                            multipleItems: false,

                                            ui: {
                                                label: 'Reads Object',
                                                description: 'This is param 1',
                                                hint: 'Hint 1',
                                                class: 'parameter'
                                            },
                                            data: {
                                                type: 'workspaceObjectRef',
                                                constraints: {
                                                    required: true,
                                                    types: ['KBaseFile.PairedEndLibrary', 'KBaseFile.SingleEndLibrary']
                                                },
                                                defaultValue: null,
                                                nullValue: null
                                            }
                                        },
                                        label: {
                                            id: 'label',

                                            multipleItems: false,

                                            ui: {
                                                label: 'Label',
                                                description: 'This is param 2',
                                                hint: 'Hint 2',
                                                class: 'parameter'
                                            },
                                            data: {
                                                type: 'string',
                                                constraints: {
                                                    required: true
                                                },
                                                defaultValue: null,
                                                nullValue: null
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    };

});