# Git Workflow for Narrative Repo

Date: 2020-08-26

Developers on the narrative repository need to come into alignment on the git workflow used to create PRs and add new content.

## Author(s)

@eamahanna
@ialarmedalien

## Status

Pending

## Considered Alternatives

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

_A feature branch a separate branch in a repo used to implement a single feature in a project._

* `+` Rapid iteration cycle
* `+` Supports developer collaboration
* `+` Provides visibility into what each team member is developing
* `+` All work is being completed in a single repository
* `-` Additional admin overhead related to repository access
* `-` More people have write access to a repository leading less fine-grained control of merges

### Forks

_A fork is a copy of a repository._

* `+` Less user access management duties for a repository admin
* `+` Fine-grain control over merging
* `+` Supports 3rd party development via independent forks
* `+` Easy to discard experiments and changes
* `-` Forking is more expensive (git has to do a diff of the entire codebase) and takes up more server space
* `-` Changes live in different repositories which can be difficult to locate
* `-` Does not easily allow for collaboration
* `-` Developers work in isolation which can lead to knowledge management issues if the team is unaware of where forked repos are located
* `-` Forks do not have access to github action secrets from the management repository
* `-` In a team setting keeping all forked repositories in sync can become error prone due to the sheer number of the moving parts

### Alternative Three

* `+` Pro...
* `-` Con...

### Alternative Four

* `+` Pro...
* `-` Con...

## References

* [Atlassian Support
](https://support.atlassian.com/bitbucket-cloud/docs/branch-or-fork-your-repository/)
* [The Definitive Guide to Forks and Branches in Git](https://www.pluralsight.com/blog/software-development/the-definitive-guide-to-forks-and-branches-in-git#:~:text=Forking%20creates%20a%20full%20copy,what%20branch%20you%20are%20using.)
* [Git Workflows for Pros: A Good Git Guide](https://www.toptal.com/git/git-workflows-for-pros-a-good-git-guide)
