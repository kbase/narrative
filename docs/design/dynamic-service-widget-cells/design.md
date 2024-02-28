# Dynamic Service Widget Cells

## Contents

- [about](about.md)
- design

## Design

### Overview

Dynamic service widgets are integrated into the Narrative in three important ways:

- they are hosted in a new type of cell, `serviceWidget`
- they may be used as data object viewers, with changes to data viewer handling
- they may be used as app output viewers, with changes to app cell output handling

Overall, the changes are mostly "additive" - adding functionality which does not affect
existing code - with most changes to existing code being conditionalized (protected with
conditional branches).

Two new external libraries are added; `preact` and `htm` have been added to support a
more familiar (dare we say "modern"?) style of component architecture.

> This decision can be reversed, and we can rewrite the components in jquery, but the
> initial prototype was based on preact and htm to facilitate rapid development.

### Changes, Additions

- New serviceWidget cell implementation
- New cell classes for notebook and cell runtime integration
- Usage of iframe to host external widgets served by dynamic services
- Resizable cell, with persistence
- Hook in data viewer code and viewer config conventions to use service widget as data
  viewer
- Hook in app output code and app config conventions to use service widget as app
  output viewer
- Development tools to assist those creating or maintaining service widgets in the
  Narrative.

### Service Widget Cell

The service widget cell is implemented as a notebook extension in
`nbextensions/serviceWidgetCell`.

The service widget cell has special features:

- It is based on new `CellManager` and `CellBase` classes;
  subclasses implement the specific behavior for the service widget cell

- Provides a "service lifetime" model (i.e. "start", "stop"), because
  service widgets utilize DOM listeners which need to be constructed when they are
  started, and torn down when they are stopped and removed.

- Widget state may be persisted in the Narrative; this feature was prototyped but is
  not presently active.

- Utilizes `preact` and `htm` to enable usage of React-style components to help control
  complexity and utilize a more familiar component pattern (compared to jQuery,
  kbwidgets, or old kbase-ui style widgets).

The basic design of the service widget cell is:

- construct a url for a given widget in a given dynamic service.
- embed this url in an iframe inside the cell's output area
- allow user to resize the output area height, and persist it

##### CellManager and CellBase

> TO BE WRITTEN

#### IFrame Embedding

A key to the service widget implementation is the usage of an iframe embedded in the
service widget cell. This allows the service widget "web app" to render naturally in the
cell output area.

We'll cover the constraints that guided this implementation:

- url format
- authentication
- window message integration

##### Widget URL

A widget url is a special form of a dynamic service url. Dynamic service urls were
previously used only for JSON-RPC 1.1 calls (with rare exception).

The widget URL is used as the target of an iframe (discussed below) embedded in the
cell.

A widget url looks like this:

```url
https://ci.kbase.us/dynserv/GITHASH.SDKMODULE/widgets/WIDGETNAME?PARAM1=VALUE1&PARAM2=VALUE2
```

where:

- `GITHASH` is the git commit hash for a specific build of the dynamic service
- `SDKMODULE` is the module name under which the dynamic service is registered
- `WIDGETNAME` is the name of thw widget within the dynamic service
- All parameters, like `PARAM1` and `PARAM2` above, are named. They are supplied as
  search parameters (aka "query parameters", but are officially known as the search
  fragment of the url).
  
##### Authentication

Authentication is provided through the existing `kbase_session` and
`kbase_session_backup` cookie.

The backup cookie is required in production because the service host is `kbase.us`,
while the front end is `narrative.kbase.us`, and a domain cookie (used by Europa) or
host cookie (used by kbase-ui) on `narrative.kbase.us` cannot be accessed on `kbase.us`.

##### Interprocess communication via window messages

As for kbase-ui and it's plugins, as for Europa and kbase-ui, the Narrative Interface
runtime via the service widget cell communicates with the service widget web app through
the `postMessage` browser DOM API.

This communication serves first as a sort of "boot process". We'll go over the entire
service widget cell lifetime below, so we'll just focus on how it works in this section.

The messaging works through a pair of objects, instances of `SendChannel` and
`ReceiveChannel`.

Due to the fact that the narrative and a dynamic service providing a widget app may have
different origins, it is not possible to use postMessage bidirectionally on the same
window. In prod, Javascript in the Narrative my not listen for events on the iframe, and
conversely the widget app in the iframe may not listen for events on the Narrative's window.

Thus, the Narrative service widget cell listens for messages from the widget app on the
Narrative window but sends messages to the widget app in the iFrame window. Conversely,
the widget app in the iFrame window listens for events on the iFrame window and sends
events to the Narrative's window.

This is managed with a pair of classes. Instances of `SendChannel` are responsible for
sending messages on another window, and instances of `ReceiveChannel` are responsible
for receiving messages in the current window.

> `Channel` is an abstraction I've used for years to wrap up the process of the window
> `message` event which is used through `addEventListener` and `postMessage`. We can
> choose a different name.

To sort out messages that may arrive from different sources, two methods are used.
(Other than the built-in target origin of postMessage). 

First, we use a specific message structure. If another process sends a message to a
window, it is highly unlikely that the message format will be the same.

The structure is

```javascript
{
  name: 'event_name',                             // an event name, or identifier
  envelope: {
    channelId: '6b8e1444-dcc0-42f4-bbcf-21b6b1a7c692', // unique identifier for the channel
    created: 1705012765708,                       // message creation time in ms
    id: 'b48e475e-1082-4c4d-a131-d90f8529390a'    // unique identifier for this message
  },
  payload: {                                      // data specific to this event
    key: 'value'
  }
}
```

Secondly, we use a unique identifier for the sender and receiver. When a service widget
cell is created, these identifiers are generated and transmitted to the widget app in
the url. A `ReceiveChannel` will ignore any messages that do not contain channel id
assigned to it and the channel id assigned to it's partner.

#### Service Widget and Lifecycle

##### Create new Service Widget Cell

- Insert Narrative cell with the type `serviceWidget`, and the requisite cell
  initialization structure
- The service widget cell manager will be listening for the notebook event
  `insertedAtIndex.Cell`, and will complete the cell's setup
- This includes the usual runtime augmentation and monkeypatching, and python generation,
  insertion, and execution.
  - Cell management, or rather integration with the Narrative notebook workflow, is
    conducted by an instance of `CellManager`. This class can serve for any cell, but is
    only used for the serviceWidget at this time.
  - Cell integration with the Narrative notebook, KBase custom cell architecture, and
    overall is carried out by a subclass of `CellBase`. `CellBase` has most of the
    logic, the sublcass mostly fills in the blanks, such as stop and start behavior, and
    python code generation.
- Most of the cell's application-specific behavior begins after the python code has been
  executed and has inserted the initial Javascript.
- This initial Javascript invokes the `Root` widget in the service widget cell extension
  codebase, which in turn inserts the `Main` component, which prepares and inserts the
  `IFrame` component.
- Once the iframe is inserted, it fetches the widget specified in the url.
  - This url includes the `iframeParams`, which are required for the iframe
    communication setup
  - It also includes the widget params
  - The auth token,if present, is sent passively as a cookie
- The widget app loads in the iframe, and if all goes well sends a `ready` message to
  the cell.
- The cell then sends a `start` message to the iframe, passing along, separately, the
  authentication, configuration, widget params, and widget state (not used in this
  implementation). This is provided primarily for purely static Javascript-based
  widgets.
- The widget, upon processing the `start` message, sends a `started` message back to the
  cell. The only information passed in this message is the preferred height of the cell,
  which may be calculated after the widget has been rendered.

After this, the widget proceeds to operate independently.

> Note that state persistence, although fragments are in the codebase, is not yet
> included in the the current implementation.

#### Resizing with Persistence

Since service widgets may be of arbitrary size we don't necessarily want the cell to
expand to the full cell height. Additionally, a widget may be responsive - resizable -
and have no natural, fixed height. Therefore, the widget cell is resizable, and will
retain the set size when saved. Upon loading, the cell, if restore the height.

This is part of the effort to have widget cell state preserved in the Narrative.

### Data Viewer Support

The dynamic service widget can serve as a data viewer widget. This is enabled by a
specifically constructed NarrativeViewer app spec, and support added to
`kbaseNarrativeWorkspace` that can recognize that app spec and construct the service
widget cell.

The viewer spec must provide an output widget name of `"ServiceWidget"`,
and the output mapping must supply the service module name and widget name. This is
detailed below.

In addition, the object ref is added to the parameters without any need to have it
specified in the viewer spec. It's presence is implied by the fact that it is in the
context of a viewer.

#### NarrativeViewer spec

Narrative viewer widgets are defined in the `NarrativeViewers` quasi-service, and
implemented in the Narrative as Javascript modules. The mapping of workspace type to
widget is provided by the type spec.

Each viewer is implemented as a quasi-method in the `NarrativeViewers` service. Viewers
are not full methods as they have no implementation. The viewer methods only serve for
their specifications.

A viewer is specified in the `widgets.output` property of the `spec.json` method
specification. The viewer corresponds to the AMD module name for the viewer in the
Narrative codebase.

Output parameters specified in `behavior.output_mapping` are processed in two ways -
input parameters appearing in output are set with the ref or object name of the data
object being rendered, others are processed supplied as parameters to the widget.

For dynamic service widgets we utilize this framework in a specific manner:

1. The `widget.output` property must have the value `"ServiceWidget"`
2. The `behavior.output_mapping` must have two entries:
   1. One with the target property `service_module_name` and a `constant_value` which is
      the module name for the dynamic service serving the widget
   2. One with the target proerty `widget_name` and a `constant_value` which is the name
      of the widget with the dynamic service
3. Any additional entries in `behavior.output_mapping` which specify a `constant_value`
   will be passed ot the widget, but none are required

#### `kbaseNarrativeWorkspace.js` support

Although `widget.output` is traditionally used as the actual module name of a viewer
widget, for dynamic service widgets it serves to signal a specific type of dynamic
service widget. The task of building a viewer cell resides in the
`kbaseNarrativeWorkspace.js` module.

### App Output Support

Service widgets may also serve as viewers for app output.

As for data viewers, enabling service widgets requires changes to the existing mechanism for handling app output.

This functionality resides within the app cell itself -  specifically the  `createOutputCell` function in  `nbextensions/appCell2/appCellWidget.js`.

Similar to the data viewer cell, the implementation of the output viewer hinges on interceding before the cell type currently handling app output is inserted into the Narrative.

And also similar to the data viewer cell, the app output specification requires a specific format to indicate that a service widget should be used, and provides the service widget's dynamic service module name and widget name.

#### Summary of Changes and New Features

App support required changes to the app cell widget, in the section in which it dispatches
to the viewer widget, and icon support.

Well, the latter may not stand the test of time, but I thought this could be a good
opportunity to improve the app output icon.


#### App Spec Format

As for the data viewer usage of the service widget, the app output requires a specific
format of app's ui specification. No new functionality is added, it is just that the
service widget requires specific values be present.