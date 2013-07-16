
   This is the new IPython based Narrative Interface repo.
   The previous version has been branched into the pre-sprint branch for archival purposes.
   All relevant code has been migrated under the src/ directory. A virtualenv based installer
and standard KBase makefile targets are in the works.

   You can run the notebook within this repo by

cd src
./ipython.sh

   This will set the PYTHONPATH to include the src directory, where the biokbase.* modules reside.
   Once within ipython, you can use "import biokbase.narrative" to bring in the modifications to
support the narrative.

   sychan 6/27/2013