export class CreateParticipantDto {
  userId?: string;
  name?: string;
  amountOwed: number;
}

export class CreateSplitBillDto {
  totalAmount: number;
  description: string;
  date: string;
  participants: CreateParticipantDto[];
}