__all__ = ['magics', 'mongonbmanager', 'ws_util', 'common', 'kbasewsmanager', 'services']

from semantic_version import Version
__version__ = Version("0.2.0")
version = lambda: __version__

# if run directly, print current version
if __name__ == '__main__':
    print(version())
