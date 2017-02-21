# Input Controls

The input of values for app, editor, and viewer cells is provided by UI input controls.

An input control is a unit of code embodied into a Javascript module, which provides UI building, DOM event listening, data update routing, and validation handling. 

## Module Structure

## Required Events

## Optional Events

## How input controls are mapped from app specs

## Catalog of controls

### textInput

Input of formatted or unformatted text which is transformed into text value

### select2TextInput

Similar to a text input, but uses the jquery select2 control.

#### Notes

This control is separated from the text input so that issues related to the select2 text input may be isolated.

### textareaInput

Input of unformatted, possibly multline text, which is transformed into a text value.

#### Notes

This control differs from a textInput in the following ways:

- regular expression or other formatting constraints may not applied
- allows multi-line entry

### intInput

Input of a valid integer string value which is transformed into an integer value.

### floatInput

Input of a valid float string which is transformed into a float value

### checkboxInput

Input of a checked or unchecked state which is transformed into an integer value using 1 to signal the "true" value and 0 to signal the "false" value. 

#### Notes

This is the only control which cannot be used to express a "no value" or null condition.

### booleanInput

Input of a logical boolean via a dropdown control which can express true and false as well as null.

#### Notes

This is an alternative to the checkboxInput, but differs in that it allows for an empty or null value.

### selectInput

Input of a string value via a select or other type of "dropdown" control, which offers the user a set of values to choose from, and transforms this into a string value.

### autocompleteTextInput

Input of a string value via an "autocomplete" style text input, in which a user is provided a dropdown set of choices based on their typed input. Outputs a simple string value derived from the choice from the list.

#### objectInput

Input of an object reference via a select or other type of "dropdown" control (e.g. select2), which offers the user a set of values, possibly a search mechanism to assist in finding an item, and then transforms this into a workspace object reference string value.

#### Notes

The types of workspace object refernces is varied. At present three types are supported:
- absolute reference, e.g. 123/45/67
- relative reference via names, e.g. object_name
- data palette absolute references, e.g. 123/45/67;8/9/1


### fileInput

supported??

### subdataInput

### customSubdataInput

### customSelect

### dataAttachmentInput

### sequenceInput

A sequence input is automatically used as a "wrapper" input around a data input if the parameter specifies that multiple items are allowed. It outputs an array of values which are the values supplied by the data input widget.

### structInput

A struct input is used as a wrapper for a "grouped parameter" -- a parameter which specifies other parameters to be managed and packaged as an object. A struct acts as a proxy to each fo the inputs it contains. It outputs an object, each element of which is the output of a data input.

