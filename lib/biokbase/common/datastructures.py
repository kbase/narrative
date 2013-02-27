'''
Created on Sep 15, 2012

@author: gaprice@lbl.gov
'''

from collections import defaultdict

# see http://stackoverflow.com/questions/651794/whats-the-best-way-to-initialize-a-dict-of-dicts-in-python
class AutoVivifingDict(dict):
    """Implementation of perl's autovivification feature."""
    def __getitem__(self, item):
        try:
            return dict.__getitem__(self, item)
        except KeyError:
            value = self[item] = type(self)()
            return value
          
class DictListWithSortedIterator(object):
  ''' Implements a dict-like object, the values of which are lists of objects.
The iterator returned from the __iter__ method traverses the lists in order
of 1) the sorted list of keys and 2) the order the items were added to the 
list. Once iteration is started, the DLWSI cannot be modified until the 
iterator is exhausted or the discard() method is called on the iterator.''' 
  
  def __init__(self):
    self._store = defaultdict(list)
    self._itercount = 0
    self._len = 0
    
  def __setitem__(self, key, value):
    '''Add value to the end of the list stored at key'''
    self._checkIterOK()
    self._store[key].append(value)
    self._len += 1
    
  def __delitem__(self, key):
    '''Delete the list stored at key.'''
    self._checkIterOK()
    if key in self._store:
      l = len(self._store[key])
      del self._store[key]
      self._len -= l
      
  def __getitem__(self, key):
    '''Returns the list stored at key as a tuple.'''
    if self._store[key]:
      return tuple(self._store[key])
    else:
      raise KeyError(str(key))
    
  def get(self, key, default = None):
    '''Returns the list stored at key as a tuple. The default argument
specifies the object to return if key does not exist (default None).'''
    if self._store[key]:
      return tuple(self._store[key])
    return default
  
  def keys(self):
    '''Returns an unsorted list of keys.'''
    return self._store.keys()
      
  def __len__(self):
    return self._len
    
  def clear(self):
    '''Removes all keys and values from the DLWSI.'''
    self._checkIterOK()
    self._store = defaultdict(list)
    self._len = 0 
    
  def merge(self, dictlist):
    '''Adds all key value pairs of the passed in DLWSI to this DLWSI. Any keys 
in this DLWSI that have matching names to keys in the passed in DLWSI
will be overwritten.''' 
    self._checkIterOK()
    for k, v in dictlist:
      self.__setitem__(k, v)
    
  def _checkIterOK(self):
    if self._itercount:
      raise RuntimeError('Attempt to modify while iterating')
    
  def __iter__(self):
    '''Returns an iterator over this DLWSI. The iterator proceeds through
each list in the order of the sorted keys and returns a key / list item pair
for each next call. Thus if a particular key has 3 list items that key will be
returned 3 times in succession, once with each list item.
The DLWSI cannot be modified while iterating. To allow modification without
exhausting the iterator call the discard() method on the iterator.'''
    if not self._itercount:
      self._sortedKeys = sorted(self._store.keys())
    self._itercount += 1
    return self._ObjIter(self)
  
  class _ObjIter(object):
    
    def __init__(self, objStore):
      self._ostore = objStore
      self._dictIndex = 0
      self._listIndex = -1
      self._notExhausted = True
      
    def next(self):
      if self._notExhausted and self._hasNextEntry(): 
        self._advanceIndex()
        return self._getCurrentKeyValTuple()
      else:
        self._decrementIteratorCount()
        raise StopIteration
    
    def discard(self):
      self._decrementIteratorCount()
    
    def _decrementIteratorCount(self):
      if self._notExhausted:
        self._ostore._itercount -= 1
      self._notExhausted = False
      
    def _hasNextEntry(self):
      if len(self._ostore._store) == 0: return False
      dictI = self._dictIndex
      if self._listIndex + 1 >= len(self._getList(self._getSortedKey(dictI))):
        dictI += 1
      return dictI < len(self._ostore._sortedKeys)
    
    def _advanceIndex(self):
      if self._listIndex + 1 >= len(self._getList(
                                    self._getSortedKey(self._dictIndex))):
        self._dictIndex += 1
        self._listIndex = 0
      else:
        self._listIndex += 1
    
    def _getCurrentKeyValTuple(self):
      key = self._getSortedKey(self._dictIndex)
      return key, self._getList(key)[self._listIndex]
    
    def _getSortedKey(self, index):
      return self._ostore._sortedKeys[index]
    
    def _getList(self, key):
      return self._ostore._store[key]
      
    def __next__(self):
      return self.next()
