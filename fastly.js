/* global Fastly: true */

var authenticate = Npm.require("fastly");

Fastly = function (apiKey) {
    Object.defineProperty(this, "client", {
        value: authenticate(apiKey),
        enumerable: true
    });
};

Fastly.prototype.request = Meteor.wrapAsync(function () {
    return this.client.request.apply(this.client, arguments);
});

Fastly.prototype.purge = Meteor.wrapAsync(function () {
    return this.client.purge.apply(this.client, arguments);
});

Fastly.prototype.purgeAll = Meteor.wrapAsync(function () {
    return this.client.purgeAll.apply(this.client, arguments);
});

Fastly.prototype.purgeKey = Meteor.wrapAsync(function () {
    return this.client.purgeKey.apply(this.client, arguments);
});

Fastly.prototype.stats = Meteor.wrapAsync(function () {
    return this.client.stats.apply(this.client, arguments);
});
