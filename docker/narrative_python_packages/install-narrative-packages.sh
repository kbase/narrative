#!/bin/sh

target=/kb/runtime

if [ $# -gt 0 ] ; then
	target=$1
	shift
fi

if [ -x $target/bin/pip ] ; then
	pip="$target/bin/pip"
else
	pip="pip"
fi

for P in `cat ./python-pip-list-narrative`; do
	echo "$pip installing $P"
	$pip install $P --upgrade
done

for P in `cat ./python-easy-list-narrative`; do
	echo "easy_installing $P"
	easy_install $P
done

#chmod a+x install-nexus.sh
#./install-nexus.sh $target
