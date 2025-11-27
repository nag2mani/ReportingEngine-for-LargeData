import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['role', 'role.permissions', 'role.fieldPermissions', 'school'],
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.hashed_password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      school_id: user.school_id,
    };

    return {
      access_token: this.jwtService.sign(payload, {
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '1h'),
      }),
      refresh_token: this.jwtService.sign(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET', 'refresh-secret'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        school_id: user.school_id,
      },
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET', 'refresh-secret'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ['role', 'school'],
      });

      if (!user || !user.is_active) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role.name,
        school_id: user.school_id,
      };

      return {
        access_token: this.jwtService.sign(newPayload, {
          expiresIn: this.configService.get('JWT_EXPIRES_IN', '1h'),
        }),
      };
    } catch (error) {
      throw new BadRequestException('Invalid refresh token');
    }
  }
}
