/*
* Request handlers
*
*/

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

// Define handlers
const handlers = {};

// sample handler
handlers.sample = function(data, callback) {
    // Callback a http status code and a payload object
    callback(406, {'name': 'sample handler'})
}

// ping handler
handlers.ping = (data, callback) => {
    // Callback a http status code
    callback(200)
}

// users handler
handlers.users = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete']
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
}

// Container for the users submethods
handlers._users = {};

// users submethod post
// Required data: firstName, lastName, phone, tosAgreement
handlers._users.post = (data, callback) => {
    // Check that all required fields are filled in
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if(firstName && lastName && phone && password && tosAgreement) {
        // Make sure the user doesn't already exist
        _data.read('users', phone, (err, data) => {
            if(err) {
                // Hash the password
                const hashedPassword = helpers.hash(password);

                if(hashedPassword) {
                    // Create the user object
                    const userObject = {
                        firstName,
                        lastName,
                        phone,
                        hashedPassword,
                        'tosAgreement': true,
                    }
    
                    // Create the user
                    _data.create('users', phone, userObject, (err) => {
                        if(!err) {
                            callback(200)
                        } else {
                            console.log(err);
                            callback(500, {'Error': 'Could notcreate a new user!'})
                        }
                    })

                } else {
                    callback(500, {'Error': 'Could not hash the user password'})
                }

            } else {
                callback(400, {'Error': 'A user with that phone number already exists'})
            }
        })
    } else {
        callback(400, {'Error':'Missing required fields'});
    }
}

// users submethod get
// Required data: phone
// Optional: none
// @TODO Only an authenticated user should access their data
handlers._users.get = (data, callback) => {
    // Check validity of phone number
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if(phone) {
        _data.read('users', phone, (err, data) => {
            if(!err && data) {
                // Remove the hashed password from the user object
                delete data.hashedPassword;
                callback(200, data);
            } else {
                callback(404, {'Error': 'User not found'});
            }
        })
    } else {
        callback(400, {'Error': 'Missing required fields'});
    }
}

// users submethod put
// Required fields: phone
// Optional fields: firstName, lastName, password. At least one must be provided
// @TODO User should only be able to update their own data
handlers._users.put = (data, callback) => {
    // Check for the required field
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

    // Check for the optional fields
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if(phone) {
        // Error if nothing to update in the payload
        if(firstName || lastName || password) {
            // Look up the user
        } else {
            callback(400, {'Error': 'Provide at least one field to update'})
        }
    } else {
        callback(400, {'Error': 'Missing required field'})
    }
}

// users submethod delete
handlers._users.delete = (data, callback) => {
    
}

// not found handler
handlers.notFound = function(data, callback) {
    callback(404)
}

// Export the module
module.exports = handlers;