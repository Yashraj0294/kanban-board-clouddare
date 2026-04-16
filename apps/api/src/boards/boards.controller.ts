import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@kanban-board/shared-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/roles.decorator';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';

@ApiTags('boards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('boards')
export class BoardsController {
  constructor(private boardsService: BoardsService) {}

  @Get()
  @ApiOperation({ summary: 'List all boards' })
  findAll() {
    return this.boardsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a board by ID' })
  async findOne(@Param('id') id: string) {
    const board = await this.boardsService.findOne(id);
    if (!board) throw new NotFoundException('Board not found');
    return board;
  }

  @Post()
  @Roles(Role.EDITOR)
  @ApiOperation({ summary: 'Create a board (editor only)' })
  create(@Body() dto: CreateBoardDto) {
    return this.boardsService.create(dto);
  }

  @Delete(':id')
  @Roles(Role.EDITOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a board (editor only)' })
  async remove(@Param('id') id: string) {
    const board = await this.boardsService.findOne(id);
    if (!board) throw new NotFoundException('Board not found');
    await this.boardsService.remove(id);
  }
}
