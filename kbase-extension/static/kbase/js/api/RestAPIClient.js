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

define([
  'jquery'
], function(
  $
) {
  'use strict';

  return function constructor(args) {

    this.root   = args.root;
    this.routes = args.routes;
    this.token  = args.token;

    var routeKeys = Object.keys(args.routes || {});

    // gawd. What i wouldn't give for some ES6 syntax here.
    routeKeys.forEach( function(routeName) {
      var route = args.routes[routeName];

      var routeArgs = route.path.match(/\${\w+}/g) || [];

      if (routeArgs) {
        for (var j = 0; j < routeArgs.length; j++) {
          var remapped = routeArgs[j].match(/\w+/g)[0];
          routeArgs[j] = remapped;
        }
      }

      this[routeName] = function(fArgs) {

        if (fArgs === undefined) {
          fArgs = {};
        }

        var path = route.path;

        for (var i = 0; i < routeArgs.length; i++) {
          var replacement = fArgs[routeArgs[i]] !== undefined
            ? fArgs[routeArgs[i]]
            : '';
          path = path.replace('${' + routeArgs[i] + '}', replacement);
        }
       var restURL = [this.root, path].join('/');

       return this.ajax(
        {
          route : route,
          url   : restURL,
          token : this.token,
          data  : fArgs.data,
        });

      }
    }.bind(this));

    this.ajax = function ajax(args) {

      var deferred = $.Deferred();

      var beforeSend = function (xhr) {
          xhr.setRequestHeader("Authorization", args.token);
      }

      var xhr = $.ajax({
          url: args.url,
          dataType: "text",
          type: args.route.method,
          processData: false,
          data: JSON.stringify(args.data),
          beforeSend: beforeSend,
          success: function (data, status, xhr) {
              deferred.resolve(data, status, xhr);
          },
          error: function (xhr, textStatus, errorThrown) {
            deferred.reject( xhr, textStatus, errorThrown )
          }
      });

      var promise = deferred.promise();
      promise.xhr = xhr;
      return promise;
    }


    return this;
  }

})
