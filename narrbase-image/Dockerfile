FROM kbase/narrprereq:1.1
MAINTAINER William Riehl wjriehl@lbl.gov

ENV JUPYTER_VERSION 4.3.2
ENV IPYWIDGETS_VERSION 5.1.5

RUN mkdir -p /kb/installers

# Download Jupyter Notebook
ADD https://github.com/jupyter/notebook/archive/${JUPYTER_VERSION}.tar.gz /kb/installers/jupyter_notebook/notebook-${JUPYTER_VERSION}.tar.gz

RUN \
    curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash - && \
    apt-get install -y nodejs

# Install Jupyter Notebook
RUN cd /kb/installers/jupyter_notebook && tar -xvf notebook-${JUPYTER_VERSION}.tar.gz && cd notebook-${JUPYTER_VERSION} && pip install --pre -e .

# Install IPywidgets
RUN pip install --upgrade six && pip install ipywidgets==${IPYWIDGETS_VERSION} && jupyter nbextension enable --py widgetsnbextension
