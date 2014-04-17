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
    <button type="button" id="pickfiles" class="btn btn-primary">Select files</button>
    <button type="button" id="uploadfiles" class="btn btn-success">Upload files</button>
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

JQUERY_UI_EXAMPLE = """
<link rel="stylesheet" href="/static/kbase/js/plupload/jquery.ui.plupload/css/jquery.ui.plupload.css" type="text/css" />
<script type="text/javascript" src="/static/kbase/js/plupload/plupload.full.min.js"></script>
<script type="text/javascript" src="/static/kbase/js/plupload/jquery.ui.plupload/jquery.ui.plupload.js"></script>

<form id="form" method="post" action="javascript:#">
    <div id="uploader">
        <p>Your browser doesn't have Flash, Silverlight or HTML5 support. Byah</p>
    </div>
    <br />
    <input type="submit" value="Submit" />
</form>
<script type="text/javascript">

$("#uploader").plupload({
// General settings
runtimes : 'html5,flash,html4',
url : '/_plupload',
// User can upload no more then 20 files in one go (sets multiple_queues to false)
max_file_count: 20,

chunk_size: '1mb',

filters : {
// Maximum file size
max_file_size : '3000mb',
},

// Rename files by clicking on their titles
rename: true,

// Sort files
sortable: true,

// Enable ability to drag'n'drop files onto the widget (currently only HTML5 supports that)
dragdrop: true,

// Views to activate
views: {
list: true,
},

// Flash settings
flash_swf_url : '/static/kbase/js/plupload/Moxie.swf',

});


// Handle the case when form was submitted before uploading has finished
$('#form').submit(function(e) {
// Files in queue upload them first
if ($('#uploader').plupload('getFiles').length > 0) {

// When all files are uploaded submit form
$('#uploader').on('complete', function() {
$('#form')[0].submit();
});

$('#uploader').plupload('start');
} else {
alert("You must have at least one file in the queue.");
}
return false; // Keep the form from submitting
});
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

