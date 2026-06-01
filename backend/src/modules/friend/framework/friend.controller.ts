import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';
import { FriendService } from '../core/app/friend.service.js';
import { SendFriendRequestDto } from '../core/app/send-friend-request.dto.js';
import { RespondFriendRequestDto, FriendResponseAction } from '../core/app/respond-friend-request.dto.js';
import { JwtAuthGuard } from '../../auth/core/app/jwt-auth-guard.js';
import { EventsGateway } from '../../../infrastructure/gateway/events.gateway.js';

@Controller('friends')
@UseGuards(JwtAuthGuard)
@ApiTags('Friends')
export class FriendController {
  constructor(
    private readonly friendService: FriendService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  @Post('request')
  @ApiOperation({ summary: 'Send a friend request' })
  async sendRequest(@Req() req: Request, @Body() dto: SendFriendRequestDto){
    const userId = (req as any).user.sub;
    const request = await this.friendService.sendFriendRequest(userId, dto.receiverId);
    this.eventsGateway.emitToUser(userId, 'friend:request-sent', request);
    this.eventsGateway.emitToUser(dto.receiverId, 'friend:request-received', request);
    return request;
  }

  @Put('request/respond')
  @ApiOperation({ summary: 'Accept, reject, or block a friend request' })
  async respondToRequest(@Req() req: Request, @Body() dto: RespondFriendRequestDto){
    const userId = (req as any).user.sub;
    const result = await this.friendService.respondToRequest(userId, dto.requestId, dto.action);
    this.eventsGateway.emitToUser(userId, 'friend:request-responded', { requestId: dto.requestId, action: dto.action });
    return result;
  }

  @Get('requests/received')
  @ApiOperation({ summary: 'Get received friend requests' })
  async getReceivedRequests(@Req() req: Request){
    const userId = (req as any).user.sub;
    return this.friendService.getReceivedRequests(userId);
  }

  @Get('requests/sent')
  @ApiOperation({ summary: 'Get sent friend requests' })
  async getSentRequests(@Req() req: Request){
    const userId = (req as any).user.sub;
    return this.friendService.getSentRequests(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get my friends list' })
  async getFriends(@Req() req: Request){
    const userId = (req as any).user.sub;
    return this.friendService.getFriends(userId);
  }

  @Delete(':friendId')
  @ApiOperation({ summary: 'Remove a friend' })
  async removeFriend(@Req() req: Request, @Param('friendId') friendId: string){
    const userId = (req as any).user.sub;
    await this.friendService.removeFriend(userId, friendId);
    this.eventsGateway.emitToUser(userId, 'friend:removed', { friendId });
    return { message: 'Friend removed' };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users to add as friends' })
  @ApiQuery({ name: 'q', description: 'Search query (username or email)' })
  async searchUsers(@Req() req: Request, @Query('q') query: string){
    const userId = (req as any).user.sub;
    if(!query || query.length < 2){
      return [];
    }
    return this.friendService.searchUsers(query, userId);
  }
}

