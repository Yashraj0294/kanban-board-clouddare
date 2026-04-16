import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, KanbanSquare, LogOut, LayoutDashboard } from 'lucide-react';
import type { IBoard } from '@kanban-board/shared-types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';

export default function BoardsPage() {
  const { user, isEditor, logout } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');

  const { data: boards, isLoading } = useQuery<IBoard[]>({
    queryKey: ['boards'],
    queryFn: () => api.get('/boards').then((r) => r.data),
  });

  const { mutate: createBoard, isPending: creating } = useMutation({
    mutationFn: (title: string) => api.post('/boards', { title }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      setCreateOpen(false);
      setNewBoardTitle('');
      navigate(`/boards/${res.data._id}`);
    },
  });

  const { mutate: deleteBoard } = useMutation({
    mutationFn: (id: string) => api.delete(`/boards/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards'] }),
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBoardTitle.trim()) createBoard(newBoardTitle.trim());
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KanbanSquare className="h-6 w-6 text-primary" />
            <span className="font-semibold text-foreground">Kanban Board</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Badge variant={isEditor ? 'default' : 'secondary'}>{user?.role}</Badge>
            <Button variant="ghost" size="icon" onClick={logout} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Your Boards</h2>
          </div>
          {isEditor && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Board
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : boards?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <KanbanSquare className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">No boards yet.</p>
            {isEditor && (
              <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first board
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards?.map((board) => (
              <div key={board._id} className="group relative">
                <Link to={`/boards/${board._id}`}>
                  <Card className="h-32 cursor-pointer transition-shadow hover:shadow-md hover:border-primary/40">
                    <CardHeader className="h-full flex flex-col justify-between">
                      <CardTitle className="text-base">{board.title}</CardTitle>
                      <CardDescription>Click to open board</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
                {isEditor && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (confirm(`Delete "${board.title}"?`)) deleteBoard(board._id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Board Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Board</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <Input
              autoFocus
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              placeholder="Board name"
              maxLength={100}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newBoardTitle.trim() || creating}>
                {creating ? 'Creating…' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
