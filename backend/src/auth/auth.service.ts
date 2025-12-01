import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { SiweMessage } from 'siwe';
import { ethers } from 'ethers';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async generateNonce(address: string) {
    const nonce = randomBytes(24).toString('hex');
    await this.prisma.walletNonce.create({
      data: {
        nonce,
        address: address?.toLowerCase(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    return nonce;
  }

  async validateSiwe(message: string, signature: string) {
    const siwe = new SiweMessage(message);
    const { address, nonce, expirationTime } = siwe;


    const recovered = ethers.verifyMessage(siwe.prepareMessage(), signature);
    if (recovered.toLowerCase() !== address.toLowerCase()) {
      throw new UnauthorizedException('Invalid signature');
    }


    const stored = await this.prisma.walletNonce.findUnique({ where: { nonce } });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Nonce expired or not found');
    }


    if (expirationTime && new Date(expirationTime) < new Date()) {
      throw new UnauthorizedException('SIWE message expired');
    }


    await this.prisma.walletNonce.delete({ where: { nonce } });


    const token = jwt.sign(
      { sub: address.toLowerCase() },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' },
    );
    return token;
  }
}
