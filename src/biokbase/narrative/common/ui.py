"""
UI-related common functions
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '12/16/13'

import re
import uuid


def random_ident():
    return str(uuid.uuid4())


class TextLayout(object):
    """Text-specified layout.

    Example:

        Lxxx.LLxxx

            |
            V

            <div id="t1-col1" class="row">
                <div class="col-med-1">Field name 1</div>
                <div class="col-med-3"><input type="text" name=".." /></div>
                <div class="col-med-1">&nbsp;</div>
            </div>
            <div id="t1-col2" class="kb-layout-column">
            </div>

    """
    # Symbols
    SPC = "."
    LBL = "L"
    INP = {'x': 'text', 'a': 'textarea'}

    SPLIT_ROW_RE = re.compile(r'\.*L+\.*(?:a+|x+)', flags=re.VERBOSE)
    _expr = '({})'.format('|'.join([c + "+" for c in ['\\' + SPC, LBL] + INP.keys()]))
    #print("@@ run expr: {}".format(_expr))
    RUNS_RE = re.compile(_expr)

    def __init__(self, layout=None, ident=None, bs_column="med"):
        self._bscol = "col-{}".format(bs_column)
        self.ident = ident or random_ident()
        if layout is not None:
            self.layout(layout)

    def layout(self, layout):
        rows = []
        # parse each row of layout
        for row_spec in layout.split("\n"):
            fields = []
            # for each sequence of chars (run), record char and len
            for inp in self.SPLIT_ROW_RE.findall(row_spec):
                for run in self.RUNS_RE.findall(inp):
                    #print("@@ inp '{}', run '{}'".format(inp, run))
                    fields.append((run[0], len(run)))
            rows.append(fields)
        # store parsed layout
        self._layout = rows

    def as_grid(self, names):
        """BS3 grid layout given the field names.
        """
        rows, name_idx, form_group = [], 0, 0
        for lrow in self._layout:
            #row = "<div class='row'>\n"
            row = ""
            for fld, n in lrow:
                if form_group == 0 and fld != self.SPC:
                    # enclose beginning of form group
                    row += "<div class='form-group'>\n"
                col_class = "{}-{:d}".format(self._bscol, n)
                if fld == self.LBL:
                    row += "<label class='control-label {}'>{}</label>".format(col_class, names[name_idx])
                    name_idx += 1
                    form_group += 1
                elif fld == self.SPC:
                    row += "<div class='{}'>&nbsp;</div>".format(col_class)
                else:
                    row += "<input type='{}' class='form-control {}'></input>".format(
                            self.INP[fld], col_class)
                    form_group += 1
                if form_group == 2:
                    form_group = 0
                    # finish off form group
                    row += "\n</div>"
            #row += "</div>"
            rows.append(row)
        return "\n".join(rows)


def __test():
    o = TextLayout("layout1", bs_column="sm")
    layouts = ["Lxxx.LLxxx", "LaaLxx\nLxxLaa"]
    labels = ['label1', 'label2', 'label3', 'label4', 'label5']
    for lyt in layouts:
        o.layout(lyt)
        print("<!-------")
        print(lyt)
        print("----- -->")
        print("<form class='form-horizontal' role='form'>")
        print(o.as_grid(labels))
        print("</form>")

if __name__ == '__main__':
    __test()