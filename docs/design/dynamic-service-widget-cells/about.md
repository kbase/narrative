# Dynamic Service Widget Cells

## Contents

- about
- [design](design.md)

## About

A " service widget" is (at the time of writing) a new kind of user interface
soon to be available within KBase.

A service widget is composed of two main pieces:

1. the service widget "web app" served by a dynamic service
2. a type of Narrative cell to fetch and render them.

A _service widget_ is a single page web app. Even simpler than that - as far as the
Narrative is concerned it is a URL of a specific format that returns `text/html` content.

The Narrative hosts such "widgets" in a dedicated "service widget Cell" -
`serviceWidget`. The `serviceWidget` cell implements the interface to service widgets,
which includes embedding an iframe which requests and renders the service widget app and a
communication protocol using window messages.

In the initial implementation (MVP-1) there is little interaction between the widget and the
Narrative. (Previous prototyping work demonstrated two-way interaction between a Narrative and a
service widget. In that case, it was utilized to allow a service widget to have
persistent state, stored in the cell's metadata.)

Dynamic service widgets are integrated into the Narrative in two ways:

1. As data viewers - the viewer displayed when a data object is inserted into a Narrative

2. As app output - the cell displayed when an app completes, and specifies that it wants
   to render an output widget

In addition, a developer tool allows inserting arbitrary service widget cells, which do
not not necessarily adhere to either the the data viewer or app output viewer formats.
