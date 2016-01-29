import os
from service import ServiceConfig

# configure services from configuration in this directory
service_conf = ServiceConfig(os.path.dirname(__file__))
