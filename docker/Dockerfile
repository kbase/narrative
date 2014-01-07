# Dockerfile that builds a minimal container for IPython + narrative
#
# Assumes that we have clones of the boostrap repo (for bringing in the python
# environment) and a narrative repo in this directory
# sychan

FROM ubuntu:latest
MAINTAINER Steve Chan sychan@lbl.gov

EXPOSE 8888
ADD ./sources.list /etc/apt/sources.list

# Create a deployment directory
RUN mkdir -p /kb/deployment/services/narrative

# Add the MongoDB repo
#RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
#RUN echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | tee /etc/apt/sources.list.d/10gen.list

RUN DEBIAN_FRONTEND=noninteractive apt-get update

# There are a bunch of packages that are related to kernel operation
# which we can't upgrade within a container. Mark them for "hold" before
# running the upgrade
RUN DEBIAN_FRONTEND=noninteractive apt-mark hold udev initscripts plymouth initramfs-tools procps busybox-initramfs
RUN DEBIAN_FRONTEND=noninteractive apt-get -f upgrade -y

# Install the stuff we actually need
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y perl-base perl-modules make
# Maybe this will get all the necessary dependencies!
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y python-qt4 python-pip python-setuptools ipython-notebook python-matplotlib python-dev python-scipy python-numpy python-lxml python-sklearn python-sympy python-pandas
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y libfreetype6-dev libcairo2-dev texlive-latex-base texlive-fonts-recommended curl git-core libzmq-dev libreadline6-dev libreadline-dev libssl-dev libxml2-dev libxslt1-dev
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y r-recommended

# Clone in the python bootstrap and run it
ADD ./bootstrap/kb_python_runtime /mini-bootstrap/kb_python_runtime
RUN cd /mini-bootstrap/kb_python_runtime/; TARGET=/kb/deployment /bin/bash install-narrative-packages.sh

# Copy in the narrative repo
ADD ./narrative /kb/dev_container/narrative
RUN cd /kb/dev_container/narrative; /bin/bash install.sh -p /kb/deployment/services narrative

# Setup the container to automatically run a script that uses the narrative_mongo profile
# and configures the notebook server to use /narrative/{CMD} as the prefix for a reverse
# proxy environment
CMD ["kbasetest"]
ENTRYPOINT ["/bin/bash", "/kb/deployment/services/narrative-venv/bin/run_magellan_narrative.sh"]

# CMD /bin/bash /kb/deployment/services/narrative-venv/bin/run_notebook.sh notebook --ip='*' --NotebookApp.password='sha1:89e8b3c3b94f:34c04b4f82d4f5442094cbf73204333 176be148a' --NotebookApp.open_browser='False'

