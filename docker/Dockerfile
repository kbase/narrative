# Dockerfile that builds a minimal container for IPython + narrative
#
# Assumes that we have clones of the boostrap repo (for bringing in the python
# environment) and a narrative repo in this directory
# Steve Chan sychan@lbl.gov
#
# Copyright 2013 The Regents of the University of California,
#                Lawrence Berkeley National Laboratory
#                United States Department of Energy
#          	 The DOE Systems Biology Knowledgebase (KBase)
# Made available under the KBase Open Source License
#

FROM ubuntu:latest
MAINTAINER Steve Chan sychan@lbl.gov

EXPOSE 8888
ADD ./sources.list /etc/apt/sources.list
ADD ./r-packages.R /root/r-packages.R

# Create a deployment directory
RUN mkdir -p /kb/deployment/services/narrative /tmp/narrative

# Add the R CRAN repo - add this back in when the 3.1-beta issue is resolved
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys E084DAB9
RUN echo 'deb http://cran.r-project.org/bin/linux/ubuntu precise/' | tee /etc/apt/sources.list.d/cran.list

RUN DEBIAN_FRONTEND=noninteractive apt-get update

RUN DEBIAN_FRONTEND=noninteractive apt-get install -y r-recommended libglu1-mesa-dev

# There are a bunch of packages that are related to kernel operation
# which we can't upgrade within a container. Mark them for "hold" before
# running the upgrade
RUN DEBIAN_FRONTEND=noninteractive apt-mark hold udev initscripts plymouth initramfs-tools procps busybox-initramfs
RUN DEBIAN_FRONTEND=noninteractive apt-get -f upgrade -y

# Install the stuff we actually need
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y perl-base perl-modules make

# Maybe this will get all the necessary dependencies!
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y python-qt4 python-vitualenv python-pip python-setuptools ipython-notebook python-matplotlib python-dev python-scipy python-numpy python-lxml python-sklearn python-sympy python-pandas python-rpy2
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y libfreetype6-dev libcairo2-dev texlive-latex-base texlive-fonts-recommended curl libcurl4-gnutls-dev git-core libzmq-dev libreadline6-dev libreadline-dev libssl-dev libxml2-dev libxslt1-dev

# install R packages that seem to be handy
RUN R --vanilla < /root/r-packages.R

# Clone in the python bootstrap and run it
ADD ./bootstrap/kb_python_runtime /mini-bootstrap/kb_python_runtime
RUN cd /mini-bootstrap/kb_python_runtime/; TARGET=/kb/deployment /bin/bash install-narrative-packages.sh

# Copy in the narrative repo
ADD ./narrative /kb/dev_container/narrative
RUN cd /kb/dev_container/narrative; /bin/bash install.sh -p /kb/deployment/services narrative
RUN cd /tmp/narrative

# Setup the container to automatically run a script that uses the narrative_mongo profile
# and configures the notebook server to use /narrative/{CMD} as the prefix for a reverse
# proxy environment
CMD ["kbasetest"]
ENTRYPOINT ["/bin/bash", "/kb/deployment/services/narrative-venv/bin/run_magellan_narrative.sh"]
RUN chown -R nobody:www-data /kb/dev_container/narrative/src/notebook/ipython_profiles /tmp/narrative; find / -xdev \( -perm -4000 \) -type f -print -exec rm {} \;
USER nobody
# CMD /bin/bash /kb/deployment/services/narrative-venv/bin/run_notebook.sh notebook --ip='*' --NotebookApp.password='sha1:89e8b3c3b94f:34c04b4f82d4f5442094cbf73204333 176be148a' --NotebookApp.open_browser='False'

