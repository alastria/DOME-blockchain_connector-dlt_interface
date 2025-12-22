import { title } from "process";

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Blockchain Interface DOME',
            description: 'The component to be used when interacting with the blockchain layer in DOME',
            version: '0.1'
        },
        servers: [
            {
                url: 'http://localhost:8080'
            }
        ]
    },
    apis: ['./src/**/*.ts']
}

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;