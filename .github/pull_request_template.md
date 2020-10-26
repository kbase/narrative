# Description of PR purpose/changes

* Please include a summary of the change and which issue is fixed. 
* Please also include relevant motivation and context.
* List any dependencies that are required for this change.

# Jira Ticket / Issue #
e.g. https://kbase-jira.atlassian.net/browse/DATAUP-X
- [ ] Added the Jira Ticket to the title of the PR e.g. (DATAUP-69 Adds a PR template)

# Testing Instructions
* Details for how to test the PR: 
- [ ] Tests pass in travis and locally 
- [ ] Changes available by spinning up a local narrative and navigating to _X_ to see _Y_

# Dev Checklist:

- [ ] My code follows the guidelines at https://sites.google.com/truss.works/kbasetruss/development
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published in downstream modules
- [ ] I have run Black and Flake8 on changed Python Code manually or with git precommit (and the travis build passes)

# Updating Version and Release Notes (if applicable)

- [ ] [Version has been bumped](https://semver.org/) for each release
- [ ] [Release notes](/RELEASE_NOTES.md) have been updated for each release (and during the merge of feature branches)
