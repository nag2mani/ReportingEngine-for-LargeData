import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../../entities/student.entity';
import { CreateStudentDto, UpdateStudentDto } from './dto/create-student.dto';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';

// Students service - business logic for student operations with school-based access control
@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async create(createStudentDto: CreateStudentDto, userSchoolId?: string) {
    if (userSchoolId && createStudentDto.school_id !== userSchoolId) {
      throw new ForbiddenException('Cannot create student for different school');
    }

    const student = this.studentRepository.create(createStudentDto);
    return this.studentRepository.save(student);
  }

  async findAll(
    pagination: PaginationDto,
    userSchoolId?: string,
    filters?: { class?: string; is_active?: boolean },
  ): Promise<PaginatedResponse<Student>> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const query = this.studentRepository.createQueryBuilder('student');

    if (userSchoolId) {
      query.where('student.school_id = :schoolId', { schoolId: userSchoolId });
    }

    if (filters?.class) {
      query.andWhere('student.class = :class', { class: filters.class });
    }

    if (filters?.is_active !== undefined) {
      query.andWhere('student.is_active = :isActive', {
        isActive: filters.is_active,
      });
    }

    const [data, total] = await query
      .skip(skip)
      .take(limit)
      .orderBy('student.created_at', 'DESC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userSchoolId?: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['school', 'feeBills', 'payments'],
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    if (userSchoolId && student.school_id !== userSchoolId) {
      throw new ForbiddenException('Access denied');
    }

    return student;
  }

  async update(
    id: string,
    updateStudentDto: UpdateStudentDto,
    userSchoolId?: string,
  ): Promise<Student> {
    const student = await this.findOne(id, userSchoolId);
    Object.assign(student, updateStudentDto);
    return this.studentRepository.save(student);
  }

  async remove(id: string, userSchoolId?: string): Promise<void> {
    const student = await this.findOne(id, userSchoolId);
    await this.studentRepository.remove(student);
  }
}
