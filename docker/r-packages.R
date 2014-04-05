options(repos = c(CRAN = "http://cran.rstudio.com/"))
install.packages("ggplot2")  # powerful printing system
install.packages("devtools")  # make dev life easier

install.packages("knitr")  # elegant report generator
install.packages("stringr")
install.packages("rgl")
install.packages("data")
install.packages("table")
install.packages("parallel")
install.packages("lme4")
 
install.packages("Rglpk")  # powerful solver for mixed integer linear programming
install.packages("lpSolve")  # including solver for transportation problem and assignment problem
install.packages("goalprog")  # goal programming
install.packages("Rdonlp2", repos="http://R-Forge.R-project.org")  # powerful solver for smooth nonlinear minimization problem
install.packages("igraph")  # complex network research
install.packages("tseries")  # processing time series 
install.packages("zoo")  # no standar time series
install.packages("xts")  # extend ts
install.packages("timeSeries")  # another time series format
install.packages("lubridate")  # dealing with dates
install.packages("fACD", repos="http://R-Forge.R-project.org")  # ACD model
 
source("http://www.rmetrics.org/Rmetrics.R")
install.Rmetrics()  # install Rmetrics
 
install.packages("foreign")  # read SPSS, SAS, S-PLUS, Stata files
install.packages("ggpmap")  # access Google Maps
install.packages("googleVis")  # access Google Visualisation API
install.packages("Quandl")  # access Quandl
install.packages("rdatamarket")  # access http://datamarket.com/

require(devtools)
install_github('rCharts', 'ramnathv')
source("http://bioconductor.org/biocLite.R")
biocLite()
