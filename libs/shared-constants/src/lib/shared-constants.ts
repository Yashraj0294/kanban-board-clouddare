export const DEFAULT_COLUMNS = ['To Do', 'In Progress', 'Done'] as const;

export const ROLES = {
  VIEWER: 'viewer',
  EDITOR: 'editor',
} as const;

export const SOCKET_NAMESPACE = '/board';

export const MAX_CARD_TITLE_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 1000;
