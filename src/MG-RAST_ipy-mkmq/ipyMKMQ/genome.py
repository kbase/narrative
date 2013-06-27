#!/usr/bin/env python

import hashlib, traceback
from ipyTools import *

def get_genome_set(gids=[], def_name=None):
    """Wrapper for Genome object creation, checks if cache (created through unique option set) exists first and returns that.
    returns dict: key = genome_id, value = Genome() object
    
    see: help(Genome)
    """
    if not gids:
        sys.stderr.write("No ids inputted\n")
        return
    cache_id  = "_".join(sorted(gids))
    cache_md5 = hashlib.md5(cache_id).hexdigest()
    cache_obj = load_object(cache_md5)
    if cache_obj is not None:
        print "Loading Genome objects for selected genomes from cached object"
        return cache_obj
    else:
        # hack to get variable name
        if def_name == None:
            (filename,line_number,function_name,text)=traceback.extract_stack()[-2]
            def_name = text[:text.find('=')].strip()
        print "Loading Genome objects for selected genomes through API. Please wait, this may take several minutes ..."
        new_obj = dict([(x, Genome(genome_id=x, def_name="%s['%s']"%(def_name, x))) for x in gids])
        save_object(new_obj, cache_md5)
        print "Done loading through API"
        return new_obj

# class for plants
class Genome(object):
    """Class for working with genomes
    self.genome_id : kbase genome id
    """
    
    def __init__(self, genome_id=None, def_name=None):
        self.genome_id = genome_id
        # hack to get variable name
        if def_name == None:
            (filename,line_number,function_name,text)=traceback.extract_stack()[-2]
            def_name = text[:text.find('=')].strip()
        self.defined_name = def_name
