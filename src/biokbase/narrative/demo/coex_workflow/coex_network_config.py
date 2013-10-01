"""
Configuration 'files' for coex_network.py
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '9/25/13'

_config = {
    "urls": {
        "main": "http://140.221.84.236:8000/node",
        "shock": "http://140.221.84.236:8000",
        "awe": "http://140.221.84.236:8001/"
    },
    "files": {
        "expression": "",
        "sample_id": "",
        "annotation": ""
    },
    "files_desc": {
        "expression": "Expression data",
        "sample_id": "Sample file",
        "annotation": "Annotation file"
    },
    "args": {
        "coex_filter": "-m anova -p 0.05 -u n -r y -d y",
        "coex_net": "-m simple -t edge -c 0.75 -r 0.8 -k 40 -p 50",
        "coex_cluster2": "-s 20 -c hclust -n simple -r 0.8 -k 40 -p 50 -d 0.99"
    }
}

_awe_job = {
    "info": {
        "pipeline": "coex-example",
        "name": "testcoex",
        "project": "default",
        "user": "default",
        "clientgroups": "",
        "sessionId": "$session_id"
    },
    "tasks": [
       {
           "cmd": {
               "args": "-i @data_csv --output=data_filtered_csv  --sample_index=@sample_id_csv  $coex_filter",
               "description": "filtering",
               "name": "coex_filter"
           },
           "dependsOn": [],
           "inputs": {
               "data_csv": {
                   "host": "$shock_uri",
                   "node": "$expression"
               },
               "sample_id_csv": {
                   "host": "$shock_uri",
                   "node": "$sample_id"
               }
           },
           "outputs": {
               "data_filtered_csv": {
                   "host": "$shock_uri"
               }
           },
           "taskid": "0",
           "skip": 0,
           "totalwork": 1
       },
       {
           "cmd": {
               "args": "-i @data_filtered_csv -o net_edge_csv -m simple -t edge $coex_net",
               "description": "coex network",
               "name": "coex_net"
           },
           "dependsOn": ["0"],
           "inputs": {
               "data_filtered_csv": {
                   "host": "$shock_uri",
                   "origin": "0"
               }
           },
           "outputs": {
               "net_edge_csv": {
                   "host": "$shock_uri"
               }
           },
           "taskid": "1",
           "skip": 0,
           "totalwork": 1
       },
       {
           "cmd": {
               "args": "-i @data_filtered_csv -o module_csv  -c hclust -n simple $coex_cluster2",
               "description": "clustering",
               "name": "coex_cluster2"
           },
           "dependsOn": ["1"],
           "inputs": {
               "data_filtered_csv": {
                   "host": "$shock_uri",
                   "origin": "0"
               }
           },
           "outputs": {
               "hclust_tree_method=hclust.txt": {
                   "host": "$shock_uri"
               },
               "module_network_edgelist_method=hclust.csv": {
                   "host": "$shock_uri"
               },
               "module_csv": {
                   "host": "$shock_uri"
               }
           },
           "taskid": "2",
           "skip": 0,
           "totalwork": 1
       },
       {
           "cmd": {
               "args": "-m @module_csv -e @net_edge_csv -a @annotation_csv -o merged_list_json -u $shock_uri/node -s $session_id",
               "description": "clustering",
               "name": "merge_csv"
           },
           "dependsOn": ["2"],
           "inputs": {
               "module_csv": {
                   "host": "$shock_uri",
                   "origin": "2"
               },
               "net_edge_csv": {
                   "host": "$shock_uri",
                   "origin": "1"
               },
               "annotation_csv": {
                   "host": "$shock_uri",
                   "node": "$annotation"
               }
           },
           "outputs": {
               "merged_list_json": {
                   "host": "$shock_uri"
               }
           },
           "taskid": "3",
           "skip": 0,
           "totalwork": 1
       }
    ]
}

# exported
CONFIG = {'config': _config, 'awe_job': _awe_job}

