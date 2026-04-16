import React, { useEffect, useState } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import type { ICard, IColumn } from '@kanban-board/shared-types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { KanbanColumn } from './KanbanColumn';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Skeleton } from './ui/skeleton';

interface ColumnWithCards extends IColumn {
  cards: ICard[];
}

interface KanbanBoardProps {
  boardId: string;
}

export function KanbanBoard({ boardId }: KanbanBoardProps) {
  const { isEditor } = useAuth();
  const queryClient = useQueryClient();
  const [columnsWithCards, setColumnsWithCards] = useState<ColumnWithCards[]>([]);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');

  const { data: columns, isLoading: colLoading } = useQuery<IColumn[]>({
    queryKey: ['columns', boardId],
    queryFn: () => api.get(`/boards/${boardId}/columns`).then((r) => r.data),
  });

  const { data: cards, isLoading: cardLoading } = useQuery<ICard[]>({
    queryKey: ['cards', boardId],
    queryFn: () => api.get(`/boards/${boardId}/cards`).then((r) => r.data),
  });

  // Build columnsWithCards from server data
  useEffect(() => {
    if (!columns || !cards) return;
    const sorted = [...columns].sort((a, b) => a.position - b.position);
    setColumnsWithCards(
      sorted.map((col) => ({
        ...col,
        cards: cards
          .filter((c) => c.columnId === col._id)
          .sort((a, b) => a.position - b.position),
      })),
    );
  }, [columns, cards]);

  const { mutate: moveCard } = useMutation({
    mutationFn: ({
      cardId,
      destinationColumnId,
      newPosition,
    }: {
      cardId: string;
      destinationColumnId: string;
      newPosition: number;
    }) => api.patch(`/cards/${cardId}/move`, { destinationColumnId, newPosition }),
    onError: () => {
      // Revert optimistic update
      queryClient.invalidateQueries({ queryKey: ['cards', boardId] });
    },
  });

  const { mutate: createColumn } = useMutation({
    mutationFn: (title: string) => api.post(`/boards/${boardId}/columns`, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns', boardId] });
      setNewColTitle('');
      setAddingColumn(false);
    },
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Optimistic update
    const next = columnsWithCards.map((col) => ({ ...col, cards: [...col.cards] }));
    const srcCol = next.find((c) => c._id === source.droppableId);
    const dstCol = next.find((c) => c._id === destination.droppableId);
    if (!srcCol || !dstCol) return;

    const [moved] = srcCol.cards.splice(source.index, 1);
    dstCol.cards.splice(destination.index, 0, { ...moved, columnId: destination.droppableId });
    setColumnsWithCards(next);

    moveCard({
      cardId: draggableId,
      destinationColumnId: destination.droppableId,
      newPosition: destination.index,
    });
  };

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (newColTitle.trim()) createColumn(newColTitle.trim());
  };

  const isLoading = colLoading || cardLoading;

  if (isLoading) {
    return (
      <div className="flex gap-4 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-72 shrink-0 space-y-3">
            <Skeleton className="h-8 w-40" />
            {[1, 2].map((j) => (
              <Skeleton key={j} className="h-20 w-full" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 p-6 overflow-x-auto min-h-[calc(100vh-8rem)]">
        {columnsWithCards.map((col) => (
          <KanbanColumn key={col._id} column={col} cards={col.cards} boardId={boardId} />
        ))}

        {isEditor && (
          <div className="w-72 shrink-0">
            {addingColumn ? (
              <form onSubmit={handleAddColumn} className="rounded-xl border bg-muted/50 p-3 space-y-2">
                <Input
                  autoFocus
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  placeholder="Column name"
                  className="h-8"
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={!newColTitle.trim()}>
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAddingColumn(false);
                      setNewColTitle('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start text-muted-foreground border-dashed"
                onClick={() => setAddingColumn(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add column
              </Button>
            )}
          </div>
        )}
      </div>
    </DragDropContext>
  );
}
