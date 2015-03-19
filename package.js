Package.describe({
    name: "edgee:fastly",
    summary: "Fastly API client for Meteor JS"
});


Npm.depends({
    "fastly": "1.2.1"
});

Package.onUse(function (api) {
    api.addFiles("fastly.js", "server");
    api.export("Fastly");
});
