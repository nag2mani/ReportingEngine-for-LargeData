import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeBill } from '../../entities/fee-bill.entity';
import { CreateFeeBillDto, UpdateFeeBillDto } from './dto/create-fee-bill.dto';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';

// Fees service - handles fee bill operations with pagination and school-based filtering
@Injectable()
export class FeesService {
  constructor(
    @InjectRepository(FeeBill)
    private feeBillRepository: Repository<FeeBill>,
  ) {}

  async create(createFeeBillDto: CreateFeeBillDto, userSchoolId?: string) {
    if (userSchoolId && createFeeBillDto.school_id !== userSchoolId) {
      throw new ForbiddenException('Cannot create fee bill for different school');
    }

    const feeBill = this.feeBillRepository.create(createFeeBillDto);
    return this.feeBillRepository.save(feeBill);
  }

  async findAll(
    pagination: PaginationDto,
    userSchoolId?: string,
    filters?: { student_id?: string; status?: string },
  ): Promise<PaginatedResponse<FeeBill>> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const query = this.feeBillRepository.createQueryBuilder('feeBill');

    if (userSchoolId) {
      query.where('feeBill.school_id = :schoolId', { schoolId: userSchoolId });
    }

    if (filters?.student_id) {
      query.andWhere('feeBill.student_id = :studentId', {
        studentId: filters.student_id,
      });
    }

    if (filters?.status) {
      query.andWhere('feeBill.status = :status', { status: filters.status });
    }

    const [data, total] = await query
      .leftJoinAndSelect('feeBill.student', 'student')
      .skip(skip)
      .take(limit)
      .orderBy('feeBill.due_date', 'DESC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userSchoolId?: string): Promise<FeeBill> {
    const feeBill = await this.feeBillRepository.findOne({
      where: { id },
      relations: ['student', 'school', 'payments'],
    });

    if (!feeBill) {
      throw new NotFoundException(`Fee bill with ID ${id} not found`);
    }

    if (userSchoolId && feeBill.school_id !== userSchoolId) {
      throw new ForbiddenException('Access denied');
    }

    return feeBill;
  }

  async update(
    id: string,
    updateFeeBillDto: UpdateFeeBillDto,
    userSchoolId?: string,
  ): Promise<FeeBill> {
    const feeBill = await this.findOne(id, userSchoolId);
    Object.assign(feeBill, updateFeeBillDto);
    return this.feeBillRepository.save(feeBill);
  }

  async remove(id: string, userSchoolId?: string): Promise<void> {
    const feeBill = await this.findOne(id, userSchoolId);
    await this.feeBillRepository.remove(feeBill);
  }
}
