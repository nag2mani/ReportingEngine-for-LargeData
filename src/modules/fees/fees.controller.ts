import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FeesService } from './fees.service';
import { CreateFeeBillDto, UpdateFeeBillDto } from './dto/create-fee-bill.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import { Resource, Action } from '../../entities/permission.entity';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { FieldMaskInterceptor } from '../../common/interceptors/field-mask.interceptor';

// Fee bills controller - manages fee bill creation, updates, and retrieval with filtering
@Controller('fee-bills')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(FieldMaskInterceptor)
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Post()
  @RequirePermission(Resource.FEE_BILLS, Action.CREATE)
  create(@Body() createFeeBillDto: CreateFeeBillDto, @CurrentUser() user: any) {
    return this.feesService.create(createFeeBillDto, user.school_id);
  }

  @Get()
  @RequirePermission(Resource.FEE_BILLS, Action.READ)
  findAll(
    @Query() pagination: PaginationDto,
    @Query('student_id') studentId?: string,
    @Query('status') status?: string,
    @CurrentUser() user?: any,
  ) {
    return this.feesService.findAll(
      pagination,
      user?.school_id,
      { student_id: studentId, status },
    );
  }

  @Get(':id')
  @RequirePermission(Resource.FEE_BILLS, Action.READ)
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.feesService.findOne(id, user.school_id);
  }

  @Patch(':id')
  @RequirePermission(Resource.FEE_BILLS, Action.UPDATE)
  update(
    @Param('id') id: string,
    @Body() updateFeeBillDto: UpdateFeeBillDto,
    @CurrentUser() user: any,
  ) {
    return this.feesService.update(id, updateFeeBillDto, user.school_id);
  }

  @Delete(':id')
  @RequirePermission(Resource.FEE_BILLS, Action.DELETE)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.feesService.remove(id, user.school_id);
  }
}
