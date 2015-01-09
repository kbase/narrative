To add a new data icon for the Narrative UI, follow these steps:

1. Convert the desired image to a small (~50x50 pixel) PNG file and place it in the
directory (deep breath):
`src/notebook/ipython_profiles/profile_narrative/kbase_templates/static/kbase/images/data-icons`.
The name of the file *must* end with the extension `.png`. The convention is
to use short, lowercase names that resemble the name of the type that they
will represent.
2. Add a mapping between the desired type(s) and the image in the JSON file
at: `src/notebook/ipython_profiles/profile_narrative/kbase_templates/static/kbase/data-icons.json`.
As you can see in that file, you should use the un-adorned type name as the key
and the filename, without the '.png' extension, as the value.
3. Please *test* your addition locally before committing and pushing anything.
Formatting errors in the JSON file could break the entire narrative UI!
