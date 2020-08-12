# Staging a new Narrative release
(Updated 8/12/2020)

1. Update versions following (roughly) semantic versioning. The file to be updated are:
    * package.json, package-lock.json, bower.json, src/config.json, src/config.json.templ, src/biokbase/narrative/\_\_init\_\_.py
    * Major - backward incompatible changes, like the move from Python 2 -> Python 3, or Narrative typed object changes.
    * Minor - new features that don't affect compatibility.
    * Patch - adjustments to existing features, bug fixes.  

2. Add release notes in RELEASE_NOTES.md
    * Add a new heading with the updated version.
    * Add a list of changes with some reasonable detail. You don't need to add the name of every module changed, just the overall feature affected. Include JIRA ticket numbers where appropriate.

3. PR these changes to the develop branch.
    * Ensure that tests pass.
    * Ensure that things work as expected on the CI environment.

4. PR the develop branch to the master branch.
    * Deploy on the next environment.
    * Ensure that things work as expected.

5. Create a new release in the narrative repo.
    * tag it with the new version, prefixed with v (e.g. v4.2.1).

That's it. The deployment image is automatically pushed to Dockerhub (as of this writing) on a successfully merged pull request, and deployed from there.
