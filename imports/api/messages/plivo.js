// Some credit to NPM plivo module
import { HTTP } from 'meteor/http'
export const Plivo = {
    request: function(path, method, params, callback) {
        const url = `${this.baseUrl}${path}`
        let options = { auth: `${this.authId}:${this.authToken}` }
        if (method === 'GET') {
           options =  _.extend(options, { params })
        } else {
           options = _.extend(options, { data: params })
        }

        console.log("OPTIONS", options)
        console.log("URL", url)
        HTTP.call(method, url, options, callback )
    },
    sendMessage: function(params, callback) {
        var path = 'Message/';
        var method = 'POST';

        this.request(path, method, params, callback);
    },
    searchNumbers: function(params, callback) {
        var path = 'PhoneNumber/';
        var method = 'GET';

        this.request(path, method, params, callback);
    },
    buyNumber: function(params, callback) {
        var path = 'PhoneNumber/' + params['number'] + '/';
        delete params.number;
        var method = 'POST';

        this.request(path, method, params, callback);
    },
}

Meteor.startup(function() {
    if (Meteor.isServer) {
        // Access to meteor.settings
        console.log("METEOR SETTINGS", Meteor.settings)
        const authId = Meteor.settings.private.plivo.authId
        const authToken = Meteor.settings.private.plivo.authToken
        Plivo.authId = authId
        Plivo.authToken = authToken
        Plivo.baseUrl = `https://api.plivo.com/v1/Account/${authId}/`

        console.log(Plivo)

    }
})