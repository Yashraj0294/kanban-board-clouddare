import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@kanban-board/shared-types';
import { AuthService } from '../auth/auth.service';
import { User, UserSchema } from '../users/user.schema';
import { UsersService } from '../users/users.service';
import { clearTestDb, setupTestDb, teardownTestDb } from './test-db.helper';
import { Model } from 'mongoose';

describe('AuthService', () => {
  let module: TestingModule;
  let authService: AuthService;
  let uri: string;

  beforeAll(async () => {
    ({ uri } = await setupTestDb());

    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
      providers: [
        AuthService,
        UsersService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock.jwt.token'),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await module.close();
    await teardownTestDb();
  });

  describe('register', () => {
    it('returns an accessToken on successful registration', async () => {
      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        role: Role.VIEWER,
      });
      expect(result).toHaveProperty('accessToken', 'mock.jwt.token');
    });

    it('throws ConflictException when email already exists', async () => {
      await authService.register({
        email: 'dup@example.com',
        password: 'password123',
        role: Role.VIEWER,
      });
      await expect(
        authService.register({
          email: 'dup@example.com',
          password: 'password123',
          role: Role.VIEWER,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('defaults to VIEWER role when not specified', async () => {
      const userModel = module.get<Model<User>>(getModelToken(User.name));
      await authService.register({
        email: 'viewer@example.com',
        password: 'password123',
        role: Role.VIEWER,
      });
      const user = await userModel.findOne({ email: 'viewer@example.com' });
      expect(user?.role).toBe(Role.VIEWER);
    });

    it('stores a bcrypt hash, not the plain password', async () => {
      const userModel = module.get<Model<User>>(getModelToken(User.name));
      await authService.register({
        email: 'hash@example.com',
        password: 'plaintext',
        role: Role.VIEWER,
      });
      const user = await userModel.findOne({ email: 'hash@example.com' });
      expect(user?.passwordHash).not.toBe('plaintext');
      expect(user?.passwordHash).toMatch(/^\$2[ab]\$/);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register({
        email: 'login@example.com',
        password: 'correctpassword',
        role: Role.EDITOR,
      });
    });

    it('returns accessToken with correct credentials', async () => {
      const result = await authService.login({
        email: 'login@example.com',
        password: 'correctpassword',
      });
      expect(result).toHaveProperty('accessToken', 'mock.jwt.token');
    });

    it('throws UnauthorizedException for wrong password', async () => {
      await expect(
        authService.login({
          email: 'login@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for unknown email', async () => {
      await expect(
        authService.login({
          email: 'ghost@example.com',
          password: 'anypassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
