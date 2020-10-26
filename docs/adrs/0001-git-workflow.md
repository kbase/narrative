# Git Workflow for Narrative Repo

Date: 2020-08-28

Developers on the narrative repository need to come into alignment on the git workflow used to create PRs and add new content.

## Author(s)

@eamahanna
@ialarmedalien

## Status

Accepted

## Alternatives Considered

* Feature Branches
* Forks
* Feature Branches and Forks for 3rd Party Developers
* Change nothing and allow developers to choose their git flow preference

## Decision Outcome

Internal team members will use feature branches and external developers will contribute via forks.

## Consequences

By choosing a combined approach contribution, there will be an increase in admin responsibilities of the repository related to access management. Internal developers will potentially have to get comfortable with contributing via feature branches if they have not done this previously. Given internal developers will not contribute via forks, regular maintenance tasks may arise to ensure the 3rd party developer experience maintains a high standard. This may be less of an issue in this repository given only internal team members have historically contributed.

## Pros and Cons of the Alternatives

### Feature Branches

_A feature branch is a separate branch in a repository used to implement a single feature in a project._

* `+` Rapid iteration cycle
* `+` Supports developer collaboration
* `+` Provides visibility into what each team member is developing
* `+` All code and changes are located in a single repository
* `-` Additional admin overhead required to provide developers with write access to the repository
* `-` More people have write access to a repository leading less fine-grained control of merges; can be mitigated using [CODEOWNERS](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/about-code-owners) file to control branch access

### Forks

_A fork is a copy of a repository and is created in the developer's namespace._

* `+` Repository admins do not need to grant write access to the repository
* `+` Admins have complete control over what goes into the repo; content from untrusted sources can be vetted prior to merge
* `+` Easy to discard experiments and changes
* `-` Forking is more expensive (git has to do a diff of the entire codebase) and takes up more server space
* `-` Code changes are scattered over numerous forks in different GitHub namespaces; no central shared repository
* `-` Does not easily allow for collaboration
* `-` Developers work in isolation which can lead to knowledge management issues if the team is unaware of where forked repositories are located
* `-` Developers must supply secrets (e.g. authentication data or dev tokens) for any github actions
* `-` In a team setting keeping all forked repositories in sync can become error prone due to the sheer number of the moving parts
* `-` Devs may end up with copies of the original repository and of collaborators' forked repositories

### Feature Branches and Forks for 3rd Party Developers

_Internal KBase staff and teams contribute via feature branches, and 3rd party developers contribute via forks._

* `+` Internal teams/developers can easily collaborate
* `+` Fine grain control of what 3rd party developers can contribute
* `+` Less forks of the repository will exist
* `+` All internal work will be completed within a single repository
* `+` Provides an insight into internal work being completed on the repository
* `-` Additional user access management duties for repository admins
* `-` Admins will have to monitor the repository for 3rd party pull requests
* `-` More internal team members have write access to repository; less control over what is merged into develop; can be mitigated using [CODEOWNERS](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/about-code-owners) file to control branch access

### Change Nothing - Developer Preference

* `+` Allows developers to choose the method they are most comfortable with
* `-` No standard can lead to confusion when attempting to collaborate and check out work locally
* `-` Has the cons of both forks and feature branches
* `-` Chaos

## References

* [Atlassian Support
](https://support.atlassian.com/bitbucket-cloud/docs/branch-or-fork-your-repository/)
* [The Definitive Guide to Forks and Branches in Git](https://www.pluralsight.com/blog/software-development/the-definitive-guide-to-forks-and-branches-in-git#:~:text=Forking%20creates%20a%20full%20copy,what%20branch%20you%20are%20using.)
* [Git Workflows for Pros: A Good Git Guide](https://www.toptal.com/git/git-workflows-for-pros-a-good-git-guide)
* [The problem with Git Flow](https://about.gitlab.com/blog/2020/03/05/what-is-gitlab-flow/)
* [Comparing Workflows](https://www.atlassian.com/git/tutorials/comparing-workflows)
