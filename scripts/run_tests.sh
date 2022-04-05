#!/bin/bash

JUPYTER_PORT=32323
IP_ADDRESS="127.0.0.1"
OUTPUT_FILE=/tmp/output
run_unit=0
run_integration=0
run_docker=0
CONTAINER=

kill_descendant_processes() {
    local pid="$1"
    local and_self="${2:-false}"
    if children="$(pgrep -P "$pid")"; then
        for child in $children; do
            kill_descendant_processes "$child" true
        done
    fi
    if [[ "$and_self" == true ]]; then
        kill -9 "$pid"
    fi
}

while getopts 'iuc:h' opt;
do
    case "$opt" in
        c) run_docker=1
        IP_ADDRESS="0.0.0.0"
        CONTAINER=${OPTARG}
        ;;

        i) run_integration=1 ;;

        u) run_unit=1 ;;

        ?|h)
        echo "Usage: $(basename $0) [-i] [-u] [-c container_name]"
        echo "-i : run integration tests"
        echo "-u : run unit tests"
        echo "-c container_name: run tests against the specified docker container "
        exit 1
        ;;
    esac
done

if [ "$run_docker" == 1 ]; then
    echo "starting narrative container ${CONTAINER}"
    rm -f $OUTPUT_FILE
    touch $OUTPUT_FILE
    docker run -p $JUPYTER_PORT:$JUPYTER_PORT $CONTAINER \
        --template \
        "/kb/dev_container/narrative/src/config.json.templ:/kb/dev_container/narrative/src/config.json" \
        --template \
        "/kb/dev_container/narrative/src/config.json.templ:/kb/dev_container/narrative/kbase-extension/static/kbase/config/config.json" \
        kbase-narrative --no-browser --NotebookApp.allow_origin="*" --ip=$IP_ADDRESS --port=$JUPYTER_PORT 2>&1 | tee $OUTPUT_FILE &
    bg_pid=$!
else
    echo "starting local narrative"
    rm -f $OUTPUT_FILE
    touch $OUTPUT_FILE
    kbase-narrative --no-browser --NotebookApp.allow_origin="*" --ip=$IP_ADDRESS --port=$JUPYTER_PORT 2>&1 | tee $OUTPUT_FILE &
    bg_pid=$!
fi

while :; do
    if grep -q "is already in use" $OUTPUT_FILE; then
        echo "The port ${JUPYTER_PORT} is already in use; please kill the existing notebook server to run tests."
        kill $bg_pid
        exit 127
    fi
    if grep -q "port is already allocated" $OUTPUT_FILE; then
        echo "The port ${JUPYTER_PORT} is already in use; please kill the existing notebook server to run tests."
        kill $bg_pid
        exit 127
    fi
    if grep -q "The Jupyter Notebook is running at:" $OUTPUT_FILE; then
        # exit the loop once the string has been found
        echo "narrative started"
        break;
    fi
    sleep 1
done

echo "starting tests"

isolated=-1
unit=-1
integration=-1

if [ "${run_unit}" == 1 ]; then
    echo "running isolated unit tests"
    npm run test_isolated
    isolated=$?

    echo "running main unit tests"
    npm run test
    unit=$?
fi

if [ "${run_integration}" == 1 ]; then
    base_url=${BASE_URL:-"http://localhost:$JUPYTER_PORT"}
    export BASE_URL=$BASE_URL
    npx wdio test/integration/wdio.conf.js
    integration=$?
fi

echo "Finished running tests"
echo "Killing server"

declare -a names=("isolated" "unit" "integration")
declare -a results=($isolated $unit $integration)

length=${#results[@]}

# report results
RESULTS_FILE=test_results.yml
rm -f $RESULTS_FILE
touch $RESULTS_FILE
echo "results:" >> $RESULTS_FILE

for (( i=0; i < ${length}; i++ ))
do
    if [ "${results[$i]}" != -1 ]; then
        echo "${names[$i]} tests completed with code ${results[$i]}"
        exit_code=$(( exit_code + results[$i] ))
    fi
    echo "  - ${names[$i]}: ${results[$i]}" >> $RESULTS_FILE
done

kill_descendant_processes $bg_pid true

exit $exit_code
