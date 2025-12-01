import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class WalletAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: unknown, user: any) {
    if (err || !user) throw err || new Error('Unauthorized');
    return user;
  }
}
