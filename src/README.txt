***Dependencies***

   There are some dependencies for the modules in this directory.
   Please make sure they are in your environment before trying to run the notebooks.

   IPython Notebook (KBNB) dependencies
      They are all spelled out here: http://ipython.org/ipython-doc/dev/install/install.html

      For the impatient, here's a summary:
         Python 2.6+
         readline
         nose
         pexpect
         ZeroMQ libraries
         pyzmq
         Qt libraries
         PyQt
         pygments
         Tornado
         MathJax

      These are taken care of in the KBase bootstrap as of 6/27/2013 for KBase images,
      but if you are running the notebook outside of a KBase, or using a KBase image V22
      or older, you will have to handle the installation manually.


   MG-RAST_Retina
      Retina/STM are packages to support a widget framework that Folker's group has developed

   MG-RAST_ipy-mkmq
      So far this module seems to have an external dependency on R and the MatR R library.
      The instructions indicate that it can be downloaded and installed using the following
      R code snippet:
         > install.packages("matR", repo="http://dunkirk.mcs.anl.gov/~braithwaite/R", type="source")
         > library(matR)
         > dependencies()

      Please see: https://github.com/MG-RAST/matR


***Contents***

   Here is an explanation of the files found in this directory:

   MG-RAST_ipy-mkmq - glue code to connect Retina and R stuff into IPython
   MG-RAST_Retina   - viz libraries from Folker's group
   biokbase/        - root of kbase python libraries to support the notebook
   notebook/        - contains all ipython specific styling, customizations, etc
      ipython.sh        - helper script that runs ipython with narrative stuff loaded
      ipython_profiles/ - the equivalent of ~/.ipython for storing configs, used with ipython.sh script for configuration
          extensions/   - directory for ipython extensions (the type used with %load_ext)
      usercustomize.py  - Ugly hack needed to deal with PYTHONPATH being munged when the kbase notebook forks a 
                          process. See http://python.6.x6.nabble.com/Weird-PYTHONPATH-etc-issue-td4989274.html

      # the following directories may need some cleanup and consolidation, they include support libraries and other content

      css
      img
      js/
         jquery
