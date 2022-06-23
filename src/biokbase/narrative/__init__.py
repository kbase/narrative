__all__ = ["magics", "common", "handlers", "contents", "services", "widgetmanager"]

from semantic_version import Version

__version__ = Version("5.1.0")


def version():
    return __version__


# if run directly:
#   no args = print current version
#   1 arg = self-modify version to arg value
if __name__ == "__main__":
    print(version())
