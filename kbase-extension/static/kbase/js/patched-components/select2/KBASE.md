# Patched Component

This repo has been patched to fix a problem with dropdown lists not matching the width of the dropdown menu button thing. The width is calculated with jquery's outerWidth, which rounds to the pixel. Since we are setting the control width as 100%, the calculation resulting width will sometimes be visibly off. Using getBoundingClientRect solves this problem, but introduces compatability with IE8 and earlier.

Remove this file if (when) we get this patch merged into the select2 project.
