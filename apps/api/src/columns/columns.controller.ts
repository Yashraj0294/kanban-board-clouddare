import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@kanban-board/shared-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/roles.decorator';
import { ColumnsService } from './columns.service';
import { CreateColumnDto, UpdateColumnDto } from './dto/column.dto';

@ApiTags('columns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ColumnsController {
  constructor(private columnsService: ColumnsService) {}

  @Get('boards/:boardId/columns')
  @ApiOperation({ summary: 'List columns for a board' })
  findByBoard(@Param('boardId') boardId: string) {
    return this.columnsService.findByBoard(boardId);
  }

  @Post('boards/:boardId/columns')
  @Roles(Role.EDITOR)
  @ApiOperation({ summary: 'Add a column to a board (editor only)' })
  create(@Param('boardId') boardId: string, @Body() dto: CreateColumnDto) {
    return this.columnsService.create(boardId, dto);
  }

  @Put('columns/:id')
  @Roles(Role.EDITOR)
  @ApiOperation({ summary: 'Rename a column (editor only)' })
  update(@Param('id') id: string, @Body() dto: UpdateColumnDto) {
    return this.columnsService.update(id, dto);
  }

  @Delete('columns/:id')
  @Roles(Role.EDITOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a column and its cards (editor only)' })
  remove(@Param('id') id: string) {
    return this.columnsService.remove(id);
  }
}
