#!/usr/bin/env python

from time import localtime, strftime, sleep
from collections import defaultdict
import os, sys, urllib, urllib2, json, pickle, copy, glob
import string, random
import rpy2.robjects as ro
import retina, flotplot
import config

# class for ipy lib env
class Ipy(object):
    """Constants for ipy-qmqc library interface"""
    auth = None
    username = None
    DEBUG   = False
    FL_PLOT = None
    RETINA  = None
    NB_DIR  = None
    LIB_DIR = None
    TMP_DIR = None
    CCH_DIR = None
    IMG_DIR = None
    KBASE_CMDS = None
    KBASE_IPY = "\n".join(['get_analysis_set','Analysis','AnalysisSet','get_collection','Collection','Project','Metagenome','QC','Drisee','NucleoProfile','Kmer','Rarefaction','merge_drisee_profile','get_plant_set','Plant'])
    VALUES  = ['abundance', 'evalue', 'identity', 'length']
    TAX_SET = ['domain', 'phylum', 'class', 'order', 'family', 'genus', 'species']
    ONT_SET = ['level1', 'level2', 'level3', 'function']
    MD_CATS = ['project', 'sample', 'library', 'env_package']
    MATRIX  = { 'annotation': 'organism',
                'level': 'strain',
                'result_type': 'abundance',
                'hit_type': 'all',
                'source': 'M5NR',
                'e_val': 5,
                'ident': 60,
                'alen': 15,
                'filters': [],
                'filter_source': None }
    COLORS  = [ "#3366cc",
                "#dc3912",
                "#ff9900",
                "#109618",
                "#990099",
                "#0099c6",
                "#dd4477",
                "#66aa00",
                "#b82e2e",
                "#316395",
                "#994499",
                "#22aa99",
                "#aaaa11",
                "#6633cc",
                "#e67300",
                "#8b0707",
                "#651067",
                "#329262",
                "#5574a6",
                "#3b3eac",
                "#b77322",
                "#16d620",
                "#b91383",
                "#f4359e",
                "#9c5935",
                "#a9c413",
                "#2a778d",
                "#668d1c",
                "#bea413",
                "#0c5922",
                "#743411" ]

def init_ipy(debug=False, nb_dir=None, api_url=None):
    # get config
    for c in filter(lambda x: not x.startswith('_'), config.__dict__.keys()):
        setattr(Ipy, c, getattr(config, c))
    # set pathing
    if nb_dir and os.path.isdir(nb_dir):
        Ipy.NB_DIR = nb_dir
    else:
        Ipy.NB_DIR = os.getcwd()
    Ipy.LIB_DIR = Ipy.NB_DIR+'/lib'
    Ipy.TMP_DIR = Ipy.NB_DIR+'/tmp'
    Ipy.CCH_DIR = Ipy.NB_DIR+'/cache'
    Ipy.IMG_DIR = Ipy.NB_DIR+'/images'
    for d in (Ipy.LIB_DIR, Ipy.TMP_DIR, Ipy.IMG_DIR):
        if not os.path.isdir(d):
            os.mkdir(d)
    # set api
    if api_url is not None:
        Ipy.API_URL = api_url
    # set graphing tools
    Ipy.FL_PLOT = flotplot.FlotPlot()
    Ipy.RETINA  = retina.Retina()
    Ipy.DEBUG   = debug
    # load matR and extras
    ro.r('suppressMessages(library(matR))')
    ro.r('suppressMessages(library(gplots))')
    ro.r('suppressMessages(library(scatterplot3d))')
    # add tab completion from a dir - bit of a hack
    #   skip names with hyphen '-' in them, its an operator and not valid name syntax :(
    #   these are for kbase command line scripts, no .pl
    names = map(lambda x: os.path.basename(x), glob.glob(Ipy.KBASE_BIN+'/*'))
    names = filter(lambda x: (not x.endswith('.pl')) and (not x.endswith('.py')), names)
    Ipy.KBASE_CMDS = "\n".join(names)
    names = filter(lambda x: '-' not in x, names)
    add_tab_completion(names)
    # echo
    if Ipy.DEBUG:
        for k in filter(lambda x: not x.startswith('_'), Ipy.__dict__.keys()):
            print k, getattr(Ipy, k)

def add_tab_completion(names):
    for n in names:
        cmd = "%s = func_factory(); dir(%s)"%(n,n)
        exec(cmd)

def func_factory():
    """function to return empty functions for adding to python namespace"""
    def func():
        return None
    return func

def save_object(obj, name):
    """save some object to python pickle file"""
    fpath = Ipy.CCH_DIR+'/'+name+'.pkl'
    try:
        pickle.dump(obj, open(fpath, 'w'))
    except:
        sys.stderr.write("Error: unable to save '%s' to %s \n"%(obj.defined_name, fpath))
    return fpath

def load_object(name):
    """load object from python pickle file"""
    fpath = Ipy.CCH_DIR+'/'+name+'.pkl'
    if os.path.isfile(fpath):
        try:
            return pickle.load(open(fpath, 'r'))
        except:
            if Ipy.DEBUG:
                sys.stderr.write("Error loading pickeled object from %s\n"%fpath)
            return None
    else:
        if Ipy.DEBUG:
            sys.stderr.write("can not create from pickeled object, %s does not exist\n"%fpath)
        return None

def google_palette(num):
    if not num:
        return Ipy.COLORS
    num_colors = []
    for i in range(num):
        c_index = i % len(Ipy.COLORS);
        num_colors.append( Ipy.COLORS[c_index] )
    return num_colors

def obj_from_url(url, auth=None):
    header = {'Accept': 'application/json'}
    if auth:
        header['Auth'] = auth
    elif Ipy.auth:
        header['Auth'] = Ipy.auth
    if Ipy.DEBUG:
        print json.dumps(header)
        print url
    try:
        req = urllib2.Request(url, headers=header)
        res = urllib2.urlopen(req)
    except urllib2.HTTPError, error:
        sys.stderr.write("ERROR (%s): %s\n"%(url, error.read()))
        return None
    if not res:
        sys.stderr.write("ERROR (%s): no results returned\n"%url)
        return None
    obj = json.loads(res.read())
    if obj is None:
        sys.stderr.write("ERROR (%s): return structure not valid json format\n"%url)
        return None
    if len(obj.keys()) == 0:
        sys.stderr.write("ERROR (%s): no data available\n"%url)
        return None
    if 'ERROR' in obj:
        sys.stderr.write("ERROR (%s): %s\n"%(url, obj['ERROR']))
        return None
    return obj

def async_rest_api(url, auth=None, delay=30):
    submit = obj_from_url(url, auth)
    if not (('status' in submit) and (submit['status'] == 'Submitted') and ('url' in submit)):
        sys.stderr.write("ERROR: return data invalid format\n:%s"%json.dumps(submit))
    result = obj_from_url(submit['url'])
    while result['status'] != 'done':
        sleep(delay)
        result = obj_from_url(submit['url'])
    return result['data']

def slice_column(matrix, index):
    data = []
    for row in matrix:
        data.append(row[index])
    return data

def toNum(s):
    s = str(s)
    try:
        return int(s)
    except ValueError:
        return float(s)

def matrix_from_file(fname, has_col_names=True, has_row_names=True):
    fhdl = open(fname, 'rU')
    matrix = []
    if has_col_names:
        fhdl.readline()
    for line in fhdl:
        row = line.strip().split("\t")
        if has_row_names:
            row.pop(0)
        matrix.append( map(lambda x: toNum(x), row) )
    fhdl.close()
    return matrix

def matrix_to_file(fname=None, matrix=[], cols=None, rows=None):
    output = ''
    if rows:
        rows = map(lambda x: ' '.join(x.strip().split()), rows) # sanitize text
    if cols:
        cols = map(lambda x: ' '.join(x.strip().split()), cols) # sanitize text
        if rows:
            output += "\t"
        output += "\t".join(cols) + "\n"
    for r, row in enumerate(matrix):
        if rows:
            output += rows[r] + "\t"
        output += "\t".join(map(str, row)) + "\n"
    if fname:
        fhdl = open(fname, 'w')
        fhdl.write(output)
        fhdl.close()
        return None
    else:
        return output

def ordered_distance_from_file(fname):
    fhdl  = open(fname, 'rU')
    line1 = fhdl.readline()
    fhdl.readline()
    order_dist  = map(lambda x: toNum(x), line1.strip().split(','))
    dist_matrix = []
    for line in fhdl:
        row = map(lambda x: toNum(x), line.strip().split())
        dist_matrix.append(row)        
    fhdl.close()
    return order_dist, dist_matrix

def eigen_data_from_file(fname):
    eigen_values  = []
    eigen_vectors = {}
    fhdl = open(fname, 'rU')
    for line in fhdl:
        if (not line) or line.startswith('#'):
            continue
        line = line.replace('"', '')
        parts = line.strip().split('\t')
        if line.startswith('PCO'):
            eigen_values.append( float(parts[1]) )
        else:
            eigen_vectors[parts[0]] = map(lambda x: float(x), parts[1:])
    return eigen_values, eigen_vectors

def relative_abundance_matrix(matrix):
    col_sums = []
    for i in range(len(matrix[0])):
        col_sums.append( sum(slice_column(matrix, i)) )
    new_matrix = []
    for row in matrix:
        new_row = []
        for i, c in enumerate(row):
            new_row.append( float(c) / col_sums[i] )
        new_matrix.append(new_row)
    return new_matrix

def sparse_to_dense(sMatrix, rmax, cmax):
    dMatrix = [[0 for i in range(cmax)] for j in range(rmax)]
    for sd in sMatrix:
        r, c, v = sd
        dMatrix[r][c] = v
    return dMatrix

def pyMatrix_to_rMatrix(matrix, rmax, cmax, normalize=0):
    if (not matrix) or (len(matrix) == 0):
        return None
    mList = []
    for i in range(cmax):
        if normalize:
            cList = map(lambda x: float(x[i]), matrix)
        else:
            cList = map(lambda x: int(x[i]), matrix)
        mList.extend(cList)
    if normalize:
        return ro.r.matrix(ro.FloatVector(mList), nrow=rmax)
    else:
        return ro.r.matrix(ro.IntVector(mList), nrow=rmax)

def rMatrix_to_pyMatrix(matrix, rmax, cmax):
    if (not matrix) or (len(matrix) == 0):
        return None
    pyM = [[0 for i in range(cmax)] for j in range(rmax)]
    col = 0
    for i in range(len(matrix)):
        row = i - (rmax * col)
        pyM[row][col] = matrix[i] 
        if row == (rmax-1):
            col += 1
    return pyM

def random_str(size=8):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for x in range(size))

def merge_columns(b, merge_set):
    """input: 1. biom object, 2. merge_set -> { merge_name_1 : [list of col ids], merge_name_2 : [list of col ids], ... }
    return: biom object. same row count, column count = names in merge_set + column_ids not in merge_set"""
    if not (merge_set and (len(merge_set) > 0)):
        sys.stderr.write("No merge set inputted\n")
        return None
    new_data = []
    new_cols = []
    seen = []
    # create new col set / test for duplicate merge ids
    for name, ids in merge_set.iteritems():
        if [i for i in ids if i in seen]:
            sys.stderr.write("Can not merge same column in more than 1 group\n")
            return None
        seen.extend(ids)
        new_cols.append({'id': name, 'name': name, 'metadata': {'components': ids}})
    # add singlets
    for c in b['columns']:
        if c['id'] not in seen:
            new_cols.append(c)
    # merge cols in data
    for row in b['data']:
        row_map = dict([(x['id'], 0) for x in new_cols])
        new_row = []
        for c, col in enumerate(b['columns']):
            if col['id'] in new_cols:
                row_map[col['id']] = row[c]
            else:
                for name, ids in merge_set.iteritems():
                    if col['id'] in ids:
                        row_map[name] += row[c]
                        break
        # re-order row
        for col in new_cols:
            new_row.append( row_map[col['id']] )
        new_data.append(new_row)
    new_b = copy.deepcopy(b)
    new_b['columns'] = new_cols
    new_b['data'] = new_data
    return new_b

def merge_biom(b1, b2):
    """input: 2 biom objects of same 'type', 'matrix_type', 'matrix_element_type', and 'matrix_element_value'
    return: merged biom object, duplicate columns skipped, duplicate rows added"""
    if b1 and b2 and (b1['type'] == b2['type']) and (b1['matrix_type'] == b2['matrix_type']) and (b1['matrix_element_type'] == b2['matrix_element_type']) and (b1['matrix_element_value'] == b2['matrix_element_value']):
        mBiom = { "generated_by": b1['generated_by'],
                   "matrix_type": 'dense',
                   "date": strftime("%Y-%m-%dT%H:%M:%S", localtime()),
                   "data": [],
                   "rows": [],
                   "matrix_element_value": b1['matrix_element_value'],
                   "matrix_element_type": b1['matrix_element_type'],
                   "format_url": "http://biom-format.org",
                   "format": "Biological Observation Matrix 1.0",
                   "columns": [],
                   "id": b1['id']+'_'+b2['id'],
                   "type": b1['type'],
                   "shape": [] }
        cols, rows = _merge_matrix_info(b1['columns'], b2['columns'], b1['rows'], b2['rows'])
        merge_func = _merge_sparse if b1['matrix_type'] == 'sparse' else _merge_dense
        mCol, mRow, mData = merge_func([b1['data'], b2['data']], cols, rows)
        mBiom['columns']  = mCol
        mBiom['rows']     = mRow
        mBiom['data']     = mData
        mBiom['shape']    = [ len(mRow), len(mCol) ]
        return biom_remove_empty(mBiom)
    else:
        sys.stderr.write("The inputed biom objects are not compatable for merging\n")
        return None

def _merge_matrix_info(c1, c2, r1, r2):
    ## merge columns, skip duplicate
    cm = {}
    for i, c in enumerate(c1):
        cm[ c['id'] ] = [0, i, c]
    for i, c in enumerate(c2):
        if c['id'] in cm:
            continue
        cm[ c['id'] ] = [1, i, c]
    ## merge rows
    rm = defaultdict(list)
    for i, r in enumerate(r1):
        rm[ r['id'] ].append( [0, i, r] )
    for i, r in enumerate(r2):
        rm[ r['id'] ].append( [1, i, r] )
    return cm.values(), rm.values()

def _merge_sparse(data, cols, rows):
    for i in range(len(data)):
        data[i] = sparse_to_dense(data[i], len(rows), len(cols))
    return _merge_dense(data, cols, rows)
    
def _merge_dense(data, cols, rows):
    cm = map(lambda x: x[2], cols)
    rm = map(lambda x: x[0][2], rows)
    mm = [[0 for i in range(len(cols))] for j in range(len(rows))]
    for i, rset in enumerate(rows):
        for r in rset:
            for j, c in enumerate(cols):
                if r[0] == c[0]:
                    mm[i][j] += data[ r[0] ][ r[1] ][ c[1] ]
    return cm, rm, mm

def biom_remove_empty(b):
    """imput: biom object
    return: biom object. cleaned up, all rows with 0's and columns with 0s removed"""
    vRows = []
    vCols = []
    if b['matrix_type'] == 'sparse':
        b['data'] = sparse_to_dense(b['data'], b['shape'][0], b['shape'][1])
        b['matrix_type'] = 'dense'
    # get valid rows
    for i, r in enumerate(b['rows']):
        row = b['data'][i]
        if sum(row) > 0:
            vRows.append(i)
    # get vaild columns
    for j, c in enumerate(b['columns']):
        col = map(lambda x: x[j], b['data'])
        if sum(col) > 0:
            vCols.append(j)
    # clean ['rows'] and ['data'] for rows
    if len(vRows) < len(b['rows']):
        sub_rows = []
        sub_data = []
        for r in vRows:
            sub_rows.append(b['rows'][r])
            sub_data.append(b['data'][r])
        b['rows'] = sub_rows
        b['data'] = sub_data
    # clean ['columns'] and ['data'] for columns
    if len(vRows) < len(b['columns']):
        sub_cols = []
        sub_data = []
        for c in vCols:
            sub_cols.append(b['columns'][c])
        for row in b['data']:
            sub_row = []
            for c in vCols:
                sub_row.append(row[c])
            sub_data.append(sub_row)
        b['columns'] = sub_cols
        b['data'] = sub_data
    return b

def matrix_remove_empty(m):
    """imput: matrix
    return: matrix. cleaned up, all rows with 0's and columns with 0s removed"""
    # identify valid columns
    vCols = []
    vMatrix = []
    for c in range(len(m[0])):
        if sum(slice_column(m, c)) > 0:
            vCols.append(c)
    # clean matrix
    for row in m:
        vRow = []
        if sum(row) == 0:
            continue
        for c in vCols:
            vRow.append(row[c])
        vMatrix.append(vRow)
    return vMatrix

def get_leaf_nodes(htype='taxonomy', level='domain', source='Subsystems', names=[]):
    leaf_level = 'species' if htype == 'taxonomy' else 'function'
    full_hierarchy = get_hierarchy(htype=htype, level=leaf_level, source=source)
    if not names:
        return slice_column(full_hierarchy, len(full_hierarchy[0])-1)
    hierarchy = Ipy.TAX_SET if htype == 'taxonomy' else Ipy.ONT_SET
    try:
        index = hierarchy.index(level)
    except (ValueError, AttributeError):
        return []
    results = set()
    for branch in full_hierarchy:
        if branch[index] in names:
            results.add(branch[-1])
    return list(results)

def get_hierarchy(htype='taxonomy', level='species', source='Subsystems', parent=None):
    params = [('min_level', level)]
    if htype == 'organism':
        htype = 'taxonomy'
    if htype == 'function':
        htype = 'ontology'
        params.append(('source', source))
    if parent is not None:
        params.append(('parent_name', parent))
    child = obj_from_url(Ipy.API_URL+'/m5nr/'+htype+'?'+urllib.urlencode(params, True))['data']
    if not child:
        child = []
    return child

def get_taxonomy(level='species', parent=None):
    return get_hierarchy(htype='taxonomy', level=level, parent=parent)

def get_ontology(level='function', source='Subsystems', parent=None):
    return get_hierarchy(htype='ontology', level=level, source=source, parent=parent)

def parent_level(level, htype='taxonomy'):
    if htype == 'organism':
        htype = 'taxonomy'
    hierarchy = Ipy.TAX_SET if htype == 'taxonomy' else Ipy.ONT_SET
    try:
        index = hierarchy.index(level)
    except (ValueError, AttributeError):
        return None
    if index == 0:
        return None
    return hierarchy[index-1]

def child_level(level, htype='taxonomy'):
    if htype == 'organism':
        htype = 'taxonomy'
    hierarchy = Ipy.TAX_SET if htype == 'taxonomy' else Ipy.ONT_SET
    try:
        index = hierarchy.index(level)
    except (ValueError, AttributeError):
        return None
    if index == (len(hierarchy)-1):
        return None
    return hierarchy[index+1]
