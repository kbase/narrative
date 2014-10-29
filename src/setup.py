"""
Installer for KBase narrative Python libraries
"""
import glob
import re
import sys
import ez_setup
ez_setup.use_setuptools()
from setuptools import setup, find_packages
# added command classes
from biokbase.narrative.common.util import BuildDocumentation

# Parse "long" description from the README
readme_text = open("README.md").read()
m = re.search("##\s*Description\s*([^#]+)", readme_text, flags=re.M)
if not m:
    print("Error getting description from README.md")
    sys.exit(1)
long_desc = m.groups()[0].strip()

# Do the setup
setup(
    name="biokbase",
    packages=find_packages(),
    version="0.0.1",
    install_requires=[s.strip() for s in open("requirements.txt")],
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
    cmdclass = {
        "doc": BuildDocumentation,
    },
)
