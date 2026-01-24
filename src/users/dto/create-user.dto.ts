import { IsString, IsNumber, IsEmail, IsNotEmpty, Min, Max, Matches, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(1)
  @Max(150)
  age: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, {
    message: 'phone must be a valid phone number',
  })
  phone: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'password must be at least 6 characters long' })
  password: string;

  @IsString()
  @IsNotEmpty()
  role: string;
}