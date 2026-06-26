import { IsString, IsNumber, IsOptional, Min, Max, Matches } from 'class-validator';

export class UpdateMyProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(150)
  age?: number;

  @IsString()
  @IsOptional()
  @Matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, {
    message: 'phone must be a valid phone number',
  })
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;
}
