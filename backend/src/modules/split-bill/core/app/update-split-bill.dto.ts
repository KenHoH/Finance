export class UpdateSplitBillDto {
  description?: string;
  status?: 'PENDING' | 'PARTIALLY_PAID' | 'SETTLED';
}

export class UpdateParticipantDto {
  isPaid?: boolean;
}