import _os


def touch(fname, times=None):
    '''Python implementation of the unix touch command. See os.utime for the
    format of the times argument. Reference:
    http://stackoverflow.com/questions/1158076/implement-touch-using-python
    '''

    with file(fname, 'a'):
        _os.utime(fname, times)
