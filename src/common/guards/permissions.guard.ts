import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/roles.decorator';
import { Resource, Action } from '../../entities/permission.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<{
      resource: Resource;
      action: Action;
    }>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('User role not found');
    }

    const hasPermission = user.role.permissions?.some(
      (permission) =>
        permission.resource === requiredPermission.resource &&
        permission.action === requiredPermission.action,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient permissions: ${requiredPermission.action} on ${requiredPermission.resource}`,
      );
    }

    return true;
  }
}
