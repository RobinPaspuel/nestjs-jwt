import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUser {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  first_name?: string;

  @IsString()
  @IsOptional()
  last_name?: string;
}
