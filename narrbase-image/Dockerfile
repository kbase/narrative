FROM kbase/kb_python:latest
MAINTAINER William Riehl wjriehl@lbl.gov

ENV JUPYTER_VERSION 5.4.1
ENV IPYWIDGETS_VERSION 7.1.2

RUN mkdir -p /kb/installers

RUN \
    curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash - && \
    apt-get install -y nodejs && \
    pip install --upgrade pip && \
    pip install setuptools==33.1.1  # https://github.com/pypa/setuptools/issues/942

# Install Jupyter Notebook and ipywidgets
RUN conda update -n base conda && \
    conda install tornado=4.5.3 && \
    conda install -c anaconda notebook=${JUPYTER_VERSION} && \
    conda update six && \
    conda install ipywidgets==${IPYWIDGETS_VERSION} && \
    jupyter nbextension enable --py widgetsnbextension

