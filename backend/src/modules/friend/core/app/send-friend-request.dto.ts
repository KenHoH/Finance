import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendFriendRequestDto {
  @ApiProperty({ description: 'User ID to send friend request to', example: 'user email' })
  @IsString()
  @IsNotEmpty()
  receiverId: string;
}
