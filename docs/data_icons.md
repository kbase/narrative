# KBase Narrative Icons

Last revised: Feb 3, 2015
Dan Gunter <dkgunter@lbl.gov>

We use FontAwesome at http://fontawesome.io/ for many of our icons. But we also will use other free sets, and even created some ourselves.

The fonts are all in `src/notebook/ipython_profiles/profile_narrative/kbase_templates/static/kbase/fonts`.
The custom ones are named `kbase-icons.<ext>`.

## Installing custom icons

We use Fontastic at http://fontastic.me for generating new fonts from SVG images. They have detailed instructions on how to use their service, and it's free. Once you have built a new font from SVG images, you "publish" it as a Download. Then follow these steps, where $KBHOME is the root of the KBase source code:

1. unzip the download file, and stay in the same directory for the next few steps
2. copy the styles.css to kbaseIcons.css in the css directory

        cp styles.css $KBHOME/src/notebook/ipython_profiles/profile_narrative/kbase_templates/static/kbase/css/kbaseIcons.css

3. rename the font files, which will be `untitled-font-<num>.<ext>`, to `kbase-icons.<ext>`, and copy the font file to the fonts directory

        ls untitled-* | cut -f2 -d '.' | while read ext; do cp untitled-font-1.$ext kbase-icons.$ext; done
        cp kbase-icons.* $KBHOME/src/notebook/ipython_profiles/profile_narrative/kbase_templates/static/kbase/fonts

4. using your favorite editor, do a search-and-replace inside `kbaseIcons.css` that you just created to reference the renamed and relocated font files. e.g., replace `fonts/untitled-fonts-1` with `../fonts/kbase-icons`.

## Using custom icons

To add your new fonts to given data types, edit the `icons.json` file, at the same level as the `css/` and `fonts/` directories, to add a line like this:

    "Metagenome": ["icon icon-metagenome"],
    
**Note**: Make sure you clear the cache in your browser before reloading, as stylesheets and font definitions have a tendency to hang around.

## Using Font Awesome icons

For Font Awesome icons, there is no procedure other than to edit the `icons.json` file, as for a custom icon. In this case the line looks like this:

    "DomainAlignment": ["fa-sliders"],

You can read on the FA website about all the tricks you can do with stacking and rotating icons. To add multiple overlapping icons just have multiple items in the value list, e.g.:

    "ContigSet": ["fa-signal fa-rotate-90",  "fa-signal fa-rotate-270 kb-data-icon-rnudge"],

Note that you can add our custom classes `kb-data-icon-rnudge` (replace 'r' with l/u/d for left/up/down) to try and line them up slightly differently.


