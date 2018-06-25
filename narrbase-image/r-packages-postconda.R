options(repos = c(CRAN = "http://cran.r-project.org/"))

install.packages(c("clValid","RXKCD"), type="source", dependencies=TRUE)
 
install.packages("Rglpk", type="source")  # powerful solver for mixed integer linear programming
install.packages("goalprog", type="source")  # goal programming
install.packages("fACD", repos="http://R-Forge.R-project.org")  # ACD model
 
install.packages("Quandl", type="source")  # access Quandl
require(devtools)
install_github('rCharts', 'ramnathv')
#source("http://bioconductor.org/biocLite.R")
#biocLite()
