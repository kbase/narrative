options(repos = c(CRAN = "http://cran.r-project.org/"))
# ggplot2 not supported under the older version of R available via ubuntu repo
# will need to wait until CRAN repo version/dependency mess for 3.1-beta is resolved
#install.packages("ggplot2")  # powerful printing system

install.packages("knitr")  # elegant report generator
install.packages("stringr")
install.packages("rgl")
install.packages("data")
install.packages("table")
 
install.packages("Rglpk")  # powerful solver for mixed integer linear programming
install.packages("goalprog")  # goal programming
install.packages("tseries")  # processing time series 
install.packages("zoo")  # no standar time series
#install.packages("xts")  # extend ts
install.packages("timeSeries")  # another time series format
install.packages("lubridate")  # dealing with dates
install.packages("fACD", repos="http://R-Forge.R-project.org")  # ACD model
 
install.packages("googleVis")  # access Google Visualisation API
install.packages("Quandl")  # access Quandl
#install.packages("rdatamarket")  # access http://datamarket.com/

#require(devtools)
#install_github('rCharts', 'ramnathv')
#source("http://bioconductor.org/biocLite.R")
#biocLite()
