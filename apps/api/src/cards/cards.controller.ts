import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@kanban-board/shared-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CardsService } from './cards.service';
import { CreateCardDto, MoveCardDto, UpdateCardDto } from './dto/card.dto';

@ApiTags('cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class CardsController {
  constructor(private cardsService: CardsService) {}

  @Get('boards/:boardId/cards')
  @ApiOperation({ summary: 'List all cards for a board' })
  findByBoard(@Param('boardId') boardId: string) {
    return this.cardsService.findByBoard(boardId);
  }

  @Post('cards')
  @Roles(Role.EDITOR)
  @ApiOperation({ summary: 'Create a card (editor only)' })
  create(@Body() dto: CreateCardDto) {
    return this.cardsService.create(dto);
  }

  @Put('cards/:id')
  @Roles(Role.EDITOR)
  @ApiOperation({ summary: 'Update card fields (editor only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateCardDto) {
    const card = await this.cardsService.findById(id);
    if (!card) throw new NotFoundException('Card not found');
    return this.cardsService.update(id, dto);
  }

  @Patch('cards/:id/move')
  @Roles(Role.EDITOR)
  @ApiOperation({ summary: 'Move card to a column/position (editor only)' })
  move(@Param('id') id: string, @Body() dto: MoveCardDto) {
    return this.cardsService.move(id, dto);
  }

  @Delete('cards/:id')
  @Roles(Role.EDITOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a card (editor only)' })
  remove(@Param('id') id: string) {
    return this.cardsService.remove(id);
  }
}
