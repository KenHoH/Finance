import { IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum FriendResponseAction {
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
  BLOCK = 'BLOCK',
}

export class RespondFriendRequestDto {
  @ApiProperty({ description: 'Friend request ID', example: 'request-uuid-here' })
  @IsString()
  @IsNotEmpty()
  requestId: string;

  @ApiProperty({ description: 'Response action', enum: FriendResponseAction, example: 'ACCEPT' })
  @IsEnum(FriendResponseAction)
  action: FriendResponseAction;
}
