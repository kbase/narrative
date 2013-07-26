#!/usr/bin/env bash

installPath=`pwd`
venv="narrative-venv"
commit="" 

while :
do
    case $1 in
        -h | --help | -\?)
            printf "usage: $0 [{-p | --install_path} root_install_path] [{-v | --virtual_env} environment_name] [{-c | commit_id} git_commit_id]\n"        
            exit 0
            ;;
        -p | --install_path)
            printf "Using $2 as the base directory for installation...\n"
            installPath=$2
            shift 2
            ;;
        -v | --virtualenv)
            printf "Virtual environment will be created under $2...\n"
            venv=$2
            shift 2
            ;;
        -c | --commit_id)
            printf "Using commit $2...\n"
            commit=$2
            shift 2
            ;;
        -*|--*) # Unrecognized option
            printf "WARN: Unknown option (ignored): $1\n" >&2
            shift
            ;;
        *)  # no more options. Stop while loop
            break
            ;;
    esac
done


dependency_commands="python virtualenv git"

for dcommand in $dependency_commands; do
  if ! hash "$dcommand" >/dev/null 2>&1; then
    printf "Command not found in PATH: %s\n" "$dcommand\n" >&2
    exit 1
  fi
done


printf "Creating virtual environment $venv...\n"
virtualenv $installPath/$venv

printf "Pulling ipython master from github...\n"
git clone https://github.com/ipython/ipython.git

# Move into the ipython git directory to run the install
cd ipython

if [ -n "$commit" ]; then
    printf "Pulling commit $commit...\n"
    git checkout $commit
fi

printf "Installing ipython into the virtual environment $venv...\n"
source $installPath/$venv/bin/activate
python setup.py install
cd ..

#printf "Creating start script for ipython notebook...\n"

# incomplete

printf "Cleaning up after install.sh script...\n"
rm -rf ipython

printf "Done.\n"
