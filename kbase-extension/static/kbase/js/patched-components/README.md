# Patched Components

This directory contains third party components which have been patched to either
fix a bug or to work better with KBase.

Ideally these would be forked, patched, a PR issued to the project, the patch merged, and
we go on. However, due to time constraints we don't always have this luxury. Yet as 
we patch forks here we should strive to have the patches, if possible, submitted
to the original projects and THEN move on.

I think it is best to make an actual fork of the component (if applicable), make
the patches there, and install it here via git (but not as a full repo, just the
patched branch). At least this way it is possible to more easily track future 
additional patches, and to make swapping back to the main distribution later.

## select2

- fix width of dropdown being rounded from the main control

```
git clone --branch "more-precise-dropdown-width" --depth=1 https://github.com/eapearson/select2.git 
rm -rf select2/.git
```