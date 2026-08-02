import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from '../src/core/auth/auth.controller';
import { AuthService } from '../src/core/auth/auth.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  const authService = {
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
        exceptionFactory: (errors) => {
          const messages = errors.map(
            (error) => Object.values(error.constraints || {})[0],
          );

          return new BadRequestException(messages.join('. '));
        },
        stopAtFirstError: true,
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /api/auth/login transmet les identifiants et le contexte', async () => {
    authService.login.mockResolvedValue({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    });

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('user-agent', 'jest-supertest')
      .set('x-forwarded-for', '203.0.113.10, 10.0.0.1')
      .send({
        email: 'admin@example.com',
        password: 'secret',
      })
      .expect(201);

    expect(response.body).toEqual({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    });

    expect(authService.login).toHaveBeenCalledWith(
      {
        email: 'admin@example.com',
        password: 'secret',
      },
      {
        ipAddress: '203.0.113.10',
        userAgent: 'jest-supertest',
      },
    );
  });

  it('POST /api/auth/login refuse un email invalide', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'email-invalide',
        password: 'secret',
      })
      .expect(400);

    expect(authService.login).not.toHaveBeenCalled();
  });

  it('POST /api/auth/refresh transmet le refresh token', async () => {
    authService.refresh.mockResolvedValue({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
    });

    const response = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({
        refresh_token: 'old-refresh-token',
      })
      .expect(201);

    expect(response.body).toEqual({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
    });

    expect(authService.refresh).toHaveBeenCalledWith(
      'old-refresh-token',
      {
        ipAddress: '::ffff:127.0.0.1',
        userAgent: null,
      },
    );
  });

  it('POST /api/auth/logout exige un refresh token', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .send({})
      .expect(400);

    expect(authService.logout).not.toHaveBeenCalled();
  });
});
