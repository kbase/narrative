#!/usr/bin/env python

import pprint, traceback
import math, urllib, sys, os, re, hashlib
import rpy2.robjects as ro
from metagenome import Metagenome
from ipyTools import *
from collections import defaultdict
from datetime import datetime
from IPython.lib.display import FileLink

def get_analysis_set(ids=[], auth=None, method='WGS', function_source='Subsystems', all_values=False, def_name=None):
    """Wrapper for AnalysisSet object creation, checks if cache (created through unique option set) exists first and returns that.
    
    see: help(AnalysisSet)
    """
    if not ids:
        sys.stderr.write("No ids inputted\n")
        return
    cache_id  = "_".join(sorted(ids))+"_"+method+"_"+function_source
    cache_md5 = hashlib.md5(cache_id).hexdigest()
    cache_obj = load_object(cache_md5)
    if cache_obj is not None:
        print "Loading AnalysisSet for selected metagenomes from cached object"
        return cache_obj
    else:
        # hack to get variable name
        if def_name == None:
            (filename,line_number,function_name,text)=traceback.extract_stack()[-2]
            def_name = text[:text.find('=')].strip()
        print "Loading AnalysisSet for selected metagenomes through API.  Please wait, this may take several minutes ... "
        new_obj = AnalysisSet(ids=ids, auth=auth, method=method, function_source=function_source, all_values=all_values, def_name=def_name)
        save_object(new_obj, cache_md5)
        print "Done loading through API"
        return new_obj

class AnalysisSet(object):
    """Class for working with a set of Analysis objects:
        - Creates an Analysis object for each taxonimic level and functional level
        - allows boxplot, barchart, and heatmap navigation through hierarchies (drilldowns)
    
    see: help(Analysis)
    """
    def __init__(self, ids=[], auth=None, method='WGS', function_source='Subsystems', all_values=False, cache=None, def_name=None):
        self.method  = method
        self._auth   = auth
        self.all_mgs = ids
        self.display_mgs = self.all_mgs
        self.function_source = function_source
        tax_source = ''
        if self.method == 'WGS':
            tax_source = 'M5NR'
        elif self.method == 'Amplicon':
            tax_source = 'M5RNA'
        else:
            sys.stderr.write("Error: invalid method (%s), use one of 'WGS' or 'Amplicon'"%self.method)
        # hack to get variable name
        if def_name == None:
            (filename,line_number,function_name,text)=traceback.extract_stack()[-2]
            def_name = text[:text.find('=')].strip()
        self.defined_name = def_name
        # check for dir of biom files
        if cache and os.path.isdir(Ipy.NB_DIR+'/'+cache):
            biom_dir = Ipy.NB_DIR+'/'+cache
            sys.stdout.write("analysis-set '%s' loading from dir %s\n"%(self.defined_name, biom_dir))
            self._get_analysis_set(tax_source=tax_source, all_values=all_values, biom_dir=biom_dir)
        else:
            sys.stdout.write("analysis-set '%s' loading through api\n"%self.defined_name)
            self._get_analysis_set(tax_source=tax_source, all_values=all_values)
    
    def set_display_mgs(self, ids=[]):
        if (not ids) or (len(ids) == 0):
            sys.stdout.write("setting %s.display_mgs to all metagenomes in set\n"%self.defined_name)
            self.display_mgs = self.all_mgs
        else:
            self.display_mgs = ids
    
    def _get_analysis_set(self, tax_source='M5NR', all_values=False, biom_dir=None):
        # get data
        for tax in Ipy.TAX_SET:
            values = {}
            if all_values:
                for val in Ipy.VALUES:
                    values[val] = self._get_analysis(self.all_mgs, 'organism', tax, val, tax_source, biom_dir)
            else:
                values['abundance'] = self._get_analysis(self.all_mgs, 'organism', tax, 'abundance', tax_source, biom_dir)
            setattr(self, tax, values)
        if self.method == 'WGS':
            for ont in Ipy.ONT_SET:
                values = {}
                if all_values:
                    for val in Ipy.VALUES:
                        values[val] = self._get_analysis(self.all_mgs, 'function', ont, val, self.function_source, biom_dir)
                else:
                    values['abundance'] = self._get_analysis(self.all_mgs, 'function', ont, 'abundance', self.function_source, biom_dir)
                setattr(self, ont, values)

    def _get_analysis(self, ids, annotation, level, result_type, source, biom_dir):
        # this needs to be created same way as matrix api builds it
        matrix_id = "_".join(sorted(ids))+"_"+"_".join([annotation, level, source, Ipy.MATRIX['hit_type'], result_type])
        matrix_id += "_%d_%d_%d"%(Ipy.MATRIX['e_val'], Ipy.MATRIX['ident'], Ipy.MATRIX['alen'])
        matrix_md5 = hashlib.md5(matrix_id).hexdigest()
        sub_def_name = self.defined_name+'.'+level+"['"+result_type+"']"
        # load from biom_dir
        if biom_dir:
            md5_file = biom_dir+'/'+matrix_md5+'.biom'
            id_file  = biom_dir+'/'+matrix_id+'.biom'
            if os.path.isfile(md5_file):
                if Ipy.DEBUG:
                    sys.stdout.write("loading %s.biom (%s) from dir %s ... \n"%(matrix_md5, matrix_id, biom_dir))
                return Analysis(bfile=md5_file, auth=self._auth, def_name=sub_def_name)
            elif os.path.isfile(id_file):
                if Ipy.DEBUG:
                    sys.stdout.write("loading %s.biom from dir %s ... \n"%(matrix_id, biom_dir))
                return Analysis(bfile=id_file, auth=self._auth, def_name=sub_def_name)
            else:
                sys.stderr.write("no biom file for %s in dir %s\n"%(matrix_id, biom_dir))
                return None
        # load through api
        else:
            if Ipy.DEBUG:
                sys.stdout.write("loading %s through api ... \n"%matrix_id)
            keyArgs = Ipy.MATRIX
            keyArgs['ids'] = ids
            keyArgs['annotation'] = annotation
            keyArgs['level'] = level
            keyArgs['result_type'] = result_type
            keyArgs['hit_type'] = Ipy.MATRIX['hit_type']
            keyArgs['source'] = source
            keyArgs['def_name'] = sub_def_name
            if self._auth:
                keyArgs['auth'] = self._auth
            return Analysis(**keyArgs)

    def boxplot(self, annot='organism', level='domain', parent=None, width=300, height=300, title="", normalize=1, col_name=True, show_data=False, arg_list=False):
        if (self.method == 'Amplicon') and (annot == 'function'):
            sys.stderr.write("'%s' is an Amplicon dataset and contains no functional annotations\n"%self.defined_name)
            return None
        children = []
        if parent and (len(parent) > 0):
            for p in parent:
                children.extend( get_hierarchy(htype=annot, level=level, source=self.function_source, parent=p) )
        if children and (len(children) > 0):
            children = filter(lambda x: x, children)
        keyArgs = { 'normalize': normalize,
                    'width': width,
                    'height': height,
                    'title': title,
                    'rows': children,
                    'cols': self.display_mgs,
                    'col_name': col_name,
                    'show_data': show_data,
                    'arg_list': arg_list,
                    'source': 'retina' }
        if Ipy.DEBUG:
            print annot, level, keyArgs
        to_plot = getattr(self, level)
        return to_plot['abundance'].boxplot(**keyArgs)
    
    def barchart(self, annot='organism', level='domain', parent=None, width=800, height=0, title="", legend=True, normalize=1, col_name=True, row_full=False, show_data=False, arg_list=False):
        if (self.method == 'Amplicon') and (annot == 'function'):
            sys.stderr.write("'%s' is an Amplicon dataset and contains no functional annotations\n"%self.defined_name)
            return None
        children = []
        if parent and (len(parent) > 0):
            for p in parent:
                children.extend( get_hierarchy(htype=annot, level=level, source=self.function_source, parent=p) )
        if children and (len(children) > 0):
            children = filter(lambda x: x, children)
        keyArgs = { 'normalize': normalize,
                    'width': width,
                    'height': height,
                    'x_rotate': '0',
                    'title': title,
                    'legend': legend,
                    'rows': children,
                    'cols': self.display_mgs,
                    'col_name': col_name,
                    'row_full': row_full,
                    'show_data': show_data,
                    'arg_list': arg_list }
        next_level = child_level(level, htype=annot)
        if next_level:
            click_opts = (self.defined_name.replace("'", "\\\'"), next_level, annot, normalize, width, height, title, self._bool(legend), self._bool(col_name), self._bool(row_full), self._bool(show_data))
            keyArgs['onclick'] = '%s.barchart(level="%s", parent=["\'+params[\'label\']+\'"], annot="%s", normalize=%d, width=%d, height=%d, title="%s", legend=%s, col_name=%s, row_full=%s, show_data=%s)'%click_opts
        if Ipy.DEBUG:
            print annot, level, next_level, keyArgs
        to_plot = getattr(self, level)
        return to_plot['abundance'].barchart(**keyArgs)
        
    def heatmap(self, annot='organism', level='domain', parent=None, width=700, height=600, normalize=1, dist='bray-curtis', clust='ward', col_name=True, row_full=False, show_data=False, arg_list=False):
        if (self.method == 'Amplicon') and (annot == 'function'):
            sys.stderr.write("'%s' is an Amplicon dataset and contains no functional annotations\n"%self.defined_name)
            return None
        children = []
        if parent and (len(parent) > 0):
            for p in parent:
                children.extend( get_hierarchy(htype=annot, level=level, source=self.function_source, parent=p) )
        if children and (len(children) > 0):
            children = filter(lambda x: x, children)
        keyArgs = { 'normalize': normalize,
                    'width': width,
                    'height': height,
                    'dist': dist,
                    'clust': clust,
                    'rows': children,
                    'cols': self.display_mgs,
                    'col_name': col_name,
                    'row_full': row_full,
                    'show_data': show_data,
                    'arg_list': arg_list,
                    'source': 'retina' }
        next_level = child_level(level, htype=annot)
        if next_level:
            click_opts = (self.defined_name.replace("'", "\\\'"), next_level, annot, normalize, width, height, dist, clust, self._bool(col_name), self._bool(row_full), self._bool(show_data))
            keyArgs['onclick'] = '%s.heatmap(level="%s", parent="\'+sel_names+\'", annot="%s", normalize=%d, width=%d, height=%d, dist="%s", clust="%s", col_name=%s, row_full=%s, show_data=%s)'%click_opts
        if Ipy.DEBUG:
            print annot, level, next_level, keyArgs
        to_plot = getattr(self, level)
        return to_plot['abundance'].heatmap(**keyArgs)

    def pco(self, annot='organism', level='domain', parent=None, width=700, height=600, title="", legend=True, normalize=1, dist='bray-curtis', x_axis=1, y_axis=2, col_name=True, show_data=False, arg_list=False):
        if (self.method == 'Amplicon') and (annot == 'function'):
            sys.stderr.write("'%s' is an Amplicon dataset and contains no functional annotations\n"%self.defined_name)
            return None
        children = []
        if parent and (len(parent) > 0):
            for p in parent:
                children.extend( get_hierarchy(htype=annot, level=level, source=self.function_source, parent=p) )
        if children and (len(children) > 0):
            children = filter(lambda x: x, children)
        keyArgs = { 'normalize': normalize,
                    'width': width,
                    'height': height,
                    'title': title,
                    'legend': legend,
                    'dist': dist,
                    'x_axis': x_axis,
                    'y_axis': y_axis,
                    'rows': children,
                    'cols': self.display_mgs,
                    'col_name': col_name,
                    'show_data': show_data,
                    'arg_list': arg_list,
                    'source': 'retina' }
        next_level = child_level(level, htype=annot)
        #if next_level:
            #click_opts = (self.defined_name, next_level, annot, normalize, width, height, dist, clust, self._bool(col_name), self._bool(row_full), self._bool(show_data))
            #keyArgs['onclick'] = "'%s.heatmap(level=\"%s\", parent=\"'+sel_names+'\", annot=\"%s\", normalize=%d, width=%d, height=%d, dist=\"%s\", clust=\"%s\", col_name=%s, row_full=%s, show_data=%s)'"%click_opts
        if Ipy.DEBUG:
            print annot, level, next_level, keyArgs
        to_plot = getattr(self, level)
        return to_plot['abundance'].pco(**keyArgs)

    def _bool(self, aBool):
        if aBool:
            return 'True'
        else:
            return 'False'

class Analysis(object):
    """Class representation of Matrix object:
        self.biom (BIOM format):
            "id"                   : [ 'string', 'unique object identifier' ],
            "format"               : [ 'string', 'format specification name' ],
            "format_url"           : [ 'string', 'url to the format specification' ],
            "type"                 : [ 'string', 'type of the data in the return table (taxon, function or gene)' ],
            "generated_by"         : [ 'string', 'identifier of the data generator' ],
            "date"                 : [ 'date',   'time the output data was generated' ],
            "matrix_type"          : [ 'string', 'type of the data encoding matrix (dense or sparse)' ],
            "matrix_element_type"  : [ 'string', 'data type of the elements in the return matrix' ],
            "matrix_element_value" : [ 'string', 'result_type of the elements in the return matrix' ],
            "shape"                : [ 'list', ['integer', 'list of the dimension sizes of the return matrix'] ],
            "rows"                 : [ 'list', ['object', [{'id'       => ['string', 'unique annotation text'],
                                                            'metadata' => ['hash', 'key value pairs describing metadata']}, "rows object"]] ],
            "columns"              : [ 'list', ['object', [{'id'       => ['string', 'unique metagenome identifier'],
            	                                            'metadata' => ['hash', 'key value pairs describing metadata']}, "columns object"]] ],
            "data"                 : [ 'list', ['list', ['float', 'the matrix values']] ]
        self.id       : BIOM id
        self.numIDs   : BIOM column count
        self.numAnnot : BIOM row count
        self.Dmatrix  : dense matrix of BIOM data
        self.Rmatrix  : R-format dense matrix
        self.SDmatrix : scaled dense matrix (abundance sum)
        self.SRmatrix : R scaled matrix object (abundance sum)
        self.NDmatrix : normalized dense matrix
        self.NRmatrix : normalized R-format dense matrix
        
        Visualizations:
            self.dump()     : produce file or string of BIOM or tab-deliminated matrix
            self.boxplot()  : boxplot display
            self.barchart() : horizontal barchart of metagenomes / annotations
            self.pco()      : pco plot of metagenomes
            self.heatmap()  : dendogram of metagenomes / annotations
    """
    def __init__(self, ids=[], annotation=None, level=None, result_type=None, hit_type=None, source=None, e_val=None, ident=None, alen=None, filters=[], filter_source=None, biom=None, bfile=None, auth=None, def_name=None):
        self._auth = auth
        # hack to get variable name
        if def_name == None:
            (filename,line_number,function_name,text)=traceback.extract_stack()[-2]
            def_name = text[:text.find('=')].strip()
        self.defined_name = def_name
        if (biom is None) and (bfile is None):
            self.biom = self._get_matrix(ids, annotation, level, result_type, hit_type, source, e_val, ident, alen, filters, filter_source)
        elif biom and isinstance(biom, dict):
            self.biom = biom
        elif bfile and os.path.isfile(bfile):
            try:
                bhdl = open(bfile, 'rU')
                self.biom = json.load(bhdl)
                bhdl.close()
            except:
                self.biom = None
        else:
            self.biom = None
        self._init_matrix()

    def _init_matrix(self):
        if (not self.biom) or (self.biom and ('id' not in self.biom) and ('data' not in self.biom)):
            sys.stderr.write("Error: Invalid BIOM object\n"+pprint.pformat(self.biom))
            self.biom = None
        self.id = self.biom['id'] if self.biom else ""
        self.hierarchy = self._get_type(self.biom)
        self.result_type = self.biom['matrix_element_value'] if self.biom else ""
        self.numIDs = self.biom['shape'][1] if self.biom else 0
        self.numAnnot = self.biom['shape'][0] if self.biom else 0
        self.Dmatrix  = self._dense_matrix()  # count dense matrix
        self.Rmatrix  = pyMatrix_to_rMatrix(self.Dmatrix, self.numAnnot, self.numIDs) # R count matrix object
        self.SDmatrix = None  # scaled dense matrix (abundance sum)
        self.SRmatrix = None  # R scaled matrix object (abundance sum)
        self.NDmatrix = None  # normalized dense matrix
        self.NRmatrix = None  # R normalized matrix object
        if self.result_type == 'abundance':
            self._scale_matrix() # only scale abundance counts
            self._normalize_matrix() # only normalize abundance counts
        self.alpha_diversity = None
        self.rarefaction     = None
    
    def _get_matrix(self, ids, annotation, level, result_type, hit_type, source, e_val, ident, alen, filters, filter_source):
        params = map(lambda x: ('id', x), ids)
        params.append(('hide_metadata', '1'))
        if not annotation:
            annotation = Ipy.MATRIX['annotation']
        if level:
            params.append(('group_level', level))
        if result_type:
            params.append(('result_type', result_type))
        if hit_type:
            params.append(('hit_type', hit_type))
        if source:
            params.append(('source', source))
        if e_val:
            params.append(('evalue', str(e_val)))
        if ident:
            params.append(('identity', str(ident)))
        if alen:
            params.append(('length', str(alen)))
        if len(filters) > 0:
            params.extend( map(lambda x: ('filter', x), filters) )
            if filter_source:
                params.append(('filter_source', filter_source))
        return obj_from_url( Ipy.API_URL+'/matrix/'+annotation+'?'+urllib.urlencode(params, True), self._auth )

    def _get_type(self, biom):
        hier = ''
        if biom and biom['type'].startswith('Taxon'):
            hier = 'taxonomy'
        elif biom and biom['type'].startswith('Function'):
            hier = 'ontology'
        return hier

    def _get_row_label(self, row, row_full=False):
        if row_full and self.hierarchy and row['metadata'] and (self.hierarchy in row['metadata']):
            return ";".join(map(lambda x: 'none' if x is None else x, row['metadata'][self.hierarchy]))+" ("+row['id']+")"
        else:
            return row['id']

    def find_annotation(self, text, row_full=True):
        if not self.biom:
            return []
        str_re = re.compile(text, re.IGNORECASE)
        annot = []
        for r in self.biom['rows']:
            if r['metadata'] and self.hierarchy and (self.hierarchy in r['metadata']) and str_re.search(r['metadata'][self.hierarchy][-1]):
                annot.append( self._get_row_label(r, row_full=row_full) )
            elif str_re.search(r['id']):
                annot.append( self._get_row_label(r, row_full=row_full) )
        return annot

    def sub_matrix(self, normalize=0, scale='auto', row_min=1, cols=None, rows=None, mark_zero=False):
        """input: list of col ids, list of row ids, strip option
        return matrix of just those items (if they exist)
        if sum of row is < 'row_min', remove it
        if normalize is true, perform above on raw and then replace final values with pre-normalized
        if normalize is false and scale
        """
        all_annot = self.annotations()
        all_mgids = self.ids()
        if not cols:
            cols = all_mgids
        if not rows:
            rows = all_annot
        matrix = self.Dmatrix
        # use normalized matrix
        if normalize and self.NDmatrix:
            scale  = None
            matrix = self.NDmatrix
        # use scaled matrix
        elif scale and isinstance(scale, str) and (scale == 'auto'):
            matrix = self.SDmatrix
        sub_matrix = []
        sub_rows = []
        sub_cols = []
        # validate rows / get indexes
        rows = self.force_row_ids(rows)
        rIndex = []
        for r in rows:
            try:
                rIndex.append( all_annot.index(r) )
            except (ValueError, AttributeError):
                pass
        # validate cols / get indexes
        cIndex = []
        for c in cols:
            try:
                cIndex.append( all_mgids.index(c) )
                sub_cols.append(c)
            except (ValueError, AttributeError):
                pass
        # build matrix / remove empty rows
        for i in rIndex:
            test = []
            rdata = []
            for j in cIndex:
                test.append(self.Dmatrix[i][j])
                val = matrix[i][j]
                # user inputted scaling
                if scale and isinstance(scale, dict) and (all_mgids[j] in scale):
                    val = float(val) / scale[all_mgids[j]]
                # output strings
                if mark_zero:
                    val = str(val) + ('*' if self.Dmatrix[i][j] == 0 else '')
                rdata.append(val)
            # test if raw row is too small
            if sum(test) < row_min:
                continue
            sub_rows.append(all_annot[i])
            sub_matrix.append(rdata)
        return sub_rows, sub_cols, sub_matrix

    def dump(self, fname=None, fformat='biom', normalize=0, scale='auto', row_min=1, matrix=None, rows=None, cols=None, col_name=True, row_full=True, mark_zero=False):
        """Function for outputing the analysis object to flatfile or text string
            Inputs:
                fname:     name of file to output too, if undefined returns string
                fformat:   format of output, options are 'biom' or 'tab', default is 'biom'
                normalize: boolean - if true output normalized abundance values, default is false
                matrix:    if passed a matrix, just dump it and given rows / cols and don't create sub_matrix and normalize
                rows:      if list of row ids is passed will only output matrix of those rows, else output all rows
                cols:      if list of column ids is passed will only output matrix of those columns, else output all columns
                metadata:  boolean - for 'tab' output, print last metadata of hierarchy for rows instaed of row id, default false
                col_name:  boolean - for 'tab' output, print column name instead of column id, default is false
            Output available:
                1. biom file
                2. biom string
                3. tab-deliminated file
                4. tab-deliminated string
        """
        output = ""
        if not self.biom:
            sys.stderr.write("Error dumping %s, no data\n"%self.id)
            return None
        if fformat == 'biom':
            # biom dump
            output = json.dumps(self.biom)
        else:
            # get sub parts if not passed matrix, rows, cols:
            # this will validate that rows and cols are in biom and are ids, and that matrix has no all 0 slices
            # will also re-normalize if creating sub-matrix
            if not (matrix and rows and cols):
                rows, cols, matrix = self.sub_matrix(normalize=normalize, scale=scale, row_min=row_min, cols=cols, rows=rows, mark_zero=mark_zero)
            if not matrix:
                sys.stderr.write("No abundance data available for the inputted columns and rows\n")
                return None
            # col names if requested
            if col_name:
                all_mgids = self.ids()
                new_cols  = []
                for c in cols:
                    i = all_mgids.index(c)
                    new_cols.append( self.biom['columns'][i]['name'] )
                cols = new_cols
            # row path if requested
            if row_full and self.hierarchy:
                all_annot = self.annotations()
                new_rows  = []
                for r in rows:
                    i = all_annot.index(r)
                    new_rows.append( self._get_row_label(self.biom['rows'][i], row_full=row_full) )
                rows = new_rows
            # print matrix
            output = matrix_to_file(matrix=matrix, cols=cols, rows=rows)
        if fname:
            open(fname, 'w').write(output)
            return FileLink(fname)
        else:
            return output

    def ids(self):
        if not self.biom:
            return []
        return map(lambda x: x['id'], self.biom['columns'])

    def names(self):
        if not self.biom:
            return []
        return map(lambda x: x['name'], self.biom['columns'])

    def annotations(self, row_full=False):
        """returns a list of annotations (row ids)
        if show_id=False then returns a list of lists (metadata hierarchies) for row"""
        if not self.biom:
            return []
        annot = []
        for r in self.biom['rows']:
            annot.append( self._get_row_label(r, row_full=row_full) )
        return annot

    def force_row_ids(self, rows):
        """returns input list with last hierarchal metadata name replaced with id.
        This re-orders input in same order as biom['rows']", and drops those items not in biom['rows']
        """
        ann = []
        if not self.hierarchy:
            # no hierarchy metadata, just return valid ids
            ann = map( lambda y: y['id'], filter(lambda x: x['id'] in rows, self.biom['rows']) )
        else:
            # return only valid ids, input may be id or last heirarchal item
            for r in self.biom['rows']:
                if r['id'] in rows:
                    ann.append(r['id'])
                elif r['metadata'] and (self.hierarchy in r['metadata']) and (r['metadata'][self.hierarchy][-1] in rows):
                    ann.append(r['id'])
        return ann

    def get_id_object(self, aid):
        if not self.biom:
            return None
        try:
            items = self.ids()
            index = items.index(aid)
        except (ValueError, AttributeError):
            return None        
        mg = Metagenome(aid, auth=self._auth)
        if mg.name is not None:
            return mg
        else:
            return self.biom['columns'][index]
    
    def alpha_diversity(self):
        if self.hierarchy != 'taxonomy':
            return None
        if self.alpha_diversity is None:
            alphaDiv = {}
            for i, aID in enumerate(self.ids()):
                col = slice_column(self.Dmatrix, i)
                h1  = 0
                s1  = sum(col)
                if not s1:
                    alphaDiv[aID] = 0
                    continue
                for n in col:
                    p = n/s1
                    if p > 0:
                        h1 += (p * math.log(1/p)) / math.log(2)
                alphaDiv[aID] = 2**h1
            self.alpha_diversity = alphaDiv
        return self.alpha_diversity

    def rarefaction(self):
        if self.hierarchy != 'taxonomy':
            return None
        if self.rarefaction is None:
            rareFact = defaultdict(list)
            for i, aID in enumerate(self.ids()):
                mg = self.get_id_object(aID)
                if ('rarefaction' in mg.stats) and (len(mg.stats['rarefaction']) > 0):
                    rareFact[aID] = mg.stats['rarefaction']
                    continue
                try:
                    nseq = int(mg.stats['sequence_count_raw'])
                    size = int(nseq/1000) if nseq > 1000 else 1
                except (ValueError, KeyError, TypeError, AttributeError):
                    rareFact[aID] = []
                    continue
                nums = slice_column(self.Dmatrix, i)
                lnum = len(nums)
                nums.sort()
                for i in xrange(0, nseq, size):
                    coeff = self._nCr2ln(nseq, i)
                    curr  = 0
                    for n in nums:
                        curr += math.exp(self._nCr2ln(nseq-n, i) - coeff)
                    rareFact[aID].append([i, lnum-curr])
            self.rarefaction = rareFact
        return self.rarefaction

    def _nCr2ln(self, n, r):
        c = 1
        if r > n:
            return c
        if (r < 50) and (n < 50):
            for x in xrange(0, r-1):
                c += (c * (n-x)) / (x+1)
            return math.log(c)
        if r <= n:
            c = self._gammaln(n+1) - self._gammaln(r+1) - self._gammaln(n-r)
        else:
            c = -1000
        return c

    def _gammaln(self, x):
        if x > 0:
            s = math.log(x)
            return math.log(2 * math.pi) / 2 + x * s + s / 2 - x
        else:
            return 0

    def boxplot(self, normalize=1, scale='auto', title='', width=300, height=300, cols=None, rows=None, col_name=True, show_data=False, arg_list=False, source='retina'):
        # default is all
        if (not cols) or (len(cols) == 0):
            cols = self.ids()
        if (not rows) or (len(rows) == 0):
            rows = self.annotations()
        # force rows to be row ids
        else:
            rows = self.force_row_ids(rows)
        rows, cols, matrix = self.sub_matrix(normalize=normalize, scale=scale, cols=cols, rows=rows)
        if not matrix:
            sys.stderr.write("No abundance data available for the inputted columns and rows\n")
            return None
        if show_data:
            print self.dump(fformat='tab', matrix=matrix, rows=rows, cols=cols, col_name=col_name)
        if source == 'retina':
            keyArgs = { 'data': matrix,
                        'width': width,
                        'height': height,
                        'target': 'div_boxplot_'+random_str() }
            if Ipy.DEBUG:
                print cols, rows, keyArgs
            if arg_list:
                return keyArgs
            else:
                try:
                    Ipy.RETINA.boxplot(**keyArgs)
                except:
                    sys.stderr.write("Error producing boxplot\n")
                return None
        else:
            fname = Ipy.IMG_DIR+'/boxplot_'+random_str()+'.svg'
            if col_name:
                labels = map(lambda y: y['name'], filter(lambda x: x['id'] in cols, self.biom['columns']))
            else:
                labels = cols
            keyArgs = { 'names': ro.StrVector(labels),
                        'main': title,
                        'show.names': True,
                        'las': 2,
                        'outpch': 21,
                        'outcex': 0.5,
                        'cex.lab': 0.8,
                        'boxwex': 0.6,
                        'cex.axis': 0.7 }
            if Ipy.DEBUG:
                print fname, keyArgs
            ro.r.svg(fname)
            ro.r.boxplot(matrix, **keyArgs)
            ro.r("dev.off()")
            return fname

    def pco(self, normalize=1, scale='auto', title='', dist='bray-curtis', width=700, height=600, x_axis=1, y_axis=2, legend=True, cols=None, rows=None, col_name=True, show_data=False, arg_list=False, source='retina'):
        # default is all
        if (not cols) or (len(cols) == 0):
            cols = self.ids()
        if (not rows) or (len(rows) == 0):
            rows = self.annotations()
        # force rows to be row ids
        else:
            rows = self.force_row_ids(rows)
        if source == 'retina':
            # run our own R code
            matrix_file = Ipy.TMP_DIR+'/matrix.'+random_str()+'.tab'
            pco_file = Ipy.TMP_DIR+'/pco.'+random_str()+'.txt'
            dump_str = self.dump(fformat='tab', normalize=normalize, scale=scale, rows=rows, cols=cols, col_name=col_name, row_full=False)
            if not dump_str:
                return None
            dump_set = dump_str.strip().split("\n")
            cols = dump_set[0].strip().split("\t")
            rows = map(lambda x: x.split("\t")[0], dump_set[1:])
            if show_data:
                print dump_str
            open(matrix_file, 'w').write(dump_str)
            rcmd = 'source("%s")\nMGRAST_plot_pco(file_in="%s", file_out="%s", dist_method="%s", headers=1)\n'%(Ipy.LIB_DIR+'/plot_pco.r', matrix_file, pco_file, dist)
            ro.r(rcmd)
            ## get data from pco_file
            eigen_values, eigen_vectors = eigen_data_from_file(pco_file)
            if (x_axis < 1) or (y_axis < 1) or (x_axis > len(eigen_values)) or (y_axis > len(eigen_values)):
                sys.stderr.write("Error: x_axis (%d) and/or y_axis (%d) set beyond principal coordinate range (1 - %d)\n"%(x_axis, y_axis, len(eigen_values)))
            series = []
            points = []
            x_all  = []
            y_all  = []
            colors = google_palette(len(cols))
            for i, c in enumerate(cols):
                series.append({'name': c, 'color': colors[i], 'shape': 'circle', 'filled': 1})
                points.append([{'x': eigen_vectors[c][x_axis-1], 'y': eigen_vectors[c][y_axis-1]}])
                x_all.append(eigen_vectors[c][x_axis-1])
                y_all.append(eigen_vectors[c][y_axis-1])
            x_buffer = math.fabs( (max(x_all) - min(x_all)) * 0.1 )
            y_buffer = math.fabs( (max(y_all) - min(y_all)) * 0.1 )
            data = {'series': series, 'points': points}
            keyArgs = { 'width': width,
                        'height': height,
                        'title': title,
                        'x_title': "PCO%d r^2 %0.5f"%(x_axis, eigen_values[x_axis-1]),
                        'y_title': "PCO%d r^2 %0.5f"%(y_axis, eigen_values[y_axis-1]),
                        'x_min': min(x_all) - x_buffer,
                        'x_max': max(x_all) + x_buffer,
                        'y_min': min(y_all) - y_buffer,
                        'y_max': max(y_all) + y_buffer,
                        'target': 'div_pco_'+random_str(),
                        'show_legend': legend,
                        'connected': False,
                        'show_dots': True,
                        'data': data }
            if Ipy.DEBUG:
                print cols, rows, keyArgs
            if arg_list:
                return keyArgs
            else:
                try:
                    Ipy.RETINA.plot(**keyArgs)
                except:
                    sys.stderr.write("Error producing pco plot\n")
                return None
        else:
            rows, cols, matrix = self.sub_matrix(normalize=normalize, scale=scale, cols=cols, rows=rows)
            if show_data:
                print self.dump(fformat='tab', matrix=matrix, rows=rows, cols=cols, col_name=col_name)
            fname = Ipy.IMG_DIR+'/pco_'+random_str()+'.svg'
            if col_name:
                labels = map(lambda y: y['name'], filter(lambda x: x['id'] in cols, self.biom['columns']))
            else:
                labels = cols
            keyArgs = { 'main': title, 'names': ro.StrVector(labels) }
            if Ipy.DEBUG:
                print fname, keyArgs
            ro.r.svg(fname)
            ro.r.scatterplot3d(matrix, **keyArgs)
            ro.r("dev.off()")
            return fname

    def heatmap(self, normalize=1, scale='auto', title='', dist='bray-curtis', clust='ward', width=700, height=600, cols=None, rows=None, col_name=True, row_full=False, show_data=False, arg_list=False, onclick=None, source='retina'):
        if source == 'retina':
            return self._retina_heatmap(normalize=normalize, scale=scale, dist=dist, clust=clust, width=width, height=height, cols=cols, rows=rows, col_name=col_name, row_full=row_full, show_data=show_data, arg_list=arg_list, onclick=onclick)
        else:
            return self._matr_heatmap(normalize=normalize, title=title, col_name=col_name)

    def _retina_heatmap(self, normalize=1, scale='auto', dist='bray-curtis', clust='ward', width=700, height=600, cols=None, rows=None, col_name=True, row_full=False, show_data=False, arg_list=False, onclick=None):
        # default is all
        if (not cols) or (len(cols) == 0):
            cols = self.ids()
        if (not rows) or (len(rows) == 0):
            rows = self.annotations()
        # force rows to be row ids
        else:
            rows = self.force_row_ids(rows)
        # run our own R code
        matrix_file = Ipy.TMP_DIR+'/matrix.'+random_str()+'.tab'
        col_file = Ipy.TMP_DIR+'/col_clust.'+random_str()+'.txt'
        row_file = Ipy.TMP_DIR+'/row_clust.'+random_str()+'.txt'
        dump_str = self.dump(fformat='tab', normalize=normalize, scale=scale, rows=rows, cols=cols, col_name=col_name, row_full=row_full)
        if not dump_str:
            return None
        dump_set = dump_str.strip().split("\n")
        cols = dump_set[0].strip().split("\t")
        rows = map(lambda x: x.split("\t")[0], dump_set[1:])
        if show_data:
            print dump_str
        open(matrix_file, 'w').write(dump_str)
        rcmd = 'source("%s")\nMGRAST_dendrograms(file_in="%s", file_out_column="%s", file_out_row="%s", dist_method="%s", clust_method="%s", produce_figures="FALSE")\n'%(Ipy.LIB_DIR+'/dendrogram.r', matrix_file, col_file, row_file, dist, clust)
        ro.r(rcmd)
        cord, cdist = ordered_distance_from_file(col_file)
        rord, rdist = ordered_distance_from_file(row_file)
        sub_matrix  = matrix_from_file(matrix_file)
        data = { 'columns': cols,
                 'rows': rows,
                 'colindex': cord,
                 'rowindex': rord,
                 'coldend': cdist,
                 'rowdend': rdist,
                 'data': sub_matrix }
        lwidth  = len(max(rows, key=len)) * 7.2
        keyArgs = { 'data': data,
                    'width': int(width+lwidth),
                    'height': height,
                    'target': 'div_heatmap_'+random_str(),
                    'tree_width': 200,
                    'legend_width': int(lwidth),
                    'onclick': onclick }
        if Ipy.DEBUG:
            print keyArgs
        if arg_list:
            return keyArgs
        else:
            try:
                Ipy.RETINA.heatmap(**keyArgs)
            except:
                sys.stderr.write("Error producing heatmap\n")
            return None

    def _matr_heatmap(self, normalize=1, title='', col_name=True):
        matrix = self.NRmatrix if normalize and self.NRmatrix else self.Rmatrix
        fname  = Ipy.IMG_DIR+'/heatmap_'+random_str()+'.svg'
        labels = self.names() if col_name else self.ids()
        if not matrix:
            return None
        keyArgs = { 'labCol': ro.StrVector(labels),
                    'labRow': '',
                    'main': title,
                    'cexCol': 0.95,
                    'margins': ro.r.c(8,1) }
        if Ipy.DEBUG:
            print fname
        ro.r.svg(fname)
        ro.r.heatmap(matrix, **keyArgs)
        ro.r("dev.off()")
        return fname

    def barchart(self, normalize=1, scale='auto', width=800, height=0, x_rotate='0', title="", legend=True, cols=None, rows=None, col_name=True, row_full=False, show_data=False, arg_list=False, onclick=None):
        # default is all
        all_mgids = self.ids()
        all_annot = self.annotations()
        if not cols:
            cols = all_mgids
        if not rows:
            rows = all_annot
        # force rows to be row ids
        else:
            rows = self.force_row_ids(rows)
        rows, cols, matrix = self.sub_matrix(normalize=normalize, scale=scale, cols=cols, rows=rows)
        if not matrix:
            sys.stderr.write("No abundance data available for the inputted columns and rows\n")
            return None
        colors = google_palette(len(cols))
        labels = []
        data = []
        # show data
        if show_data:
            print self.dump(fformat='tab', matrix=matrix, rows=rows, cols=cols, col_name=col_name, row_full=row_full)
        # set retina data
        for i, c in enumerate(cols):
            try:
                j = all_mgids.index(c)
                name = c if not col_name else self.biom['columns'][j]['name']
            except:
                name = c
            data.append({'name': name, 'data': slice_column(matrix, i), 'fill': colors[i]})
        # set labels
        if row_full and self.hierarchy:
            for r in rows:
                try:
                    i = all_annot.index(r)
                    labels.append( self._get_row_label(self.biom['rows'][i], row_full=row_full) )
                except:
                    labels.append(r)
        else:
            labels = rows
        # get retina parameters
        height  = height if height else len(labels)*len(cols)*7.5
        lheight = min(height, len(cols)*35)
        lwidth  = len(max(labels, key=len)) * 7.5
        cwidth  = 0.85 if legend else 0.99
        keyArgs = { 'btype': 'row',
                    'width': int(width+lwidth),
                    'height': int(height),
                    'x_labels': labels,
                    'x_labels_rotation': x_rotate,
                    'title': title,
                    'target': 'div_graph_'+random_str(),
                    'show_legend': legend,
                    'legendArea': [0.87, 0.05, 0.2, int(lheight)],
                    'chartArea': [int(lwidth), 0.02, cwidth, 0.95],
                    'data': data,
                    'onclick': onclick }
        if normalize and self.NDmatrix:
            keyArgs['y_labeled_tick_interval'] = 0.1
        if Ipy.DEBUG:
            print cols, rows, keyArgs
        if arg_list:
            return keyArgs
        else:
            try:
                Ipy.RETINA.graph(**keyArgs)
            except:
                sys.stderr.write("Error producing chart\n")
            return None

    def _scale_matrix(self):
        try:
            self.SDmatrix = relative_abundance_matrix(self.Dmatrix)
            self.SRmatrix = pyMatrix_to_rMatrix(self.SDmatrix, self.numAnnot, self.numIDs)
        except:
            sys.stderr.write("Error scaling matrix to adundance sum (%s)\n"%self.id)

    def _normalize_matrix(self):
        # skip single metagenome matrix
        if self.numIDs == 1:
            return
        try:
            # can matr do it ?
            self.NRmatrix = ro.r.normalize(self.Rmatrix)
            self.NDmatrix = rMatrix_to_pyMatrix(self.NRmatrix, self.numAnnot, self.numIDs)
        except:
            try:
                # run our own R code
                raw_file = Ipy.TMP_DIR+'/raw.'+random_str()+'.tab'
                matrix_to_file(fname=raw_file, matrix=self.Dmatrix, cols=self.ids(), rows=self.annotations())
                norm_file = self._normalize_tabbed(raw_file)
                self.NDmatrix = matrix_from_file(norm_file, has_col_names=True, has_row_names=True)
                self.NRmatrix = pyMatrix_to_rMatrix(self.NDmatrix, self.numAnnot, self.numIDs, normalize=1)
            except:
                sys.stderr.write("Error normalizing matrix (%s)\n"%self.id)

    def _normalize_tabbed(self, rfile):
        """input: raw tabbed matrix file (with column and row headers)
        return: normalized tabbed matrix file (with column and row headers)"""
        nfile = Ipy.TMP_DIR+'/norm.'+random_str()+'.tab'
        rcmd = 'source("%s")\nMGRAST_preprocessing(file_in="%s", file_out="%s", produce_fig="FALSE")\n'%(Ipy.LIB_DIR+'/preprocessing.r', rfile, nfile)
        ro.r(rcmd)
        return nfile

    def _dense_matrix(self):
        if not self.biom:
            return []
        if self.biom['matrix_type'] == 'dense':
            return self.biom['data']
        else:
            return sparse_to_dense(self.biom['data'], self.numAnnot, self.numIDs)
