// Permission decorators - define required permissions for routes (resource-level and field-level access control)
import { SetMetadata } from '@nestjs/common';
import { Resource, Action } from '../../entities/permission.entity';

export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const FIELD_PERMISSIONS_KEY = 'field_permissions';

export const RequirePermission = (resource: Resource, action: Action) =>
  SetMetadata(PERMISSIONS_KEY, { resource, action });

export const RequireFieldPermission = (resource: Resource, field: string) =>
  SetMetadata(FIELD_PERMISSIONS_KEY, { resource, field });
