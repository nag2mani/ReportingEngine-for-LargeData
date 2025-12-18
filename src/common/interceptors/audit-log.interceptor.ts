import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../entities/audit-log.entity';

// Audit log interceptor - automatically logs all API requests with user actions, IP addresses, and changes
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const user = request.user;
    const body = request.body;

    const action = this.mapMethodToAction(method);
    if (!action) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (response) => {
        try {
          const resource = this.inferResource(url);
          const resourceId = this.extractResourceId(url, response);

          await this.auditLogRepository.save({
            user_id: user?.id,
            resource,
            resource_id: resourceId,
            action,
            changes: body,
            ip_address: request.ip,
            user_agent: request.get('user-agent'),
          });
        } catch (error) {
          // Don't fail the request if audit logging fails
          console.error('Audit log error:', error);
        }
      }),
    );
  }

  private mapMethodToAction(method: string): string | null {
    const mapping = {
      GET: 'read',
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    };
    return mapping[method] || null;
  }

  private inferResource(url: string): string {
    const parts = url.split('/').filter(Boolean);
    return parts[parts.length - 1] || 'unknown';
  }

  private extractResourceId(url: string, response: any): string | null {
    // Try to extract from URL params
    const urlMatch = url.match(/\/([a-f0-9-]{36})/i);
    if (urlMatch) {
      return urlMatch[1];
    }

    // Try to extract from response
    if (response?.id) {
      return response.id;
    }

    return null;
  }
}
