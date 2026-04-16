import React, { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ICard, IColumn } from '@kanban-board/shared-types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { KanbanCard } from './KanbanCard';
import { CardModal } from './CardModal';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';

interface KanbanColumnProps {
  column: IColumn;
  cards: ICard[];
  boardId: string;
}

export function KanbanColumn({ column, cards, boardId }: KanbanColumnProps) {
  const { isEditor } = useAuth();
  const queryClient = useQueryClient();
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(column.title);

  const { mutate: deleteColumn } = useMutation({
    mutationFn: () => api.delete(`/columns/${column._id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns', boardId] });
      queryClient.invalidateQueries({ queryKey: ['cards', boardId] });
    },
  });

  const { mutate: renameColumn } = useMutation({
    mutationFn: (title: string) => api.put(`/columns/${column._id}`, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns', boardId] });
      setRenaming(false);
    },
  });

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim() && newTitle !== column.title) {
      renameColumn(newTitle.trim());
    } else {
      setRenaming(false);
    }
  };

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-muted/50 border">
      {/* Column Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        {renaming ? (
          <form onSubmit={handleRenameSubmit} className="flex-1 mr-2">
            <Input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={handleRenameSubmit}
              className="h-7 text-sm font-semibold"
            />
          </form>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{column.title}</h3>
            <span className="text-xs text-muted-foreground bg-background rounded-full px-1.5 py-0.5 border">
              {cards.length}
            </span>
          </div>
        )}
        {isEditor && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setNewTitle(column.title);
                  setRenaming(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => deleteColumn()}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete column
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Cards */}
      <Droppable droppableId={column._id} type="CARD">
        {(provided, snapshot) => (
          <ScrollArea
            className={[
              'flex-1 px-2 transition-colors min-h-[2rem]',
              snapshot.isDraggingOver ? 'bg-primary/5' : '',
            ].join(' ')}
          >
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex flex-col gap-2 py-1"
            >
              {cards.map((card, i) => (
                <KanbanCard key={card._id} card={card} index={i} boardId={boardId} />
              ))}
              {provided.placeholder}
            </div>
          </ScrollArea>
        )}
      </Droppable>

      {/* Add card */}
      {isEditor && (
        <div className="px-2 pb-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={() => setAddCardOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add card
          </Button>
        </div>
      )}

      <CardModal
        open={addCardOpen}
        onOpenChange={setAddCardOpen}
        boardId={boardId}
        columnId={column._id}
      />
    </div>
  );
}
