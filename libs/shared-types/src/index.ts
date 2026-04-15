export * from './lib/shared-types';

export enum Role {
  VIEWER = 'viewer',
  EDITOR = 'editor',
}

export enum SocketEvent {
  CARD_CREATED = 'card:created',
  CARD_UPDATED = 'card:updated',
  CARD_DELETED = 'card:deleted',
  CARD_MOVED = 'card:moved',
  COLUMN_CREATED = 'column:created',
  COLUMN_DELETED = 'column:deleted',
}

export interface IUser {
  _id: string;
  email: string;
  role: Role;
}

export interface ICard {
  _id: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  columnId: string;
  boardId: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface IColumn {
  _id: string;
  title: string;
  boardId: string;
  position: number;
}

export interface IBoard {
  _id: string;
  title: string;
  columns: IColumn[];
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface MoveCardPayload {
  cardId: string;
  sourceColumnId: string;
  destinationColumnId: string;
  newPosition: number;
}
