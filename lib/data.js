/*
* Library for storing and editing data
*
*
*/

// Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

// Container for the module (to be exported)
const lib = {};

// Define the base directory of the data folder
lib.baseDir = path.join(__dirname,'/../.data/')

// Write data to a file
lib.create = (dir, file, data, callback) =>{
    // Open the file for writing
    fs.open(lib.baseDir+dir+'/'+file+'.json', 'wx', function(err, fileDescriptor) {
        if(!err && fileDescriptor) {
            // Convert data to a string
            const dataString = JSON.stringify(data)

            // Write to file and close
            fs.writeFile(fileDescriptor, dataString, function(err) {
                if(!err) {
                    fs.close(fileDescriptor, function(err) {
                        if(!err) {
                            callback(false);
                        } else {
                            callback('Error closing the file')
                        }
                    })
                } else {
                    callback('Error writing to file')
                }
            })
        } else {
            callback('Could not create new file, it may already exist')
        }
    });
}

// Read data from a file
lib.read = (dir, file, callback) => {
    fs.readFile(lib.baseDir+dir+'/'+file+'.json', 'utf8', (err, data) => {
        if(!err && data) {
            const parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else {
            callback(err, data);
        }
    })
}

// Update data to a file
lib.update = (dir, file, data, callback) =>{
    // Open the file for writing
    fs.open(lib.baseDir+dir+'/'+file+'.json', 'r+', function(err, fileDescriptor) {
        if(!err && fileDescriptor) {
            // Convert data to a string
            const dataString = JSON.stringify(data)

            // Truncate the file
            fs.ftruncate(fileDescriptor, (err) => {
                if(!err) {
                    // Write to file and close
                    fs.writeFile(fileDescriptor, dataString, function(err) {
                        if(!err) {
                            fs.close(fileDescriptor, function(err) {
                                if(!err) {
                                    callback(false);
                                } else {
                                    callback('Error closing the file')
                                }
                            })
                        } else {
                            callback('Error writing to file')
                        }
                    })
                } else {
                    callback('Error truncating the file');
                }
            })

        } else {
            callback('Could not update the file')
        }
    });
}

// Delete a file
lib.delete = (dir, file, callback) => {
    // Unlink the file
    fs.unlink(lib.baseDir+dir+'/'+file+'.json', function(err) {
        if(!err) {
            callback(false)
        } else {
            callback('Error deleting file')
        }
    })
}

// Export the module
module.exports = lib;