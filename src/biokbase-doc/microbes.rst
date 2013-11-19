Microbes demo service
=====================

.. currentmodule:: biokbase.narrative.demo.microbes_workflow.microbes

This service defines the following methods:

* :ref:`annotate-genome`
* :ref:`assemble-genome`
* :ref:`build-media`

In all cases, the private method starts with an `_`, but clients
should invoke the wrapper method with no leading underscore.

For example::

    from biokbase.narrative.demo.microbes_workflow import microbes
    microbes.quiet(True) # turn off status output
    genome = "123abc"
    ann_genome = microbes.annotate_genome(genome, None)
    asm_genome = microbes.assemble_genome(ann_genome, None)


.. _annotate-genome:

Annotate genome
---------------

.. autofunction:: _annotate_genome

.. _assemble-genome:

Assemble genome
---------------

.. autofunction:: _assemble_genome

.. _build-media:

Build media
-----------

.. autofunction:: _build_media
