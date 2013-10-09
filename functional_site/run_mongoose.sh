#!/bin/bash

www_root=`dirname $0`
mongoose=""
if [ $# -gt 0 ]; then
    mongoose="$1"
    shift
fi

# You MUST set to your mongoose path
# mac osx
#mongoose=/Applications/Mongoose.app/Contents/MacOS/Mongoose

# test for path
if [ "x$mongoose" = "x" ]; then
    echo "please edit the script or give an argument for the location of mongoose"
    exit 1
fi

opts="-document_root $www_root -listening_ports 8888"

printf "running mongoose with options: $opts \n"
$mongoose $opts
printf "exiting mongoose\n"
