# Introduction

This document describes the Python code in the KBase narrative repo.

# Package biokbase

The subdirectory, biokbase/, is a Python package.

## Description

This Python package contains all the KBase Python libraries to support the Python narrative UI, which is built on the IPython notebook.

## Dependencies

See ``requirements.txt``.

IPython Notebook (KBNB) dependencies are here: http://ipython.org/ipython-doc/dev/install/install.html

## Install

Installation uses setup.py and pip. If you don't have 'pip' installed, do that first. See http://www.pip-installer.org/en/latest/installing.html 

Then run the install script:

    ./install.sh

## Running

A script to run the notebook, `run_notebook.sh`, is placed in your path from install.sh in the parent directory so you can run it like this:

    run_notebook.sh notebook

# Other packages

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