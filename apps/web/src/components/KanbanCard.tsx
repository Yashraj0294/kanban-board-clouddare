import React, { useState, memo } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { format } from 'date-fns';
import { MoreHorizontal, Pencil, Trash2, CalendarDays, User } from 'lucide-react';
import type { ICard } from '@kanban-board/shared-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { CardModal } from './CardModal';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { Button } from './ui/button';

interface KanbanCardProps {
  card: ICard;
  index: number;
  boardId: string;
}

export const KanbanCard = memo(function KanbanCard({ card, index, boardId }: KanbanCardProps) {
  const { isEditor } = useAuth();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const { mutate: deleteCard } = useMutation({
    mutationFn: () => api.delete(`/cards/${card._id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cards', boardId] }),
  });

  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();

  return (
    <>
      <Draggable draggableId={card._id} index={index} isDragDisabled={!isEditor}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={[
              'group rounded-md border bg-white p-3 shadow-sm transition-shadow',
              snapshot.isDragging ? 'shadow-lg rotate-1 opacity-90' : 'hover:shadow-md',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium leading-snug text-foreground flex-1">{card.title}</p>
              {isEditor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => deleteCard()}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {card.description && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{card.description}</p>
            )}

            {(card.assignee || card.dueDate) && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {card.assignee && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{card.assignee}</span>
                  </div>
                )}
                {card.dueDate && (
                  <Badge variant={isOverdue ? 'destructive' : 'secondary'} className="text-xs px-1.5 py-0">
                    <CalendarDays className="mr-1 h-3 w-3" />
                    {format(new Date(card.dueDate), 'MMM d')}
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}
      </Draggable>

      {isEditor && (
        <CardModal
          open={editOpen}
          onOpenChange={setEditOpen}
          boardId={boardId}
          columnId={card.columnId}
          card={card}
        />
      )}
    </>
  );
});
