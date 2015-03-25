/* global Fastly: true */

var client = Npm.require("fastly");

Fastly = function (apiKey) {
    Object.defineProperty(this, "client", {
        value: client(apiKey),
        enumerable: true
    });
};

Fastly.prototype = {
    constructor: Fastly,

    request: Meteor.wrapAsync(function () {
        return this.client.request.apply(this.client, arguments);
    }),

    purge: Meteor.wrapAsync(function () {
        return this.client.purge.apply(this.client, arguments);
    }),

    purgeAll: Meteor.wrapAsync(function () {
        return this.client.purgeAll.apply(this.client, arguments);
    }),

    purgeKey: Meteor.wrapAsync(function () {
        return this.client.purgeKey.apply(this.client, arguments);
    }),

    stats: Meteor.wrapAsync(function () {
        return this.client.stats.apply(this.client, arguments);
    })
};
