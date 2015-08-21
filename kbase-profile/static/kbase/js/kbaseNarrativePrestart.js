// Bind all page buttons right at startup.
define(['jquery',
        'narrativeConfig', 
        'jqueryui', 
        'kbaseNarrativeSharePanel', 
        'bootstrap'], function($) {
    $(document).on('workspaceIdQuery.Narrative', function(e, callback) {
        if (callback) {
            callback(workspaceId);
        }
    });

    // bind menubar buttons
    $('#kb-save-btn').click(function(e) {
        if (IPython && IPython.notebook) {
            var narrName = IPython.notebook.notebook_name;
            // we do not allow users to leave their narratives untitled
            if (narrName.trim().toLowerCase()==='untitled' || narrName.trim().length === 0) {
                IPython.save_widget.rename_notebook("Please name your Narrative before saving.", false);
            } else {
                IPython.narrative.saveNarrative();
            }
        }
    });
    $('#kb-narr-name #name').click(function(e) {
        if (IPython && IPython.save_widget) {
            IPython.save_widget.rename_notebook("Rename your Narrative.", true);
            var narrName = IPython.notebook.notebook_name;
            // this code needs to move to the save widget since rename_notebook is async!!
            //$('#kb-narr-name #name').text(narrName);
        }
    });
    $('#kb-kernel-int-btn').click(function(e) {
        if (IPython && IPython.notebook && IPython.notebook.kernel) {
            IPython.notebook.kernel.interrupt();
        }
    });
    $('#kb-kernel-ref-btn').click(function(e) {
        if (IPython && IPython.notebook && IPython.notebook.kernel) {
            IPython.notebook.kernel.restart();
        }
    });
    $('#kb-del-btn').click(function(e) {
        if (IPython && IPython.notebook)
            IPython.notebook.delete_cell();
    });
    $('#kb-jira-btn').attr('href', window.kbconfig.urls.submit_jira_ticket + '%20' + window.kbconfig.version);
    $('#kb-status-btn').attr('href', window.kbconfig.urls.status_page);


    var $dataList = $('<div>');
    var $shareWidget = $dataList["kbaseNarrativeSharePanel"]({});
    $('#kb-share-btn').popover({
        html : true,
        placement : "bottom",
        content: function() {
            // we do not allow users to leave thier narratives untitled
            if (IPython && IPython.notebook) {
                var narrName = IPython.notebook.notebook_name;
                if (narrName.trim().toLowerCase()==='untitled' || narrName.trim().length === 0) {
                    IPython.save_widget.rename_notebook("Your Narrative must be named before you can share it with others.", false);
                    return "<br><br>Please name your Narrative before sharing.<br><br>"
                }
            }

            //!! arg!! I have to refresh to get reattach the events, which are lost when
            //the popover is hidden!!!  makes it a little slower because we refetch permissions from ws each time
            $shareWidget.refresh();
            return $dataList;
        }
    });

    $('#kb-add-code-cell').click(function() { IPython.notebook.insert_cell_below('code'); })
    $('#kb-add-md-cell').click(function() { IPython.notebook.insert_cell_below('markdown'); })

/**
 * Error logging for detectable failure conditions.
 * Logs go through the kernel and thus are sent to the
 * main KBase logging facility (Splunk, as of this writing).
 *
 * Usage:
 *    KBFail(<is_it_fatal>, "what you were doing", "what happened");
 * Returns: false if IPython not initialized yet, true otherwise
 */
window._kb_failed_once = false;
window.KBFail = function(is_fatal, where, what) {
    if (!IPython || !IPython.notebook || !IPython.notebook.kernel) {
        return false;
    }
    var code = "";
    if (_kb_failed_once == false) {
        code += "from biokbase.narrative.common import kblogging\n";
        _kb_failed_once = true;
    }
    code += "kblogging.NarrativeUIError(";
    if (is_fatal) {
        code += "True,";
    }
    else {
        code += "False,";
    }
    if (where) {
        code += 'where="' + where + '"';
    }
    if (what) {
        if (where) { code += ", "; }
        code += 'what="' + what + '"';
    }
    code += ")\n";
    // Log the failure
    try {
        IPython.notebook.kernel.execute(code, null, {store_history: false});        
    }
    catch (err) {
        // wait half a second and try one more time.
        console.log(err);
        setTimeout( function() { IPython.notebook.kernel.execute(code, null, {store_history: false}); }, 500 );
    }    
    return true;
}
/**
 * Syntactic sugar for logging error vs. fatal error.
 *
 * Same as KBFail() with boolean flag replaced by different names
 * for the function.
 */
window.KBError = function(where, what) {
  return KBFail(false, where, what);
}

/**
 * KBFatal will, in addition to calling KBFail(),
 * put up a modal dialog showing the error
 * and providing some advice to users on what to do next.
 *
 * @param where (string) Where the error occurred
 * @param what  (string) What happened
 */
window.KBFatal = function(where, what) {

  var res = KBFail(true, where, what);

  var version = 'unknown';
  if (window.kbconfig !== undefined &&
      window.kbconfig.version !== undefined) {
    version = window.kbconfig.version;
  }
  var hash = 'unkown';
  if (window.kbconfig !== undefined &&
    window.kbconfig.git_commit_hash !== undefined) {
    hash = window.kbconfig.git_commit_hash;
  }
  var full_version = 'unknown';
  if (version != 'unknown') {
    if (hash == 'unknown') {
      full_version = version;
    }
    else {
      full_version = version + ' (hash=' + hash + ')';
    }
  }
  var $fatal =
    $('<div tabindex=-1 role="dialog" aria-labelledby="kb-fatal-error" aria-hidden="true">')
      .addClass('modal fade')
    .append($('<div>').addClass('modal-dialog')
      .append($('<div>').addClass('modal-content').addClass('kb-error-dialog')
        .append($('<div>').addClass('modal-header')
          .append($('<h4>').addClass('modal-title')
            .append('KBase Narrative Error')))
        .append($('<div>').addClass('modal-body'))
          .append($('<p>').css({'margin': '-1em 0 0 1em'})
            .text('Hmmm, your narrative seemed to hit a fatal error.'))
          .append($('<p>').css({'margin-left': '1em'})
            .html('But, as a wise man once said, ' +
                  '<strong>"Don\'t Panic!"</strong>'))
          .append($('<p>').css({'margin': '1em 0 0 1em'})
            .text('Some errors are caused by the ' +
                    'way browsers cache information. Try manually clearing your ' +
                    'browser cache and reloading the page.')
            .append($('<span>')
              .append($('<a>')
                .attr({href:"http://www.refreshyourcache.com/en/home/",
                       target: "_blank"})
                .text('This page'))
              .append($('<span>')
                .text(' has instructions on how to clear the cache on all major browsers.'))))
          .append($('<p>').css({'margin': '1em 0 0 1em'})
            .html('If that doesn\'t work, please ' +
              'contact us at ' +
              '<a href="mailto:help@kbase.us">help@kbase.us</a> ' +
              'and include the following information in your email:'))
        .append($('<p>').css({margin: '1em 0 0 2em'}).addClass('kb-err-text')
            .text('Version: ' + full_version))
        .append($('<p>').css({margin: '0 0 0 2em'}).addClass('kb-err-text')
            .text('Error location: ' + where))
        .append($('<p>').css({margin: '0 0 0 2em'}).addClass('kb-err-text')
            .text('Error message: ' + what))
        .append($('<div>').addClass('modal-footer')
          .append($('<div>')
              .append($('<span>').css({float: 'left'}).addClass('kb-err-warn')
                .text("Note: the Narrative may not work properly until this error is fixed"))
            .append($('<button type="button" data-dismiss="modal">')
              .addClass('btn btn-default')
              .append('Close').click(function(e) { $fatal.modal('close'); })
    )))));
  $fatal.modal('show');
}
});