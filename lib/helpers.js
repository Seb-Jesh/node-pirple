/*
* Helpers for various tasks
*
*/

// Dependencies
const crypto = require('crypto');
const config = require('./config');

// Create a container
const helpers = {};

// Create a SHA256 hash
helpers.hash = (str) => {
    if(typeof(str) === 'string' && str.length > 0) {
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

// Parse a JSON string to an object without throwing
helpers.parseJsonToObject = (str) => {
    try{
        const obj = JSON.parse(str);
        return obj
    } catch(e){
        return {};
    }
}

// Create a string of random alphanumeric characters of specified length
helpers.createRandomString = (strLength) => {
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
    if(strLength) {
        // Define all the possible characters that can be included
        const possibleChars = 'a1bc2de3fg4hi5jk6lm7no8pq9rs0tuvw$xyzABCDEFGHI#JKLMNOPQRSTUVWXYZ';

        // Start the string
        let str = '';
        for(i = 1; i <= strLength; i++) {
            // Get a random character from the possible characters
            const randomChar = possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
    
            // Append this character to the string
            str+=randomChar
        }
        // Return the final string
        console.log(str)
        return str;
    } else {
        return false;
    }
}

// Export the module
module.exports = helpers;