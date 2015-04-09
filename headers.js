/* global Fastly: false */

var Autoupdate = Package.autoupdate && Package.autoupdate.Autoupdate,
    WebApp = Package.webapp && Package.webapp.WebApp; //jshint ignore:line

Fastly.CacheVersions = new Mongo.Collection("edgee:fastly/versions");

Fastly.CacheVersions._ensureIndex({
    _id: 1,
    purged: 1
});

/** Purges cache for all other versions.
 *
 * @param {String} serviceId - Fastly Service ID
 * @param {String} version - Autoupdate version ID
 */

Fastly.prototype.versionUpdate = function (serviceId, version) {
    var fastly = this;

    Fastly.CacheVersions.find({
        _id: {$ne: version},
        purged: {$exists: false}
    }, {
        fields: {_id: 1}
    }).forEach(function (version) {
        fastly.purgeKey(serviceId, "version-" + version._id, function (error) {
            if (error)
                throw error;
            else {
                Fastly.CacheVersions.update(version._id, {
                    $set: {purged: true}
                });
            }
        });
    });
};

/** Automatically purge all html cache when app is updated
 *
 * @param {String} serviceId - Fastly serviceId
 * @param {Number|null} [maxAge] - Cache Control maxage for app urls
 * (in seconds)
 */

Fastly.prototype.autoupdate = function (serviceId, maxAge) {
    if (!Autoupdate || !WebApp) {
        return; //No webapp / autoupdate (probably a bg-worker or something)
    }

    var fastly = this,
        version = null;

    Meteor.startup(function () {
        version = Autoupdate.autoupdateVersion;
        // Purge boilerplate from older versions.
        fastly.versionUpdate(serviceId, version);
    });

    if (_.isUndefined(maxAge)) {
        //Default maxAge is 24 hours or 1 hour if fast-render is enabled
        maxAge = 3600;

        if (! ("meteorhacks:fast-render" in Package))
            maxAge *= 24;
    }

    // Label pages as the current version.
    WebApp.connectHandlers.use(function (req, res, next) {
        if (isAppUrl(req.url)) {
            Fastly.CacheVersions.upsert({_id: version}, {
                $set: {servedAt: new Date()}
                //Nice to have, but not supported by Mongo yet:
                //$setOnInsert: {urls: [req.url]},
                //$addToSet: {urls: req.url}
            }, function (error) {
                //Asychronous to no further delay delivery.
                if (error) {
                    throw error;
                }
            });

            if (maxAge) {
                res.setHeader("Cache-Control", "public, s-maxage=" + maxAge);
            }

            res.setHeader("Surrogate-Key", [
                "version-" + version
            ].join(" "));
        }
        next();
    });
};

// meteor algorithm to check if this is a meteor serving http request or not
function isAppUrl(url) {
    if (url === '/favicon.ico' || url === '/robots.txt')
        return false;

    // NOTE: app.manifest is not a web standard like favicon.ico and
    // robots.txt. It is a file name we have chosen to use for HTML5
    // appcache URLs. It is included here to prevent using an appcache
    // then removing it from poisoning an app permanently. Eventually,
    // once we have server side routing, this won't be needed as
    // unknown URLs with return a 404 automatically.
    if (url === '/app.manifest')
        return false;

    // Avoid serving app HTML for declared routes such as /sockjs/.
    if (Package.routepolicy.RoutePolicy.classify(url))
        return false;

    // we currently return app HTML on all URLs by default
    return true;
}
