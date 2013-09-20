import os
import ez_setup
ez_setup.use_setuptools()
from setuptools import setup, find_packages

with open("README.md") as f:
    long_desc_lines = []
    for line in f:
        if line.strip().startswith('#'):
            for line2 in f:
                if line2.strip().startswith('#'):
                    break
                long_desc_lines.append(line2.strip())
            break
    long_desc = ' '.join(long_desc_lines)

setup(
    name="biokbase",
    packages=find_packages(),
    version="0.0.1",
    install_requires=["requests>=1.0", "pyyaml>=3.1",
                      "rsa", "pyasn1", "paramiko", "pycrypto"],
    extras_require={},
    package_data={"": ["*.json"]},
    author="Steve Chan, Dan Gunter",
    author_email="sychan@lbl.gov, dkgunter@lbl.gov",
    maintainer="Steve Chan, Dan Gunter",
    url="https://kbase.us/",
    license="Other",
    description="Source code for IPython/Python KBase narrative UI.",
    long_description=long_desc,
    keywords=["kbase", "narrative", "UI"],
    classifiers=[
        "Programming Language :: Python :: 2.7",
        "Development Status :: 4 - Beta",
        "Intended Audience :: Science/Research",
        "Operating System :: OS Independent",
        "Topic :: Scientific/Engineering :: Information Analysis",
        "Topic :: Scientific/Engineering :: Physics",
        "Topic :: Scientific/Engineering :: Chemistry",
        "Topic :: Software Development :: Libraries :: Python Modules"
    ],
    ext_modules=[],
    #scripts=[os.path.join("scripts", f) for f in os.listdir("scripts")]
)
