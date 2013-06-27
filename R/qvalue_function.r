# qvalue() function extracted from the package "qvalue"
# by Alan Dabney and John D. Storey, with assistance from Gregory R. Warnes
#
# DESCRIPTION file follows:
#
# Package: qvalue
# Title: Q-value estimation for false discovery rate control
# Version: 1.32.0
# Author: Alan Dabney <adabney@u.washington.edu> and John D. Storey
# <jstorey@u.washington.edu>, with assistance from Gregory R.
# Warnes <gregory_r_warnes@groton.pfizer.com>
#
# Description: This package takes a list of p-values resulting from the
# simultaneous testing of many hypotheses and estimates their
# q-values. The q-value of a test measures the proportion of
# false positives incurred (called the false discovery rate)
# when that particular test is called significant. Various plots
# are automatically generated, allowing one to make sensible
# significance cut-offs. Several mathematical results have
# recently been shown on the conservative accuracy of the
# estimated q-values from this software. The software can be
# applied to problems in genomics, brain imaging, astrophysics,
# and data mining.
# Maintainer: John D. Storey <jstorey@u.washington.edu>
# 	Imports: graphics, stats
# License: LGPL
# biocViews: MultipleComparisons
# Packaged: 2012-10-02 02:49:23 UTC; biocbuild
# InstallableEverywhere: yes

qvalue <- function(p=NULL, lambda=seq(0,0.90,0.05), pi0.method="smoother", fdr.level=NULL, robust=FALSE, 
									 gui=FALSE, smooth.df = 3, smooth.log.pi0 = FALSE) {
	
	#This is just some pre-processing
	if(is.null(p))  ## change by Alan
	{qvalue.gui(); return("Launching point-and-click...")}
	if(gui & !interactive())  ## change by Alan
		gui = FALSE
	
	if(min(p)<0 || max(p)>1) {
		if(gui) ## change by Alan:  check for GUI
			eval(expression(postMsg(paste("ERROR: p-values not in valid range.", "\n"))), parent.frame())
		else
			print("ERROR: p-values not in valid range.")
		return(0)
	}
	if(length(lambda)>1 && length(lambda)<4) {
		if(gui)
			eval(expression(postMsg(paste("ERROR: If length of lambda greater than 1, you need at least 4 values.",
																		"\n"))), parent.frame())
		else
			print("ERROR: If length of lambda greater than 1, you need at least 4 values.")
		return(0)
	}
	if(length(lambda)>1 && (min(lambda) < 0 || max(lambda) >= 1)) { ## change by Alan:  check for valid range for lambda
		if(gui)
			eval(expression(postMsg(paste("ERROR: Lambda must be within [0, 1).", "\n"))), parent.frame())
		else
			print("ERROR: Lambda must be within [0, 1).")
		return(0)
	}
	m <- length(p)
	#These next few functions are the various ways to estimate pi0
	if(length(lambda)==1) {
		if(lambda<0 || lambda>=1) { ## change by Alan:  check for valid range for lambda
			if(gui)
				eval(expression(postMsg(paste("ERROR: Lambda must be within [0, 1).", "\n"))), parent.frame())
			else
				print("ERROR: Lambda must be within [0, 1).")
			return(0)
		}
		
		pi0 <- mean(p >= lambda)/(1-lambda)
		pi0 <- min(pi0,1)
	}
	else {
		pi0 <- rep(0,length(lambda))
		for(i in 1:length(lambda)) {
			pi0[i] <- mean(p >= lambda[i])/(1-lambda[i])
		}
		
		if(pi0.method=="smoother") {
			if(smooth.log.pi0)
				pi0 <- log(pi0)
			
			spi0 <- smooth.spline(lambda,pi0,df=smooth.df)
			pi0 <- predict(spi0,x=max(lambda))$y
			
			if(smooth.log.pi0)
				pi0 <- exp(pi0)
			pi0 <- min(pi0,1)
		}
		else if(pi0.method=="bootstrap") {
			minpi0 <- min(pi0)
			mse <- rep(0,length(lambda))
			pi0.boot <- rep(0,length(lambda))
			for(i in 1:100) {
				p.boot <- sample(p,size=m,replace=TRUE)
				for(i in 1:length(lambda)) {
					pi0.boot[i] <- mean(p.boot>lambda[i])/(1-lambda[i])
				}
				mse <- mse + (pi0.boot-minpi0)^2
			}
			pi0 <- min(pi0[mse==min(mse)])
			pi0 <- min(pi0,1)
		}
		else {  ## change by Alan: check for valid choice of 'pi0.method' (only necessary on command line)
			print("ERROR: 'pi0.method' must be one of 'smoother' or 'bootstrap'.")
			return(0)
		}
	}
	if(pi0 <= 0) {
		if(gui)
			eval(expression(postMsg(
				paste("ERROR: The estimated pi0 <= 0. Check that you have valid p-values or use another lambda method.",
							"\n"))), parent.frame())
		else
			print("ERROR: The estimated pi0 <= 0. Check that you have valid p-values or use another lambda method.")
		return(0)
	}
	if(!is.null(fdr.level) && (fdr.level<=0 || fdr.level>1)) {  ## change by Alan:  check for valid fdr.level
		if(gui)
			eval(expression(postMsg(paste("ERROR: 'fdr.level' must be within (0, 1].", "\n"))), parent.frame())
		else
			print("ERROR: 'fdr.level' must be within (0, 1].")
		return(0)
	}
	#The estimated q-values calculated here
	u <- order(p)
	
	# change by Alan
	# ranking function which returns number of observations less than or equal
	qvalue.rank <- function(x) {
		idx <- sort.list(x)
		
		fc <- factor(x)
		nl <- length(levels(fc))
		bin <- as.integer(fc)
		tbl <- tabulate(bin)
		cs <- cumsum(tbl)
		
		tbl <- rep(cs, tbl)
		tbl[idx] <- tbl
		
		return(tbl)
	}
	
	v <- qvalue.rank(p)
	
	qvalue <- pi0*m*p/v
	if(robust) {
		qvalue <- pi0*m*p/(v*(1-(1-p)^m))
	}
	qvalue[u[m]] <- min(qvalue[u[m]],1)
	for(i in (m-1):1) {
		qvalue[u[i]] <- min(qvalue[u[i]],qvalue[u[i+1]],1)
	}
	#The results are returned
	if(!is.null(fdr.level)) {
		retval <- list(call=match.call(), pi0=pi0, qvalues=qvalue, pvalues=p, fdr.level=fdr.level, ## change by Alan
									 significant=(qvalue <= fdr.level), lambda=lambda)
	}
	else {
		retval <- list(call=match.call(), pi0=pi0, qvalues=qvalue, pvalues=p, lambda=lambda)
	}
	class(retval) <- "qvalue"
	return(retval)
}
