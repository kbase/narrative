class MockComm(object):
    """
    Mock class for ipython.kernel.Comm
    This keeps the last message that was sent, so it can be retrieved and
    analyzed during the test.
    """

    def __init__(self, *args, **kwargs):
        """Mock the init"""
        self.messages = []

    @property
    def last_message(self):
        if len(self.messages) == 0:
            return None
        return self.messages[-1]

    def peek_message(self, i):
        return self.messages[i]

    def on_msg(self, *args, **kwargs):
        """Mock the msg router"""

    def send(self, data=None, content=None):
        """Mock sending a msg"""
        self.messages.append({"data": data, "content": content})

    def clear_message_cache(self):
        self.messages = []
