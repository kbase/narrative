# Integration Testing Framework

Date: 2020-10-12

Integration testing and end-to-end (e2e) testing is not actively used in this repo. To implement integration/e2e testing, a testing framework needs to be selected and implemented.

## Author(s)

@eamahanna

## Status

Accepted

## Alternatives Considered

* WebDriver.io
* Cypress
* No integration testing

## Decision Outcome

Selenium WebDriver will be used for integration and e2e testing.

## Consequences

There will be overhead to create and maintain additional tests.

## Pros and Cons of the Alternatives

### Webdriver.io

* `+` Other repos in KBase use it
* `+` Has cross browser testing (Chrome, Firefox, Edge, IE, Opera, Safari)
* `+` Supports multiple languages
* `+` Supports iframes
* `-` Steep learning curve for new developers
* `-` Challenging to implement
* `-` Test execution is slow
* `-` Can be flaky

### Cypress

* `+` Easy to setup
* `+` Tests can be written quickly
* `+` Provides access to a dashboard for easy debugging
* `+` Small learning curve for new developers
* `+` Comprehensive documentation
* `+` Free for open source projects
* `-` Can only test using JavaScript
* `-` Has limited cross browser testing (Chrome, Edge, Electron, Firefox - Beta)
* `-` KBase developers will have to learn another testing framework
* `-` Limited iframe support (the narrative uses iframes in several locations)

### No integration/e2e testing

* `+` Will not take any time away from feature development
* `+` Less tests to maintain
* `-` Will not expand test coverage
* `-` Have low confindence during the development cycle
* `-` Will not have tests to catch integration bugs
* `-` Testing does not reflect the user expereience

## References

* [Cypress.io](https://www.cypress.io/)
* [WebDriver.io](https://webdriver.io/)
* [Applitools: Cypress vs Selenium WebDriver](https://applitools.com/blog/cypress-vs-selenium-webdriver-better-or-just-different/)