import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportFilterDto, TimeSeriesFilterDto } from './dto/report-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import { Resource, Action } from '../../entities/permission.entity';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { FieldMaskInterceptor } from '../../common/interceptors/field-mask.interceptor';

@Controller('reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(FieldMaskInterceptor)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @RequirePermission(Resource.REPORTS, Action.READ)
  async getSummary(
    @Query() filter: ReportFilterDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getSummary(filter, user.school_id);
  }

  @Get('time-series')
  @RequirePermission(Resource.REPORTS, Action.READ)
  async getTimeSeries(
    @Query() filter: TimeSeriesFilterDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getTimeSeries(filter, user.school_id);
  }

  @Get('student/:studentId')
  @RequirePermission(Resource.REPORTS, Action.READ)
  async getStudentReport(
    @Param('studentId') studentId: string,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getStudentReport(studentId, user.school_id);
  }

  @Get('top-schools')
  @RequirePermission(Resource.REPORTS, Action.READ)
  async getTopSchools(
    @Query('limit') limit?: number,
    @Query('period_months') periodMonths?: number,
  ) {
    return this.reportsService.getTopSchools(
      limit ? parseInt(limit.toString(), 10) : 10,
      periodMonths ? parseInt(periodMonths.toString(), 10) : 1,
    );
  }
}
