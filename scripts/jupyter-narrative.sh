export NARRATIVE_DIR=/Users/wjriehl/Projects/kbase/narrative-fork
export JUPYTER_CONFIG_DIR=$NARRATIVE_DIR/kbase-profile

cp $NARRATIVE_DIR/src/config.json $JUPYTER_CONFIG_DIR/static/kbase/

jupyter notebook