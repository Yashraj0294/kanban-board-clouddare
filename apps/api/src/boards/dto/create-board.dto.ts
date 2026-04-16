import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateBoardDto {
  @ApiProperty({ example: 'My Kanban Board' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;
}
