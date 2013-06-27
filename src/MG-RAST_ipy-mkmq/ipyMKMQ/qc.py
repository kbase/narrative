#!/usr/bin/env python

import math, sys
from metagenome import Metagenome
from ipyTools import *

class QC(object):
    """Class for working with QC statistics of a metagenome
    
    self.drisee      : Drisee object
    self.kmer        : Kmer object
    self.bp_histo    : NucleoProfile object
    self.rarefaction : Rarefaction object
    """
    def __init__(self, mgid=None, metagenome=None, auth=None):
        if metagenome:
            self.metagenome = metagenome
            if self.metagenome.stats is None:
                self.metagenome._set_statistics()
        elif mgid:
            self.metagenome = Metagenome(mgid, True, True, auth)
        else:
            sys.stderr.write("Must pass metagenome id or metagenome object")
            return
        self.drisee   = Drisee(mgObj=self.metagenome)
        self.kmer     = Kmer(mgObj=self.metagenome)
        self.bp_histo = NucleoProfile(mgObj=self.metagenome)
        self.rarefaction = Rarefaction(mgObjs=[self.metagenome])

class Drisee(object):
    """Class for working with DRISEE statistics of a metagenome
    
    self.summary : {"columns" : ['list', 'names of columns'], "data" : ['list', 'drisee count profile']}
    self.count   : {"columns" : ['list', 'names of columns'], "data" : ['list', 'drisee percent profile']}
    self.percent : {"columns" : ['list', 'names of columns'], "data" : ['list', 'drisee summary stats']}
    """
    def __init__(self, mgObj=None, mgData=None):
        data = None
        if mgObj:
            data = self._get_drisee(mgObj)
        if mgData:
            data = mgData
        self.summary = data['summary'] if has_profile('summary', data) else None
        self.count   = data['counts'] if has_profile('counts', data) else None
        self.percent = data['percents'] if has_profile('percents', data) else None
        
    def _get_drisee(self, mgObj):
        try:
            return mgObj.stats['qc']['drisee']
        except:
            return None

    def dump(self, filename=None, type='count'):
        if not filename:
            filename = 'drisee_'+type+'_'+random_str()+'.txt'
        profile = None
        if (type == 'count') and self.count:
            profile = self.count
        elif (type == 'percent') and self.percent:
            profile = self.percent
        else:
            return None
        fhdl = open(filename, 'w')
        fhdl.write("#\t"+"\t".join(profile['columns'])+"\n")
        for row in profile['data']:
            fhdl.write("\t".join(map(str, row))+"\n")
        fhdl.close()
        return filename

    def plot(self, width=800, height=300, title="", x_title="", y_title="", legend=True, arg_list=False, source='retina'):
        if not self.percent:
            return None
        labels = self.percent['columns'][1:]
        x = map(lambda y: y[0], self.percent['data'])
        if source == 'retina':
            series = []
            colors = google_palette(len(labels))
            for i, l in enumerate(labels):
                series.append({'name': l, 'color': colors[i]})
            pA = map(lambda y: {'x': y[0], 'y': y[1]}, self.percent['data'])
            pT = map(lambda y: {'x': y[0], 'y': y[2]}, self.percent['data'])
            pC = map(lambda y: {'x': y[0], 'y': y[3]}, self.percent['data'])
            pG = map(lambda y: {'x': y[0], 'y': y[4]}, self.percent['data'])
            pN = map(lambda y: {'x': y[0], 'y': y[5]}, self.percent['data'])
            pX = map(lambda y: {'x': y[0], 'y': y[6]}, self.percent['data'])
            pTot = map(lambda y: {'x': y[0], 'y': y[7]}, self.percent['data'])
            data = {'series': series, 'points': [pA, pT, pC, pG, pN, pX, pTot]}
            keyArgs = { 'width': width,
                        'height': height,
                        'title': 'drisee plot' if not title else title,
                        'x_title': x_title,
                        'y_title': y_title,
                        'x_min': min(x),
                        'x_max': max(x),
                        'y_min': 0,
                        'y_max': 100,
                        'target': 'div_plot_'+random_str(),
                        'show_legend': legend,
                        'show_dots': False,
                        'data': data }
            if Ipy.DEBUG:
                print keyArgs
            if arg_list:
                return keyArgs
            else:
                try:
                    Ipy.RETINA.plot(**keyArgs)
                except:
                    sys.stderr.write("Error producing drisee plot\n")
                return None
        else:
            yA = map(lambda y: y[1], self.percent['data'])
            yT = map(lambda y: y[2], self.percent['data'])
            yC = map(lambda y: y[3], self.percent['data'])
            yG = map(lambda y: y[4], self.percent['data'])
            yN = map(lambda y: y[5], self.percent['data'])
            yX = map(lambda y: y[6], self.percent['data'])
            yTot = map(lambda y: y[7], self.percent['data'])
            Ipy.FL_PLOT.pixelsx = width
            Ipy.FL_PLOT.pixelsy = height
            Ipy.FL_PLOT.haslegend = legend
            Ipy.FL_PLOT.legendloc = 'nw'
            try:
                Ipy.FL_PLOT.plot_figure([x,x,x,x,x,x,x],[yA,yT,yC,yG,yN,yX,yTot],label=labels)
            except:
                sys.stderr.write("Error producing drisee plot\n")
            return None

class NucleoProfile(object):
    """Class for working with nucleotide profile statistics of a metagenome
    
    self.count   : {"columns" : ['list', 'names of columns'], "data" : ['list', 'nucleotide count profile']}
    self.percent : {"columns" : ['list', 'names of columns'], "data" : ['list', 'nucleotide percent profile']}
    """
    def __init__(self, mgObj=None, mgData=None):
        data = None
        if mgObj:
            data = self._get_bp_profile(mgObj)
        if mgData:
            data = mgData
        self.count   = data['counts'] if has_profile('counts', data) else None
        self.percent = data['percents'] if has_profile('percents', data) else None

    def _get_bp_profile(self, mgObj):
        try:
            return mgObj.stats['qc']['bp_profile']
        except:
            return None

    def plot(self, width=800, height=300, title="", legend=True, arg_list=False, source='retina'):
        if not self.percent:
            return None
        labels = self.percent['columns'][1:]
        if source == 'retina':
            x_label = []
            x_tick  = 0
            data = []
            colors = google_palette(len(labels))
            for i, l in enumerate(labels):
                data.append({'name': l, 'fill': colors[i], 'data': []})
            for n, row in enumerate(self.percent['data']):
                if (n % 10) == 0:
                    x_label.append(str(n))
                    x_tick += 1
                for i, d in enumerate(row[1:]):
                    data[i]['data'].append(toNum(d))
            
            keyArgs = { 'width': width,
                        'height': height,
                        'title': 'nucleotide profile' if not title else title,
                        'x_title': 'bp position',
                        'y_title': 'percent bp',
                        'x_labels': x_label,
                        'x_tick_interval': int(len(self.percent['data'])/50),
                        'x_labeled_tick_interval': x_tick,
                        'btype': 'stackedArea',
                        'target': 'div_graph_'+random_str(),
                        'show_legend': legend,
                        'legend_position': 'right',
                        'data': data }
            if Ipy.DEBUG:
                print keyArgs
            if arg_list:
                return keyArgs
            else:
                try:
                    Ipy.RETINA.graph(**keyArgs)
                except:
                    sys.stderr.write("Error producing nucleotide profile\n")
                return None
        else:
            x  = map(lambda y: y[0], self.percent['data'])
            yA = map(lambda y: y[1], self.percent['data'])
            yT = map(lambda y: y[2], self.percent['data'])
            yC = map(lambda y: y[3], self.percent['data'])
            yG = map(lambda y: y[4], self.percent['data'])
            yN = map(lambda y: y[5], self.percent['data'])
            Ipy.FL_PLOT.pixelsx = width
            Ipy.FL_PLOT.pixelsy = height
            Ipy.FL_PLOT.haslegend = legend
            Ipy.FL_PLOT.legendloc = 'se'
            try:
                Ipy.FL_PLOT.plot_figure([x,x,x,x,x],[yA,yT,yC,yG,yN],label=labels)
            except:
                sys.stderr.write("Error producing nucleotide profile\n")
            return None

class Kmer(object):
    """Class for working with kmer profile statistics of a metagenome
    
    self.profile : {"columns" : ['list', 'names of columns'], "data" : ['list', 'kmer 15 counts']}
    """
    def __init__(self, mgObj=None, profile=None):
        if mgObj:
            self.profile = self._get_kmer(mgObj)
        elif profile:
            self.profile = profile
        else:
            self.profile = None

    def _get_kmer(self, mgObj):
        try:
            return mgObj.stats['qc']['kmer']['15_mer']
        except:
            try:
                return mgObj.stats['qc']['kmer']['6_mer']
            except:
                return None

    def plot_abundance(self, width=800, height=300, title="", x_title="", y_title="", arg_list=False, source='retina'):
        if not (self.profile and ('data' in self.profile)):
            return None
        points = map(lambda z: {'x': math.log(z[3], 10), 'y': math.log(z[0], 10)}, self.profile['data'])
        tt = 'kmer rank abundance' if not title else title
        xt = 'sequence size' if not x_title else x_title
        yt = 'kmer coverage' if not y_title else y_title
        return self._plot(points=points, width=width, height=height, title=tt, x_title=xt, y_title=yt, arg_list=arg_list, source=source)

    def plot_ranked(self, width=800, height=300, title="", x_title="", y_title="", arg_list=False, source='retina'):
        if not (self.profile and ('data' in self.profile)):
            return None
        points = map(lambda z: {'x': math.log(z[3], 10), 'y': 1 - (1.0 * z[5])}, self.profile['data'])
        tt = 'ranked kmer consumed' if not title else title
        xt = 'sequence size' if not x_title else x_title
        yt = 'fraction of observed kmers' if not y_title else y_title
        return self._plot(points=points, width=width, height=height, title=tt, x_title=xt, y_title=yt, arg_list=arg_list, source=source)

    def plot_spectrum(self, width=800, height=300, title="", x_title="", y_title="", arg_list=False, source='retina'):
        if not (self.profile and ('data' in self.profile)):
            return None
        points = map(lambda z: {'x': math.log(z[0], 10), 'y': math.log(z[1], 10)}, self.profile['data'])
        tt = 'kmer spectrum' if not title else title
        xt = 'kmer coverage' if not x_title else x_title
        yt = 'number of kmers' if not y_title else y_title
        return self._plot(points=points, width=width, height=height, title=tt, x_title=xt, y_title=yt, arg_list=arg_list, source=source)
        
    def _plot(self, points=None, width=800, height=300, title="", x_title="", y_title="", arg_list=False, source='retina'):
        if not points:
            return None
        x = map(lambda z: z['x'], points)
        y = map(lambda z: z['y'], points)
        if source == 'retina':
            data = {'series': [{'name': title}], 'points': [points]}
            keyArgs = { 'width': width,
                        'height': height,
                        'title': title,
                        'x_title': x_title,
                        'y_title': y_title,
                        'x_min': min(x),
                        'x_max': max(x),
                        'y_min': min(y),
                        'y_max': max(y),
                        'target': 'div_plot_'+random_str(),
                        'show_legend': False,
                        'show_dots': False,
                        'data': data }
            if Ipy.DEBUG:
                print keyArgs
            if arg_list:
                return keyArgs
            else:
                try:
                    Ipy.RETINA.plot(**keyArgs)
                except:
                    sys.stderr.write("Error producing kmer profile\n")
                return None
        else:
            Ipy.FL_PLOT.pixelsx = width
            Ipy.FL_PLOT.pixelsy = height
            Ipy.FL_PLOT.haslegend = True if title else False
            Ipy.FL_PLOT.legendloc = 'se'
            try:
                Ipy.FL_PLOT.plot_figure(x,y,label=title)
            except:
                sys.stderr.write("Error producing kmer profile\n")
            return None
        

class Rarefaction(object):
    """Class for working with rarefaction statistics of one or more metagenomes
    
    self.points : {metagenome_id : [ 'list', 'rarefaction coordinate data' ]}
    self.alpha  : {metagenome_id : [ 'list', 'alpha-diversity values' ]}
    """
    def __init__(self, mgObjs=None, points=None, alpha=None):
        if mgObjs and (len(mgObjs) > 0):
            self.points, self.alpha = self._get_rarefaction(mgObjs)
        elif points and (len(points) > 0):
            self.points = points
            self.alpha  = alpha if alpha else None
        else:
            self.points = None
            self.alpha  = None

    def _get_rarefaction(self, mgObjs):
        try:
            points = {}
            alpha  = {}
            for m in mgObjs:
                points[m.id] = m.stats['rarefaction']
                alpha[m.id]  = m.stats['sequence_stats']['alpha_diversity_shannon'] if 'alpha_diversity_shannon' in m.stats['sequence_stats'] else None
            return points, alpha
        except:
            return None, None
    
    def plot(self, mgids=None, width=800, height=300, title="", x_title="", y_title="", legend=True, arg_list=False, source='retina'):
        if not self.points:
            return None
        tt = 'rarefaction curve' if not title else title
        if source == 'retina':
            series = []
            points = []
            x_all  = []
            y_all  = []
            colors = google_palette(len(self.points.keys()))
            for i, m in enumerate(self.points.keys()):
                # only plot for given set
                if mgids and (m not in mgids):
                    continue
                a = " (%0.2f)"%float(self.alpha[m]) if self.alpha[m] else ''
                series.append( {'name': m+a, 'color': colors[i]} )
                points.append( map(lambda z: {'x': toNum(z[0]), 'y': toNum(z[1])}, self.points[m]) )
                x_all.extend( map(lambda z: toNum(z[0]), self.points[m]) )
                y_all.extend( map(lambda z: toNum(z[1]), self.points[m]) )
            keyArgs = { 'width': width,
                        'height': height,
                        'title': tt,
                        'x_title': x_title,
                        'y_title': y_title,
                        'x_min': min(x_all),
                        'x_max': max(x_all),
                        'y_min': min(y_all),
                        'y_max': max(y_all),
                        'target': 'div_plot_'+random_str(),
                        'show_legend': legend,
                        'show_dots': False,
                        'data': {'series': series, 'points': points} }
            if Ipy.DEBUG:
                print keyArgs
            if arg_list:
                return keyArgs
            else:
                try:
                    Ipy.RETINA.plot(**keyArgs)
                except:
                    sys.stderr.write("Error producing rarefaction plot\n")
                return None
        else:
            x = map(lambda z: z[0], self.points)
            y = map(lambda z: z[1], self.points)
            Ipy.FL_PLOT.pixelsx = width
            Ipy.FL_PLOT.pixelsy = height
            Ipy.FL_PLOT.haslegend = legend
            Ipy.FL_PLOT.legendloc = 'se'
            try:
                Ipy.FL_PLOT.plot_figure(x,y,label=tt)
            except:
                sys.stderr.write("Error producing rarefaction plot\n")
            return None

def has_profile(profile, data):
    if data and (profile in data) and ('data' in data[profile]) and data[profile]['data']:
        return True
    else:
        return False

def merge_drisee_profile(qc_set, profile='count'):
    if profile == 'count':
        columns = qc_set[0].drisee.count['columns']
        colMax  = len(columns)
        rowMax  = max([ len(x.drisee.count['rows']) for x in qc_set if x.drisee.count ])
        rows    = map(lambda x: x+1, range(rowMax))
        mMatrix = [[0 for i in range(colMax)] for j in range(rowMax)]
        for qc in qc_set:
            if not qc.drisee.count:
                continue
            curLen = len(qc.drisee.count['rows'])
            for r in range(rowMax):
                if r == curLen:
                    break
                for c in range(colMax):
                    mMatrix[r][c] += qc.drisee.count['data'][r][c]
        mData = {'count_profile': {'rows': rows, 'columns': columns, 'data': mMatrix}}
        return Drisee(mgData=mData)
    elif profile == 'percent':
        columns = qc_set[0].drisee.percent['columns']
        colMax  = len(columns)
        rowMax  = max([ len(x.drisee.percent['rows']) for x in qc_set if x.drisee.percent ])
        rows    = map(lambda x: x+51, range(rowMax))
        rowNums = [0 for i in range(rowMax)]
        mMatrix = [[0 for i in range(colMax)] for j in range(rowMax)]
        for qc in qc_set:
            if not qc.drisee.percent:
                continue
            curLen = len(qc.drisee.percent['rows'])
            for r in range(rowMax):
                if r == curLen:
                    break
                rowNums[r] += 1
                for c in range(colMax):
                    mMatrix[r][c] += qc.drisee.percent['data'][r][c]
        for r in range(rowMax):
            for c in range(colMax):
                mMatrix[r][c] = mMatrix[r][c] / rowNums[r]
        mData = {'percent_profile': {'rows': rows, 'columns': columns, 'data': mMatrix}}
        return Drisee(mgData=mData)
    else:
        return None

