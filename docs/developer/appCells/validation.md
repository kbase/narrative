# Data Conversion and Validation

Validation comes in more than one flavor.

## DOM->Native Conversion

Conversion from a control's native data representation to the internal representation is one aspect.

Each control maintains a view model which holds the native value of the control. Yet, the DOM itself, which the user interacts with, also contains a representation of the same data. It may be in the form of a "normal" value, such as a string, but in other cases it is a different structure. For instance, a checkbox has a "checked" flag, a select has an collection of selected dom option elements.

One job of control validation is to convert the DOM native representation of the control value into the Javascript native value. This is typically done at the instigation of a DOM user event, such as "keyup" or "change".

All (except checkbox) controls support the concept of "blank" or "null" values. Most data types support "null" as the value for a blank or null control, except for strings which require the value to be an empty string. 

Collection types, such as sequence and struct, support either null or the empty collection, the empty Array [] for sequence and the empty Object {} for struct.

## Validation

Once a value has been converted from the DOM to the native form, it is validated.

Validation applies the constraint rules of the parameter spec to the converted value. 

Validation returns a standard structure, which is suited to programmatic as well as UI consumption.

## Who does what?

The conversion process is contained in the control code itself. This is because it is only the control code (module) which knows the precise implementation of the DOM code. Of course, there may be other code involved, such as a jquery custom control.

Validation is conducted by the control itself as well as the app cell. However, the validation code is a property of the data type, and thus the code is contained and managed in the validation library.