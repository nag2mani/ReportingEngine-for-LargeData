import {
  IsString,
  IsUUID,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class CreateStudentDto {
  @IsUUID()
  school_id: string;

  @IsString()
  student_number: string;

  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsOptional()
  @IsString()
  class?: string;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsDateString()
  admission_date?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  meta?: any;
}

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  class?: string;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  meta?: any;
}
