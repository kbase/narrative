#!/usr/bin/env python
"""Output single markdown doc from multimarkdown
with internal links and includes.
"""

import re
import sys


def println(*s):
    sys.stdout.write("".join(s))


def main():
    filenames = sys.argv[1:] if len(sys.argv) > 1 else ["-"]
    for fname in filenames:
        f = sys.stdin if fname == "-" else open(fname)
        for line in f:
            # m = re.match('(.*)\[(.*)\]\[\](.*)', line)
            # if m:
            #    println(''.join(m.groups()),'\n')
            # else:
            m = re.search(r"\{\{(.*)\}\}", line)
            if m:
                f2 = open(m.group(1))
                println("\n")
                for line2 in f2:
                    println(line2)
            else:
                println(line)


if __name__ == "__main__":
    main()
    sys.exit(0)
