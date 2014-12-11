__all__ = ['magics', 'mongonbmanager', 'ws_util', 'common', 'kbasewsmanager', 'services']

from semantic_version import Version
__version__ = Version("0.2.1")
version = lambda: __version__

# if run directly:
#   no args = print current version
#   1 arg = self-modify version to arg value
if __name__ == '__main__':
    import sys
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
        oldself = open(__file__).read()
        newself = oldself.replace(oldver, newver)
        open(__file__, 'w').write(newself)
    sys.exit(0)
