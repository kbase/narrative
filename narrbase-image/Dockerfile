FROM python:3.10-slim-bullseye

ENV NOTEBOOK_VERSION 6.4.11
ENV IPYTHON_VERSION 8.4.0
ENV IPYWIDGETS_VERSION 7.6.3
ENV NODEJS_VERSION 16
ENV TAR /bin/tar

# Install Base libraries, Node, R and Jupyter Notebook and ipywidgets from distinct channels
ADD ./conda-requirements /root/conda
ADD ./ /root/image_files
RUN mkdir -p /kb/deployment/bin

# A gamut of basic requirements in Debian
RUN apt-get update && \
    apt-get install -y \
    gfortran \
    gnupg \
    # for pycurl, r-curl
    curl \
    libcurl4-openssl-dev \
    libssl-dev \
    git \
    # for ete3 / etetoolkit
    python3-pyqt5 \
    # for R and CRAN installations
    libxml2 \
    libxml2-dev \
    libfontconfig1-dev \
    libharfbuzz-dev \
    libfribidi-dev \
    libfreetype6-dev \
    libpng-dev \
    libtiff5-dev \
    libjpeg-dev \
    glpk-utils \
    libglpk-dev \
    glpk-doc \
    cmake \
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
RUN R --vanilla < /root/image_files/install-r-packages.R

# Install Dockerize
RUN	curl -LJO https://github.com/kbase/dockerize/raw/master/dockerize-linux-amd64-v0.6.1.tar.gz && \
    tar xvzf dockerize-linux-amd64-v0.6.1.tar.gz && \
    mv dockerize /kb/deployment/bin && \
    rm dockerize-linux-amd64-v0.6.1.tar.gz

# The BUILD_DATE value seem to bust the docker cache when the timestamp changes, move to
# the end
LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.vcs-url="https://github.com/kbase/narrative.git" \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.schema-version="1.0.0-rc1" \
      us.kbase.vcs-branch=$BRANCH \
      maintainer="William Riehl wjriehl@lbl.gov"
