# Integration Testing Framework

Date: 2020-09-21

Integration testing and end-to-end (e2e) testing is not actively used in this repo. To implement integration/e2e testing, a testing framework needs to be selected and implemented.

## Author(s)

@eamahanna

## Status

Pending

## Alternatives Considered

* Selenium WebDriver
* Cypress
* No integration testing

## Decision Outcome

Cypress will be used for integration and e2e testing.

## Consequences

KBase developers will have to learn a new testing frame work. There will also be overhead to create and maintain additional tests.

## Pros and Cons of the Alternatives

### Selenium Webdriver

* `+` Other repos in KBase use it
* `+` Has cross browser testing (Chrome, Firefox, Edge, IE, Opera, Safari)
* `+` Supports multiple languages
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
* `-` Limited iframe support

### No integration/e2e testing

* `+` Will not take any time away from feature development
* `+` Less tests to maintain
* `-` Will not expand test coverage
* `-` Have low confindence during the development cycle
* `-` Will not have tests to catch integration bugs
* `-` Testing does not reflect the user expereience

## References

* [Cypress.io](https://www.cypress.io/)
* [Selenium WebDriver](https://www.selenium.dev/documentation/en/webdriver/)
* [Applitools: Cypress vs Selenium WebDriver](https://applitools.com/blog/cypress-vs-selenium-webdriver-better-or-just-different/)
* [BrowserStack: Cypress vs Selenium](https://www.browserstack.com/guide/cypress-vs-selenium)