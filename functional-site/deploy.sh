
#!/bin/bash
#
# This is a simple script to copy all neccessary files for the 'landing page' app
# from a ui-common.git repo to a specified directory .
#
# Example usage: 
#	bash deploy ~/object-viewer/
#
#

if [ $# -eq 0 ]
  then
    printf "*****Please give the path to the deployment directory\n\n"
    exit
fi

mkdir $1

printf "\nCopying landing page app from ui-common/landing-pages/ to: $1/objects/ \n\n"

mkdir "$1/objects"
cp -r ./* "$1/objects/"


printf "Copying external libraries from ui-common/ext/ to: $1/ext \n\n"
mkdir "$1/ext"
cp -r ../ext "$1"

printf "Copying widgets from ui-common/src/ to: $1/src \n\n"
mkdir "$1/src"
cp -r ../src "$1"

printf "\ndone.\n\n"