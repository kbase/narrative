
define([], function () {

    var spec = {
        "info": {
            "id": "NarrativeTest/test_create_set",
            "module_name": "NarrativeTest",
            "git_commit_hash": "d7c1e3be28da8c1d095d3c0742070d77ce1780db",
            "name": "Test Create Set",
            "ver": "0.0.1",
            "subtitle": "Tests creating a set with the Set API.",
            "tooltip": "Tests creating a set with the Set API.",
            "categories": [
                "active"
            ],
            "authors": [
                "wjriehl"
            ],
            "input_types": [
                "KBaseFile.PairedEndLibrary",
                "KBaseFile.SingleEndLibrary"
            ],
            "output_types": [
                "KBaseSets.ReadsSet"
            ],
            "app_type": "editor",
            "namespace": "NarrativeTest"
        },
        "widgets": {
            "input": "reads_set_editor",
            "output": "null"
        },
        "parameters": [
            {
                "id": "name",
                "ui_name": "Output Object name",
                "short_hint": "Gotta be a string.",
                "description": "",
                "field_type": "text",
                "ui_class": "output",
                "default_values": [
                    ""
                ],
                "text_options": {
                    "valid_ws_types": [
                        "KBaseSets.ReadsSet"
                    ],
                    "is_output_name": true,
                    "placeholder": "",
                    "regex_constraint": []
                }
            },
            {
                "id": "description",
                "ui_name": "A String",
                "short_hint": "A description string.",
                "description": "",
                "field_type": "text",
                "allow_multiple": 0,
                "optional": 0,
                "advanced": 0,
                "disabled": 0,
                "ui_class": "parameter",
                "default_values": [
                    "Reads Set Description"
                ],
                "text_options": {
                    "is_output_name": 0,
                    "placeholder": "",
                    "regex_constraint": []
                }
            },
            {
                id: 'items',
                ui_name: 'Reads Set',
                short_hint: 'Group of parameters for each set of reads.',
                description: 'not yet',
                field_type: 'group',
                ui_class: 'group',
                allow_multiple: 1,
                optional: 1,
                group_options: {
                    border: 1
                },
                parameters: [
                    {
                        "id": "label",
                        "ui_name": "Reads Object label.",
                        "short_hint": "Reads Object label string.",
                        "description": "",
                        "field_type": "text",
                        "allow_multiple": 0,
                        "optional": 1,
                        "advanced": 0,
                        "disabled": 0,
                        "ui_class": "parameter",
                        "default_values": [
                            ""
                        ]
                    },
                    {
                        "id": "ref",
                        "ui_name": "Reads data object",
                        "short_hint": "Should be of type KBaseFile.SingleEndLibrary or KBaseFile.PairedEndLibrary",
                        "description": "",
                        "field_type": "text",
                        "allow_multiple": 0,
                        "optional": 1,
                        "advanced": 0,
                        "disabled": 0,
                        "ui_class": "input",
                        "default_values": [
                            ""
                        ],
                        "text_options": {
                            "valid_ws_types": [
                                "KBaseFile.SingleEndLibrary",
                                "KBaseFile.PairedEndLibrary"
                            ],
                            "is_output_name": 0,
                            "placeholder": "",
                            "regex_constraint": []
                        }
                    },
                    {
                        "id": "metadata",
                        "ui_name": "Reads Metadata mapping.",
                        "short_hint": "Should be string-to-string key-value pairs.",
                        "description": "",
                        "field_type": "mapping",
                        "allow_multiple": 0,
                        "optional": 1,
                        "advanced": 0,
                        "disabled": 0,
                        "ui_class": "parameter",
                        "default_values": [
                            ""
                        ]
                    }
                ]
            }
        ],
        "fixed_parameters": [],
        "behavior": {
            "kb_service_url": "",
            "kb_service_name": "SetAPI",
            "kb_service_version": "d7c1e3be28da8c1d095d3c0742070d77ce1780db",
            "kb_service_method": "save_reads_set_v1",
            "kb_service_input_mapping": [
                {
                    "input_parameter": "reads_tuple",
                    "target_argument_position": 0,
                    "target_property": "data/items"
                },
                {
                    "input_parameter": "description",
                    "target_argument_position": 0,
                    "target_property": "data/description"
                },
                {
                    "narrative_system_variable": "workspace",
                    "target_argument_position": 0,
                    "target_property": "workspace"
                },
                {
                    "input_parameter": "output_object",
                    "target_argument_position": 0,
                    "target_property": "output_object_name"
                }
            ],
            "kb_service_output_mapping": [
                {
                    "service_method_output_path": [
                        "0",
                        "report_name"
                    ],
                    "target_property": "report_name"
                },
                {
                    "service_method_output_path": [
                        "0",
                        "report_ref"
                    ],
                    "target_property": "report_ref"
                },
                {
                    "service_method_output_path": [
                        "0",
                        "value"
                    ],
                    "target_property": "out_value"
                }
            ]
        },
        "job_id_output_field": "docker"
    };

    return spec;

});