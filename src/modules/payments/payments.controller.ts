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
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/create-payment.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import { Resource, Action } from '../../entities/permission.entity';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { FieldMaskInterceptor } from '../../common/interceptors/field-mask.interceptor';

@Controller('payments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(FieldMaskInterceptor)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @RequirePermission(Resource.PAYMENTS, Action.CREATE)
  create(@Body() createPaymentDto: CreatePaymentDto, @CurrentUser() user: any) {
    return this.paymentsService.create(createPaymentDto, user.school_id);
  }

  @Get()
  @RequirePermission(Resource.PAYMENTS, Action.READ)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('student_id') studentId?: string,
    @Query('status') status?: string,
    @Query('method') method?: string,
    @CurrentUser() user?: any,
  ) {
    const pagination: PaginationDto = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };
    return this.paymentsService.findAll(
      pagination,
      user?.school_id,
      { student_id: studentId, status, method },
    );
  }

  @Get(':id')
  @RequirePermission(Resource.PAYMENTS, Action.READ)
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentsService.findOne(id, user.school_id);
  }

  @Patch(':id')
  @RequirePermission(Resource.PAYMENTS, Action.UPDATE)
  update(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.update(id, updatePaymentDto, user.school_id);
  }

  @Delete(':id')
  @RequirePermission(Resource.PAYMENTS, Action.DELETE)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentsService.remove(id, user.school_id);
  }
}
