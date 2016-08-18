import ftputil
url="ftp://ftp.ncbi.nlm.nih.gov/genomes/all/GCF_000022325.1_ASM2232v1/GCF_000022325.1_ASM2232v1_genomic.gbff.gz"
host = url.split("ftp://")[1].split("/")[0]
path = url.split("ftp://")[1].split("/", 1)[1]
ftp_connection = ftputil.FTPHost(host, 'anonymous', 'anonymous@')
ftp_connection.path.isdir(path)
