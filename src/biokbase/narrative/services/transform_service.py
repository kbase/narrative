"""
Calls to the Transform Service
"""
__author__ = ('Bill Riehl <wjriehl@lbl.gov>, ' +
              'Roman Sutormin <rsutormin@lbl.gov>' +
              'Gavin Price <gaprice@lbl.gov>')
__date__ = '1/15/15'

# Imports

import json
# Local
import biokbase.narrative.common.service as service
from biokbase.narrative.common.service import init_service
from biokbase.narrative.common.service import finalize_service
from biokbase.narrative.common.service import method
from biokbase.Transform.Client import Transform

#  Global vars

VERSION = (0, 0, 1)
NAME = "Transform Service"

# Initialize
init_service(name=NAME, desc="KBase Transform Service Calls", version=VERSION)


@method(name="Assy to ContigSet")
def _assy_to_cs(meth, input_assyfile, output_contigset):
    """Makes a call to the app service

    :param input_assyfile: the KBaseFile.AssemblyFile to convert
    :type input_assyfile: kbtypes.Unicode
    :ui_name input_assyfile: assembly file
    :param output_contigset: the name for the output ContigSet
    :type output_contigset: kbtypes.Unicode
    :ui_name output_contigset: output ContigSet name
    :rtype: kbtypes.Unicode
    :return: running job info
    """
    token, workspace = meth.token, meth.workspace_id
#     meth.debug(str(service.URLS))
    transform_url = service.URLS.get_url('transform')
    trans = Transform(transform_url, token=token)
    _, ujs_job = trans.convert(
        {'source_kbase_type': 'KBaseFile.Assembly',
         'source_workspace_name': workspace,
         'source_object_name': input_assyfile,
         'destination_kbase_type': 'KBaseGenomes.ContigSet',
         'destination_workspace_name': workspace,
         'destination_object_name': output_contigset}
    )

    meth.register_job(ujs_job)
    return json.dumps({'jobID': ujs_job})

# Finalize (registers service)
finalize_service()
