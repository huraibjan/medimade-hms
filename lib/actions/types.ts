export type ActionState = {
  ok: boolean;
  message: string;
};

export type ActionStateWithId<Key extends string> = ActionState & {
  [K in Key]?: string;
};
