import json


def read_json_file(path):
    """
    Generically reads in any JSON file and returns it as a dict.
    Especially intended for reading a Narrative file.
    """
    with open(path, 'r') as f:
        data = json.loads(f.read())
        f.close()
        return data
