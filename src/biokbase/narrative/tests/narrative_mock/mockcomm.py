"""Mock comm class."""

from comm.base_comm import BaseComm


class MockComm(BaseComm):
    """Mock class for ipython.comm.BaseComm.

    This keeps the last message that was sent, so it can be retrieved and
    analyzed during the test.
    """

    def __init__(self: "MockComm", *args, **kwargs) -> None:
        """Mock the init."""
        self.messages = []

    @property
    def last_message(self: "MockComm") -> str | None:
        """The last (most recent) message from the message list."""
        if len(self.messages) == 0:
            return None
        return self.messages[-1]

    def on_msg(self: "MockComm", *args, **kwargs) -> None:
        """Mock the msg router."""

    def send(self: "MockComm", message: str | None = None) -> None:
        """Mock sending a msg."""
        self.messages.append(message)

    def clear_message_cache(self: "MockComm") -> None:
        """Delete existing messages."""
        self.messages = []
