from biokbase.narrative.contents.narrativeio import PermissionsError
import json

def read_narrative_file(path):
    """
    Generically reads in any JSON file and returns it as a dict.
    Especially intended for reading a Narrative file.
    """
    with open(path, 'r') as f:
        narr = json.loads(f.read())
        f.close()
        return narr

