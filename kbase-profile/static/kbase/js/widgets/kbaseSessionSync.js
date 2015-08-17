(function($) {
'use strict';
  var SessionSync = Object.create({}, {
    init: {
      value: function (cfg) {
        this.sessionObject = this.importSessionFromCookie();
        return this;
      }
    },
    
    session: {
      value: null,
      writable: true
    },
    sessionObject: {
      value: null,
      writable: true
    },
    cookieName: {
      value: 'kbase_session'
    },
    narrCookieName: {
      value: 'kbase_narr_session'
    },
    
    // Note that THIS session just uses the original kbase
    // session object without transforming it to the canonical form
    // used in the real kbaseSession
    getKBaseSession: {
      value: function () {
        return this.sessionObject;
      }
    },
   
    
    importSessionFromCookie: {
      value: function () {
         var sessionCookie = $.cookie(this.cookieName);
        if (!sessionCookie) {
          return null;
        }
        // first pass just break out the string into fields.
        var session = this.decodeToken(sessionCookie);
        
        if (! (session.kbase_sessionid && session.un && session.user_id && session.token) ) {
          this.removeAuth();
          return null;
        }
        
        session.token = session.token.replace(/PIPESIGN/g, '|').replace(/EQUALSSIGN/g, '=');

        // now we have a session object equivalent to the one returned by the auth service.
        
        session.tokenObject = this.decodeToken(session.token);
        
        if (this.validateSession(session)) {
          return session;
        } else {
          return null;
        }
      }
    },
    decodeToken: {
      value: function (token) {
        var parts = token.split('|');
        var map = {};
        for (var i=0; i<parts.length; i++) {
          var fieldParts = parts[i].split('=');
          var key = fieldParts[0];
          var value = fieldParts[1];
          map[key] = value;
        }
        return map;
      }
    },
    decodeSessionString: {
      value: function (s) {
        if (!s || s.length === 0) {
          return null;
        }        
        var session = this.decodeToken(s);
        if (!session) {
          return null;
        }
        if (! (session.kbase_sessionid && session.un && session.user_id && session.token) ) {
          // In all probability, we have have the cookie created by the auth server.
          this.removeAuth();
          return null
        }
        session.token = session.token.replace(/PIPESIGN/g, '|').replace(/EQUALSSIGN/g, '=');
        session.tokenObject = this.decodeToken(session.token);
        return session;
      }
    },
    
    validateSession: {
      value: function (sessionObject) {
        if (sessionObject === undefined) {
          sessionObject = this.sessionObject;
        }
        if (!sessionObject) {
          return false;
        }
        if (! (sessionObject.kbase_sessionid && sessionObject.un && sessionObject.user_id && sessionObject.token && sessionObject.tokenObject) ) {
          // We should not get here.
          this.removeAuth();
          return false;
        }
        if (this.hasExpired(sessionObject)) {
          return false;
        }
        return true;
      }
    },
    
    hasExpired : {
      value: function (sessionObject) {          
          var expirySec = sessionObject.tokenObject.expiry;
          if (!expirySec) {
            return false;
          }
          expirySec = parseInt(expirySec);
          if (isNaN(expirySec)) {
            return false;
          }
          var expiryDate = new Date(expirySec*1000);
          var diff = expiryDate - new Date();
          if (diff <= 0) {
            return true;
          } else {
            return false;
          }
        }
    },
    removeAuth: {
      value: function() {
        $.removeCookie(this.cookieName, {path: '/'});
        $.removeCookie(this.cookieName, {path: '/', domain: 'kbase.us'});
        $.removeCookie(this.narrCookieName, {path: '/', domain: 'kbase.us'});
        // For compatability
        localStorage.removeItem(this.cookieName);
      }
    }
    
  });
  $.KBaseSessionSync = SessionSync;
}(jQuery));