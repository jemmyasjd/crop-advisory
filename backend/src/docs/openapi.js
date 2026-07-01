/**
 * OpenAPI 3.0 specification for the Watermelon Crop Advisory & Risk Engine API.
 *
 * Served as interactive Swagger UI at GET /api/docs and as raw JSON at
 * GET /api/docs.json. Kept as a plain JS object so it lives in-repo without any
 * extra build step or YAML tooling.
 */

const config = require('../config');

// ---------------------------------------------------------------------------
// Reusable schema components
// ---------------------------------------------------------------------------
const schemas = {
  // ---- Envelopes ----
  SuccessMessage: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'OK' },
    },
  },
  Error: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string', example: 'Something went wrong' },
      details: {
        description: 'Present on validation errors (400).',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            in: { type: 'string', enum: ['body', 'params', 'query'], example: 'body' },
            field: { type: 'string', example: 'email' },
            message: { type: 'string', example: '"email" must be a valid email' },
          },
        },
      },
    },
  },

  // ---- Auth ----
  User: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      name: { type: 'string', example: 'Ravi Farmer' },
      email: { type: 'string', format: 'email', example: 'ravi@example.com' },
      role: { type: 'string', enum: ['farmer', 'admin'], example: 'farmer' },
      phone: { type: 'string', nullable: true, example: '+919876543210' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
    },
  },
  AuthSession: {
    type: 'object',
    properties: {
      user: { $ref: '#/components/schemas/User' },
      token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
      expiresAt: { type: 'string', format: 'date-time' },
    },
  },
  SignupRequest: {
    type: 'object',
    required: ['name', 'email', 'password'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 100, example: 'Ravi Farmer' },
      email: { type: 'string', format: 'email', example: 'ravi@example.com' },
      password: { type: 'string', minLength: 6, maxLength: 128, example: 'secret123' },
      phone: { type: 'string', maxLength: 20, nullable: true, example: '+919876543210' },
    },
  },
  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', example: 'ravi@example.com' },
      password: { type: 'string', example: 'secret123' },
    },
  },

  // ---- Profile ----
  UpdateProfileRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 100, example: 'Ravi Kumar' },
      phone: { type: 'string', maxLength: 20, nullable: true, example: '+919876543210' },
      password: { type: 'string', minLength: 6, maxLength: 128, example: 'newsecret123' },
    },
  },

  // ---- Field ----
  Field: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 10 },
      name: { type: 'string', example: 'North Plot' },
      cropId: { type: 'integer', example: 1 },
      season: { type: 'string', nullable: true, example: 'summer' },
      areaHectare: { type: 'number', example: 2.5 },
      plantingDate: { type: 'string', format: 'date', example: '2026-03-01' },
      latitude: { type: 'number', nullable: true, example: 21.17 },
      longitude: { type: 'number', nullable: true, example: 72.83 },
    },
  },
  CreateFieldRequest: {
    type: 'object',
    required: ['name', 'cropId', 'areaHectare', 'plantingDate'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 150, example: 'North Plot' },
      cropId: { type: 'integer', example: 1 },
      season: { type: 'string', maxLength: 50, nullable: true, example: 'summer' },
      areaHectare: { type: 'number', minimum: 0, exclusiveMinimum: true, example: 2.5 },
      plantingDate: { type: 'string', format: 'date', example: '2026-03-01' },
      latitude: { type: 'number', minimum: -90, maximum: 90, nullable: true, example: 21.17 },
      longitude: { type: 'number', minimum: -180, maximum: 180, nullable: true, example: 72.83 },
    },
  },
  UpdateFieldRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 150 },
      cropId: { type: 'integer' },
      season: { type: 'string', maxLength: 50, nullable: true },
      areaHectare: { type: 'number', minimum: 0, exclusiveMinimum: true },
      plantingDate: { type: 'string', format: 'date' },
      latitude: { type: 'number', minimum: -90, maximum: 90, nullable: true },
      longitude: { type: 'number', minimum: -180, maximum: 180, nullable: true },
    },
  },

  // ---- Soil report ----
  SoilReport: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 5 },
      fieldId: { type: 'integer', example: 10 },
      reportDate: { type: 'string', format: 'date', example: '2026-06-15' },
      nitrogen: { type: 'number', example: 40 },
      phosphorus: { type: 'number', example: 25 },
      potassium: { type: 'number', example: 30 },
      soilMoisture: { type: 'number', nullable: true, example: 55 },
    },
  },
  CreateSoilReportRequest: {
    type: 'object',
    required: ['nitrogen', 'phosphorus', 'potassium'],
    properties: {
      reportDate: { type: 'string', format: 'date', example: '2026-06-15' },
      nitrogen: { type: 'number', minimum: 0, example: 40 },
      phosphorus: { type: 'number', minimum: 0, example: 25 },
      potassium: { type: 'number', minimum: 0, example: 30 },
      soilMoisture: { type: 'number', minimum: 0, maximum: 100, nullable: true, example: 55 },
    },
  },

  // ---- Crop reference data ----
  Crop: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      name: { type: 'string', example: 'Watermelon' },
      baseTemperature: { type: 'number', example: 10 },
    },
  },
  CropStage: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 2 },
      cropId: { type: 'integer', example: 1 },
      stageName: { type: 'string', example: 'Vegetative' },
      gddStart: { type: 'integer', example: 150 },
      gddEnd: { type: 'integer', example: 400 },
      sortOrder: { type: 'integer', example: 2 },
    },
  },
  Disease: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 3 },
      cropId: { type: 'integer', example: 1 },
      diseaseName: { type: 'string', example: 'Anthracnose' },
      description: { type: 'string', nullable: true },
    },
  },

  // ---- Admin request bodies ----
  CreateCropRequest: {
    type: 'object',
    required: ['name', 'baseTemperature'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100, example: 'Watermelon' },
      baseTemperature: { type: 'number', example: 10 },
    },
  },
  UpdateCropRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      baseTemperature: { type: 'number' },
    },
  },
  CreateStageRequest: {
    type: 'object',
    required: ['cropId', 'stageName', 'gddStart', 'gddEnd'],
    properties: {
      cropId: { type: 'integer', example: 1 },
      stageName: { type: 'string', minLength: 1, maxLength: 150, example: 'Flowering' },
      gddStart: { type: 'integer', minimum: 0, example: 400 },
      gddEnd: { type: 'integer', minimum: 0, example: 700 },
      sortOrder: { type: 'integer', minimum: 0, example: 3 },
    },
  },
  UpdateStageRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      stageName: { type: 'string', minLength: 1, maxLength: 150 },
      gddStart: { type: 'integer', minimum: 0 },
      gddEnd: { type: 'integer', minimum: 0 },
      sortOrder: { type: 'integer', minimum: 0 },
    },
  },
  CreateDiseaseRequest: {
    type: 'object',
    required: ['cropId', 'diseaseName'],
    properties: {
      cropId: { type: 'integer', example: 1 },
      diseaseName: { type: 'string', minLength: 1, maxLength: 150, example: 'Anthracnose' },
      description: { type: 'string', nullable: true },
    },
  },
  UpdateDiseaseRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      diseaseName: { type: 'string', minLength: 1, maxLength: 150 },
      description: { type: 'string', nullable: true },
    },
  },
  CreateDiseaseRuleRequest: {
    type: 'object',
    required: ['diseaseId', 'parameter', 'operator', 'score'],
    properties: {
      diseaseId: { type: 'integer', example: 3 },
      ruleName: { type: 'string', maxLength: 100, example: 'High humidity window' },
      parameter: { type: 'string', maxLength: 100, example: 'humidity' },
      operator: { type: 'string', enum: ['BETWEEN', 'GTE', 'LTE', 'GT', 'LT', 'EQ'], example: 'GTE' },
      minValue: { type: 'number', nullable: true, example: 80 },
      maxValue: { type: 'number', nullable: true, example: null },
      consecutiveDays: { type: 'integer', minimum: 1, nullable: true, example: 3 },
      score: { type: 'integer', example: 5 },
    },
  },
  UpdateDiseaseRuleRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      ruleName: { type: 'string', maxLength: 100 },
      parameter: { type: 'string', maxLength: 100 },
      operator: { type: 'string', enum: ['BETWEEN', 'GTE', 'LTE', 'GT', 'LT', 'EQ'] },
      minValue: { type: 'number', nullable: true },
      maxValue: { type: 'number', nullable: true },
      consecutiveDays: { type: 'integer', minimum: 1, nullable: true },
      score: { type: 'integer' },
    },
  },
  CreateRiskLevelRequest: {
    type: 'object',
    required: ['diseaseId', 'minScore', 'maxScore', 'riskLevel', 'advisory'],
    properties: {
      diseaseId: { type: 'integer', example: 3 },
      minScore: { type: 'integer', example: 0 },
      maxScore: { type: 'integer', example: 4 },
      riskLevel: { type: 'string', maxLength: 20, example: 'LOW' },
      advisory: { type: 'string', example: 'Monitor the field; no action required.' },
    },
  },
  UpdateRiskLevelRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      minScore: { type: 'integer' },
      maxScore: { type: 'integer' },
      riskLevel: { type: 'string', maxLength: 20 },
      advisory: { type: 'string' },
    },
  },
  CreateNutrientRuleRequest: {
    type: 'object',
    required: [
      'cropId',
      'stageId',
      'nutrient',
      'fertilizer',
      'soilThreshold',
      'doseUnderThreshold',
      'doseAboveThreshold',
    ],
    properties: {
      cropId: { type: 'integer', example: 1 },
      stageId: { type: 'integer', example: 2 },
      season: { type: 'string', maxLength: 50, nullable: true, example: 'summer' },
      nutrient: { type: 'string', maxLength: 50, example: 'nitrogen' },
      fertilizer: { type: 'string', maxLength: 150, example: 'Urea' },
      soilThreshold: { type: 'number', example: 40 },
      doseUnderThreshold: { type: 'number', example: 50 },
      doseAboveThreshold: { type: 'number', example: 20 },
    },
  },
  UpdateNutrientRuleRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      stageId: { type: 'integer' },
      season: { type: 'string', maxLength: 50, nullable: true },
      nutrient: { type: 'string', maxLength: 50 },
      fertilizer: { type: 'string', maxLength: 150 },
      soilThreshold: { type: 'number' },
      doseUnderThreshold: { type: 'number' },
      doseAboveThreshold: { type: 'number' },
    },
  },
};

// ---------------------------------------------------------------------------
// Reusable responses & parameters
// ---------------------------------------------------------------------------
const responses = {
  BadRequest: {
    description: 'Validation failed or malformed request.',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
  },
  Unauthorized: {
    description: 'Missing, invalid, or expired token.',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
  },
  Forbidden: {
    description: 'Authenticated but not allowed (e.g. non-admin on an admin route).',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
  },
  NotFound: {
    description: 'Resource not found.',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
  },
  Conflict: {
    description: 'Duplicate / conflicting resource.',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
  },
};

const idParam = (name, description) => ({
  name,
  in: 'path',
  required: true,
  schema: { type: 'integer', minimum: 1 },
  description: description || `Numeric ID of the ${name}`,
});

// success envelope wrapping a data payload
const dataResponse = (description, dataSchema, extraProps = {}) => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          ...extraProps,
          ...(dataSchema ? { data: dataSchema } : {}),
        },
      },
    },
  },
});

const messageResponse = (description) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessage' } } },
});

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const arrayOf = (name) => ({ type: 'array', items: ref(name) });

// Shorthand for a standard authenticated CRUD-item response set.
const authErrors = {
  400: { $ref: '#/components/responses/BadRequest' },
  401: { $ref: '#/components/responses/Unauthorized' },
  404: { $ref: '#/components/responses/NotFound' },
};
const adminErrors = {
  400: { $ref: '#/components/responses/BadRequest' },
  401: { $ref: '#/components/responses/Unauthorized' },
  403: { $ref: '#/components/responses/Forbidden' },
  404: { $ref: '#/components/responses/NotFound' },
};

// ---------------------------------------------------------------------------
// Path builders for the repetitive admin CRUD resources
// ---------------------------------------------------------------------------
function adminCrud({ tag, base, singular, listSchema, itemSchema, createReq, updateReq }) {
  return {
    [`/admin/${base}`]: {
      get: {
        tags: [tag],
        summary: `List all ${base}`,
        security: [{ bearerAuth: [] }],
        responses: {
          200: dataResponse(`${singular} list`, arrayOf(listSchema)),
          ...adminErrors,
        },
      },
      post: {
        tags: [tag],
        summary: `Create a ${singular.toLowerCase()}`,
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: ref(createReq) } },
        },
        responses: {
          201: dataResponse(`${singular} created`, itemSchema ? ref(itemSchema) : undefined),
          ...adminErrors,
        },
      },
    },
    [`/admin/${base}/{id}`]: {
      put: {
        tags: [tag],
        summary: `Update a ${singular.toLowerCase()}`,
        security: [{ bearerAuth: [] }],
        parameters: [idParam('id')],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: ref(updateReq) } },
        },
        responses: {
          200: dataResponse(`${singular} updated`, itemSchema ? ref(itemSchema) : undefined),
          ...adminErrors,
        },
      },
      delete: {
        tags: [tag],
        summary: `Delete a ${singular.toLowerCase()}`,
        security: [{ bearerAuth: [] }],
        parameters: [idParam('id')],
        responses: {
          200: messageResponse(`${singular} deleted`),
          ...adminErrors,
        },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const paths = {
  // ===== Health =====
  '/health': {
    get: {
      tags: ['Health'],
      summary: 'Health check',
      security: [],
      responses: {
        200: {
          description: 'API is healthy.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'API is healthy' },
                  timestamp: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
  },

  // ===== Auth =====
  '/auth/signup': {
    post: {
      tags: ['Auth'],
      summary: 'Register a new farmer account',
      security: [],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref('SignupRequest') } },
      },
      responses: {
        201: dataResponse('Signup successful', ref('AuthSession')),
        400: { $ref: '#/components/responses/BadRequest' },
        409: { $ref: '#/components/responses/Conflict' },
      },
    },
  },
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Farmer login',
      security: [],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref('LoginRequest') } },
      },
      responses: {
        200: dataResponse('Login successful', ref('AuthSession')),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
      },
    },
  },
  '/auth/logout': {
    post: {
      tags: ['Auth'],
      summary: 'Logout (invalidates the current token)',
      security: [{ bearerAuth: [] }],
      responses: {
        200: messageResponse('Logged out successfully'),
        401: { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },

  // ===== Profile =====
  '/profile': {
    get: {
      tags: ['Profile'],
      summary: 'Get the current user profile',
      security: [{ bearerAuth: [] }],
      responses: {
        200: dataResponse('Profile fetched', ref('User')),
        401: { $ref: '#/components/responses/Unauthorized' },
      },
    },
    put: {
      tags: ['Profile'],
      summary: 'Update the current user profile',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref('UpdateProfileRequest') } },
      },
      responses: {
        200: dataResponse('Profile updated', ref('User')),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },

  // ===== Fields =====
  '/fields': {
    get: {
      tags: ['Fields'],
      summary: 'List the current user’s fields',
      security: [{ bearerAuth: [] }],
      responses: {
        200: dataResponse('Fields fetched', arrayOf('Field')),
        401: { $ref: '#/components/responses/Unauthorized' },
      },
    },
    post: {
      tags: ['Fields'],
      summary: 'Create a field (weather is synced on creation)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref('CreateFieldRequest') } },
      },
      responses: {
        201: dataResponse('Field created and weather synced', ref('Field')),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/fields/{fieldId}': {
    get: {
      tags: ['Fields'],
      summary: 'Get a single field',
      security: [{ bearerAuth: [] }],
      parameters: [idParam('fieldId')],
      responses: { 200: dataResponse('Field fetched', ref('Field')), ...authErrors },
    },
    put: {
      tags: ['Fields'],
      summary: 'Update a field',
      security: [{ bearerAuth: [] }],
      parameters: [idParam('fieldId')],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref('UpdateFieldRequest') } },
      },
      responses: { 200: dataResponse('Field updated', ref('Field')), ...authErrors },
    },
    delete: {
      tags: ['Fields'],
      summary: 'Delete a field',
      security: [{ bearerAuth: [] }],
      parameters: [idParam('fieldId')],
      responses: { 200: messageResponse('Field deleted'), ...authErrors },
    },
  },

  // ===== Soil reports (nested under field) =====
  '/fields/{fieldId}/soil-reports': {
    post: {
      tags: ['Soil Reports'],
      summary: 'Upload a soil report for a field',
      security: [{ bearerAuth: [] }],
      parameters: [idParam('fieldId')],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref('CreateSoilReportRequest') } },
      },
      responses: { 201: dataResponse('Soil report uploaded', ref('SoilReport')), ...authErrors },
    },
    get: {
      tags: ['Soil Reports'],
      summary: 'Get the soil report history for a field',
      security: [{ bearerAuth: [] }],
      parameters: [idParam('fieldId')],
      responses: { 200: dataResponse('Soil report history', arrayOf('SoilReport')), ...authErrors },
    },
  },
  '/fields/{fieldId}/soil-reports/latest': {
    get: {
      tags: ['Soil Reports'],
      summary: 'Get the latest soil report for a field',
      security: [{ bearerAuth: [] }],
      parameters: [idParam('fieldId')],
      responses: { 200: dataResponse('Latest soil report', ref('SoilReport')), ...authErrors },
    },
  },
  '/soil-reports/{id}': {
    delete: {
      tags: ['Soil Reports'],
      summary: 'Delete a soil report',
      security: [{ bearerAuth: [] }],
      parameters: [idParam('id', 'Numeric ID of the soil report')],
      responses: { 200: messageResponse('Soil report deleted'), ...authErrors },
    },
  },

  // ===== Advisory =====
  '/fields/{fieldId}/advisory': {
    get: {
      tags: ['Advisory'],
      summary: 'Generate the current advisory for a field',
      description:
        'Runs the crop-stage, disease-risk and nutrient engines for the field and returns a fresh advisory.',
      security: [{ bearerAuth: [] }],
      parameters: [idParam('fieldId')],
      responses: {
        200: {
          description: 'Advisory generated. Advisory content fields are spread at the top level.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Advisory generated successfully' },
                  generatedAt: { type: 'string', format: 'date-time' },
                },
                additionalProperties: true,
              },
            },
          },
        },
        ...authErrors,
      },
    },
  },
  '/fields/{fieldId}/advisories': {
    get: {
      tags: ['Advisory'],
      summary: 'Get the advisory history for a field',
      security: [{ bearerAuth: [] }],
      parameters: [idParam('fieldId')],
      responses: {
        200: dataResponse('Advisory history fetched', { type: 'array', items: { type: 'object' } }),
        ...authErrors,
      },
    },
  },

  // ===== Crops (reference data, farmer-facing) =====
  '/crops': {
    get: {
      tags: ['Crops'],
      summary: 'List all crops',
      security: [{ bearerAuth: [] }],
      responses: {
        200: dataResponse('Crops fetched', arrayOf('Crop')),
        401: { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/crops/{cropId}/stages': {
    get: {
      tags: ['Crops'],
      summary: 'List the growth stages for a crop',
      security: [{ bearerAuth: [] }],
      parameters: [idParam('cropId')],
      responses: { 200: dataResponse('Crop stages fetched', arrayOf('CropStage')), ...authErrors },
    },
  },
  '/crops/{cropId}/diseases': {
    get: {
      tags: ['Crops'],
      summary: 'List the diseases tracked for a crop',
      security: [{ bearerAuth: [] }],
      parameters: [idParam('cropId')],
      responses: { 200: dataResponse('Diseases fetched', arrayOf('Disease')), ...authErrors },
    },
  },

  // ===== Admin auth =====
  '/admin/auth/login': {
    post: {
      tags: ['Admin'],
      summary: 'Admin login',
      security: [],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref('LoginRequest') } },
      },
      responses: {
        200: dataResponse('Admin login successful', ref('AuthSession')),
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
      },
    },
  },
  '/admin/dashboard': {
    get: {
      tags: ['Admin'],
      summary: 'Admin dashboard summary',
      security: [{ bearerAuth: [] }],
      responses: {
        200: dataResponse('Dashboard data', { type: 'object' }),
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
      },
    },
  },

  // ===== Admin: farmers =====
  '/admin/farmers': {
    get: {
      tags: ['Admin'],
      summary: 'List all farmers',
      security: [{ bearerAuth: [] }],
      responses: { 200: dataResponse('Farmers list', arrayOf('User')), ...adminErrors },
    },
  },
  '/admin/farmers/{id}': {
    get: {
      tags: ['Admin'],
      summary: 'Get a farmer by ID',
      security: [{ bearerAuth: [] }],
      parameters: [idParam('id')],
      responses: { 200: dataResponse('Farmer details', ref('User')), ...adminErrors },
    },
    delete: {
      tags: ['Admin'],
      summary: 'Delete a farmer',
      security: [{ bearerAuth: [] }],
      parameters: [idParam('id')],
      responses: { 200: messageResponse('Farmer deleted'), ...adminErrors },
    },
  },

  // ===== Admin: fields =====
  '/admin/fields': {
    get: {
      tags: ['Admin'],
      summary: 'List all fields (across all farmers)',
      security: [{ bearerAuth: [] }],
      responses: { 200: dataResponse('Fields list', arrayOf('Field')), ...adminErrors },
    },
  },
  '/admin/fields/{id}': {
    get: {
      tags: ['Admin'],
      summary: 'Get field details',
      security: [{ bearerAuth: [] }],
      parameters: [idParam('id')],
      responses: { 200: dataResponse('Field details', ref('Field')), ...adminErrors },
    },
    delete: {
      tags: ['Admin'],
      summary: 'Delete a field',
      security: [{ bearerAuth: [] }],
      parameters: [idParam('id')],
      responses: { 200: messageResponse('Field deleted'), ...adminErrors },
    },
  },

  // ===== Admin CRUD resources =====
  ...adminCrud({
    tag: 'Admin',
    base: 'crops',
    singular: 'Crop',
    listSchema: 'Crop',
    itemSchema: 'Crop',
    createReq: 'CreateCropRequest',
    updateReq: 'UpdateCropRequest',
  }),
  ...adminCrud({
    tag: 'Admin',
    base: 'stages',
    singular: 'Stage',
    listSchema: 'CropStage',
    itemSchema: 'CropStage',
    createReq: 'CreateStageRequest',
    updateReq: 'UpdateStageRequest',
  }),
  ...adminCrud({
    tag: 'Admin',
    base: 'diseases',
    singular: 'Disease',
    listSchema: 'Disease',
    itemSchema: 'Disease',
    createReq: 'CreateDiseaseRequest',
    updateReq: 'UpdateDiseaseRequest',
  }),
  ...adminCrud({
    tag: 'Admin',
    base: 'disease-rules',
    singular: 'Disease rule',
    listSchema: 'CreateDiseaseRuleRequest',
    itemSchema: 'CreateDiseaseRuleRequest',
    createReq: 'CreateDiseaseRuleRequest',
    updateReq: 'UpdateDiseaseRuleRequest',
  }),
  ...adminCrud({
    tag: 'Admin',
    base: 'risk-levels',
    singular: 'Risk level',
    listSchema: 'CreateRiskLevelRequest',
    itemSchema: 'CreateRiskLevelRequest',
    createReq: 'CreateRiskLevelRequest',
    updateReq: 'UpdateRiskLevelRequest',
  }),
  ...adminCrud({
    tag: 'Admin',
    base: 'nutrient-rules',
    singular: 'Nutrient rule',
    listSchema: 'CreateNutrientRuleRequest',
    itemSchema: 'CreateNutrientRuleRequest',
    createReq: 'CreateNutrientRuleRequest',
    updateReq: 'UpdateNutrientRuleRequest',
  }),
};

// ---------------------------------------------------------------------------
// Root document
// ---------------------------------------------------------------------------
const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Watermelon Crop Advisory & Risk Engine API',
    version: '1.0.0',
    description:
      'REST API for the Watermelon Crop Advisory & Risk Engine. All responses use a ' +
      '`{ success, message, data? }` envelope. Authenticate via the `POST /api/auth/login` ' +
      '(or `/api/admin/auth/login`) endpoint, then pass the returned token as a Bearer token.',
  },
  servers: [{ url: `http://localhost:${config.port}/api`, description: 'Local server' }],
  tags: [
    { name: 'Health', description: 'Service health' },
    { name: 'Auth', description: 'Farmer authentication' },
    { name: 'Profile', description: 'Current-user profile management' },
    { name: 'Fields', description: 'Farmer field management' },
    { name: 'Soil Reports', description: 'Soil report upload & history' },
    { name: 'Advisory', description: 'Advisory generation & history' },
    { name: 'Crops', description: 'Crop reference data (farmer-facing)' },
    { name: 'Admin', description: 'Admin-only management endpoints (requires admin role)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas,
    responses,
  },
  security: [{ bearerAuth: [] }],
  paths,
};

module.exports = openapiSpec;
