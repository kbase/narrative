#!/usr/bin/env bash

installPath=`pwd`
venv="narrative-venv"
commit="" 

while getopts "p:v:c:" opt; do

    case $opt in
        p)
            echo "Using $OPTARG as the base directory for installation..."
            installPath="$OPTARG"
            ;;
        v)
            venv="$OPTARG"
            echo "Virtual environment will be created under $OPTARG..."
            ;;
        c)
            commit="$OPTARG"
            echo "Using commit $OPTARG..."
            ;;
        \?)
            echo "Unrecognized option: -$OPTARG"
            exit 1
            ;;
        :)
            echo "-$OPTARG requires an argument."
            exit 1
            ;;
    esac
    
done

# Clear options
shift $(( OPTIND -1 ))

if [ -z "$1" ]; then
    echo "usage: $0 [-p root_install_path] [-v environment_name] [-c git_commit_id]"
fi

echo "Creating virtual environment..."
virtualenv $installPath/$venv

echo "Pulling ipython master from github..."
git clone https://github.com/ipython/ipython.git

# Move into the ipython git directory to run the install
cd ipython

if [ -n "$commit" ]; then
    echo "Pulling commit $commit..."
    echo "git checkout $commit"
    git checkout $commit
fi

echo "Installing ipython into the virtual environment..."
echo "$installPath/$venv/bin/pip install .[$venv]"

source $installPath/$venv/bin/activate
#$installPath/$venv/bin/pip install -e .[$venv]
python setup.py install
cd ..

echo "Creating start script for ipython notebook..."

# incomplete

echo "Cleaning up after install.sh script..."
rm -rf ipython

echo "Done."
