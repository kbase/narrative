/*
    This is an abstract class designed to wrapper up a RESTful API so it's encapsulated and abstracted away.

    Take a look at StagingServiceClient.js for ane example. Basically, just wrapper up a constructor to return
    a RestAPIClient object with routes installed, e.g.:

    return function constructor(args) {
      return new RestAPIClient({
        root : http://some.service.url
        token : (your auth token)
        routes : {
          someRoute : {
            method : get|post|delete|put|patch
            path : "/path/to/route/${variable}/${other}?${query_string}"
          }
        }
      })
    };

    Note that the path of the route *looks* like it's an ES6 template string - it's not, it's just future proofed to turn into one.
    This'll create a new client object with a single route, "someRoute". Call it like this:

    $someClient.someRoute(
      {
        variable : 'first_thing_in_url",
        other    : "next_thing_in_url",
        query_string: "some_query_in_this_case"
      }
    );

    The variables are arbitrary - it's whatever's named in the template string. Must match \w+.

    It returns a jQuery promise, with its .then and .fail method:

    $someClient.someRoute( { ... } )
      .then(function(data, status, xhr) {
        // do interesting things
      })
      .fail(function(xhr, textStatus, errorThrown) {
        // report failure somehow
      });

    errata - it just uses jquery's ajax methods and promises, and we may want to upgrade that to bluebird.
    It also returns the raw info on the successful request, with no parsing of json or nothing. It'd be handy to have
    some sort of middleware in there.
*/

define(['jquery'], ($) => {
    'use strict';

    return function constructor(args) {
        this.root = args.root;
        this.routes = args.routes;
        this.token = args.token;

        const routeKeys = Object.keys(args.routes || {});

        // gawd. What i wouldn't give for some ES6 syntax here.
        routeKeys.forEach((routeName) => {
            const route = args.routes[routeName];
            const routeArgs = route.path.match(/\${\w+}/g) || [];

            for (let j = 0; j < routeArgs.length; j++) {
                const remapped = routeArgs[j].match(/\w+/g)[0];
                routeArgs[j] = remapped;
            }

            this[routeName] = function (fArgs) {
                if (fArgs === undefined) {
                    fArgs = {};
                }

                const ajaxArgs = Object.assign(
                    {},
                    {
                        token: this.token,
                        route,
                    },
                    fArgs
                );

                let path = route.path;
                for (const element of routeArgs) {
                    const replacement = fArgs[element] !== undefined ? fArgs[element] : '';
                    path = path.replace('${' + element + '}', replacement);
                }
                ajaxArgs.url = [this.root, path].join('/');

                return this.ajax(ajaxArgs);
            };
        });

        this.ajax = function ajax(ajaxArgs) {
            const deferred = $.Deferred();
            const promise = deferred.promise();

            const xhrArgs = {
                url: ajaxArgs.url,
                dataType: ajaxArgs.dataType || 'text',
                type: ajaxArgs.route.method,
                processData: false,
                data: JSON.stringify(ajaxArgs.data),
                beforeSend: (xhr) => {
                    xhr.setRequestHeader('Authorization', ajaxArgs.token);
                    if (ajaxArgs.headers) {
                        ajaxArgs.headers.forEach((header) => {
                            xhr.setRequestHeader(header[0], header[1]);
                        });
                    }
                },
                success: (data, status, xhr) => {
                    deferred.resolve(data, status, xhr);
                },
                error: (xhr, textStatus, errorThrown) => {
                    deferred.reject(xhr, textStatus, errorThrown);
                },
            };
            promise.xhr = $.ajax(xhrArgs);
            return promise;
        };

        return this;
    };
});
