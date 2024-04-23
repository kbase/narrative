"""Installer for KBase narrative Python libraries."""

import glob

from setuptools import find_packages, setup

import ez_setup

ez_setup.use_setuptools()

# added command classes

long_desc = "This Python package contains all the KBase Python libraries to support the Python narrative UI, which is built on the IPython notebook."

with open("requirements.txt") as f:
    install_requires = [s.strip() for s in f]

# Do the setup
setup(
    name="biokbase",
    packages=find_packages(),
    version="0.0.1",
    install_requires=install_requires,
    extras_require={},
    package_data={"": ["*.json"]},
    scripts=glob.glob("scripts/kb-*"),
    author="Steve Chan, Dan Gunter, William Riehl",
    author_email="sychan@lbl.gov, dkgunter@lbl.gov, wjriehl@lbl.gov",
    maintainer="Dan Gunter",
    url="https://kbase.us/",
    license="Other",
    description="KBase Python API",
    long_description=long_desc,
    keywords=["kbase", "narrative", "UI"],
    classifiers=[
        "Programming Language :: Python :: 3.12",
        "Development Status :: 4 - Beta",
        "Intended Audience :: Science/Research",
        "Operating System :: OS Independent",
        "Topic :: Scientific/Engineering :: Information Analysis",
        "Topic :: Scientific/Engineering :: Physics",
        "Topic :: Scientific/Engineering :: Chemistry",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    ext_modules=[],
)
