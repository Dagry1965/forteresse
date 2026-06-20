import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

@Injectable()
export class UsersService {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email }});
  }

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id }});
  }

  async createUser(data: { email: string; password: string; name?: string }) {
    const hash = await argon2.hash(data.password);
    return prisma.user.create({ data: { email: data.email, password: hash, name: data.name }});
  }

  async verifyPassword(userId: string, plain: string) {
    const u = await this.findById(userId);
    if (!u || !u.password) return false;
    return argon2.verify(u.password, plain);
  }
}
