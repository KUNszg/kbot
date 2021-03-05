#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');

module.exports = {
    name: "kb chat",
    invocation: async (channel, user, message) => {
        try {
            return `${user['username']}, this command has been deprecated.`;

            const msg = custom.getParam(message);

            const got = require('got');
            const getResponse = await got(encodeURI(`https://some-random-api.ml/chatbot?message=${msg.join(" ")}`)).json()

            if (!msg.join(" ")) {
                return `${user['username']}, please provide a text for me to respond to :)`;
            }

            if (msg.includes("homeless")) {
                return `${user['username']}, just get a house 4House`;
            }

            if (msg.includes("forsen")) {
                return `${user['username']}, maldsen LULW`;
            }

            if (((getResponse.response.charAt(0).toLowerCase() + getResponse.response.slice(1))
                .replace(".", " 4Head ")
                .replace("?", "? :) ")
                .replace("ń", "n")
                .replace("!", "! :o ")) === ' '
            ) {
                return `${user['username']}, bad response monkaS`;
            }

            return `${user['username']}, ${(getResponse.response.charAt(0).toLowerCase() +
                getResponse.response.slice(1))
                .replace(".", " 4Head ")
                .replace("?", "? :) ")
                .replace("ń", "n")
                .replace("!", "! :o ")}`;

        } catch (err) {
            if (err.message) {
                custom.errorLog(err.message)
                return `${user['username']}, an error occured while fetching data monkaS`;
            }
            custom.errorLog(err)
            return `${user['username']}, ${err.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')} FeelsDankMan !!!`;
        }
    }
}