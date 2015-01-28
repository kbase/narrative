__all__ = ['magics', 'mongonbmanager', 'ws_util', 'common', 'kbasewsmanager', 'services']

from semantic_version import Version
__version__ = Version("0.4.4")
version = lambda: __version__

# if run directly:
#   no args = print current version
#   1 arg = self-modify version to arg value
if __name__ == '__main__':
    import os, sys
    if len(sys.argv) == 1:
        print(version())
    elif len(sys.argv) == 2:
        ver = sys.argv[1]
        try:
            Version(ver)
        except:
            print("Invalid version: {}".format(ver))
            sys.exit(1)
        oldver = '"' + str(version()) + '"'
        newver = '"' + ver + '"'
        myfile = os.path.abspath(sys.argv[0])
        oldself = open(myfile).read()
        newself = oldself.replace(oldver, newver)
        open(myfile, 'w').write(newself)
    sys.exit(0)
