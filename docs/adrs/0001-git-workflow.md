# Git Workflow for Narrative Repo

Date: 2020-08-26

Developers on the narrative repository need to come into alignment on the git workflow used to create PRs and add new content.

## Author(s)

@eamahanna
@ialarmedalien

## Status

Pending

## Alternatives Considered

* Feature Branches
* Forks
* Feature Branches and Forks
* Change nothing and allow developers to choose their git flow preference

## Decision Outcome

Paragraph of text

## Consequences

*
*

## Pros and Cons of the Alternatives

### Feature Branches

_A feature branch is a separate branch in a repository used to implement a single feature in a project._

* `+` Rapid iteration cycle
* `+` Supports developer collaboration
* `+` Provides visibility into what each team member is developing
* `+` All code and changes are located in a single repository
* `-` Additional admin overhead required to provide developers with write access to the repository
* `-` More people have write access to a repository leading less fine-grained control of merges

### Forks

_A fork is a copy of a repository and is created in the developers namespace._

* `+` Repository admins do not need to grant write access to the repository
* `+` Admins have complete control over what goes into the repo; content from untrusted sources can be vetted prior to merge
* `+` Easy to discard experiments and changes
* `-` Forking is more expensive (git has to do a diff of the entire codebase) and takes up more server space
* `-` Code changes are scattered over numerous forks in different GitHub namespaces; no central shared repository
* `-` Does not easily allow for collaboration
* `-` Developers work in isolation which can lead to knowledge management issues if the team is unaware of where forked repositories are located
* `-` Developers must supply secrets (e.g. authentication data or dev tokens) for any github actions
* `-` In a team setting keeping all forked repositories in sync can become error prone due to the sheer number of the moving parts
* `-` Devs may end up with copies of the original repositoryand of collaborators' forked repositories

### Feature Branches and Forks

* `+` Pro...
* `-` Con...

### Change Nothing - Developer Preference

* `+` Pro...
* `-` Con...


## References

* [Atlassian Support
](https://support.atlassian.com/bitbucket-cloud/docs/branch-or-fork-your-repository/)
* [The Definitive Guide to Forks and Branches in Git](https://www.pluralsight.com/blog/software-development/the-definitive-guide-to-forks-and-branches-in-git#:~:text=Forking%20creates%20a%20full%20copy,what%20branch%20you%20are%20using.)
* [Git Workflows for Pros: A Good Git Guide](https://www.toptal.com/git/git-workflows-for-pros-a-good-git-guide)
