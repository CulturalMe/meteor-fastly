/* global Fastly: false */

var url = Npm.require("url");

/** Automatically configure fastly
 *
 * This might create a new configuration version on your fastly instance.
 *
 * @param {String} serviceId - Service id to configure
 * @param {Object} [options]
 *
 * @returns new version number that was created (if any)
 */

Fastly.prototype.configure = function (serviceId, options) {

    options = _.extend({
        forceSSL: "force-ssl" in Package,
        httpsPort: "443",
        domain: url.parse(Meteor.absoluteUrl()).hostname,
        backendUrl: process.env.DDP_DEFAULT_CONNECTION_URL,
        requestSettingsName: "Default"
    }, options);

    var fastly = this;

    function service() {
        return "/" + [
                "service",
                encodeURIComponent(serviceId)
            ].concat(_.map(arguments, encodeURIComponent)).join("/");
    }

    function serviceVersion(version) {
        return service.apply(this, [
            "version",
            version || draft && draft.number || currentVersion().number
        ].concat(_.rest(arguments)));
    }

    var currentVersion = _.memoize(function () {
        return _.findWhere(fastly.request("GET", service("version")), {
            active: true
        });
    });

    function request(method) {
        var args = _.rest(arguments), params;

        if (_.chain(args).last().isObject().value()) {
            params = args.pop();
        }

        return fastly.request(method, serviceVersion.apply(this, args), params);
    }

    function get() {
        return request.apply(this, ["GET"].concat(_.toArray(arguments)));
    }

    function post() {
        return request.apply(this, ["POST"].concat(_.toArray(arguments)));
    }

    function put() {
        return request.apply(this, ["PUT"].concat(_.toArray(arguments)));
    }

    function listRequestSettings(version) {
        return get(version, "request_settings");
    }

    function listBackends(version) {
        return get(version, "backend");
    }

    var draft = null;

    function createDraft() {
        draft = put(currentVersion().number, "clone");

        put(draft.number, {
            comment: "Put by edgee:fastly"
        });

        return draft;
    }

    function draftVersion() {
        return draft || createDraft();
    }

    function getBackend() {
        var backends = listBackends();

        if (backends.length === 1) {
            return backends[0];
        }
        else if (backends.length > 1 && options.backendUrl) {
            return _.findWhere(backends, {
                hostname: url.parse(options.backendUrl).hostname
            });
        }
        else {
            throw new Error("Ambiguous or missing fastly backend setup: " +
            "Make sure that there is exactly one backend for the fastly " +
            "or choose a backendUrl");
        }
    }

    function assertDomain(domainName) {
        var allDomains = get(null, "domain", "check_all");

        var domain = _.find(allDomains, function (domain) {
            return domain[0].name === domainName;
        });

        if (!domain) {
            post(draftVersion().number, "domain", {
                name: domainName,
                comment: "Posted by edgee:fastly"
            });
        }
    }

    function assertRequestSettings(settings) {
        var list = listRequestSettings();

        if (!_.findWhere(list, settings)) {
            var version = draftVersion().number,
                current = _.findWhere(list, {name: settings.name});

            if (current) {
                put(version, "request_settings", settings.name, settings);
            }
            else {
                post(version, "request_settings", settings);
            }
        }
    }

    function activateDraft() {
        if (draft) {
            var version = draft.number;
            put(version, "activate");
            draft = null;
            return version;
        }
    }

    var backend = getBackend();

    if (options.forceSSL && !backend.use_ssl) {
        put(draftVersion().number, "backend", backend.name, {
            use_ssl: "1",
            port: options.httpsPort
        });
    }

    if (options.domain !== backend.hostname) {
        assertDomain(options.domain);
    }

    if (options.forceSSL) {
        assertRequestSettings({
            name: options.requestSettingsName,
            force_ssl: "1"
        });
    }

    return activateDraft();
};
