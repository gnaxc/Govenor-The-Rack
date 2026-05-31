const request = require('supertest');
const app = require('./server');
const mongoose = require('mongoose');

describe('The Rack API Routes', () => {

    // Close the database connection after all tests finish so Jest doesn't hang
    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('should return a 200 OK status for the GET /api/v1/assets route', async () => {
        const response = await request(app).get('/api/v1/assets');

        // We expect the server to respond with a 200 (Success) code
        expect(response.statusCode).toBe(200);
        // We expect the data returned to be an Array (a list of servers)
        expect(Array.isArray(response.body)).toBeTruthy();
    });

    it('should create a new asset via POST /api/v1/assets', async () => {
        // This is the fake server data we are sending to test the database
        const testAsset = {
            hostname: 'jest-automated-test',
            ipAddress: '192.168.100.100',
            osVersion: 'Test-OS',
            rackPosition: 'Test-U1'
        };

        const response = await request(app).post('/api/v1/assets').send(testAsset);

        // We expect a 201 (Created) status code
        expect(response.statusCode).toBe(201);
        // We expect the database to echo back the exact hostname we sent
        expect(response.body.hostname).toBe('jest-automated-test');
    });
});