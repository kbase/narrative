
   This is the new IPython based Narrative Interface repo.
   The previous version has been branched into the pre-sprint branch for archival purposes.
   All relevant code has been migrated under the src/ directory. A virtualenv based installer
and standard KBase makefile targets are in the works.

   You can run the notebook within this repo by

cd src
./ipython.sh

   This will set the PYTHONPATH to include the src directory, where the biokbase.* modules reside,
as well as setting the IPYTHONPATH to include the directory containing a KBase narrative profile
that loads a kbase specific environment

   sychan 6/27/2013