# -*- coding: utf-8 -*-
"""
Sphinx documentation extension to fix traitlets junk.
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '2/4/14'

def setup(app):
    app.connect('autodoc-process-signature', autodoc_fix_traitlets)


def autodoc_fix_traitlets(app, what, name, obj, options, signature, return_annotation):
    """Fix traitlets cruft in class signature.

    :param app: the Sphinx application object
    :param what: the type of the object which the docstring belongs to (one of "module", "class", "exception",
                 "function", "method", "attribute")
    :param name: the fully qualified name of the object
    :param obj: the object itself
    :param options: the options given to the directive, an object with attributes inherited_members, undoc_members,
                    show_inheritance and noindex that are true if the flag option of same name was given
                    to the auto directive
    :param signature: function signature, as a string of the form "(parameter_1, parameter_2)", or None if introspection
            didn’t succeed and signature wasn’t specified in the directive.
    ::param return_annotation: function return annotation as a string of the form " -> annotation", or None if
                               there is no return annotation
    :return: (signature, return_annotation)
    :rtype: tuple
    """
    app.debug("Called for {} with signature {}".format(what, signature))
    if what == "class" and signature is not None and 'IPython.utils.traitlets' in signature:
        app.debug("Changing signature for traitlets subclass")
        signature = "(Unicode, TypeMeta)"
    return signature, return_annotation
