import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';

// Import Zod schemas
import {
  userSchema,
  createUserInputSchema,
  updateUserInputSchema,
  expoSchema,
  createExpoInputSchema,
  updateExpoInputSchema,
  createExpoRegistrationInputSchema,
  expoRegistrationSchema,
  exhibitorSchema,
  createExhibitorInputSchema,
  updateExhibitorInputSchema,
  virtualBoothSchema,
  createVirtualBoothInputSchema,
  updateVirtualBoothInputSchema,
  notificationSchema,
  createNotificationInputSchema,
  createUserInteractionInputSchema,
  userInteractionSchema
} from './schema.ts';

// Load environment variables
dotenv.config();

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database setup
const { DATABASE_URL, PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT = 5432, JWT_SECRET = 'your-secret-key' } = process.env;

const pool = new Pool(
  DATABASE_URL
    ? { 
        connectionString: DATABASE_URL, 
        ssl: { require: true } 
      }
    : {
        host: PGHOST,
        database: PGDATABASE,
        user: PGUSER,
        password: PGPASSWORD,
        port: Number(PGPORT),
        ssl: { require: true },
      }
);

// Error response utility
function createErrorResponse(message, error = null, errorCode = null) {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errorCode) {
    response.error_code = errorCode;
  }

  if (error) {
    response.details = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return response;
}

// Express app setup
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: "5mb" }));
app.use(morgan('combined'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

/*
Authentication middleware for protected routes
Validates JWT token and attaches user to request object
*/
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json(createErrorResponse('Access token required', null, 'AUTH_TOKEN_MISSING'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query('SELECT user_id, email, name, created_at FROM users WHERE user_id = $1', [decoded.user_id]);
    
    if (result.rows.length === 0) {
      return res.status(401).json(createErrorResponse('Invalid token', null, 'AUTH_USER_NOT_FOUND'));
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(403).json(createErrorResponse('Invalid or expired token', error, 'AUTH_TOKEN_INVALID'));
  }
};

/*
Socket.IO authentication middleware
Validates JWT token for WebSocket connections
*/
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query('SELECT user_id, email, name, created_at FROM users WHERE user_id = $1', [decoded.user_id]);
    
    if (result.rows.length === 0) {
      return next(new Error('Invalid token'));
    }

    socket.user = result.rows[0];
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});

// AUTH ENDPOINTS

/*
User registration endpoint
Creates new user account and returns JWT token
*/
app.post('/api/auth/register', async (req, res) => {
  try {
    const validatedData = createUserInputSchema.parse(req.body);
    const { email, name, password_hash } = validatedData;

    // Check if user exists
    const existingUser = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json(createErrorResponse('User with this email already exists', null, 'USER_ALREADY_EXISTS'));
    }

    // Create user (NO HASHING - store password directly for development)
    const user_id = uuidv4();
    const created_at = new Date().toISOString();
    
    const result = await pool.query(
      'INSERT INTO users (user_id, email, name, password_hash, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, email, name, created_at',
      [user_id, email.toLowerCase().trim(), name.trim(), password_hash, created_at]
    );

    const user = result.rows[0];

    // Generate JWT
    const auth_token = jwt.sign(
      { user_id: user.user_id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Emit WebSocket event for user registration
    io.emit('user/registered', {
      user_id: user.user_id,
      email: user.email,
      name: user.name
    });

    res.status(201).json({ auth_token });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
User login endpoint
Authenticates user credentials and returns JWT token
*/
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(createErrorResponse('Email and password are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    // Find user (NO HASHING - direct password comparison for development)
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      return res.status(400).json(createErrorResponse('Invalid email or password', null, 'INVALID_CREDENTIALS'));
    }

    const user = result.rows[0];

    // Check password (direct comparison for development)
    if (password !== user.password_hash) {
      return res.status(400).json(createErrorResponse('Invalid email or password', null, 'INVALID_CREDENTIALS'));
    }

    // Generate JWT
    const auth_token = jwt.sign(
      { user_id: user.user_id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({ auth_token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Password recovery endpoint
Initiates password recovery process for user
@@need:external-api : Email service API to send password recovery emails with reset links
*/
app.post('/api/auth/recover-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(createErrorResponse('Email is required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    // Check if user exists
    const result = await pool.query('SELECT user_id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      // Return success even if user doesn't exist for security
      return res.json({ message: 'Password recovery email sent' });
    }

    // Mock password recovery email sending
    await sendPasswordRecoveryEmail({ email });

    res.json({ message: 'Password recovery email sent' });
  } catch (error) {
    console.error('Password recovery error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Mock function for sending password recovery emails
This would integrate with an email service API in production
*/
async function sendPasswordRecoveryEmail({ email }) {
  // Returning a mock response in the expected format for now
  return {
    success: true,
    message_id: uuidv4(),
    email: email,
    sent_at: new Date().toISOString()
  };
}

// USER ENDPOINTS

/*
Get user profile endpoint
Retrieves user profile information by user ID
*/
app.get('/api/users/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query('SELECT user_id, email, name, created_at FROM users WHERE user_id = $1', [user_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('User not found', null, 'USER_NOT_FOUND'));
    }

    const user = result.rows[0];
    const validatedUser = userSchema.parse({
      ...user,
      password_hash: 'hidden' // Don't expose password
    });

    res.json({
      user_id: validatedUser.user_id,
      email: validatedUser.email,
      name: validatedUser.name,
      created_at: validatedUser.created_at
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Update user profile endpoint
Updates user profile information
*/
app.patch('/api/users/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    const validatedData = updateUserInputSchema.parse({ user_id, ...req.body });

    // Check if user exists and belongs to authenticated user
    if (req.user.user_id !== user_id) {
      return res.status(403).json(createErrorResponse('Access denied', null, 'ACCESS_DENIED'));
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (validatedData.email) {
      updateFields.push(`email = $${paramCount++}`);
      updateValues.push(validatedData.email.toLowerCase().trim());
    }

    if (validatedData.name) {
      updateFields.push(`name = $${paramCount++}`);
      updateValues.push(validatedData.name.trim());
    }

    if (validatedData.password_hash) {
      updateFields.push(`password_hash = $${paramCount++}`);
      updateValues.push(validatedData.password_hash);
    }

    if (updateFields.length === 0) {
      return res.status(400).json(createErrorResponse('No fields to update', null, 'NO_UPDATE_FIELDS'));
    }

    updateValues.push(user_id);
    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = $${paramCount} RETURNING user_id, email, name, created_at`;

    const result = await pool.query(query, updateValues);
    const user = result.rows[0];

    // Emit WebSocket event for profile update
    io.emit('user/profileUpdated', {
      user_id: user.user_id,
      email: user.email,
      name: user.name
    });

    res.json({
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      created_at: user.created_at
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// EXPO ENDPOINTS

/*
Search expos endpoint
Retrieves list of expos with optional search and filtering
*/
app.get('/api/expos', async (req, res) => {
  try {
    const { query, limit = 10, offset = 0, sort_by = 'date', sort_order = 'desc' } = req.query;

    let sqlQuery = 'SELECT * FROM expos';
    const queryParams = [];
    let paramCount = 1;

    if (query) {
      sqlQuery += ` WHERE title ILIKE $${paramCount} OR description ILIKE $${paramCount} OR category ILIKE $${paramCount}`;
      queryParams.push(`%${query}%`);
      paramCount++;
    }

    sqlQuery += ` ORDER BY ${sort_by} ${sort_order.toUpperCase()}`;
    sqlQuery += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(sqlQuery, queryParams);
    
    const expos = result.rows.map(expo => ({
      ...expo,
      featured: Boolean(expo.featured)
    }));

    res.json(expos);
  } catch (error) {
    console.error('Search expos error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Create expo endpoint
Creates a new expo entry
*/
app.post('/api/expos', authenticateToken, async (req, res) => {
  try {
    const validatedData = createExpoInputSchema.parse(req.body);
    const { title, description, date, category, location, featured = false } = validatedData;

    const expo_id = uuidv4();
    const dateString = new Date(date).toISOString();

    const result = await pool.query(
      'INSERT INTO expos (expo_id, title, description, date, category, location, featured) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [expo_id, title, description, dateString, category, location, featured]
    );

    const expo = result.rows[0];

    res.status(201).json({
      ...expo,
      featured: Boolean(expo.featured)
    });
  } catch (error) {
    console.error('Create expo error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Get expo details endpoint
Retrieves detailed information for a specific expo
*/
app.get('/api/expos/:expo_id', async (req, res) => {
  try {
    const { expo_id } = req.params;

    const result = await pool.query('SELECT * FROM expos WHERE expo_id = $1', [expo_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Expo not found', null, 'EXPO_NOT_FOUND'));
    }

    const expo = result.rows[0];

    res.json({
      ...expo,
      featured: Boolean(expo.featured)
    });
  } catch (error) {
    console.error('Get expo details error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Update expo endpoint
Updates an existing expo's information
*/
app.patch('/api/expos/:expo_id', authenticateToken, async (req, res) => {
  try {
    const { expo_id } = req.params;
    const validatedData = updateExpoInputSchema.parse({ expo_id, ...req.body });

    // Check if expo exists
    const existingExpo = await pool.query('SELECT * FROM expos WHERE expo_id = $1', [expo_id]);
    if (existingExpo.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Expo not found', null, 'EXPO_NOT_FOUND'));
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (validatedData.title) {
      updateFields.push(`title = $${paramCount++}`);
      updateValues.push(validatedData.title);
    }

    if (validatedData.description) {
      updateFields.push(`description = $${paramCount++}`);
      updateValues.push(validatedData.description);
    }

    if (validatedData.date) {
      updateFields.push(`date = $${paramCount++}`);
      updateValues.push(new Date(validatedData.date).toISOString());
    }

    if (validatedData.category) {
      updateFields.push(`category = $${paramCount++}`);
      updateValues.push(validatedData.category);
    }

    if (validatedData.location) {
      updateFields.push(`location = $${paramCount++}`);
      updateValues.push(validatedData.location);
    }

    if (validatedData.featured !== undefined) {
      updateFields.push(`featured = $${paramCount++}`);
      updateValues.push(validatedData.featured);
    }

    if (updateFields.length === 0) {
      return res.status(400).json(createErrorResponse('No fields to update', null, 'NO_UPDATE_FIELDS'));
    }

    updateValues.push(expo_id);
    const query = `UPDATE expos SET ${updateFields.join(', ')} WHERE expo_id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, updateValues);
    const expo = result.rows[0];

    // Emit WebSocket event for expo update
    io.emit('expo/updated', {
      expo_id: expo.expo_id,
      title: expo.title,
      description: expo.description,
      date: expo.date,
      category: expo.category,
      location: expo.location,
      featured: Boolean(expo.featured)
    });

    res.json({
      ...expo,
      featured: Boolean(expo.featured)
    });
  } catch (error) {
    console.error('Update expo error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// EXPO REGISTRATION ENDPOINTS

/*
Create expo registration endpoint
Registers a user for an expo
*/
app.post('/api/expo-registrations', authenticateToken, async (req, res) => {
  try {
    const validatedData = createExpoRegistrationInputSchema.parse(req.body);
    const { user_id, expo_id } = validatedData;

    // Verify user_id matches authenticated user
    if (req.user.user_id !== user_id) {
      return res.status(403).json(createErrorResponse('Access denied', null, 'ACCESS_DENIED'));
    }

    // Check if expo exists
    const expoResult = await pool.query('SELECT expo_id FROM expos WHERE expo_id = $1', [expo_id]);
    if (expoResult.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Expo not found', null, 'EXPO_NOT_FOUND'));
    }

    // Check if already registered
    const existingReg = await pool.query('SELECT registration_id FROM expo_registrations WHERE user_id = $1 AND expo_id = $2', [user_id, expo_id]);
    if (existingReg.rows.length > 0) {
      return res.status(400).json(createErrorResponse('User already registered for this expo', null, 'ALREADY_REGISTERED'));
    }

    const registration_id = uuidv4();
    const registered_at = new Date().toISOString();

    const result = await pool.query(
      'INSERT INTO expo_registrations (registration_id, user_id, expo_id, registered_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [registration_id, user_id, expo_id, registered_at]
    );

    const registration = result.rows[0];

    // Create notification for user
    const notification_id = uuidv4();
    const notificationResult = await pool.query(
      'INSERT INTO notifications (notification_id, user_id, message, type, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [notification_id, user_id, 'Your expo registration was successful!', 'registration', registered_at]
    );

    // Emit WebSocket events
    io.emit('expo/registrationCreated', {
      registration_id: registration.registration_id,
      user_id: registration.user_id,
      expo_id: registration.expo_id,
      registered_at: registration.registered_at
    });

    io.emit('notification/created', {
      notification_id: notificationResult.rows[0].notification_id,
      user_id: notificationResult.rows[0].user_id,
      message: notificationResult.rows[0].message,
      type: notificationResult.rows[0].type,
      created_at: notificationResult.rows[0].created_at
    });

    res.status(201).json(registration);
  } catch (error) {
    console.error('Create expo registration error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// EXHIBITOR ENDPOINTS

/*
Create exhibitor endpoint
Creates a new exhibitor profile
*/
app.post('/api/exhibitors', authenticateToken, async (req, res) => {
  try {
    const validatedData = createExhibitorInputSchema.parse(req.body);
    const { user_id, name, email, company } = validatedData;

    // Verify user_id matches authenticated user
    if (req.user.user_id !== user_id) {
      return res.status(403).json(createErrorResponse('Access denied', null, 'ACCESS_DENIED'));
    }

    // Check if exhibitor already exists for this user
    const existingExhibitor = await pool.query('SELECT exhibitor_id FROM exhibitors WHERE user_id = $1', [user_id]);
    if (existingExhibitor.rows.length > 0) {
      return res.status(400).json(createErrorResponse('Exhibitor profile already exists for this user', null, 'EXHIBITOR_EXISTS'));
    }

    const exhibitor_id = uuidv4();
    const created_at = new Date().toISOString();

    const result = await pool.query(
      'INSERT INTO exhibitors (exhibitor_id, user_id, name, email, company, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [exhibitor_id, user_id, name, email, company, created_at]
    );

    const exhibitor = result.rows[0];

    res.status(201).json(exhibitor);
  } catch (error) {
    console.error('Create exhibitor error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Get exhibitor details endpoint
Retrieves information for a specific exhibitor
*/
app.get('/api/exhibitors/:exhibitor_id', async (req, res) => {
  try {
    const { exhibitor_id } = req.params;

    const result = await pool.query('SELECT * FROM exhibitors WHERE exhibitor_id = $1', [exhibitor_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Exhibitor not found', null, 'EXHIBITOR_NOT_FOUND'));
    }

    const exhibitor = result.rows[0];
    res.json(exhibitor);
  } catch (error) {
    console.error('Get exhibitor details error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Update exhibitor endpoint
Updates an existing exhibitor's information
*/
app.patch('/api/exhibitors/:exhibitor_id', authenticateToken, async (req, res) => {
  try {
    const { exhibitor_id } = req.params;
    const validatedData = updateExhibitorInputSchema.parse({ exhibitor_id, ...req.body });

    // Check if exhibitor exists and belongs to authenticated user
    const existingExhibitor = await pool.query('SELECT * FROM exhibitors WHERE exhibitor_id = $1', [exhibitor_id]);
    if (existingExhibitor.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Exhibitor not found', null, 'EXHIBITOR_NOT_FOUND'));
    }

    if (existingExhibitor.rows[0].user_id !== req.user.user_id) {
      return res.status(403).json(createErrorResponse('Access denied', null, 'ACCESS_DENIED'));
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (validatedData.name) {
      updateFields.push(`name = $${paramCount++}`);
      updateValues.push(validatedData.name);
    }

    if (validatedData.email) {
      updateFields.push(`email = $${paramCount++}`);
      updateValues.push(validatedData.email);
    }

    if (validatedData.company !== undefined) {
      updateFields.push(`company = $${paramCount++}`);
      updateValues.push(validatedData.company);
    }

    if (updateFields.length === 0) {
      return res.status(400).json(createErrorResponse('No fields to update', null, 'NO_UPDATE_FIELDS'));
    }

    updateValues.push(exhibitor_id);
    const query = `UPDATE exhibitors SET ${updateFields.join(', ')} WHERE exhibitor_id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, updateValues);
    const exhibitor = result.rows[0];

    res.json(exhibitor);
  } catch (error) {
    console.error('Update exhibitor error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// VIRTUAL BOOTH ENDPOINTS

/*
Create virtual booth endpoint
Creates a new virtual booth for an exhibitor
*/
app.post('/api/virtual-booths', authenticateToken, async (req, res) => {
  try {
    const validatedData = createVirtualBoothInputSchema.parse(req.body);
    const { exhibitor_id, description, media_urls, product_catalog } = validatedData;

    // Check if exhibitor exists and belongs to authenticated user
    const exhibitorResult = await pool.query('SELECT * FROM exhibitors WHERE exhibitor_id = $1', [exhibitor_id]);
    if (exhibitorResult.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Exhibitor not found', null, 'EXHIBITOR_NOT_FOUND'));
    }

    if (exhibitorResult.rows[0].user_id !== req.user.user_id) {
      return res.status(403).json(createErrorResponse('Access denied', null, 'ACCESS_DENIED'));
    }

    // Check if booth already exists for this exhibitor
    const existingBooth = await pool.query('SELECT booth_id FROM virtual_booths WHERE exhibitor_id = $1', [exhibitor_id]);
    if (existingBooth.rows.length > 0) {
      return res.status(400).json(createErrorResponse('Virtual booth already exists for this exhibitor', null, 'BOOTH_EXISTS'));
    }

    const booth_id = uuidv4();

    const result = await pool.query(
      'INSERT INTO virtual_booths (booth_id, exhibitor_id, description, media_urls, product_catalog) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [booth_id, exhibitor_id, description, media_urls, product_catalog]
    );

    const booth = result.rows[0];

    res.status(201).json(booth);
  } catch (error) {
    console.error('Create virtual booth error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Get virtual booth details endpoint
Retrieves information for a specific virtual booth
*/
app.get('/api/virtual-booths/:booth_id', async (req, res) => {
  try {
    const { booth_id } = req.params;

    const result = await pool.query('SELECT * FROM virtual_booths WHERE booth_id = $1', [booth_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Virtual booth not found', null, 'BOOTH_NOT_FOUND'));
    }

    const booth = result.rows[0];
    res.json(booth);
  } catch (error) {
    console.error('Get virtual booth details error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Update virtual booth endpoint
Updates an existing virtual booth's information
*/
app.patch('/api/virtual-booths/:booth_id', authenticateToken, async (req, res) => {
  try {
    const { booth_id } = req.params;
    const validatedData = updateVirtualBoothInputSchema.parse({ booth_id, ...req.body });

    // Check if booth exists and belongs to authenticated user
    const boothResult = await pool.query(`
      SELECT vb.*, e.user_id 
      FROM virtual_booths vb 
      JOIN exhibitors e ON vb.exhibitor_id = e.exhibitor_id 
      WHERE vb.booth_id = $1
    `, [booth_id]);
    
    if (boothResult.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Virtual booth not found', null, 'BOOTH_NOT_FOUND'));
    }

    if (boothResult.rows[0].user_id !== req.user.user_id) {
      return res.status(403).json(createErrorResponse('Access denied', null, 'ACCESS_DENIED'));
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (validatedData.description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      updateValues.push(validatedData.description);
    }

    if (validatedData.media_urls !== undefined) {
      updateFields.push(`media_urls = $${paramCount++}`);
      updateValues.push(validatedData.media_urls);
    }

    if (validatedData.product_catalog !== undefined) {
      updateFields.push(`product_catalog = $${paramCount++}`);
      updateValues.push(validatedData.product_catalog);
    }

    if (updateFields.length === 0) {
      return res.status(400).json(createErrorResponse('No fields to update', null, 'NO_UPDATE_FIELDS'));
    }

    updateValues.push(booth_id);
    const query = `UPDATE virtual_booths SET ${updateFields.join(', ')} WHERE booth_id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, updateValues);
    const booth = result.rows[0];

    res.json(booth);
  } catch (error) {
    console.error('Update virtual booth error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// NOTIFICATION ENDPOINTS

/*
Get user notifications endpoint
Retrieves all notifications for a specific user
*/
app.get('/api/notifications/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;

    // Verify user_id matches authenticated user
    if (req.user.user_id !== user_id) {
      return res.status(403).json(createErrorResponse('Access denied', null, 'ACCESS_DENIED'));
    }

    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get user notifications error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// WEBSOCKET EVENTS

/*
Socket.IO connection handler
Manages real-time connections and events
*/
io.on('connection', (socket) => {
  console.log(`User ${socket.user.user_id} connected`);

  // Join user to their personal room for targeted notifications
  socket.join(`user:${socket.user.user_id}`);

  /*
  Handle exhibitor interaction events
  Records and broadcasts user-exhibitor interactions
  */
  socket.on('exhibitor/interaction', async (data) => {
    try {
      const validatedData = createUserInteractionInputSchema.parse(data);
      const { user_id, exhibitor_id, interaction_type } = validatedData;

      // Verify user_id matches authenticated user
      if (socket.user.user_id !== user_id) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      const interaction_id = uuidv4();
      const created_at = new Date().toISOString();

      const result = await pool.query(
        'INSERT INTO user_interactions (interaction_id, user_id, exhibitor_id, interaction_type, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [interaction_id, user_id, exhibitor_id, interaction_type, created_at]
      );

      const interaction = result.rows[0];

      // Broadcast interaction event
      io.emit('exhibitor/interaction', {
        interaction_id: interaction.interaction_id,
        user_id: interaction.user_id,
        exhibitor_id: interaction.exhibitor_id,
        interaction_type: interaction.interaction_type,
        created_at: interaction.created_at
      });

      socket.emit('interaction/acknowledged', { interaction_id });
    } catch (error) {
      console.error('Exhibitor interaction error:', error);
      socket.emit('error', { message: 'Failed to record interaction' });
    }
  });

  /*
  Handle notification creation events
  Creates and broadcasts new notifications
  */
  socket.on('notification/create', async (data) => {
    try {
      const validatedData = createNotificationInputSchema.parse(data);
      const { user_id, message, type } = validatedData;

      const notification_id = uuidv4();
      const created_at = new Date().toISOString();

      const result = await pool.query(
        'INSERT INTO notifications (notification_id, user_id, message, type, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [notification_id, user_id, message, type, created_at]
      );

      const notification = result.rows[0];

      // Send notification to specific user
      io.to(`user:${user_id}`).emit('notification/created', {
        notification_id: notification.notification_id,
        user_id: notification.user_id,
        message: notification.message,
        type: notification.type,
        created_at: notification.created_at
      });

      socket.emit('notification/acknowledged', { notification_id });
    } catch (error) {
      console.error('Notification creation error:', error);
      socket.emit('error', { message: 'Failed to create notification' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.user.user_id} disconnected`);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Catch-all route for SPA routing (serves index.html for non-API routes)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

export { app, pool };

// Start the server
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port} and listening on 0.0.0.0`);
});
