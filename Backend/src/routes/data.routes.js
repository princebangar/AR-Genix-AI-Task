const express = require('express');
const router = express.Router();
const dataController = require('../controllers/data.controller');
const RequestValidator = require('../middleware/requestValidator');
const RateLimiter = require('../middleware/rateLimiter');

const generalLimiter = new RateLimiter({
    windowMs: 60000,
    maxRequests: 100,
    message: 'Too many requests, please try again later'
});

const strictLimiter = new RateLimiter({
    windowMs: 60000,
    maxRequests: 10,
    message: 'Rate limit exceeded for this resource'
});

const dataIngestionSchema = {
    fields: {
        recordId: {
            type: 'string',
            required: true,
            minLength: 1,
            maxLength: 100
        },
        timestamp: {
            type: 'number',
            required: false
        },
        temperature: {
            type: 'number',
            required: true,
            min: -50,
            max: 150
        },
        humidity: {
            type: 'number',
            required: true,
            min: 0,
            max: 100
        },
        location: {
            type: 'string',
            required: true,
            minLength: 1,
            maxLength: 100
        },
        status: {
            type: 'string',
            required: false,
            enum: ['active', 'inactive', 'error']
        },
        metadata: {
            type: 'object',
            required: false
        }
    },
    strict: false
};

const generateDataSchema = {
    fields: {
        count: {
            type: 'number',
            required: false,
            min: 1,
            max: 10000,
            integer: true
        },
        batchSize: {
            type: 'number',
            required: false,
            min: 100,
            max: 5000,
            integer: true
        }
    },
    strict: true
};

router.post(
    '/ingest',
    generalLimiter.middleware(),
    RequestValidator.validate(dataIngestionSchema, 'body'),
    dataController.ingestData
);

router.get(
    '/records',
    generalLimiter.middleware(),
    dataController.getRecords
);

router.post(
    '/generate',
    strictLimiter.middleware(),
    RequestValidator.validate(generateDataSchema, 'body'),
    dataController.generateTestData
);

router.get(
    '/stats',
    generalLimiter.middleware(),
    dataController.getStats
);

router.delete(
    '/records',
    strictLimiter.middleware(),
    dataController.deleteAllRecords
);

module.exports = router;
