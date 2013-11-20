#!/bin/sh
function announce() {
	printf "\n>>>   $1   <<<\n\n"
}
function abort() {
	announce "Failed!"
	exit 1
}
pyver=$(python --version 2>&1 | awk '{split($2, a, "."); print a[1] "." a[2]}')
pipver=$(pip --version | awk '{print substr($6, 1, length($6)-1)}')
if [ "$pyver" != "$pipver" ]; then
	printf "Error: Version mismatch, python=$pyver pip=$pipver\n"
else
	announce "Install dependencies"
	pip install -r requirements.txt || abort
	announce "Run setup.py"
	python setup.py install || abort
fi
announce "Success"
exit 0
