# Make docs
# Dan Gunter <dkgunter@lbl.gov>
# Last updated: 2014-11-12

default: help
	
help:
	@printf 'Combine the markdown documents in this directory and\n'
	@printf 'export them in readable formats. '
	@printf 'Requires the "multimarkdown" command,\navailable from: '
	@printf 'http://fletcherpenney.net/multimarkdown/install\n'
	@printf 'Commands:\n'
	@printf '   help  - Print this message\n'
	@printf '   html  - Generate HTML\n'
	@printf '   latex - Generate LaTeX\n'
	@printf '   md    - Generate Markdown\n'
	@printf '   clean - Remove generated files\n'

SOURCES := dev.md ops.md

html: $(SOURCES:.md=.html)
latex: $(SOURCES:.md=.tex)
	
md:
	./mdcombo.py dev.md > README-dev.md
	./mdcombo.py ops.md > README-ops.md
	
%.html:%.md
	multimarkdown $<  > $@
	@printf "Created output file $@\n"
	
%.tex:%.md
	multimarkdown --to=latex $<  > $@
	@printf "Created output file $@\n"
	
clean:
	/bin/rm -f *.html *.tex