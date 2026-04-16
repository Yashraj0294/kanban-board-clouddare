import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateColumnDto {
  @ApiProperty({ example: 'Backlog' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  title: string;
}

export class UpdateColumnDto {
  @ApiProperty({ example: 'Backlog' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  title: string;
}
