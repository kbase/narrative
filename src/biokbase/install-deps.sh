#!/bin/sh
for f in 'requests>=1.0
pyyaml>=3.1
rsa
pyasn1
paramiko
pycrypto'
do
    echo "Install $f"
    pip install $f
done
