Package.describe({
    name: "edgee:fastly",
    summary: "Fastly API client and configurator"
});


Npm.depends({
    "fastly": "1.2.1"
});

Package.onUse(function (api) {
    api.versionsFrom('METEOR@1.0');

    api.use(["mongo", "underscore"], "server");
    api.use(["autoupdate", "webapp"], "server", {
        weak: true
    });

    api.addFiles(["fastly.js", "headers.js", "configurator.js"], "server");
    api.export("Fastly");
});
