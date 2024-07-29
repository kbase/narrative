__all__ = ["magics", "common", "handlers", "contents", "services", "widgetmanager"]
__version__ = "5.4.1"


def version():
    return __version__


# if run directly:
#   no args = print current version
#   1 arg = self-modify version to arg value
if __name__ == "__main__":
    print(version())
