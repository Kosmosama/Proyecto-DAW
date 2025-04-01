import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { Friendship, FriendshipStatus } from './entities/friendship.entity';
import { Player } from './entities/player.entity';
import { FriendResponse } from './interfaces/friend-response.interface';
import { PlayerResponse } from './interfaces/player-response.interface';

@Injectable()
export class PlayerService {
    constructor(
        @InjectRepository(Friendship)
        private readonly friendshipRepository: Repository<Friendship>,
        @InjectRepository(Player)
        private readonly playerRepository: Repository<Player>,
    ) { }

    /**
     * Retrieve all players' basic information.
     * @returns {Promise<PlayerResponse[]>} List of players with their ids and usernames.
     */
    async findAll(): Promise<PlayerResponse[]> {
        return await this.playerRepository.find({
            select: ['id', 'username'],
        });
    }

    /**
     * Retrieve a single player by id.
     * @param {number} id Player id to search for.
     * @returns {Promise<PlayerResponse>} Player details.
     * @throws {NotFoundException} if player doesn't exist.
     */
    async findOne(id: number): Promise<PlayerResponse> {
        const player = await this.playerRepository.findOne({
            where: { id },
            select: ['id', 'username'],
        });
        if (!player) throw new NotFoundException("Player not found.");
        return player;
    }

    /**
     * Update player details.
     * @param {number} id Player id to update.
     * @param {UpdatePlayerDto} updatePlayerDto Data to update player.
     * @returns {Promise<PlayerResponse>} Updated player data.
     * @throws {NotFoundException} if player doesn't exist.
     */
    async update(id: number, updatePlayerDto: UpdatePlayerDto): Promise<PlayerResponse> {
        const result = await this.playerRepository.update(id, updatePlayerDto);
        if (result.affected === 0) throw new NotFoundException("Player not found.");
        return this.findOne(id);
    }

    /**
     * Delete a player by id.
     * @param {number} id Player id to delete.
     * @returns {Promise<void>} Promise that resolves when the player is deleted.
     * @throws {NotFoundException} if player doesn't exist.
     */
    async remove(id: number): Promise<void> {
        const deleteResult = await this.playerRepository.delete(id);
        if (deleteResult.affected === 0) throw new NotFoundException("Player not found.");
    }

    /**
     * Find friendship between two players.
     * @param {number} playerId Sender player id.
     * @param {number} friendId Receiver player id.
     * @returns {Promise<Friendship | null>} Object if it exists.
     */
    private async findFriendship(playerId: number, friendId: number): Promise<Friendship | null> {
        return await this.friendshipRepository.findOne({
            where: [
                { senderId: playerId, receiverId: friendId },
                { senderId: friendId, receiverId: playerId }
            ],
        });
    }

    /**
     * Send a friend request from one player to another.
     * @param {number} senderId Sender player id.
     * @param {number} receiverId Receiver player id.
     * @returns {Promise<void>} Promise that resolves when the request is sent.
     * @throws {ConflictException} if a friend request already exists.
     */
    async sendFriendRequest(senderId: number, receiverId: number): Promise<void> {
        const existingFriendship = await this.findFriendship(senderId, receiverId);
        if (existingFriendship) throw new ConflictException(`Friend request already exists with status: ${existingFriendship.status}`);

        const friendship = this.friendshipRepository.create({
            senderId,
            receiverId,
            status: FriendshipStatus.PENDING,
        });

        await this.friendshipRepository.save(friendship);
    }

    /**
     * Accept a pending friend request.
     * @param {number} senderId Sender player id.
     * @param {number} receiverId Receiver player id.
     * @returns {Promise<void>} Promise that resolves when the request is accepted.
     * @throws {NotFoundException} if the friendship isn't found.
     */
    async acceptFriendRequest(senderId: number, receiverId: number): Promise<void> {
        const result = await this.friendshipRepository.update(
            { senderId, receiverId },
            { status: FriendshipStatus.ACCEPTED }
        );

        if (result.affected === 0) throw new NotFoundException('Friend request not found.');
    }

    /**
     * Decline (remove) a pending friend request.
     * @param {number} senderId Sender player id.
     * @param {number} receiverId Receiver player id.
     * @returns {Promise<void>} Promise that resolves when the request is declined.
     * @throws {NotFoundException} if the friendship isn't found.
     */
    async declineFriendRequest(senderId: number, receiverId: number): Promise<void> {
        const friendship = await this.findFriendship(senderId, receiverId);
        if (!friendship) throw new NotFoundException('Friend request not found.');

        await this.friendshipRepository.delete({ senderId: friendship.senderId, receiverId: friendship.receiverId });
    }

    /**
     * Get the list of accepted friends for a given player.
     * @param {number} playerId Player id to fetch friends for.
     * @returns {Promise<FriendResponse[]>} List of friends with their details.
     */
    async getFriends(playerId: number): Promise<FriendResponse[]> {
        // SELECT friendship."createdAt",
        //     sender.id AS "sender_id", sender.username AS "sender_username", sender.photo AS "sender_photo", 
        //     sender.online AS "sender_online", sender."lastLogin" AS "sender_lastLogin",
        //     receiver.id AS "receiver_id", receiver.username AS "receiver_username", receiver.photo AS "receiver_photo", 
        //     receiver.online AS "receiver_online", receiver."lastLogin" AS "receiver_lastLogin"
        // FROM "friendship"
        // LEFT JOIN "player" AS sender ON sender.id = friendship."senderId"
        // LEFT JOIN "player" AS receiver ON receiver.id = friendship."receiverId"
        // WHERE (friendship."senderId" = :playerId OR friendship."receiverId" = :playerId)
        //     AND friendship.status = :status;

        const friendships = await this.friendshipRepository.createQueryBuilder('friendship')
            .leftJoin('friendship.sender', 'sender')
            .leftJoin('friendship.receiver', 'receiver')
            .select([
                'friendship.createdAt',
                'sender.id', 'sender.username', 'sender.photo', 'sender.online', 'sender.lastLogin',
                'receiver.id', 'receiver.username', 'receiver.photo', 'receiver.online', 'receiver.lastLogin',
            ])
            .where(
                '(friendship.senderId = :playerId OR friendship.receiverId = :playerId) AND friendship.status = :status',
                { playerId, status: FriendshipStatus.ACCEPTED }
            )
            .getMany();
    
        return friendships.map(({ sender, receiver, createdAt }) => {
            const friend = sender.id === playerId ? receiver : sender;
            return {
                id: friend.id,
                username: friend.username,
                photo: friend.photo,
                online: friend.online,
                lastLogin: friend.lastLogin,
                friendsSince: createdAt,
            };
        });
    }
}
