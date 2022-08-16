# FROM kbase/kb_python:python3
FROM python:3.10-slim-bullseye

ENV NOTEBOOK_VERSION 6.4.11
ENV IPYTHON_VERSION 8.4.0
ENV IPYWIDGETS_VERSION 7.6.3
ENV NODEJS_VERSION 16
ENV TAR /bin/tar

# Install Base libraries, Node, R and Jupyter Notebook and ipywidgets from distinct channels
ADD ./conda-requirements /root/conda
ADD ./ /root/image_files

# A gamut of basic requirements in Debian
RUN apt-get update && \
    apt-get install -y \
    gfortran \
    gnupg \
    # for pycurl
    curl \
    libcurl4-openssl-dev \
    libssl-dev \
    # for ete3 / etetoolkit
    python3-pyqt5 \
    # for R and CRAN installations
    r-base r-base-dev

# Python dependencies
# Core Python necessities
RUN pip install -r /root/image_files/base-pip-requirements.txt

# KBase scientific computing packages
RUN pip install -r /root/image_files/kbase-pip-requirements.txt

# Install Jupyter, Notebook, Ipywidgets
RUN pip install -r /root/image_files/jupyter-pip-requirements.txt

# Enable the widgets extension
RUN jupyter nbextension enable --py widgetsnbextension
RUN jupyter nbextension enable --py --sys-prefix clustergrammer_widget

# JavaScript needs
RUN curl -sL https://deb.nodesource.com/setup_${NODEJS_VERSION}.x | bash - && \
    apt-get install -y nodejs

# R requirements


# RUN mkdir -p /kb/installers && \
#     # run conda installs
# x    conda update -n base -c defaults conda && \
# x    conda install conda && \
# x    conda install -c conda-forge --file /root/conda/base && \
# x   conda install -c etetoolkit ete3 && \
# x   conda install -c anaconda-platform --file /root/conda/base.anaconda-platform && \
# x   conda install -c javascript --file /root/conda/base.javascript && \
# x   conda install --file /root/conda/biokbase-requirements.txt && \
#     conda install -c r r-base && \
#     conda install -c conda-forge --file /root/conda/r.conda-forge && \
#     conda install -c r --file /root/conda/r.r && \
#     # Install apt-get prereqs for node and R
# x   apt-get update && \
# x   apt-get install -y gfortran gnupg curl libcurl-dev libssl-dev && \
# x   # Install nodejs at a useful version
# x   curl -sL https://deb.nodesource.com/setup_${NODEJS_VERSION}.x | bash - && \
# x   apt-get install -y nodejs

# # Install misc R packages not available on Conda
# ADD ./r-packages-postconda.R /root/r-packages.R
# RUN R --vanilla < /root/r-packages.R && \
# x   # Install IPython, Jupyter Notebook, and ipywidgets at controlled versions
# x   conda install -c conda-forge ipython=${IPYTHON_VERSION} notebook=${NOTEBOOK_VERSION} ipywidgets==${IPYWIDGETS_VERSION} && \
# x   conda update six && \
# x   jupyter nbextension enable --py widgetsnbextension

# The BUILD_DATE value seem to bust the docker cache when the timestamp changes, move to
# the end
LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.vcs-url="https://github.com/kbase/narrative.git" \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.schema-version="1.0.0-rc1" \
      us.kbase.vcs-branch=$BRANCH \
      maintainer="William Riehl wjriehl@lbl.gov"
