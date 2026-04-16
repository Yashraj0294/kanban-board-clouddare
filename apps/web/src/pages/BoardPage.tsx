import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, KanbanSquare, LogOut } from 'lucide-react';
import type { IBoard } from '@kanban-board/shared-types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { KanbanBoard } from '../components/KanbanBoard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { user, isEditor, logout } = useAuth();
  const navigate = useNavigate();

  const { data: board, isLoading, isError } = useQuery<IBoard>({
    queryKey: ['board', boardId],
    queryFn: () => api.get(`/boards/${boardId}`).then((r) => r.data),
    enabled: !!boardId,
  });

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Board not found.</p>
          <Button onClick={() => navigate('/boards')}>Go back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="border-b bg-white shrink-0">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/boards">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <KanbanSquare className="h-5 w-5 text-primary" />
            {isLoading ? (
              <Skeleton className="h-5 w-40" />
            ) : (
              <h1 className="font-semibold text-foreground">{board?.title}</h1>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <Badge variant={isEditor ? 'default' : 'secondary'}>{user?.role}</Badge>
            <Button variant="ghost" size="icon" onClick={logout} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Board */}
      <div className="flex-1 overflow-hidden">
        {boardId && <KanbanBoard boardId={boardId} />}
      </div>
    </div>
  );
}
