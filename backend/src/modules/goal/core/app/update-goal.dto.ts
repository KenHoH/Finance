export class UpdateGoalDto {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  deadline?: string;
  status?: 'IN_PROGRESS' | 'ACHIEVED' | 'CANCELLED';
}