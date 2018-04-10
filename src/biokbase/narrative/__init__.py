__all__ = ['magics', 'ws_util', 'common', 'handlers', 'contents', 'services', 'widgetmanager']

from semantic_version import Version
__version__ = Version("3.7.1")
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
