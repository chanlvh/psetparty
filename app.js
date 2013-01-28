// Generated by IcedCoffeeScript 1.3.3f
(function() {
  var $, FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, FacebookStrategy, addEvent, addUserIfNotPresent, allevents, app, authentications, buildingaddress, buildingdata, buildingname, classdata, classes, classlist, classlist_set, deleteEvent, dumpToDisk, ensureAuthenticated, eventListToDictionary, everyone, express, fixEventParticipantFormat, fixParticipantFormat, fs, getAddress, getCalendarId, getClasses, getEvents, getEventsForUser, getEventsUserIsParticipating, hostname, http, httpserver, iced, indexContents, line, location_addresses, location_list, mkId, nowjs, parseEvent, participantToEvent, passport, rclient, redis, redisdata, rediserr, removeUserIfPresent, request, restler, subjectnum, toValues, __iced_deferrals, __iced_k, __iced_k_noop,
    _this = this;

  iced = require('iced-coffee-script').iced;
  __iced_k = __iced_k_noop = function() {};

  fs = require('fs');

  request = require('request');

  $ = require('jQuery');

  restler = require('restler');

  redis = require('redis');

  rclient = redis.createClient();

  console.log('loading redis data');

  (function(__iced_k) {
    __iced_deferrals = new iced.Deferrals(__iced_k, {
      filename: "app.coffee"
    });
    rclient.get('psetparty', __iced_deferrals.defer({
      assign_fn: (function() {
        return function() {
          rediserr = arguments[0];
          return redisdata = arguments[1];
        };
      })(),
      lineno: 11
    }));
    __iced_deferrals._fulfill();
  })(function() {
    var _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3;
    _ref = JSON.parse(redisdata), classes = _ref.cl, allevents = _ref.ev;
    console.log('finished loading redis data');
    express = require('express');
    app = express();
    http = require('http');
    httpserver = http.createServer(app);
    httpserver.listen(3333);
    nowjs = require('now');
    everyone = nowjs.initialize(httpserver);
    passport = require('passport');
    FacebookStrategy = require('passport-facebook').Strategy;
    indexContents = fs.readFileSync('index.html');
    FACEBOOK_APP_ID = '123681104472943';
    FACEBOOK_APP_SECRET = '9115798d61b57d41b5e10b66f49e86a0';
    hostname = require('os').hostname();
    if (hostname === 'psetparty') {
      FACEBOOK_APP_ID = '122852207888099';
      FACEBOOK_APP_SECRET = 'aeb972a64f7d04e23a8fd509a61e8f90';
    }
    passport.serializeUser(function(user, done) {
      return done(null, user);
    });
    passport.deserializeUser(function(obj, done) {
      return done(null, obj);
    });
    passport.use(new FacebookStrategy({
      clientID: FACEBOOK_APP_ID,
      clientSecret: FACEBOOK_APP_SECRET,
      callbackURL: "/auth/facebook/callback"
    }, function(accessToken, refreshToken, profile, done) {
      return process.nextTick(function() {
        return done(null, profile);
      });
    }));
    app.configure('development', function() {
      return app.use(express.errorHandler());
    });
    app.configure(function() {
      app.set('views', __dirname + '/views');
      app.set('view engine', 'ejs');
      app.use(express.bodyParser());
      app.use(express.methodOverride());
      app.set('view options', {
        layout: false
      });
      app.locals({
        layout: false
      });
      app.use(express.logger());
      app.use(express.cookieParser());
      app.use(express.bodyParser());
      app.use(express.methodOverride());
      app.use(express.session({
        secret: 'keyboard cat'
      }));
      app.use(passport.initialize());
      app.use(passport.session());
      app.use(app.router);
      return app.use(express["static"](__dirname + '/'));
    });
    app.get('/', function(req, res) {
      if ((req.query != null) && (req.query.email != null) && (req.query.name != null)) {
        return res.redirect('/index.html?email=' + encodeURI(req.query.email) + '&name=' + encodeURI(req.query.name));
      } else {
        return res.redirect('/login.html');
      }
    });
    app.get('/auth/facebook', passport.authenticate('facebook'), function(req, res) {});
    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
      failureRedirect: '/login.html'
    }), function(req, res) {
      return res.redirect('/?email=' + encodeURI(req.user.profileUrl) + '&name=' + encodeURI(req.user.displayName));
    });
    ensureAuthenticated = function(req, res, next) {
      if (req.isAuthenticated()) return next();
      return res.redirect('/login.html');
    };
    fixParticipantFormat = function(x) {
      if (x.email != null) {
        return x;
      } else {
        return {
          'email': x[0],
          'fullname': x[1]
        };
      }
    };
    fixEventParticipantFormat = function(event) {
      var participant, participants;
      if (!(event.participants != null)) event.participants = [];
      participants = (function() {
        var _i, _len, _ref1, _results;
        _ref1 = event.participants;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          participant = _ref1[_i];
          _results.push(fixParticipantFormat(participant));
        }
        return _results;
      })();
      event.participants = participants;
      return event;
    };
    eventListToDictionary = function(eventlist) {
      var event, output, _i, _len;
      output = {};
      for (_i = 0, _len = eventlist.length; _i < _len; _i++) {
        event = eventlist[_i];
        output[event.id] = event;
      }
      return output;
    };
    if (!(allevents != null)) allevents = {};
    (function() {
      var event, eventid, k, v, _results;
      _results = [];
      for (k in allevents) {
        v = allevents[k];
        if (allevents[k] instanceof Array) {
          allevents[k] = eventListToDictionary(allevents[k]);
        }
        _results.push((function() {
          var _ref1, _results1;
          _ref1 = allevents[k];
          _results1 = [];
          for (eventid in _ref1) {
            event = _ref1[eventid];
            eventid = parseInt(eventid);
            _results1.push(allevents[k][eventid] = fixEventParticipantFormat(event));
          }
          return _results1;
        })());
      }
      return _results;
    })();
    participantToEvent = {};
    (function() {
      var email, event, eventid, participant, subjectname, v, _results;
      _results = [];
      for (subjectname in allevents) {
        v = allevents[subjectname];
        _results.push((function() {
          var _ref1, _results1;
          _ref1 = allevents[subjectname];
          _results1 = [];
          for (eventid in _ref1) {
            event = _ref1[eventid];
            _results1.push((function() {
              var _i, _len, _ref2, _results2;
              _ref2 = event.participants;
              _results2 = [];
              for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
                participant = _ref2[_i];
                email = participant.email;
                if (!(participantToEvent[email] != null)) {
                  participantToEvent[email] = {};
                }
                _results2.push(participantToEvent[email][event.id] = subjectname);
              }
              return _results2;
            })());
          }
          return _results1;
        })());
      }
      return _results;
    })();
    classlist = [];
    classlist_set = {};
    classdata = fs.readFileSync('classes.txt', 'utf-8');
    _ref1 = classdata.split('\n');
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      line = _ref1[_i];
      if (line.indexOf('\t') === -1) continue;
      subjectnum = line.split('\t')[0];
      if (!(classlist_set[subjectnum] != null)) {
        classlist_set[subjectnum] = true;
        classlist.push(subjectnum);
      }
    }
    classlist.sort();
    buildingdata = fs.readFileSync('buildings.txt', 'utf-8');
    location_list = [];
    location_addresses = {};
    _ref2 = buildingdata.split('\n');
    for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
      line = _ref2[_j];
      _ref3 = line.split('\t'), buildingname = _ref3[0], buildingaddress = _ref3[1];
      location_list.push(buildingname);
      location_addresses[buildingname] = buildingaddress;
    }
    everyone.now.location_list = location_list;
    everyone.now.location_addresses = location_addresses;
    getAddress = everyone.now.getAddress = function(location) {
      var addr;
      addr = location_addresses[location];
      if (addr != null) return addr + ' , MIT, Cambridge, MA';
      return location + ' , MIT, Cambridge, MA';
    };
    everyone.now.addClassType = function(classname) {
      if (typeof classname !== typeof '') return;
      if (!(classlist_set[classname] != null)) {
        classlist_set[classname] = true;
        classlist.push(classname);
        return classlist.sort();
      }
    };
    everyone.now.getClassesWithPrefix = function(prefix, callback) {
      var matches, x;
      matches = (function() {
        var _k, _len2, _results;
        _results = [];
        for (_k = 0, _len2 = classlist.length; _k < _len2; _k++) {
          x = classlist[_k];
          if (x.indexOf(prefix) === 0) _results.push(x);
        }
        return _results;
      })();
      return callback(matches);
    };
    everyone.now.getCalendarId = getCalendarId = function(classname, callback) {
      return restler.get('http://localhost:5000/calid?title=' + classname).on('complete', callback);
    };
    root.classids = {};
    /*
    # s: "2013-01-21T07:30:00-05:00"
    splitTimeRange = (s) ->
      [date,timerange] = s.split('T')
      [start,end] = timerange.split('-')
      startTime = new Date(date + 'T' + start)
      endTime = new Date(date + 'T' + end)
      return [startTime, endTime]
    */

    parseEvent = function(event) {
      return {
        'id': event.id,
        'title': event.summary,
        'start': new Date(event.start.dateTime),
        'end': new Date(event.end.dateTime)
      };
    };
    getEventsUserIsParticipating = everyone.now.getEventsUserIsParticipating = function(username, callback) {
      var customEventDict, eventid, events, subjectevents, subjectname, _ref4, _ref5;
      events = [];
      customEventDict = (_ref4 = participantToEvent[username]) != null ? _ref4 : {};
      for (eventid in customEventDict) {
        subjectname = customEventDict[eventid];
        eventid = parseInt(eventid);
        subjectevents = (_ref5 = allevents[subjectname]) != null ? _ref5 : {};
        if (subjectevents[event.id] != null) events.push(subjectevents[event.id]);
      }
      return callback(events);
    };
    getEventsForUser = everyone.now.getEventsForUser = function(username, callback) {
      var classlist, customEventDict, event, eventid, eventid_set, events, events_for_class, events_per_class, i, subjectevents, subjectname, title, ___iced_passed_deferral, __iced_deferrals, __iced_k,
        _this = this;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      (function(__iced_k) {
        __iced_deferrals = new iced.Deferrals(__iced_k, {
          parent: ___iced_passed_deferral,
          filename: "app.coffee",
          funcname: "getEventsForUser"
        });
        getClasses(username, __iced_deferrals.defer({
          assign_fn: (function() {
            return function() {
              return classlist = arguments[0];
            };
          })(),
          lineno: 246
        }));
        __iced_deferrals._fulfill();
      })(function() {
        events_per_class = [];
        (function(__iced_k) {
          var _k, _len2;
          __iced_deferrals = new iced.Deferrals(__iced_k, {
            parent: ___iced_passed_deferral,
            filename: "app.coffee",
            funcname: "getEventsForUser"
          });
          for (i = _k = 0, _len2 = classlist.length; _k < _len2; i = ++_k) {
            title = classlist[i];
            getEvents(title, __iced_deferrals.defer({
              assign_fn: (function(__slot_1, __slot_2) {
                return function() {
                  return __slot_1[__slot_2] = arguments[0];
                };
              })(events_per_class, i),
              lineno: 250
            }));
          }
          __iced_deferrals._fulfill();
        })(function() {
          var _k, _l, _len2, _len3, _ref4, _ref5;
          events = [];
          eventid_set = {};
          for (_k = 0, _len2 = events_per_class.length; _k < _len2; _k++) {
            events_for_class = events_per_class[_k];
            for (_l = 0, _len3 = events_for_class.length; _l < _len3; _l++) {
              event = events_for_class[_l];
              events.push(event);
              eventid_set[event.id] = true;
            }
          }
          customEventDict = (_ref4 = participantToEvent[username]) != null ? _ref4 : {};
          for (eventid in customEventDict) {
            subjectname = customEventDict[eventid];
            eventid = parseInt(eventid);
            if (eventid_set[eventid] != null) continue;
            subjectevents = (_ref5 = allevents[subjectname]) != null ? _ref5 : {};
            if (subjectevents[event.id] != null) {
              events.push(subjectevents[event.id]);
            }
          }
          return callback(events);
        });
      });
    };
    mkId = function() {
      return Math.floor(Math.random() * 9007199254740992);
    };
    deleteEvent = everyone.now.deleteEvent = function(subjectname, eventid, callback) {
      if (!(allevents[subjectname] != null)) allevents[subjectname] = {};
      if (allevents[subjectname][eventid] != null) {
        delete allevents[subjectname][eventid];
      }
      if (callback != null) callback();
      return everyone.now.refreshUser();
    };
    addEvent = everyone.now.addEvent = function(subjectname, event, callback) {
      var newid;
      if (!(allevents[subjectname] != null)) allevents[subjectname] = {};
      newid = mkId();
      while (allevents[subjectname][newid] != null) {
        newid = mkId();
      }
      event.id = newid;
      event.address = getAddress(event.location);
      event.subjectname = subjectname;
      allevents[subjectname][event.id] = event;
      if (callback != null) callback(newid);
      return everyone.now.refreshUser();
    };
    toValues = function(dict) {
      var key, output, value;
      output = [];
      for (key in dict) {
        value = dict[key];
        output.push(value);
      }
      return output;
    };
    getEvents = everyone.now.getEvents = function(title, callback) {
      /*
        restler.get('http://localhost:5000/events?title=' + title).on('complete', (events) ->
          items = events.items ? []
          callback (parseEvent(event) for event in items)
        )
      */
      if (!(allevents[title] != null)) allevents[title] = [];
      return callback(toValues(allevents[title]));
    };
    app.get('/events', function(req, res) {
      var title, username;
      title = req.query.title;
      if (title != null) {
        getEvents(title, function(x) {
          return res.json(x);
        });
        return;
      }
      username = req.query.username;
      if (username != null) {
        getEventsForUser(username, function(x) {
          return res.json(x);
        });
        return;
      }
      return res.send('no title or username specified');
    });
    app.get('/classes', function(req, res) {
      var username;
      username = req.query.username;
      if (username != null) {
        return getClasses(username, function(x) {
          return res.json(x);
        });
      }
    });
    everyone.now.getAuthenticated = function(key, callback) {
      if (authentications[key] != null) return callback(authentications[key]);
    };
    authentications = {};
    app.get('/authenticate', function(req, res) {
      var email, key, name;
      email = req.query.email;
      if (!(email != null)) {
        res.send('e');
        return;
      }
      name = req.query.name;
      if (!(name != null)) {
        res.send('n');
        return;
      }
      key = req.query.key;
      if (!(key != null)) {
        res.send('k');
        return;
      }
      authentications[key] = {
        'email': email,
        'fullname': name
      };
      console.log(key);
      console.log(email);
      console.log(name);
      return res.send('g');
    });
    dumpToDisk = function(callback) {
      var ndata;
      ndata = JSON.stringify({
        cl: classes,
        ev: allevents
      });
      rclient.set('psetparty', ndata, callback);
      return ndata;
    };
    app.get('/save', function(req, res) {
      return dumpToDisk(function() {
        return res.send('saved');
      });
    });
    everyone.now.getCalendarIds = function(classnames, callback) {
      var i, title, ___iced_passed_deferral, __iced_deferrals, __iced_k,
        _this = this;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      (function(__iced_k) {
        var _k, _len2;
        __iced_deferrals = new iced.Deferrals(__iced_k, {
          parent: ___iced_passed_deferral,
          filename: "app.coffee",
          funcname: "getCalendarIds"
        });
        for (i = _k = 0, _len2 = classnames.length; _k < _len2; i = ++_k) {
          title = classnames[i];
          if (!(root.classids[title] != null)) {
            getCalendarId(title, __iced_deferrals.defer({
              assign_fn: (function(__slot_1, __slot_2) {
                return function() {
                  return __slot_1[__slot_2] = arguments[0];
                };
              })(classids, title),
              lineno: 371
            }));
          }
        }
        __iced_deferrals._fulfill();
      })(function() {
        return callback(root.classids);
      });
    };
    everyone.now.getClasses = getClasses = function(username, callback) {
      if (!(classes[username] != null)) classes[username] = [];
      if (callback != null) return callback(classes[username]);
    };
    everyone.now.addClass = function(username, classname, callback) {
      if (!(classes[username] != null)) classes[username] = [];
      if (classes[username].indexOf(classname) === -1) {
        classes[username].push(classname);
      }
      if (callback != null) return callback(classes[username]);
    };
    everyone.now.removeClass = function(username, classname, callback) {
      var x;
      if (!(classes[username] != null)) classes[username] = [];
      classes[username] = (function() {
        var _k, _len2, _ref4, _results;
        _ref4 = classes[username];
        _results = [];
        for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
          x = _ref4[_k];
          if (x !== classname) _results.push(x);
        }
        return _results;
      })();
      if (callback != null) return callback();
    };
    addUserIfNotPresent = function(event, user) {
      var emails, x;
      emails = (function() {
        var _k, _len2, _ref4, _results;
        _ref4 = event.participants;
        _results = [];
        for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
          x = _ref4[_k];
          _results.push(x.email);
        }
        return _results;
      })();
      if (emails.indexOf(user.email) === -1) return event.participants.push(user);
    };
    removeUserIfPresent = function(event, user) {
      var emails, newparticipants, x;
      emails = (function() {
        var _k, _len2, _ref4, _results;
        _ref4 = event.participants;
        _results = [];
        for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
          x = _ref4[_k];
          _results.push(x.email);
        }
        return _results;
      })();
      if (emails.indexOf(user.email) !== -1) {
        newparticipants = (function() {
          var _k, _len2, _ref4, _results;
          _ref4 = event.participants;
          _results = [];
          for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
            x = _ref4[_k];
            if (x.email !== user.email) _results.push(x);
          }
          return _results;
        })();
        return event.participants = newparticipants;
      }
    };
    everyone.now.joinEvent = function(event, user) {
      var eventid, title;
      eventid = event.id;
      title = event.subjectname;
      if (!(allevents[title] != null)) return;
      if (!(participantToEvent[user.email] != null)) {
        participantToEvent[user.email] = {};
      }
      participantToEvent[user.email][eventid] = title;
      if (allevents[title][eventid] != null) {
        addUserIfNotPresent(allevents[title][eventid], user);
      }
      return everyone.now.refreshUser();
    };
    everyone.now.leaveEvent = function(event, user) {
      var eventid, title;
      eventid = event.id;
      title = event.subjectname;
      if (!(allevents[title] != null)) return;
      if ((participantToEvent[user.email] != null) && (participantToEvent[user.email][eventid] != null)) {
        delete participantToEvent[user.email][eventid];
      }
      if (allevents[title][eventid] != null) {
        removeUserIfPresent(allevents[title][eventid], user);
      }
      return everyone.now.refreshUser();
    };
    return 'process.on \'SIGINT\', () ->\n  dumpToDisk()\n  process.exit()\n\nprocess.on \'SIGTERM\', () ->\n  dumpToDisk()\n  process.exit()\n\nprocess.on \'SIGQUIT\', () ->\n  dumpToDisk()\n  process.exit()';
  });

}).call(this);
