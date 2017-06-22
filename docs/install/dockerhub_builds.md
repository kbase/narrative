## Building Narrative Images with Dockerhub
(Updated 6/22/2017)

We currently make use of Jenkins and Dockerhub (https://hub.docker.com) to manage Narrative production builds. There are three images here that stack on each other.

### List of images
1. **narrprereq**  
This image is the prerequisite for all Narrative components. It's an Ubuntu 14.04 build that gets constructed with a number of apt-get packages, Python packages (via pip), Perl, and R packages. It's essentially the core system that has prerequisites for all the rest. It shouldn't need to be rebuilt very often, except to update version of requirements.

2. **narrbase**  
This image is the base for the KBase code. It builds on narrprereq by adding specific versions of Jupyter, IPython, and IPywidgets. This layer allows us to manage versions of those components without rebuilding everything in narrprereq.

3. **narrative**  
This is the final image to build the Narrative with. It mostly just contains KBase code that makes use of the rest.

### How to build images
Dockerhub builds images based on either Github tags or branches. We're using tags for narrprereq and narrbase, and branches with webhook triggers for narrative.

These all live under the KBase organization, so you'll first need access there to make a new tag. Here's the steps.

1. From the command line, clone the repo (if you haven't already) and create a tag. We've been following the convention <image name><semantic version>
```
git clone https://github.com/kbase/narrative
cd narrative
git tag narrbase1.2
git push --tags
```
2. With the new tag in place, head to Dockerhub. In the KBase organization, click the `kbase/narrbase` block. Navigate to the `Build Settings` tab to see the list of builds available. The top one should have a green '+' sign - click that to add a new row.
3. In the new Build Settings row, select type=tag in the dropdown, and set the name to the name of the git tag you created (above would be narrbase1.2). Set the location to the directory where the Dockerfile is (relative to the root of the repo), and add a semantic version for the Docker image.
4. Once that's done, hit "Save Settings." Then you can trigger the build with the Trigger button.

Note that the Dockerfile of narrbase and narrative depend on specific versions of previous images being present, so watch your build order.

With the two base images built, you can now use the internal Jenkins instance to build and deploy the main image, as it pulls the base images from Dockerhub. Instructions for that are elsewhere.
