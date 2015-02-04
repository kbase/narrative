"""
Key=value pair parser
"""
import re

KVP_EXPR = re.compile(r"""
    (?:
        \s*                        # leading whitespace
        ([0-9a-zA-Z_.\-]+)         # Name
        =
        (?:                        # Value:
          ([^"\s]+) |              # - simple value
          "((?:[^"] | (?<=\\)")*)" # - quoted string
        )
        \s*
    ) |
    ([^= ]+)                        # Text w/o key=value
    """, flags=re.X)

def parse_kvp(msg, record, text_sep=' '):
    """
    Parse key-value pairs, adding to record in-place.

    :param msg: Input string
    :param record: In/out dict
    :param text_sep: Separator for output text pieces
    :return: All non-KVP as a string, joined by `text_sep`
    """
    text = []
    for n, v, vq, txt in KVP_EXPR.findall(msg):
        if n:
            if vq:
                v = vq.replace('\\"', '"')
            # add this KVP to output dict
            record[n] = v
        else:
            text.append(txt)
    return text_sep.join(text)
