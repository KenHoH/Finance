import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { NotificationService } from '../../../notification/core/app/notification.service.js';

@Injectable()
export class FriendService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async sendFriendRequest(senderId: string, receiverId: string) {
    // Check if trying to add self
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // Check if receiver exists
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });
    if (!receiver) {
      throw new NotFoundException('User not found');
    }

    // Check if already friends
    const existingFriendship = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { user1Id: senderId, user2Id: receiverId },
          { user1Id: receiverId, user2Id: senderId },
        ],
      },
    });
    if (existingFriendship) {
      throw new ConflictException('Already friends with this user');
    }

    // Check if request already exists
    const existingRequest = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
        status: 'PENDING',
      },
    });
    if (existingRequest) {
      throw new ConflictException('Friend request already pending');
    }

    // Check if blocked
    const blockedRequest = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId, status: 'BLOCKED' },
          { senderId: receiverId, status: 'REJECTED' },
        ],
      },
    });
    if (blockedRequest) {
      throw new ConflictException('Cannot send friend request to this user');
    }

    // Fetch sender info for notification
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { username: true },
    });

    // Create friend request
    const request = await this.prisma.friendRequest.create({
      data: {
        senderId,
        receiverId,
        status: 'PENDING',
      },
      include: {
        sender: {
          select: { id: true, username: true, email: true, avatar: true },
        },
        receiver: {
          select: { id: true, username: true, email: true, avatar: true },
        },
      },
    });

    // Notify receiver
    if (sender) {
      await this.notificationService.create(
        receiverId,
        'SYSTEM',
        'New Friend Request',
        `${sender.username} sent you a friend request.`,
      );
    }

    return request;
  }

  async respondToRequest(
    userId: string,
    requestId: string,
    action: 'ACCEPT' | 'REJECT' | 'BLOCK',
  ) {
    const request = await this.prisma.friendRequest.findFirst({
      where: {
        id: requestId,
        receiverId: userId,
        status: 'PENDING',
      },
    });
    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    if (action === 'ACCEPT') {
      // Create friendship in both directions
      await this.prisma.$transaction([
        this.prisma.friend.create({
          data: {
            user1Id: request.senderId,
            user2Id: request.receiverId,
          },
        }),
        this.prisma.friendRequest.update({
          where: { id: requestId },
          data: { status: 'ACCEPTED' },
        }),
      ]);

      // Notify sender that request was accepted
      const accepter = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      });
      if (accepter) {
        await this.notificationService.create(
          request.senderId,
          'SYSTEM',
          'Friend Request Accepted',
          `${accepter.username} accepted your friend request.`,
        );
      }

      return { message: 'Friend request accepted' };
    } else if (action === 'REJECT') {
      await this.prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' },
      });
      return { message: 'Friend request rejected' };
    } else if (action === 'BLOCK') {
      await this.prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'BLOCKED' },
      });
      return { message: 'User blocked' };
    }
  }

  async getReceivedRequests(userId: string) {
    return this.prisma.friendRequest.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING',
      },
      include: {
        sender: {
          select: { id: true, username: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSentRequests(userId: string) {
    return this.prisma.friendRequest.findMany({
      where: {
        senderId: userId,
        status: 'PENDING',
      },
      include: {
        receiver: {
          select: { id: true, username: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSummary(userId: string) {
    const [friendships, sentRequests, receivedRequests] = await Promise.all([
      this.prisma.friend.findMany({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
        include: {
          user1: {
            select: { id: true, username: true, email: true, avatar: true },
          },
          user2: {
            select: { id: true, username: true, email: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.friendRequest.findMany({
        where: {
          senderId: userId,
          status: 'PENDING',
        },
        include: {
          receiver: {
            select: { id: true, username: true, email: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.friendRequest.findMany({
        where: {
          receiverId: userId,
          status: 'PENDING',
        },
        include: {
          sender: {
            select: { id: true, username: true, email: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const friends = friendships.map((friendship) => {
      const friend =
        friendship.user1Id === userId ? friendship.user2 : friendship.user1;
      return {
        friendshipId: friendship.id,
        friend,
        createdAt: friendship.createdAt,
      };
    });

    return { friends, sentRequests, receivedRequests };
  }

  async getFriends(userId: string) {
    const friendships = await this.prisma.friend.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: {
          select: { id: true, username: true, email: true, avatar: true },
        },
        user2: {
          select: { id: true, username: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Return the other user in each friendship
    return friendships.map((friendship) => {
      const friend =
        friendship.user1Id === userId ? friendship.user2 : friendship.user1;
      return {
        friendshipId: friendship.id,
        friend,
        createdAt: friendship.createdAt,
      };
    });
  }

  async removeFriend(userId: string, friendId: string) {
    const friendship = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: friendId },
          { user1Id: friendId, user2Id: userId },
        ],
      },
    });
    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    await this.prisma.friend.delete({
      where: { id: friendship.id },
    });
    return { message: 'Friend removed' };
  }

  async checkAreFriends(userId: string, otherUserId: string): Promise<boolean> {
    const friendship = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: otherUserId },
          { user1Id: otherUserId, user2Id: userId },
        ],
      },
    });
    return !!friendship;
  }

  async searchUsers(query: string, currentUserId: string) {
    // Search users by username or email, excluding current user and already friends
    const friends = await this.getFriends(currentUserId);
    const friendIds = friends.map((f) => f.friend.id);

    return this.prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
          { id: { not: currentUserId } },
          { id: { notIn: friendIds } },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
      },
      take: 10,
    });
  }
}
