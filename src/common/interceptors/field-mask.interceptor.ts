import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { FIELD_PERMISSIONS_KEY } from '../decorators/roles.decorator';
import { Resource } from '../../entities/permission.entity';

@Injectable()
export class FieldMaskInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role || !user.role.fieldPermissions) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        return this.maskFields(data, user.role.fieldPermissions);
      }),
    );
  }

  private maskFields(data: any, fieldPermissions: any[]): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.maskFields(item, fieldPermissions));
    }

    const masked = { ...data };

    // Get field permissions for the resource type
    const resourceType = this.inferResourceType(data);
    if (!resourceType) {
      return masked;
    }

    const relevantPermissions = fieldPermissions.filter(
      (fp) => fp.resource === resourceType,
    );

    for (const permission of relevantPermissions) {
      const fieldName = permission.field_name;
      if (fieldName in masked) {
        // Check if user has read permission for this field
        if (!permission.allowed_actions.includes('read')) {
          masked[fieldName] = '***MASKED***';
        }
      }
    }

    return masked;
  }

  private inferResourceType(data: any): Resource | null {
    if (data.student_number) return Resource.STUDENTS;
    if (data.amount_due !== undefined) return Resource.FEE_BILLS;
    if (data.amount_paid !== undefined) return Resource.PAYMENTS;
    if (data.name && data.timezone) return Resource.SCHOOLS;
    return null;
  }
}
