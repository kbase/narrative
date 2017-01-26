# Just a simple script to save some typing...
# copy this to your working directory, then issue
# ./build-from-pr.sh XXX
# where XXX is your pull request number
echo "PR is "
echo ${1}

git clone https://github.com/kbase/narrative
cd narrative
git fetch origin pull/${1}/head:test-${1}
git checkout test-${1}
virtualenv venvs/v
source venvs/v/bin/activate
./scripts/install_narrative.sh
kbase-narrative