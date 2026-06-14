const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const bcrypt = require('bcrypt');

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    // Make sure we have a test user
    const hashed = await bcrypt.hash('password123', 10);
    const existing = await prisma.user.findUnique({ where: { email: 'test_jest@zustandtech.com' }});
    if (!existing) {
      // Find a role
      let role = await prisma.role.findUnique({ where: { name: 'BDE' }});
      if (!role) {
        role = await prisma.role.create({ data: { name: 'BDE', permissions: ['manage_leads'] }});
      }
      await prisma.user.create({
        data: {
          name: 'Jest Tester',
          email: 'test_jest@zustandtech.com',
          passwordHash: hashed,
          roleId: role.id
        }
      });
    }
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.delete({ where: { email: 'test_jest@zustandtech.com' } });
    await prisma.$disconnect();
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test_jest@zustandtech.com',
        password: 'wrongpassword'
      });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should login successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test_jest@zustandtech.com',
        password: 'password123'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe('test_jest@zustandtech.com');
  });

  it('should return 401 on protected route without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
});
