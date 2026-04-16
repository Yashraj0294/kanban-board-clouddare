import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { JwtPayload, Role } from '@kanban-board/shared-types';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string }> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.usersService.create(
      dto.email,
      passwordHash,
      dto.role ?? Role.VIEWER,
    );

    return { accessToken: this.signToken(user) };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { accessToken: this.signToken(user) };
  }

  private signToken(user: { _id: unknown; email: string; role: Role }): string {
    const payload: JwtPayload = {
      sub: String(user._id),
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}
