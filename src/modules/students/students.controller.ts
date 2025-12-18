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
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto } from './dto/create-student.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import { Resource, Action } from '../../entities/permission.entity';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { FieldMaskInterceptor } from '../../common/interceptors/field-mask.interceptor';

@Controller('students')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(FieldMaskInterceptor)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @RequirePermission(Resource.STUDENTS, Action.CREATE)
  create(@Body() createStudentDto: CreateStudentDto, @CurrentUser() user: any) {
    return this.studentsService.create(createStudentDto, user.school_id);
  }

  @Get()
  @RequirePermission(Resource.STUDENTS, Action.READ)
  findAll(
    @Query() pagination: PaginationDto,
    @Query('class') classFilter?: string,
    @Query('is_active') isActive?: boolean,
    @CurrentUser() user?: any,
  ) {
    return this.studentsService.findAll(
      pagination,
      user?.school_id,
      { class: classFilter, is_active: isActive === undefined ? undefined : (typeof isActive === 'string' ? isActive === 'true' : isActive) },
    );
  }

  @Get(':id')
  @RequirePermission(Resource.STUDENTS, Action.READ)
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.studentsService.findOne(id, user.school_id);
  }

  @Patch(':id')
  @RequirePermission(Resource.STUDENTS, Action.UPDATE)
  update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @CurrentUser() user: any,
  ) {
    return this.studentsService.update(id, updateStudentDto, user.school_id);
  }

  @Delete(':id')
  @RequirePermission(Resource.STUDENTS, Action.DELETE)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.studentsService.remove(id, user.school_id);
  }
}
// This is dev and wanted to merge into prod using PR
