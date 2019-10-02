from nbconvert.postprocessors import Postprocessor

class NarrativePostprocessor(Postprocessor):
    def postproceess(self, input):
        print input