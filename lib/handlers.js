/*
* Request handlers
*
*/

// Dependencies
const config = require('./config');
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
handlers._users.get = (data, callback) => {
    // Check validity of phone number
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if(phone) {
        // Get the token from the headers
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if(tokenIsValid) {
                // Look up the user
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
                callback(403, {'Error': 'Missing token or token error'})
            }
        })
    } else {
        callback(400, {'Error': 'Missing required fields'});
    }
}

// users submethod put
// Required fields: phone
// Optional fields: firstName, lastName, password. At least one must be provided
// User should only be able to update their own data
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
            // Get the token from the headers
            const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

            // Verify that the given token is valid for the phone number
            handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if(tokenIsValid) {
                // Look up the user
                _data.read('users', phone, (err, userData) => {
                    if(!err && userData) {
                        // Update fields as necessary
                        if(firstName) {
                            userData.firstName = firstName;
                        }
                        if(lastName) {
                            userData.lastName = lastName;
                        }
                        if(password) {
                            userData.hashedPassword = helpers.hash(password);
                        }
                        // Store the new updates
                        _data.update('users', phone, userData, (err) => {
                            if(!err) {
                                callback(200)
                            } else {
                                console.log(err)
                                callback(500, {'Error': 'Something went wrong'})
                            }
                        })
            } else {
                callback(403, {'Error': 'Missing token or token error'})
            }
        })

                } else {
                    callback(400, {'Error': 'The specified user does not exist'})
                }
            })
        } else {
            callback(400, {'Error': 'Provide at least one field to update'})
        }
    } else {
        callback(400, {'Error': 'Missing required field'})
    }
}

// users submethod delete
// Required fields: phone
// @TODO User should be able to delete only their own user object
// @TODO Cleanup all related user data
handlers._users.delete = (data, callback) => {
     // Check validity of phone number
     const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
     if(phone) {
        // Get the token from the headers
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if(tokenIsValid) {
                // Look up the user
                _data.read('users', phone, (err, data) => {
                    if(!err && data) {
                       _data.delete('users', phone, (err) => {
                           if(!err) {
                               callback(200);
                           } else {
                               callback(500, {'Error': 'Something went wrong'});
                           }
                       })
                    } else {
                        callback(404, {'Error': 'User not found'});
                    }
                })
            } else {
                callback(403, {'Error': 'Missing token or token error'});
            }
        })
     } else {
         callback(400, {'Error': 'Missing required fields'});
     }
}

// Tokens handler
handlers.tokens = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete']
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
}

// Container for the tokens submethods
handlers._tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = (data, callback) => {
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if(phone && password) {
        // Lookup user who matches that phone number
        _data.read('users', phone, (err, userData) => {
            if(!err && userData) {
               // Hash the provided password
               const hashedPassword = helpers.hash(password);
               
               // Compare the hashed password above to the hashed password in the user object fetched
               if(hashedPassword == userData.hashedPassword) {
                    // 1. If valid create a new token with a random name and expiry
                    const tokenId = helpers.createRandomString(20);
                    const expires = Date.now() + 1000 * 60 * 60
                    const tokenObject = {
                        phone,
                        'id': tokenId,
                        expires,
                    }

                    // 2. Store the token
                    _data.create('tokens', tokenId, tokenObject, (err) => {
                        if(!err) {
                            callback(200, tokenObject)
                        } else {
                            callback(500, {'Error': 'Create token error'})
                        }
                    })
               } else {
                callback(400, {'Error': 'Password error!'})
               }
            } else {
                callback(400, {'Error': 'User not found!'})
            }
        })
    } else {
        callback(400, {'Error': 'Missing required fields'});
    }
}

// Tokens - get
// Required fields: token id
// Optional fields: none
handlers._tokens.get = (data, callback) => {
    // Check for id validity
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id) {
        // Lookup the token
        _data.read('tokens', id, (err, tokenData) => {
            if(!err && tokenData) {
                callback(200, tokenData);
            } else {
                callback(404, {'Error': 'Token not found'});
            }
        })
    } else {
        callback(400, {'Error': 'Missing required fields'});
    }
}

// Tokens - put
// Required fields: id, extend
// Optional fields: none
handlers._tokens.put = (data, callback) => {
    const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length === 20 ? data.payload.id.trim() : false;
    const extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;

    if(id && extend) {
        _data.read('tokens', id, (err, tokenData) => {
            if(!err && tokenData) {
                // Check if token not expired
                if(tokenData.expires > Date.now()) {
                    // Set new expiry
                    tokenData.expires = Date.now() + 1000 * 60 * 60;

                    // Update the token data
                    _data.update('tokens',id, tokenData, (err) => {
                        if(!err) {
                            callback(200);
                        } else {
                            callback(500, {'Error': 'Something wen wrong'})
                        }
                    })
                } else {
                    callback(400, {'Error': 'Token already expired'})
                }
            } else {
                callback(400, {'Error': 'Token not found'})
            }
        })
    } else {
        callback(400, {'Error': 'Missing required or invalid fields'});
    }
}

// Tokens - delete
// Required field: id
// Optional fields: none
handlers._tokens.delete = (data, callback) => {
    // Check id validity
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
     if(id) {
         _data.read('tokens', id, (err, data) => {
             if(!err && data) {
                _data.delete('tokens', id, (err) => {
                    if(!err) {
                        callback(200);
                    } else {
                        callback(500, {'Error': 'Something went wrong'});
                    }
                })
             } else {
                 callback(404, {'Error': 'Token not found'});
             }
         })
     } else {
         callback(400, {'Error': 'Missing required fields'});
     }
}

// Checks handler
handlers.checks = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete']
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback);
    } else {
        callback(405);
    }
}

// Container for the checks submethods
handlers._checks = {};

// Checks - post
// Required fields: protocol, url, method, successCodes, timeoutSeconds
// Optional fields: none
handlers._checks.post = (data, callback) => {
    // Validate inputs
    const protocol = typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    const url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    const method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    const successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    const timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1  && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if(protocol && url && method && successCodes && timeoutSeconds) {
        // Get the token from the headers
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // Look up the user by reading the token
        _data.read('tokens', token, (err, tokenData) => {
            if(!err && tokenData) {
                const userPhone = tokenData.phone;

                // Look up the user by phone
                _data.read('users', userPhone, (err, userData) => {
                    if(!err && userData) {
                        const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                        // Check if max checks allowed reached
                        if(userChecks.length < config.maxChecks) {
                            // Create a random Id for the check
                            const checkId = helpers.createRandomString(20)

                            // Create the check object and include the user phone
                            const checkObject = {
                                'id': checkId,
                                userPhone,
                                protocol,
                                url,
                                method,
                                successCodes,
                                timeoutSeconds
                            }

                            // Save the object
                            _data.create('checks', checkId, checkObject, (err) => {
                                if(!err) {
                                    // Add the check id to the user's object
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);

                                    // Save the new user data
                                    _data.update('users', userPhone, userData, (err) => {
                                        if(!err) {
                                            // Return the new check data
                                            callback(200, checkObject)
                                        } else {
                                            callback(500, {'Error': 'Something went wrong!'})
                                        }
                                    })
                                } else {
                                    callback(500, {'Error': 'Something went wrong!'})
                                }
                            })
                        } else {
                            console.log(userChecks.length)
                            callback(400, {'Error': 'Maximum number of checks reached!'})
                        }
                    } else {
                        callback(403)
                    }
                })
            } else {
                callback(403)
            }
        })
    } else {
        callback(400, {'Error': 'Missing required fields or invalid inputs'})
    }
}

// Checks - get
// Required fields: id
// Optional fields: none
handlers._checks.get = (data, callback) => {
    // Check validity of id number
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    
    if(id) {
        // Look up the check
        _data.read('checks', id, (err, checkObject) => {
            if(!err && checkObject) {
                // Get the token from the headers
                const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        
                // Verify that the given token is valid and belongs to the user
                handlers._tokens.verifyToken(token, checkObject.userPhone, (tokenIsValid) => {
                    if(tokenIsValid) {
                        // Return the check object
                        return callback(200, checkObject);
                    }
                    callback(403)
                })
                return    
            }
            callback(404)
        })
        return
    }
    callback(400, {'Error': 'Missing required fields or invalid input'});
}

// Checks - put
// Required fields: id
// Optional fields: protocol, url, method, successCodes, timeoutSeconds
handlers._checks.put = (data, callback) => {
    // Check for the required field
    const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;

    // Check for the optional fields
    const protocol = typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    const url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    const method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    const successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    const timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1  && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    // Check for id validity
    if(id) {
        // Check at least one optional field provided
        if(protocol || url || method || successCodes || timeoutSeconds) {
            // Look up the check
            _data.read('checks', id, (err, checkObject) => {
                if(!err && checkObject) {
                    // Get the token from the headers
                    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        
                    // Verify that the given token is valid and belongs to the user
                    handlers._tokens.verifyToken(token, checkObject.userPhone, (tokenIsValid) => {
                        if(tokenIsValid) {
                            // Update the check object where necessary
                            if(protocol) {
                                checkObject.protocol = protocol
                            }
                            if(url) {
                                checkObject.url = url
                            }
                            if(method) {
                                checkObject.method = method
                            }
                            if(successCodes) {
                                checkObject.successCodes = successCodes
                            }
                            if(timeoutSeconds) {
                                checkObject.timeoutSeconds = timeoutSeconds
                            }
                            // Save the new updates
                            _data.update('checks', id, checkObject, (err) => {
                                if(!err) {
                                    return callback(200)
                                }
                                callback(500, {'Error': 'Something went wrong!'})
                            })
                            return
                        }
                        callback(403)
                    })
                    return
                }
                callback(400, {'Error': 'Check Id is incorrect'})
            })
            return
        }
        callback(400, {'Error': 'Missing fields to update'})
        return
    }
    callback(400, {'Error': 'Missing required fields'})
}

// Verify if a given token is valid for the user
handlers._tokens.verifyToken = (id, phone, callback) => {
    // Look up the token
    _data.read('tokens', id, (err, tokenData) => {
        if(!err && tokenData) {
            // Check if token is for the given user and is still valid
            if(tokenData.phone == phone && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    })
}

// not found handler
handlers.notFound = function(data, callback) {
    callback(404)
}

// Export the module
module.exports = handlers;