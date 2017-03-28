export NARRATIVE_DIR=$(pwd)
python -m nose --with-coverage --cover-html --cover-package=biokbase.narrative src/biokbase/narrative/tests/
# python -m nose src/biokbase/narrative/tests/
