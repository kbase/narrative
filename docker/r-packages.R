options(repos = c(CRAN = "http://cran.rstudio.com/"))
install.packages("ggplot2")  # powerful printing system
install.packages("devtools")  # make dev life easier

install.packages("knitr")  # elegant report generator
install.packages("stringr")
install.packages("rgl")
install.packages("data")
install.packages("table")
install.packages("parallel")
 
install.packages("Rglpk")  # powerful solver for mixed integer linear programming
install.packages("goalprog")  # goal programming
install.packages("Rdonlp2", repos="http://R-Forge.R-project.org")  # powerful solver for smooth nonlinear minimization problem
install.packages("tseries")  # processing time series 
install.packages("zoo")  # no standar time series
install.packages("xts")  # extend ts
install.packages("timeSeries")  # another time series format
install.packages("lubridate")  # dealing with dates
install.packages("fACD", repos="http://R-Forge.R-project.org")  # ACD model
 
install.packages("ggpmap")  # access Google Maps
install.packages("googleVis")  # access Google Visualisation API
install.packages("Quandl")  # access Quandl
install.packages("rdatamarket")  # access http://datamarket.com/

require(devtools)
install_github('rCharts', 'ramnathv')
#source("http://bioconductor.org/biocLite.R")
#biocLite()
