// jest.setup.js
import { app, pool } from './server.ts';
import supertest from 'supertest';

const request = supertest(app);

// Setup and teardown functions to initialize test database state
beforeAll(async () => {
  await pool.connect();
  // Ensure clean test state or set up prerequisite test data
});

afterAll(async () => {
  // Clean up test data
  await pool.query('DELETE FROM users; DELETE FROM expos; DELETE FROM expo_registrations; DELETE FROM exhibitors; DELETE FROM virtual_booths; DELETE FROM user_interactions; DELETE FROM notifications; DELETE FROM admin_activity_logs; DELETE FROM event_schedules; DELETE FROM feedbacks;');
  await pool.end();
});

describe('Auth API', () => {
  it('should register a new user successfully', async () => {
    const response = await request.post('/api/auth/register').send({
      email: 'test@example.com',
      name: 'Test User',
      password_hash: 'password123', // Use plain-text password for test purposes
    });
    
    expect(response.status).toBe(201);
    expect(response.body.auth_token).toBeTruthy();
  });

  it('should not register a user with invalid data', async () => {
    const response = await request.post('/api/auth/register').send({
      email: 'invalid', // Invalid email
      name: 'Test User',
      password_hash: 'short' // Invalid password length
    });
    
    expect(response.status).toBe(400);
  });

  it('should log in a user successfully', async () => {
    await request.post('/api/auth/register').send({
      email: 'testlogin@example.com',
      name: 'Login User',
      password_hash: 'password123'
    });

    const response = await request.post('/api/auth/login').send({
      email: 'testlogin@example.com',
      password: 'password123'
    });
    
    expect(response.status).toBe(200);
    expect(response.body.auth_token).toBeTruthy();
  });

  it('should not log in a user with incorrect credentials', async () => {
    const response = await request.post('/api/auth/login').send({
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    });
    
    expect(response.status).toBe(401);
  });
});

describe('Expo API', () => {
  it('should retrieve a list of expos', async () => {
    const response = await request.get('/api/expos');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should create a new expo', async () => {
    const response = await request.post('/api/expos').send({
      title: 'New Expo',
      description: 'An exciting new expo.',
      date: '2023-12-01',
      category: 'Art',
      location: 'Virtual',
      featured: true
    });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('expo_id');
  });
});

describe('WebSocket Tests', () => {
  it('should handle user registration event', (done) => {
    const socket = new WebSocket('ws://localhost:3000');
    socket.onopen = () => {
      socket.send(JSON.stringify({
        event: 'user/registered',
        data: { user_id: 'user1', email: 'notify@example.com', name: 'Notify User' }
      }));
      
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        expect(data.event).toBe('user/registered');
        expect(data.data.user_id).toBe('user1');
        expect(data.data.email).toBe('notify@example.com');
        socket.close();
        done();
      };
    };
  });
});
