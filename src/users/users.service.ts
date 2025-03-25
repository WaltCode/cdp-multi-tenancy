import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<User> {
    if (!userData.password) {
      throw new Error('Password is required');
    }
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = this.usersRepository.create({
      ...userData,
      password: hashedPassword,
      isVerified: false,
      roles: ['user'],
    });
    return await this.usersRepository.save(user);
  }

  async update(
    id: string,
    userData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<User | null> {
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    await this.usersRepository.update(id, userData);
    return this.usersRepository.findOne({ where: { id } });
  }
}
