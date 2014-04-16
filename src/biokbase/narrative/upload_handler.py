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
 
HTML_EXAMPLE = """

<script type="text/javascript" src="/static/kbase/js/plupload/plupload.full.min.js"></script>

<div id="filelist">Your browser doesn't have Flash, Silverlight or HTML5 support.</div>
<br/><hr/>

<div id="container">
    <a id="pickfiles" href="javascript:;">[Select files]</a>
    <a id="uploadfiles" href="javascript:;">[Upload files]</a>
</div>
<hr/>
<pre id="console"></pre>
<script type="text/javascript">
var uploader = new plupload.Uploader({
    runtimes : 'html5,html4',
     
    browse_button : 'pickfiles', // you can pass in id...
    container: document.getElementById('container'), // ... or DOM Element itself
     
    url : "/_plupload",
     
    filters : {
        max_file_size : '2gb',
        //mime_types: [
        //    {title : "Text files", extensions : "txt,log"},
        //    {title : "Image files", extensions : "jpg,gif,png"},
        //    {title : "Zip files", extensions : "zip"}
        //]
    },
 
    init: {
        PostInit: function() {
            document.getElementById('filelist').innerHTML = '';
 
            document.getElementById('uploadfiles').onclick = function() {
                uploader.start();
                return false;
            };
        },
 
        FilesAdded: function(up, files) {
            plupload.each(files, function(file) {
                document.getElementById('filelist').innerHTML += '<div id="' + file.id + '">' + file.name + ' (' + plupload.formatSize(file.size) + ') <b></b></div>';
            });
        },
 
        UploadProgress: function(up, file) {
            document.getElementById(file.id).getElementsByTagName('b')[0].innerHTML = '<span>' + file.percent + "%</span>";
        },
 
        Error: function(up, err) {
            document.getElementById('console').innerHTML += "Error #" + err.code + ": " + err.message;
        }
    }
});
 
uploader.init();
</script>
"""
 
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
        dst = os.path.join('/tmp', 'narrative', filename)
 
        chunk = int(self.get_argument('chunk', '0'))
        chunks = int(self.get_argument('chunks', 0))
 
        f = get_or_create_file(chunk, dst)
        body = self.request.files['file'][0]['body']
        f.write(body)
        f.close()
 
        self.write('uploaded')

def insert_plupload_handler() :
    # add a handler for plupload file uploads
    IPython.html.base.handlers.app_log.error("Adding handler for plupload at /_plupload")
    handler = importlib.import_module('IPython.html.notebook.handlers')
    handler.default_handlers.append( (r"/_plupload", UploadHandler))
    IPython.html.base.handlers.app_log.debug("New routes are: %s" % str(handler.default_handlers))

