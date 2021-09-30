import json


class NarrativeInfo(object):
    def __init__(self, narr_info: list, ws_owner: str):
        self.ws_id = narr_info[6]
        self.last_saved = narr_info[3]
        self.saved_by = narr_info[5]
        self.ws_owner = ws_owner
        self.updated_cells = 0
        self.changed_cells = dict()  # cell idx - CellChange

    def add_updated_cell(self, idx: int, original_source: str, updated_source: str):
        """
        Check original vs updated
        if different, mark them and add an updated cell to the count
        """
        if original_source != updated_source:
            self.changed_cells[idx] = CellChange(
                self.ws_id, idx, original_source, updated_source
            ).to_dict()
            self.updated_cells += 1

    def to_dict(self):
        return {
            "id": self.ws_id,
            "last_saved": self.last_saved,
            "saved_by": self.saved_by,
            "updates": self.changed_cells,
            "owner": self.ws_owner,
        }

    def __repr__(self):
        return json.dumps(self.to_dict())


class CellChange(object):
    def __init__(self, ws_id: int, idx: int, original: str, updated: str):
        self.ws_id = ws_id
        self.updated_lines = {}
        self.original = original
        self.updated = updated
        self.cell_idx = idx
        self._init_lines(original, updated)

    def _init_lines(self, original: str, updated: str):
        orig_lines = original.split("\n")
        updated_lines = updated.split("\n")
        if len(orig_lines) != len(updated_lines):
            print(
                f"WS:{self.ws_id} updating cell {self.cell_idx} - can't compare line by line, squashing them all together."
            )
            self.updated_lines = {0: {"o": original, "u": updated}}
        else:
            for idx, line in enumerate(orig_lines):
                if line != updated_lines[idx]:
                    self.updated_lines[idx] = {"o": line, "u": updated_lines[idx]}

    def __repr__(self):
        return json.dumps(self.to_dict())

    def to_dict(self):
        return self.updated_lines
