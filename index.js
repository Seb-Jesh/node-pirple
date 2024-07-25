/*
* Primary file for the API
*
*
*/

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
const config = require('./lib/config');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

// Instantiate the HTTP Server
const httpServer = http.createServer((req, res) => {
    unifiedServer(req, res);
})

// Start the HTTP Server
httpServer.listen(config.httpPort, () => {
    console.log('http Server is listening on port ' + config.httpPort + ' in ' + config.envName + ' mode.');
})

// Instantiate the HTTPS Server
const httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
}
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
    unifiedServer(req, res);
})

// Start the HTTPS Server
httpsServer.listen(config.httpsPort, () => {
    console.log('https Server is listening on port ' + config.httpsPort + ' in ' + config.envName + ' mode.');
})

// All the server logic for both http and https
const unifiedServer = (req, res) => {
    // Get the url and parse it
    const parsedUrl = url.parse(req.url, true);

    // Get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g,'');

    // Get the query string as an object
    const queryStringObject = parsedUrl.query;

    // Get the http method
    const method = req.method.toLowerCase();

    // Get the headers
    const headers = req.headers;

    // Get the payload if any
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', (data) => {
        buffer += decoder.write(data);
    })

    req.on('end', () => {
        buffer += decoder.end();

        // Choose the handler for this request
        var chosenHandler = typeof(router[trimmedPath]) === undefined ? handlers.notFound : router[trimmedPath];

        // Construct the data object to send to the handler
        var data = {
            trimmedPath,
            queryStringObject,
            method,
            headers,
            payload: helpers.parseJsonToObject(buffer),
        }

        // Route the request to the specified handler
        if(trimmedPath !== 'favicon.ico') {
            if(chosenHandler === undefined) {
                handlers.notFound(data, function(statusCode) {
        
                    // Send the response
                    res.writeHead(statusCode);
                    res.end();
        
                    // Log the response
                    console.log('Returning this response: ',statusCode);                
                })
            }
            if(chosenHandler !== undefined) {
                chosenHandler(data, function(statusCode, payload) {
                    // Use the status code called back by the handler or default to 200
                    statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
        
                    // Use the payload called back by the handler or default to empty object
                    payload = typeof(payload) == 'object' ? payload : {};
        
                    // Convert the payload to a string
                    const payloadString = JSON.stringify(payload);
        
                    // Send the response
                    res.setHeader('Content-Type', 'application/json')
                    res.writeHead(statusCode);
                    res.end(payloadString);
        
                    // Log the response
                    console.log('Returning this response: ',statusCode, payloadString, trimmedPath);                
                })
    
            }

        }

    
    })
}

// Define a request router
var router = {
    'sample': handlers.sample,
    'ping': handlers.ping,
    'users': handlers.users,
}