import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ICard } from '@kanban-board/shared-types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface CardForm {
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
}

interface CardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  columnId: string;
  card?: ICard;
}

export function CardModal({ open, onOpenChange, boardId, columnId, card }: CardModalProps) {
  const queryClient = useQueryClient();
  const isEdit = !!card;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CardForm>({
    defaultValues: {
      title: card?.title ?? '',
      description: card?.description ?? '',
      assignee: card?.assignee ?? '',
      dueDate: card?.dueDate ? card.dueDate.substring(0, 10) : '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: card?.title ?? '',
        description: card?.description ?? '',
        assignee: card?.assignee ?? '',
        dueDate: card?.dueDate ? card.dueDate.substring(0, 10) : '',
      });
    }
  }, [open, card, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CardForm) => {
      const payload = {
        ...data,
        description: data.description || undefined,
        assignee: data.assignee || undefined,
        dueDate: data.dueDate || undefined,
      };
      if (isEdit) {
        return api.put(`/cards/${card._id}`, payload);
      }
      return api.post('/cards', { ...payload, columnId, boardId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', boardId] });
      onOpenChange(false);
    },
  });

  const onSubmit = handleSubmit((data) => mutate(data));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Card' : 'Add Card'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register('title', { required: 'Title is required', maxLength: 100 })}
              placeholder="Card title"
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description', { maxLength: 1000 })}
              placeholder="Optional description"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="assignee">Assignee</Label>
              <Input id="assignee" {...register('assignee')} placeholder="Name" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" {...register('dueDate')} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Card'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
