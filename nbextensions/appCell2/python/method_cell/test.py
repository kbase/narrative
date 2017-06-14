from IPython.display import Javascript
import string
import sys
import uuid

def js_error(cell_id, message):
    jsString = """
require([
  'base/js/namespace',
  'nbextensions/methodCell/main'
], function (Jupyter, KBaseMethodsExtension) {
    KBaseMethodsExtension.send({
        type: 'runstatus',
        cellId: '${cellid}',
        status: 'error',
        message: '${message}'
    });
});
"""
def js_test():
    js = "alert('hi');"
    return Javascript(data=js, lib=None, css=None)

def js_run_widget(cell_id, kbase_cell_id):
    jsString = """
//@ sourceUrl=whatever.js    
require([
  'base/js/namespace',
  'nbextensions/methodCell/widgets/codeCellRunWidget'
], function (Jupyter, RunWidget) {
   var args = {
       cellId: '${cell_id}',
       kbaseCellId: '${kbase_cell_id}'
   };
   console.log('here with', args);
   var widget = RunWidget.make(args);
   widget.attach(args)
   .then(function () {
   console.log('IT WORKED');
   })
   .catch(function (err) {
   console.error('BOO', err, args);
   });
});

"""
    jsTemplate = string.Template(jsString)
    js = jsTemplate.substitute(cell_id=cell_id, kbase_cell_id=kbase_cell_id)
    print js
    return Javascript(data=js, lib=None, css=None)

def insert_run_widget(cell_id, kbase_cell_id):
    try:
        # return js_test()
        return js_run_widget(cell_id, kbase_cell_id)
    except Exception as e:
        error = str(e)
        return js_error(cell_id, error)



