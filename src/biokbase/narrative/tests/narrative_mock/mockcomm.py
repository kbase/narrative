class MockComm(object):
    """
    Mock class for ipython.kernel.Comm
    This keeps the last message that was sent, so it can be retrieved and
    analyzed during the test.
    """
    def __init__(self, *args, **kwargs):
        """Mock the init"""
        self.last_message = None

    def on_msg(self, *args, **kwargs):
        """Mock the msg router"""
        pass

    def send(self, data=None, content=None):
        """Mock sending a msg"""
        self.last_message = {"data": data, "content": content}

    def clear_message_cache(self):
        self.last_message = None
