export type TeamType = 'pool' | 'a' | 'b';

export interface Player {
  id: string;
  name: string;
  team: TeamType;
  assignOrder?: number;
}
