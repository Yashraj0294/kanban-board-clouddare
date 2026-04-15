import { Role, SocketEvent } from './shared-types';
import type { ICard, IColumn, IBoard, IUser, JwtPayload, MoveCardPayload } from './shared-types';

describe('Role enum', () => {
  it('has the correct string values', () => {
    expect(Role.VIEWER).toBe('viewer');
    expect(Role.EDITOR).toBe('editor');
  });

  it('has exactly two members', () => {
    const members = Object.values(Role);
    expect(members).toHaveLength(2);
  });
});

describe('SocketEvent enum', () => {
  it('has correct card event values', () => {
    expect(SocketEvent.CARD_CREATED).toBe('card:created');
    expect(SocketEvent.CARD_UPDATED).toBe('card:updated');
    expect(SocketEvent.CARD_DELETED).toBe('card:deleted');
    expect(SocketEvent.CARD_MOVED).toBe('card:moved');
  });

  it('has correct column event values', () => {
    expect(SocketEvent.COLUMN_CREATED).toBe('column:created');
    expect(SocketEvent.COLUMN_DELETED).toBe('column:deleted');
  });

  it('has exactly six events', () => {
    expect(Object.values(SocketEvent)).toHaveLength(6);
  });
});

describe('ICard type shape', () => {
  it('accepts a valid card object', () => {
    const card: ICard = {
      _id: '507f1f77bcf86cd799439011',
      title: 'Write unit tests',
      columnId: '507f1f77bcf86cd799439012',
      boardId: '507f1f77bcf86cd799439013',
      position: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(card.title).toBe('Write unit tests');
    expect(card.position).toBe(0);
  });

  it('accepts optional fields', () => {
    const card: ICard = {
      _id: '1',
      title: 'Task',
      columnId: '2',
      boardId: '3',
      position: 1,
      createdAt: '',
      updatedAt: '',
      description: 'Some description',
      assignee: 'yashraj@example.com',
      dueDate: '2026-04-20T00:00:00.000Z',
    };
    expect(card.description).toBe('Some description');
    expect(card.assignee).toBe('yashraj@example.com');
  });
});

describe('MoveCardPayload type shape', () => {
  it('accepts a valid move payload', () => {
    const payload: MoveCardPayload = {
      cardId: 'card-1',
      sourceColumnId: 'col-todo',
      destinationColumnId: 'col-inprogress',
      newPosition: 2,
    };
    expect(payload.sourceColumnId).toBe('col-todo');
    expect(payload.destinationColumnId).toBe('col-inprogress');
    expect(payload.newPosition).toBe(2);
  });
});

describe('IUser type shape', () => {
  it('uses Role enum for the role field', () => {
    const user: IUser = {
      _id: 'u1',
      email: 'editor@example.com',
      role: Role.EDITOR,
    };
    expect(user.role).toBe(Role.EDITOR);
  });
});

describe('JwtPayload type shape', () => {
  it('contains sub, email, and role', () => {
    const payload: JwtPayload = {
      sub: 'user-id-123',
      email: 'viewer@example.com',
      role: Role.VIEWER,
    };
    expect(payload.sub).toBe('user-id-123');
    expect(payload.role).toBe(Role.VIEWER);
  });
});

