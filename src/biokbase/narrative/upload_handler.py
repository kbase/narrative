"""
Cribbed from https://gist.github.com/zengjie/1228183
"""
import tornado.web
import tornado.ioloop
import logging
import os.path
 
import IPython.html.base.handlers
import importlib

def clean_filename(filename):
    i = filename.rfind(".")
    if i != -1:
        filename = filename[0:i] + filename[i:].lower()
    return filename
 
 
def get_or_create_file(chunk, dst):
    if chunk == 0:
        f = file(dst, 'wb')
    else:
        f = file(dst, 'ab')
    return f
 
 
class UploadHandler(tornado.web.RequestHandler):
    CORS_ORIGIN = '*'
    CORS_HEADERS = 'Content-Type, Authorization'
    CORS_METHODS = 'POST'
    CORS_CREDENTIALS = True
    CORS_MAX_AGE = 86400

    def set_default_headers(self):
        if self.CORS_ORIGIN:
            self.set_header("Access-Control-Allow-Origin", self.CORS_ORIGIN)

    def options(self, *args, **kwargs):
        if self.CORS_HEADERS:
            self.set_header('Access-Control-Allow-Headers', self.CORS_HEADERS)
        if self.CORS_METHODS:
            self.set_header('Access-Control-Allow-Methods', self.CORS_METHODS)
        else:
            self.set_header('Access-Control-Allow-Methods', self._get_methods())
        if self.CORS_CREDENTIALS != None:
            self.set_header('Access-Control-Allow-Credentials',
                "true" if self.CORS_CREDENTIALS else "false")
        if self.CORS_MAX_AGE:
            self.set_header('Access-Control-Max-Age', self.CORS_MAX_AGE)
        self.set_status(204)
        self.finish()

    def _get_methods(self):
        supported_methods = [method.lower() for method in self.SUPPORTED_METHODS]
        #  ['get', 'put', 'post', 'patch', 'delete', 'options']
        methods = []
        for meth in supported_methods:
            instance_meth = getattr(self, meth)
            if not meth:
                continue
            handler_class = _get_class_that_defined_method(instance_meth)
            if not handler_class is RequestHandler:
                methods.append(meth.upper())

        return ", ".join(methods)

    def post(self):
        filename = clean_filename(self.get_argument('name'))
        dst = os.path.join('/tmp', filename)
 
        chunk = int(self.get_argument('chunk', '0'))
        chunks = int(self.get_argument('chunks', 0))
 
        f = get_or_create_file(chunk, dst)
        body = self.request.files['file'][0]['body']
        f.write(body)
        f.close()
 
        self.write('uploaded')


# add a handler for plupload file uploads
IPython.html.base.handlers.app_log.error("Adding handler for plupload at /_plupload")
handler = importlib.import_module('IPython.html.notebook.handlers')
handler.default_handlers.append( (r"/_plupload", UploadHandler))
IPython.html.base.handlers.app_log.debug("New routes are: %s" % str(handler.default_handlers))

