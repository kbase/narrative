FROM kbase/kb_python:python3

ENV NOTEBOOK_VERSION 5.7.4
ENV IPYTHON_VERSION 7.3.0
ENV IPYWIDGETS_VERSION 7.4.2

RUN mkdir -p /kb/installers

# Install Base libraries, Node, R and Jupyter Notebook and ipywidgets from distinct channels
ADD ./conda-requirements /root/conda
RUN conda update -n base conda && \
    conda install --file /root/conda/base && \
    conda install -c etetoolkit ete3 && \
    conda install -c anaconda-platform --file /root/conda/base.anaconda-platform && \
    conda install -c javascript --file /root/conda/base.javascript && \
    conda install -c wakari --file /root/conda/base.wakari && \
    conda install --file /root/conda/biokbase-requirements.txt && \
    conda install -c r r-base && \
    conda install -c conda-forge --file /root/conda/r.conda-forge && \
    conda install -c r --file /root/conda/r.r

# Install misc R packages not available on Coda
RUN apt-get update && \
    apt-get install -y gfortran

ADD ./r-packages-postconda.R /root/r-packages.R
RUN R --vanilla < /root/r-packages.R

RUN conda install -c anaconda ipython=${IPYTHON_VERSION} && \
    conda install -c anaconda notebook=${NOTEBOOK_VERSION} && \
    conda update six && \
    conda install ipywidgets==${IPYWIDGETS_VERSION} && \
    jupyter nbextension enable --py widgetsnbextension

# The BUILD_DATE value seem to bust the docker cache when the timestamp changes, move to
# the end
LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.vcs-url="https://github.com/kbase/narrative.git" \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.schema-version="1.0.0-rc1" \
      us.kbase.vcs-branch=$BRANCH \
      maintainer="William Riehl wjriehl@lbl.gov"
