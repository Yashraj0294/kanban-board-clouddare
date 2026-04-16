import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { KanbanSquare } from 'lucide-react';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, role);
      }
      navigate('/boards');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Something went wrong';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <KanbanSquare className="h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold">Kanban Board</h1>
          <p className="text-muted-foreground text-sm">Organise your work visually</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex rounded-lg bg-muted p-1 gap-1">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className={[
                  'flex-1 rounded-md py-1.5 text-sm font-medium transition-colors',
                  mode === 'login' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                className={[
                  'flex-1 rounded-md py-1.5 text-sm font-medium transition-colors',
                  mode === 'register' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                Register
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              {mode === 'register' && (
                <div className="space-y-1">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'viewer' | 'editor')}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="viewer">Viewer — can view boards</option>
                    <option value="editor">Editor — can create &amp; edit</option>
                  </select>
                </div>
              )}
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
