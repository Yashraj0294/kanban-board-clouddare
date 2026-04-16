import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCardDto {
  @ApiProperty({ example: 'Implement login page' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignee?: string;

  @ApiPropertyOptional({ example: '2026-04-30' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ example: '6639a1f4e2b4a3c5d7890abc' })
  @IsMongoId()
  columnId: string;

  @ApiProperty({ example: '6639a1f4e2b4a3c5d7890def' })
  @IsMongoId()
  boardId: string;
}

export class UpdateCardDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignee?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class MoveCardDto {
  @ApiProperty()
  @IsMongoId()
  destinationColumnId: string;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  newPosition: number;
}
