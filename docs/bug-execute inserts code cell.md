The behavior is exhibited when Shift-Enter is used to execute a code cell. This invokes "execute\_cell\_and\_select_below" whose behavior is to execute the current (or selected set of) cell(s) and then either select the next cell, if there is one, or to insert a new cell (unspecified, but it is documented to default to code cell, but actually defaults to a default cell type which is defined I-don't-know-where)

This is the only case of cell insertion which is out of our control, and presents a problem.

The problem is that when we insert code cells ourselves, we immediately issue an "inserted.Cell" event with the appropriate kbase cell metadata in order to trigger the code extension handler. 

If a cell is inserted withouth this event following, our extension is not triggered and it can't manage the cell.

Code cells are now managed, since our overriding of them for app cells requires us to change the default behavior. E.g. hiding the code area by default.

Markdown cells are current unmanaged, but I'm quite sure we will manage them soon. There is discussion of structured markdown cells (e.g. abstract, author info, conclusions, etc.) which we could easily provide through a markdown cell extension.

So, back to this case. The fundamental problem is that the Jupyter cell insertion methods do not provide any way to initilaize the cell metadata when the cell is created. When used directly in our code, one can get a handle on the cell itself after many of the cell insertion methods (insert\_cell\_below, insert\_cell\_above, insert\_cell\_at\_index). However, for cell insertion events like described above, the trigger for cell insertion is not under our control. We might be able to wrest controle (e.g. overriding the event handler), but even then the "execute\_cel\l_and\_select\_below" method does not itself return the cell that was inserted.

So here is my idea.

All cell insertion ends up calling "insert\_cell\_at\_index". We can wrap this method and:

- add metadata immediately to the created cell
- emit an event after the cell insertion

The method wrapper would need to accept an additional, third, parameter, the metadata to be added to the cell.

Since we usualy call insert cell before or insert cell after, these methods would need to be replaced, actually, in order to pass the new parameter on to insert cell at index.

This part makes me uncomfortable, because it creates a code-level binding to the Jupyter javascript implementation. But in reality it is maybe 10 line of code in total, and I think well worth what we get out of it.

Actually, I'm going to try a tricky technique.

The wrapper will take the extra argument, but set will set it in a "sidecar variable" within the closure used to built the wrappers. It will then be available to insert cell at index, which will use it if it's own extra arg is undefined.
