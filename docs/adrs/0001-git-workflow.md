# Git Workflow for Narrative Repo

Date: 2020-08-19

Developers on the narrative repo need to come into alignment on the git workflow used to create PRs and add new content.

## Status

Pending

## Alternatives Considered

* Feature branch
* Fork and pull
*
*

## Decision Outcome

Paragraph of text

## Consequences

*
*

## Pros and Cons of the Alternatives

### Centralised Repository



* `+` Pro...
* `-` Con...

### Feature Branches

Developers create feature branches

* `+` Pro...
* `+` Fine-grained control over write access possible via CODEOWNERS file
* `-` Con...

### Fork and pull

Developers fork the original repository to create a server-side clone in their own namespace, and use pull requests to merge new content into the repository.

* `+` Repository admins do not need to grant write access to the repo
* `+` Admins have complete control over what goes into the repo; content from untrusted sources can be vetted prior to merge


* `-` Collaborative development more difficult:
  * `-` Code scattered over numerous forks in different GitHub namespaces; no central shared repo
  * `-` Devs may end up with copies of the original repo and of collaborators' forked repos
* `-` Forked repos may be deleted or access denied, losing potentially valuable development work
* `-` Third party devs must supply their own secrets (e.g. authentication data or dev tokens) for any GitHub actions that need them
* `-`

###

## References

*
*
*
