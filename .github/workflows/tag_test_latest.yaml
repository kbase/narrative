---
name: Tag Latest Test Image
'on':
  pull_request:
    branches:
    - develop
    types:
    - closed
jobs:
  docker_tag:
    runs-on: ubuntu-latest
    steps:
    - name: Check out GitHub Repo
      if: github.event_name == 'pull_request' && github.event.action == 'closed' &&
        github.event.pull_request.merged == true
      with:
        ref: "${{ github.event.pull_request.head.sha }}"
      uses: actions/checkout@v2
    - name: Build and Push to Packages
      if: github.event.pull_request.draft == false
      env:
        PR: "${{ github.event.pull_request.number }}"
        SHA: "${{ github.event.pull_request.head.sha }}"
        DOCKER_ACTOR: "${{ secrets.GHCR_USERNAME }}"
        DOCKER_TOKEN: "${{ secrets.GHCR_TOKEN }}"
      run: "./.github/workflows/scripts/tag_test_latest.sh\n"
