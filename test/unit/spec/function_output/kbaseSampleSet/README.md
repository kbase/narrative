# README for kbaseSampleSet unit tests

Test data was gathered through an external script (ref) from real CI data sources, and copied into the `data/files` directory. This created a set of files organized by sample set (`sampleSet1`, `sampleSet2`).

The script `scripts/compile-json.js` was used to create a single JSON file `data/index.json`. It is an object wrapping each json file, in which the path to the json data is the path to the file. E.g. `sampleSet1/sample_ID_VER.json`.

```bash
node scripts/compile-json.js --source=test/unit/spec/function_output/kbaseSampleSet/data/files --dest=test/unit/spec/function_output/kbaseSampleSet/data/index.json
```

The MSW mocking setup for Workspace and SampleService accesses this data knowing the path into the `index.json` object.