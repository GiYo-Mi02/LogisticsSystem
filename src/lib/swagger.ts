/**
 * Swagger/OpenAPI Configuration
 * =============================
 * @description Generates OpenAPI 3.0 specification for the LogIQ API.
 * This configuration is used to create interactive API documentation.
 */

import swaggerJsdoc from 'swagger-jsdoc';

/**
 * OpenAPI Specification Options
 */
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LogIQ - Logistics Management API',
      version: '1.0.0',
      description: `
## LogIQ API Documentation

A comprehensive logistics management system demonstrating Object-Oriented Programming principles.

### Features
- **Shipment Management**: Create, track, and manage shipments
- **Vehicle Fleet**: Manage drones, trucks, and ships
- **User Management**: Customer, Driver, and Admin roles
- **Real-time Tracking**: SSE-based live updates
- **Dynamic Pricing**: Strategy pattern for Air/Ground/Sea pricing

### Authentication
Currently uses session-based authentication. Include user credentials in the request body for login.

### OOP Design Patterns Used
- Factory Pattern (Shipment & Vehicle creation)
- Strategy Pattern (Pricing algorithms)
- Builder Pattern (Shipment builder)
- Observer Pattern (Real-time events)
- Singleton Pattern (Database connection)
      `,
      contact: {
        name: 'LogIQ Support',
        email: 'support@logiq.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://logiq.vercel.app',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Shipments',
        description: 'Shipment management endpoints',
      },
      {
        name: 'Vehicles',
        description: 'Vehicle fleet management',
      },
      {
        name: 'Authentication',
        description: 'User authentication',
      },
      {
        name: 'Admin',
        description: 'Admin dashboard and statistics',
      },
      {
        name: 'Driver',
        description: 'Driver-specific endpoints',
      },
      {
        name: 'Real-time',
        description: 'Server-Sent Events for live updates',
      },
    ],
    components: {
      schemas: {
        // Location Schema
        Location: {
          type: 'object',
          required: ['lat', 'lng'],
          properties: {
            address: {
              type: 'string',
              example: '123 Broadway',
              description: 'Street address',
            },
            city: {
              type: 'string',
              example: 'New York',
              description: 'City name',
            },
            country: {
              type: 'string',
              example: 'USA',
              description: 'Country name',
            },
            lat: {
              type: 'number',
              format: 'float',
              example: 40.7128,
              description: 'Latitude coordinate',
            },
            lng: {
              type: 'number',
              format: 'float',
              example: -74.006,
              description: 'Longitude coordinate',
            },
          },
        },

        // Shipment Schemas
        Shipment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: 'ship-123e4567-e89b',
            },
            trackingId: {
              type: 'string',
              example: 'TRK-ABC123XYZ',
            },
            weight: {
              type: 'number',
              format: 'float',
              example: 25.5,
              description: 'Weight in kilograms',
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
              example: 'IN_TRANSIT',
            },
            origin: {
              $ref: '#/components/schemas/Location',
            },
            destination: {
              $ref: '#/components/schemas/Location',
            },
            cost: {
              type: 'number',
              format: 'float',
              example: 150.0,
            },
            customerId: {
              type: 'string',
              format: 'uuid',
            },
            assignedVehicle: {
              $ref: '#/components/schemas/VehicleSummary',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },

        CreateShipmentRequest: {
          type: 'object',
          required: ['customerId', 'weight', 'origin', 'destination', 'urgency'],
          properties: {
            customerId: {
              type: 'string',
              format: 'uuid',
              description: 'The customer creating the shipment',
            },
            weight: {
              type: 'number',
              minimum: 0.1,
              maximum: 50000,
              description: 'Weight in kg',
            },
            origin: {
              $ref: '#/components/schemas/Location',
            },
            destination: {
              $ref: '#/components/schemas/Location',
            },
            urgency: {
              type: 'string',
              enum: ['high', 'standard', 'low'],
              default: 'standard',
            },
          },
        },

        // Vehicle Schemas
        Vehicle: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            licenseId: {
              type: 'string',
              example: 'DRN-0001',
            },
            type: {
              type: 'string',
              enum: ['DRONE', 'TRUCK', 'SHIP'],
            },
            capacity: {
              type: 'number',
              description: 'Maximum capacity in kg',
            },
            currentFuel: {
              type: 'number',
            },
            status: {
              type: 'string',
              enum: ['IDLE', 'IN_TRANSIT', 'MAINTENANCE', 'OUT_OF_SERVICE'],
            },
            currentLocation: {
              $ref: '#/components/schemas/Location',
            },
          },
        },

        VehicleSummary: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            type: {
              type: 'string',
              enum: ['DRONE', 'TRUCK', 'SHIP'],
            },
            licenseId: {
              type: 'string',
            },
          },
        },

        // User Schemas
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            role: {
              type: 'string',
              enum: ['CUSTOMER', 'DRIVER', 'ADMIN'],
            },
          },
        },

        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 8,
            },
          },
        },

        // Admin Stats Schema
        AdminStats: {
          type: 'object',
          properties: {
            totalShipments: {
              type: 'integer',
            },
            activeShipments: {
              type: 'integer',
            },
            deliveredShipments: {
              type: 'integer',
            },
            totalVehicles: {
              type: 'integer',
            },
            activeVehicles: {
              type: 'integer',
            },
            totalDrivers: {
              type: 'integer',
            },
            totalCustomers: {
              type: 'integer',
            },
            revenue: {
              type: 'number',
              format: 'float',
            },
          },
        },

        // Error Response
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },

        // Success Response
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            message: {
              type: 'string',
            },
            data: {
              type: 'object',
            },
          },
        },
      },

      responses: {
        BadRequest: {
          description: 'Invalid request parameters',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        Unauthorized: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        InternalError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },

    // API Paths
    paths: {
      // Shipments
      '/api/shipments': {
        get: {
          tags: ['Shipments'],
          summary: 'List all shipments',
          description: 'Retrieve all shipments. Can filter by customer ID.',
          parameters: [
            {
              name: 'customerId',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by customer ID',
            },
          ],
          responses: {
            200: {
              description: 'List of shipments',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Shipment' },
                  },
                },
              },
            },
            500: { $ref: '#/components/responses/InternalError' },
          },
        },
        post: {
          tags: ['Shipments'],
          summary: 'Create a new shipment',
          description: 'Create a shipment using the Factory Pattern. Automatically assigns recommended vehicle and calculates cost.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateShipmentRequest' },
              },
            },
          },
          responses: {
            201: {
              description: 'Shipment created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Shipment' },
                },
              },
            },
            400: { $ref: '#/components/responses/BadRequest' },
            500: { $ref: '#/components/responses/InternalError' },
          },
        },
      },

      '/api/shipments/{id}': {
        get: {
          tags: ['Shipments'],
          summary: 'Get shipment by ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Shipment ID or tracking ID',
            },
          ],
          responses: {
            200: {
              description: 'Shipment details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Shipment' },
                },
              },
            },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        patch: {
          tags: ['Shipments'],
          summary: 'Update shipment status',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Shipment updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Shipment' },
                },
              },
            },
            400: { $ref: '#/components/responses/BadRequest' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      // Vehicles
      '/api/vehicles': {
        get: {
          tags: ['Vehicles'],
          summary: 'List all vehicles',
          description: 'Get all vehicles in the fleet with their current status.',
          responses: {
            200: {
              description: 'List of vehicles',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Vehicle' },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Vehicles'],
          summary: 'Create a new vehicle',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['type', 'licenseId'],
                  properties: {
                    type: {
                      type: 'string',
                      enum: ['DRONE', 'TRUCK', 'SHIP'],
                    },
                    licenseId: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Vehicle created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Vehicle' },
                },
              },
            },
            400: { $ref: '#/components/responses/BadRequest' },
          },
        },
      },

      // Authentication
      '/api/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'User login',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                      redirectUrl: { type: 'string' },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      // Admin
      '/api/admin/stats': {
        get: {
          tags: ['Admin'],
          summary: 'Get dashboard statistics',
          description: 'Returns aggregate statistics for the admin dashboard.',
          responses: {
            200: {
              description: 'Dashboard statistics',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AdminStats' },
                },
              },
            },
          },
        },
      },

      // Real-time
      '/api/realtime': {
        get: {
          tags: ['Real-time'],
          summary: 'Server-Sent Events stream',
          description: 'Establish an SSE connection for real-time updates. Events include shipment updates, vehicle movements, and system notifications.',
          parameters: [
            {
              name: 'channel',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['all', 'shipments', 'vehicles', 'admin'],
              },
              description: 'Event channel to subscribe to',
            },
          ],
          responses: {
            200: {
              description: 'SSE stream established',
              content: {
                'text/event-stream': {
                  schema: {
                    type: 'string',
                    example: 'event: shipment_update\ndata: {"id":"ship-001","status":"IN_TRANSIT"}\n\n',
                  },
                },
              },
            },
          },
        },
      },

      // Simulation
      '/api/simulation': {
        post: {
          tags: ['Admin'],
          summary: 'Run vehicle simulation',
          description: 'Simulate vehicle movement for active shipments. Useful for demo/testing.',
          responses: {
            200: {
              description: 'Simulation step executed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      updatedVehicles: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [], // We define paths inline above
};

/**
 * Generate the OpenAPI specification
 */
export const swaggerSpec = swaggerJsdoc(options);

/**
 * Get the OpenAPI spec as a JSON object
 * @returns {object} The OpenAPI specification
 */
export function getApiSpec(): object {
  return swaggerSpec;
}
