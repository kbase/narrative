# Make docs

default: help
	
help:
	@printf 'Combine the markdown documents in this directory and\n'
	@printf 'export them in readable formats. '
	@printf 'Requires the "multimarkdown" command,\navailable from: '
	@printf 'http://fletcherpenney.net/multimarkdown/install\n'
	@printf 'Commands:\n'
	@printf '   help - Print this message\n'
	@printf '   html - Generate HTML\n'
	@printf '   clean - Remove generated files\n'

html: dev.html ops.html
	
%.html:%.md
	multimarkdown $<  > $@
	@printf "Created output file $@\n"
	
clean:
	/bin/rm -f *.html