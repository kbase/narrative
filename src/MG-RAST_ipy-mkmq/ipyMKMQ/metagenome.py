#!/usr/bin/env python

import sys, os, json, traceback
import IPython.core.display
from ipyTools import *

class Metagenome(object):
    """Class representation of Metagenome object:
        "id"       : [ 'string', 'unique object identifier' ],
        "name"     : [ 'string', 'human readable identifier' ],
        "library"  : [ 'reference library', 'reference to the related library object' ],
        "sample"   : [ 'reference sample',  'reference to the related sample object' ],
        "project"  : [ 'reference project', 'reference to the project object' ],
        "metadata" : [ 'hash',    'key value pairs describing metadata' ],
        "created"  : [ 'date',    'time the object was first created' ],
        "version"  : [ 'integer', 'version of the object' ],
        "url"      : [ 'uri',     'resource location of this object instance' ],
        "status"   : [ 'cv', [ ['public', 'object is public'],
        					   ['private', 'object is private'] ] ],
        "sequence_type" : [ 'string', 'sequencing type' ],
        "stats"      : "id" : [ 'string', 'unique metagenome id' ],
                       "length_histogram" : { "upload" : [ 'list', 'length distribution of uploaded sequences' ],
                                              "post_qc" : [ 'list', 'length distribution of post-qc sequences' ] },
                       "gc_histogram" : { "upload" : [ 'list', 'gc % distribution of uploaded sequences' ],
                                          "post_qc" : [ 'list', 'gc % distribution of post-qc sequences' ] },
                       "qc" : { "kmer" : { "6_mer"  : {"columns" : ['list', 'names of columns'], "data" : ['list', 'kmer 6 counts']},
                                           "15_mer" : {"columns" : ['list', 'names of columns'], "data" : ['list', 'kmer 15 counts']} },
                                "drisee" : { "counts" : {"columns" : ['list', 'names of columns'], "data" : ['list', 'drisee count profile']},
                                             "percents" : {"columns" : ['list', 'names of columns'], "data" : ['list', 'drisee percent profile']},
                                             "summary" : {"columns" : ['list', 'names of columns'], "data" : ['list', 'drisee summary stats']} },
                                "bp_profile" : { "counts" : {"columns" : ['list', 'names of columns'], "data" : ['list', 'nucleotide count profile']},
                                                 "percents" : {"columns" : ['list', 'names of columns'], "data" : ['list', 'nucleotide percent profile']} }
                               },
                       "sequence_stats" : [ 'hash', 'statistics on sequence files of all pipeline stages' ],
                       "taxonomy" : { "species" : [ 'list', 'species counts' ],
                                      "genus" : [ 'list', 'genus counts' ],
                                      "family" : [ 'list', 'family counts' ],
                                      "order" : [ 'list', 'order counts' ],
                                      "class" : [ 'list', 'class counts' ],
                                      "phylum" : [ 'list', 'phylum counts' ],
                                      "domain" : [ 'list', 'domain counts' ] },
                       "ontology" : { "COG" : [ 'list', 'COG counts' ],
                                      "KO" : [ 'list', 'KO counts' ],
		                              "NOG" : [ 'list', 'NOG counts' ],
		                              "Subsystems" : [ 'list', 'Subsystem counts' ] },
                       "source" : [ 'hash', 'evalue and % identity counts per source' ],
	                   "rarefaction" : [ 'list', 'rarefaction coordinate data' ]
	    "display"    : 'MetagenomeDisplay Object - help(this_name.display)'
    """
    def __init__(self, mgid, stats=True, display=True, auth=None, def_name=None, cache=False):
        self._mgfile = Ipy.CCH_DIR+'/'+mgid+'.json'
        self._statfile = Ipy.CCH_DIR+'/'+mgid+'.stats.json'
        self._auth   = auth
        self.stats   = None
        self.display = None
        metagenome   = None
        if cache and os.path.isfile(self._mgfile):
            # load from cache
            metagenome = self._load_cache('metagenome '+mgid, self._mgfile)
            print "Loading metagenome %s from cached file"%mgid
        if metagenome is None:
            # load from api
            metagenome = self._get_metagenome(mgid)
            print "Loading metagenome %s through API"%mgid
            if metagenome and cache and os.path.isdir(Ipy.CCH_DIR):
                self._save_cache(metagenome, 'metagenome '+mgid, self._mgfile)
        if metagenome is not None:
            for key, val in metagenome.iteritems():
                setattr(self, key, val)
        else:
            sys.stderr.write("ERROR: unable to load metagenome %s through API\n"%mgid)
            self.id = mgid
            self.name = None
            return
        # get stats
        if stats:
            if cache and os.path.isfile(self._statfile):
                # load from cache
                self.stats = self._load_cache('metagenome '+mgid+' stats', self._statfile)
            if self.stats is None:
                # load from api
                self._set_statistics()
                if self.stats and cache and os.path.isdir(Ipy.CCH_DIR):
                    self._save_cache(self.stats, 'metagenome '+mgid+' stats', self._statfile)
        # hack to get variable name
        if def_name == None:
            try:
                (filename,line_number,function_name,text)=traceback.extract_stack()[-2]
                def_name = text[:text.find('=')].strip()
            except:
                pass
        self.defined_name = def_name
        # set display
        if display and metagenome:
            self.display = MetagenomeDisplay(self, self.defined_name+'.display')
    
    def _load_cache(self, ctype, cfile):
        # try load from cache if given
        obj = None
        try:
            obj = json.load(open(cfile, 'rU'))
            if Ipy.DEBUG:
                sys.stdout.write("%s loaded from cached file (%s)\n"%(ctype, cfile))
        except:
            sys.stderr.write("ERROR: unable to load %s from cached file (%s)\n"%(ctype, cfile))
        return obj
    
    def _save_cache(self, cobj, ctype, cfile):
        # save to cache if given
        try:
            json.dump(cobj, open(cfile, 'w'))
            if Ipy.DEBUG:
                sys.stdout.write("%s saved to cached file (%s)\n"%(ctype, cfile))
        except:
            sys.stderr.write("ERROR: unable to save %s to cached file (%s)\n"%(ctype, cfile))
    
    def _mg_dict(self):
        mg_dict = {}
        for k, v in vars(self).items():
            if (not k.startswith('_')) and (k not in ['stats','display','defined_name']):
                mg_dict[k] = v
        return mg_dict
    
    def _get_metagenome(self, mgid):
        if Ipy.DEBUG:
            sys.stdout.write("Loading metagenome %s from API ...\n"%mgid)
        return obj_from_url(Ipy.API_URL+'/metagenome/'+mgid+'?verbosity=full', self._auth)

    def _set_statistics(self):
        if Ipy.DEBUG:
            sys.stdout.write("Loading metagenome %s statistics from API ...\n"%self.id)
        self.stats = obj_from_url(Ipy.API_URL+'/metagenome_statistics/'+self.id+'?verbosity=full', self._auth)

class MetagenomeDisplay(object):
    """Class containing functions to display metagenome visualizations:
        annotation        : interactive piechart of organism or functional abundances with clickable drilldown
        annotation_chart  : static piechart of organism or functional abundances
        bp_histogram      : areagraph of nucleotide distribution
        drisee            : plot of DRISEE sequencing error
        kmer              : plot of kmer profile
        metadata          : interactive table of full metadata
        mixs              : table of GSC MIxS metadata
        rank_abundance    : plot of taxanomic rank abundance
        rarefaction       : plot of species rarefaction
        summary_chart     : piechart of summary sequence hits
        summary_stats     : table of summary statistics
    """
    def __init__(self, mg, def_name=None):
        self.mg = mg
        # hack to get variable name
        if def_name == None:
            try:
                (filename,line_number,function_name,text)=traceback.extract_stack()[-2]
                def_name = text[:text.find('=')].strip()
            except:
                pass
        self.defined_name = def_name
        # load and create instance of metagenome widget
        self._mg_widget = 'window.mg_widget_'+random_str();
        self._widget_div = 'mg_div_'+random_str();
        html = "<div id='%s'></div>"%self._widget_div
        src = """
        (function() {
            Retina.load_widget("metagenome_overview").then( function() {
                """+self._mg_widget+""" = Retina.Widget.create('metagenome_overview', {'target': document.getElementById('"""+self._widget_div+"""')}, true);
                """+self._mg_widget+""".curr_mg = """+json.dumps(self.mg._mg_dict())+""";
                """+self._mg_widget+""".curr_mg_stats = """+json.dumps(self.mg.stats)+""";
            });
		})();
        """
        if Ipy.DEBUG:
            print src
        IPython.core.display.display_html(IPython.core.display.HTML(data=html))
        IPython.core.display.display_javascript(IPython.core.display.Javascript(data=src))
    
    def annotation(self, annotation='organism', level='domain', source='Subsystems', parent=None, arg_list=False):
        if self.mg.stats is None:
            self.mg._set_statistics()
        sub_ann = ''
        if annotation == 'organism':
            annotation = 'taxonomy'
            sub_ann = level
        elif annotation == 'function':
            annotation = 'ontology'
            sub_ann = source
        names  = get_taxonomy(level, parent) if (annotation == 'taxonomy') and (parent is not None) else None
        colors = google_palette(len(self.mg.stats[annotation][sub_ann]))
        data   = []
        for i, d in enumerate(self.mg.stats[annotation][sub_ann]):
            if (names is not None) and (d[0] not in names):
                continue
            data.append({'name': d[0], 'data': [int(d[1])], 'fill': colors[i]})
        annMax  = len(max(self.mg.stats[annotation][sub_ann], key=len))
        pwidth  = 300;
    	pheight = 300;
    	lwidth  = max(300, int(annMax * 7.5));
    	lheight = len(data) * 23;
    	width   = pwidth+lwidth;
    	height  = min(lheight, pheight+(pheight/2)) if lheight > pheight else pheight;
        keyArgs = { 'btype': 'pie',
                    'x_labels': [""],
                    'title': sub_ann,
                    'target': self.mg.id+"_"+level+'_'+random_str(),
                    'show_legend': True,
                    'legendArea': [pwidth+40, 20, lwidth, lheight],
    		        'chartArea': [25, 20, pwidth, pheight],
    		        'width': width,
    		        'height': height,
                    'data': data }
        if annotation == 'taxonomy':
            qname = self.defined_name.replace("'", "\\\'")
            keyArgs['onclick'] = '%s.annotation(annotation="organism", level="%s", parent="\'+params[\'series\']+\'")'%(qname, child_level(level, htype='taxonomy'))
        if Ipy.DEBUG:
            print keyArgs
        if arg_list:
            return keyArgs
        else:
            try:
                Ipy.RETINA.graph(**keyArgs)
            except:
                sys.stderr.write("Error producing %s chart"%annotation)
            return None
    
    def summary_chart(self, arg_list=False, target=None):
        try:
            Ipy.RETINA.metagenome(widget=self._mg_widget, view='summary_chart', arg_list=arg_list, target=target)
        except:
            sys.stderr.write("Error producing summary chart\n")
    
    def summary_stats(self, arg_list=False, target=None):
        try:
            Ipy.RETINA.metagenome(widget=self._mg_widget, view='summary_stats', arg_list=arg_list, target=target)
        except:
            sys.stderr.write("Error producing summary stats\n")
            
    def annotation_chart(self, annotation='organism', level='domain', source='Subsystems', arg_list=False, target=None):
        try:
            Ipy.RETINA.metagenome(widget=self._mg_widget, view='annotation_chart', annotation=annotation, level=level, source=source, arg_list=arg_list, target=target)
        except:
            sys.stderr.write("Error producing annotation chart\n")
            
    def bp_histogram(self, arg_list=False, target=None):
        if self.mg.sequence_type == 'Amplicon':
            sys.stderr.write("Unable to display bp histogram graph for Amplicon datasets.\n")
            return
        try:
            Ipy.RETINA.metagenome(widget=self._mg_widget, view='bp_histogram', arg_list=arg_list, target=target)
        except:
            sys.stderr.write("Error producing bp histogram\n")
            
    def drisee(self, arg_list=False, target=None):
        if self.mg.sequence_type == 'Amplicon':
            sys.stderr.write("Unable to display drisee plot for Amplicon datasets.\n")
            return
        try:
            Ipy.RETINA.metagenome(widget=self._mg_widget, view='drisee', arg_list=arg_list, target=target)
        except:
            sys.stderr.write("Error producing drisee plot\n")
            
    def kmer(self, kmer='abundance', arg_list=False, target=None):
        if self.mg.sequence_type == 'Amplicon':
            sys.stderr.write("Unable to display kmer profile for Amplicon datasets.\n")
            return
        try:
            Ipy.RETINA.metagenome(widget=self._mg_widget, view='kmer', kmer=kmer, arg_list=arg_list, target=target)
        except:
            sys.stderr.write("Error producing kmer plot\n")
            
    def rarefaction(self, arg_list=False, target=None):
        try:
            Ipy.RETINA.metagenome(widget=self._mg_widget, view='rarefaction', arg_list=arg_list, target=target)
        except:
            sys.stderr.write("Error producing rarefaction plot\n")
            
    def rank_abundance(self, level='domain', arg_list=False, target=None):
        try:
            Ipy.RETINA.metagenome(widget=self._mg_widget, view='rank_abundance', level=level, arg_list=arg_list, target=target)
        except:
            sys.stderr.write("Error producing rank abundance plot\n")
            
    def mixs(self, arg_list=False, target=None):
        if not hasattr(self.mg, 'mixs'):
            sys.stderr.write("No MIxS metadata available to display.\n")
            return
        try:
            Ipy.RETINA.metagenome(widget=self._mg_widget, view='mixs', arg_list=arg_list, target=target)
        except:
            sys.stderr.write("Error producing mixs metadata table\n")
            
    def metadata(self, arg_list=False, target=None):
        if not hasattr(self.mg, 'metadata'):
            sys.stderr.write("No metadata available to display.\n")
            return
        try:
            Ipy.RETINA.metagenome(widget=self._mg_widget, view='metadata', arg_list=arg_list, target=target)
        except:
            sys.stderr.write("Error producing full metadata table\n")
