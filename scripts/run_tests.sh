#!/bin/bash

JUPYTER_PORT=32323
IP_ADDRESS="127.0.0.1"
OUTPUT_FILE=/tmp/output
run_unit=0
run_integration=0
run_docker=0
CONTAINER=

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

# check whether the IP address and port are already in use
if ( nc -zv $IP_ADDRESS $JUPYTER_PORT 2>&1 >/dev/null ); then
    echo "The address ${IP_ADDRESS}:${JUPYTER_PORT} is already in use; please kill the existing notebook server to run tests."
    exit 127
fi

if [ "$run_docker" == 1 ]; then
    echo "starting narrative container ${CONTAINER}"
    rm -f $OUTPUT_FILE
    touch $OUTPUT_FILE
    docker run -p $JUPYTER_PORT:$JUPYTER_PORT $CONTAINER \
        --template \
        "/kb/dev_container/narrative/src/config.json.templ:/kb/dev_container/narrative/src/config.json" \
        --template \
        "/kb/dev_container/narrative/src/config.json.templ:/kb/dev_container/narrative/kbase-extension/static/kbase/config/config.json" \
        kbase-narrative --no-browser --port=$JUPYTER_PORT 2>&1 | tee $OUTPUT_FILE &
    bg_pid=$(jobs -p)
else
    echo "starting local narrative"
    rm -f $OUTPUT_FILE
    touch $OUTPUT_FILE
    kbase-narrative --no-browser --ServerApp.allow_origin="*" --ip=$IP_ADDRESS --port=$JUPYTER_PORT 2>&1 | tee $OUTPUT_FILE &
    bg_pid=$(jobs -p)
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
    if grep -q "Jupyter Notebook.*is running at:" $OUTPUT_FILE; then
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
    export BASE_URL=$base_url
    npx wdio test/integration/wdio.conf.js
    integration=$?
fi

echo "Finished running tests"

declare -a names=("isolated" "unit" "integration")
declare -a results=($isolated $unit $integration)
length=${#results[@]}

for (( i=0; i < ${length}; i++ ))
do
    if [ "${results[$i]}" != -1 ]; then
        echo "${names[$i]} tests completed with code ${results[$i]}"
        exit_code=$(( exit_code + results[$i] ))
    fi
done

echo "Killing server"
pkill -P "$bg_pid"

exit $exit_code
