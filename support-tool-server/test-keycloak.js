#!/usr/bin/env node

// Test script to check Keycloak connectivity and configuration
const request = require('request');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

console.log('=== Keycloak Configuration Test ===\n');

// Load environment variables (assuming they're loaded through process.env)
const KONG_API_URL = process.env.KONG_API_URL;
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID;
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET;

console.log('Environment Variables:');
console.log(`KONG_API_URL: ${KONG_API_URL ? 'SET' : 'NOT SET'}`);
console.log(`KEYCLOAK_CLIENT_ID: ${KEYCLOAK_CLIENT_ID ? 'SET' : 'NOT SET'}`);
console.log(`KEYCLOAK_CLIENT_SECRET: ${KEYCLOAK_CLIENT_SECRET ? 'SET (length: ' + KEYCLOAK_CLIENT_SECRET?.length + ')' : 'NOT SET'}\n`);

if (!KONG_API_URL || !KEYCLOAK_CLIENT_ID || !KEYCLOAK_CLIENT_SECRET) {
    console.log('❌ Missing required environment variables');
    process.exit(1);
}

const authUrl = `${KONG_API_URL}auth/realms/sunbird/protocol/openid-connect/token`;
console.log(`Keycloak URL: ${authUrl}\n`);

// Test 1: Check if the URL is reachable
console.log('Test 1: Testing Keycloak endpoint reachability...');

const options = {
    method: 'GET',
    url: authUrl.replace('/protocol/openid-connect/token', ''), // Just test the realm endpoint
    timeout: 10000
};

request(options, (error, response, body) => {
    if (error) {
        console.log('❌ Network error:', error.message);
        return;
    }
    
    console.log(`Status Code: ${response.statusCode}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    
    if (body && body.length > 0) {
        console.log('Response preview:', body.substring(0, 200) + '...');
    }
    
    // Test 2: Try a basic token request (should fail but show what type of error we get)
    console.log('\nTest 2: Testing token endpoint with invalid credentials...');
    
    const tokenOptions = {
        method: 'POST',
        url: authUrl,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
            client_id: KEYCLOAK_CLIENT_ID,
            password: 'invalid_password',
            grant_type: 'password',
            username: 'invalid_user',
            client_secret: KEYCLOAK_CLIENT_SECRET
        },
        timeout: 10000
    };
    
    request(tokenOptions, (error, response, body) => {
        if (error) {
            console.log('❌ Network error:', error.message);
            return;
        }
        
        console.log(`Token Endpoint Status Code: ${response.statusCode}`);
        console.log(`Token Endpoint Content-Type: ${response.headers['content-type']}`);
        
        if (body) {
            console.log('Token Response:', body);
            
            // Try to parse as JSON
            try {
                const jsonResponse = JSON.parse(body);
                console.log('✅ Response is valid JSON');
                console.log('Parsed response:', jsonResponse);
            } catch (parseError) {
                console.log('❌ Response is not valid JSON');
                console.log('Parse error:', parseError.message);
                console.log('Raw response:', body.substring(0, 500));
            }
        }
        
        console.log('\n=== Test Complete ===');
    });
});
