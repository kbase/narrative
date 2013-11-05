#!/bin/sh
printf "\nXXXXX THIS DOES NOT WORK YET XXXXX\n\n"
function announce() {
	printf "+----------------------------+\n"
	printf "  $1\n"
	printf "+----------------------------+\n"
}
function abort() {
	printf "\nABORT\n\n"
	exit 42
}
pyver=$(python --version 2>&1 | awk '{split($2, a, "."); print a[1] "." a[2]}')
pipver=$(pip --version | awk '{print substr($6, 1, length($6)-1)}')
if [ "$pyver" != "$pipver" ]; then
	printf "Error: Version mismatch, python=$pyver pip=$pipver\n"
else
	announce "Install dependencies"
	pip install -r requirements.txt || abort
	announce "Run setup.py"
	python setup.py || abort
fi
