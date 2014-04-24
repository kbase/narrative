options(repos = c(CRAN = "http://cran.r-project.org/"))
# ggplot2 not supported under the older version of R available via ubuntu repo
# will need to wait until CRAN repo version/dependency mess for 3.1-beta is resolved

install.packages("knitr", type="source")  # elegant report generator
install.packages("plyr", type="source")
install.packages("stringr", type="source")
install.packages("rgl", type="source")
install.packages("data", type="source")
install.packages("table", type="source")
install.packages("ggplot2", type="source")
install.packages("lme4", type="source")
install.packages("reshape", type="source")
install.packages("pheatmap", type="source")
install.packages(c("RCcolorBrewer","pheatmap","amap","clValid","gplots","png","tiff","lattice","RXKCD","wordcloud","tm",igraph"), type="source")
 
install.packages("Rglpk", type="source")  # powerful solver for mixed integer linear programming
install.packages("goalprog", type="source")  # goal programming
install.packages("tseries", type="source")  # processing time series 
install.packages("zoo", type="source")  # no standar time series
install.packages("xts", type="source")  # extend ts
install.packages("timeSeries", type="source")  # another time series format
install.packages("lubridate", type="source")  # dealing with dates
install.packages("fACD", repos="http://R-Forge.R-project.org")  # ACD model
 
install.packages("googleVis", type="source")  # access Google Visualisation API
install.packages("Quandl", type="source")  # access Quandl

install.packages("codetools", type="source")
install.packages("devtools", type="source")
require(devtools)
install_github('rCharts', 'ramnathv')
#source("http://bioconductor.org/biocLite.R")
#biocLite()
