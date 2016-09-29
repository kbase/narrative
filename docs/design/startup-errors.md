# Narrative Startup Conditions

This document explores error conditions that may occur during initial Narrative startup. 

## Components
- network
- nginx server
- lua nginx code
- docker
- jupyter

## Startup Lifecycle

So I think that in any case in which an unhandled error is issued by the narrative server (the lua proxy) the narrative loader will loop until it times out and then issue an error message. We need to identify specifically the response from the narrative server when a narrative container is loading.

Narrative opening will go through the kbase-ui narrative loading page if the narrative server (i.e. lua code in nginx) detects that a container is not loaded for that user. The loading page will attempt to load the narrative up to 20 times, with a 1 second pause between each one. If there is an error detected upon any loading attempt, an error message is displayed.

The issue is the detection of a container being loaded. We should identify all of the responses from the narrative service, and make sure they are specifically handled. Currently only a few error conditions are detected, and everything else falls through allowing the loop to continue until the end.


## Error Conditions
- network
    - No connection from user to kbase proxy
    - Kbase front proxy to narrative proxy
- nginx server
    - nginx down
- lua nginx code
    - lua program error
    - lua error conditions detected
        - HTTP_REQUEST_TIMEOUT (408) - if there is a timeout locking the user session (could this happen with concurrent access by the same user to the same narrative deployment env?)
HTTP_SERVICE_UNAVAILABLE (503) - if no container could be created
ngx.redirect (302) - if container does not exist yet and is being created.
HTTP_NOT_FOUND (404) - if a container was not found ... then not found ... don't think is possible to reach this condition
- docker
- jupyter


### Network

#### No connection from user to kbase proxy

The connection from the browser to the kbase front end proxy is interrupted.

name
: KBase proxy unreachable

expected
: Nothing, the browser cannot get any response from a KBase service


#### Kbase front proxy to narrative proxy

The connection from the KBase front end proxy to the Narrative proxy is interrupted.

name
: Narrative proxy unreachable

expected
: The user should see an error message specifically stating that the Narrative service is not currently available

currently
: I don't know, but I expect it is a simple 502 or 404.


### Narrative proxy

##### nginx down

The Narrative proxy runs on nginx, and nginx may not be running at all. This differs from the "Narrative proxy unreachable" in that the Narrative proxy can be contacted by the KBase proxy, but will not have the http or https service running on the respective ports.

name
: Narrative proxy does not offer http or https service

expected
: The user should see an error message specifically stating that the Narrative service is not currently available

currently
: I don't know, but I expect it is a simple 502 or 404.


### lua nginx code

The Narrative proxy uses Lua scripts executed during browser connection to route access to the user's Narrative container.
    
#### lua program error

During the execution of this Lua code, the Lua code itself may experience an error


name
: Narrative proxy program error

expected
: The user should see a message stating that the Narrative service is experiencing internal errors.

currently
: Plain 500 Internal Server Error

todo
: The Narrative proxy nginx should be configured to display a custom error message in the case of all errors, but especially 500.



In addition, the Lua code itself may return the following errors upon detecting certain conditions.


#### HTTP_REQUEST_TIMEOUT (408)
 
if there is a timeout locking the user session (could this happen with concurrent access by the same user to the same narrative deployment env?)

What should this mean to the user? There really isn't anything meaningful to convey to the user, but the technical reason for the error should be preserved and communicated.

name
: Timeout locking user session

expected
: The user should see a message that there was a temporary error accessing the Narrative, and they should try again

currently
: If this error could be triggered, it would be a runtime error resulting in a generic 500 message. The error handing is incorrectly coded

todo
: Correct the coding of the error; install a custom error page for this condition

#### HTTP_SERVICE_UNAVAILABLE (503)

if no container could be created because the limit on the number of containers that may be created has been exceeded, or the time to create containers is exceeding the ability of the system to respond to new requests

name
: Narrative container could not be created

expected
: The user should receive an error message that the Narrative service has exceeded the capacity, and they should try again later

currently
: It looks like it should return the correct error; the narrative proxy itself will return a generic 503 error message

todo
: The Narrative proxy should return a custom error message. Alternatively, a front end Narrative loading page could ALWAYS be the entry-way to a narrative, in which case it could trap such errors.
 


#### ngx.redirect (302)

Technically a non-success message, this response is created in the case of a Narrative request requiring the starting of a new Narrative container. The url to the loading page with the Narrative url passed as a parameter is the sent as the Location.


#### HTTP\_NOT\_FOUND (404)

if a container was not found ... then not found ... don't think is possible to reach this condition.

This pathway in the code does not seem possible.

#### 


## Upstream Errors

What happens when various upstream components have a failure?

### docker

A docker error may affect the initial Narrative startup as well as the Loading loop.

### jupyter

A Jupyter / Narrative app error will not affect the initial Narrative startup, but may affect the Loading loop. This is because an error in the Narrative server code itself may produce any number of http error conditions which would result in an Nginx proxy 502 error.



## Non-Startup Errors

Although not related to startup per se, in the user's mind Narrative access post-startup is no different. It should behave the same.

There are generally two types of Narrative access errors: access and startup.

Access errors are encountered when a user requests a Narrative, but before it is delivered.

- no authorization
- inadequate authorization
- requested object is not a narrative
- requested object does not exist at all
- requested narrative is corrupt
