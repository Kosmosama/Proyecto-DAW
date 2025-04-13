import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { FindOptionsWhere, Repository } from 'typeorm';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { Friendship } from './entities/friendship.entity';
import { Player } from './entities/player.entity';
import { Friend } from './interfaces/friend.interface';
import { PlayerPublic } from './interfaces/player-public.interface';
import { FriendshipStatus } from './enums/friendship-status.enum';

@Injectable()
export class PlayerService {
    constructor(
        @InjectRepository(Friendship)
        private readonly friendshipRepository: Repository<Friendship>,
        @InjectRepository(Player)
        private readonly playerRepository: Repository<Player>,
    ) { }

    /**
     * Register a new player.
     * @param {RegisterDto} dto Registration data (username, email, password, optional photo).
     * @returns {Promise<Player>} Created player entity.
     */
    async createUser(dto: RegisterDto): Promise<Player> {
        const player = this.playerRepository.create(dto);
        return await this.playerRepository.save(player); // triggers hashing
    }

    /**
     * Retrieve all players with optional pagination and search.
     * @param {number} page Page number for pagination (default: 1).
     * @param {number} limit Number of players per page (default: 10).
     * @param {string?} search Optional search term for filtering by username.
     * @returns {Promise<PlayerPublic[]>} List of players with public info.
     */
    async findAll(page = 1, limit = 10, search?: string): Promise<PlayerPublic[]> {
        const query = this.playerRepository.createQueryBuilder('player')
            .select(['player.id', 'player.username'])
            .skip((page - 1) * limit)
            .take(limit);
    
        if (search) {
            query.where('LOWER(player.username) LIKE :search', { search: `%${search.toLowerCase()}%` });
        }
    
        return await query.getMany();
    }

    /**
     * Retrieve a single player by id.
     * @param {number} id Player id to search for.
     * @returns {Promise<PlayerPublic>} Player details.
     * @throws {NotFoundException} if player doesn't exist.
     */
    async findOne(id: number): Promise<PlayerPublic> {
        return await this.findOneBy({ id }, true, ['id', 'username', 'role']);
    }

    /**
     * Update player details.
     * @param {number} id Player id to update.
     * @param {UpdatePlayerDto} updatePlayerDto Data to update player.
     * @returns {Promise<PlayerPublic>} Updated player data.
     * @throws {NotFoundException} if player doesn't exist.
     */
    async update(id: number, updatePlayerDto: UpdatePlayerDto): Promise<PlayerPublic> {
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
     * Find a single player by given conditions.
     * @param {FindOptionsWhere<Player>} where Conditions to match.
     * @param {boolean} throwIfNotFound Whether to throw if not found (default: true).
     * @param {Array<keyof Player>} select Optional list of fields to select.
     * @returns {Promise<Player>} Player entity or throws NotFoundException.
     */
    async findOneBy(where: FindOptionsWhere<Player>, throwIfNotFound = true, select?: Array<keyof Player>): Promise<Player> {
        const player = await this.playerRepository.findOne({
            where,
            select,
        });
    
        if (!player && throwIfNotFound) {
            throw new NotFoundException('Player not found.');
        }

        return player!;
    }

    /**
     * Update and hash a player's refresh token.
     * @param {number} playerId Player ID.
     * @param {string | null} refreshToken Raw refresh token to be hashed.
     * @returns {Promise<string>} Hashed refresh token.
     * @throws {NotFoundException} If player is not found.
     */
    async updateRefreshToken(playerId: number, refreshToken: string | null): Promise<string | null> {
        const player = await this.findOneBy({ id: playerId });
    
        player.refreshToken = refreshToken;
        await this.playerRepository.save(player); // triggers hashSensitiveData
    
        return player.refreshToken ?? null;
    }

    /**
     * Get hashed refresh token for a player.
     * @param {number} playerId Player ID.
     * @returns {Promise<string | null>} Hashed token or null if not found.
     */
    async getRefreshTokenHash(playerId: number): Promise<string | null> {
        const player = await this.findOneBy({ id: playerId }, false, ['refreshToken']);
        return player?.refreshToken ?? null;
    }

    /**
     * Validate a refresh token by comparing with the stored hash.
     * @param {number} playerId Player ID.
     * @param {string} refreshToken Unhashed token to validate.
     * @returns {Promise<boolean>} True if token is valid.
     */
    async validateRefreshToken(playerId: number, refreshToken: string): Promise<boolean> {
        const hashed = await this.getRefreshTokenHash(playerId);
        if (!hashed) return false;
        return await bcrypt.compare(refreshToken, hashed);
    }

    /**
     * Check if a user exists by partial conditions.
     * @param {FindOptionsWhere<Player>} conditions Partial Player fields to match.
     * @returns {Promise<boolean>} True if a matching user is found.
     */
    async userExistsBy(conditions: FindOptionsWhere<Player>): Promise<boolean> {
        return !!(await this.findOneBy(conditions, false));
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
            { status: FriendshipStatus.ACCEPTED },
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
     * Get the list of friends for a given player.
     * @param {number} playerId Player id to fetch friends for.
     * @param {number} page Page number for pagination (default: 1).
     * @param {number} limit Number of friends per page (default: 10).
     * @returns {Promise<Friend[]>} List of friends.
     */
    async getFriends(playerId: number, page = 1, limit = 10): Promise<Friend[]> {
        const friendships = await this.getFriendshipsByStatus(playerId, FriendshipStatus.ACCEPTED, page, limit);
    
        return friendships.map(({ sender, receiver, updatedAt }) => {
            const friend = sender.id === playerId ? receiver : sender;
            return {
                id: friend.id,
                username: friend.username,
                photo: friend.photo,
                since: updatedAt,
                lastLogin: friend.lastLogin,
            };
        });
    }
    
    /**
     * Get the list of incoming friend requests for a given player.
     * @param {number} playerId Player id to fetch incoming requests for.
     * @param {number} page Page number for pagination (default: 1).
     * @param {number} limit Number of requests per page (default: 10).
     * @returns {Promise<Friend[]>} List of incoming friendships.
     */
    async getIncomingFriendRequests(playerId: number, page = 1, limit = 10): Promise<Friend[]> {
        const friendships = await this.getFriendshipsByStatus(playerId, FriendshipStatus.PENDING, page, limit);
    
        return friendships
            .filter(f => f.receiverId === playerId)
            .map(({ sender, updatedAt }) => ({
                id: sender.id,
                username: sender.username,
                photo: sender.photo,
                since: updatedAt,
            }));
    }

    /**
     * Get the list of outgoing friend requests for a given player.
     * @param {number} playerId Player id to fetch outgoing requests for.
     * @param {number} page Page number for pagination (default: 1).
     * @param {number} limit Number of requests per page (default: 10).
     * @returns {Promise<Friend[]>} List of outgoing friendships.
     */
    async getPendingOutgoing(playerId: number, page = 1, limit = 10): Promise<Friend[]> {
        const friendships = await this.getFriendshipsByStatus(playerId, FriendshipStatus.PENDING, page, limit);
    
        return friendships
            .filter(f => f.senderId === playerId)
            .map(({ receiver, updatedAt }) => ({
                id: receiver.id,
                username: receiver.username,
                photo: receiver.photo,
                since: updatedAt,
            }));
    }

    /**
     * Get the list of outgoing friend requests for a given player.
     * @param {number} playerId Player id to fetch outgoing requests for.
     * @param {number} page Page number for pagination (default: 1).
     * @param {number} limit Number of requests per page (default: 10).
     * @returns {Promise<Friend[]>} List of outgoing friendships.
     */
    private async getOutgoingPendingFriendRequests(playerId: number, page = 1, limit = 10): Promise<Friendship[]> {
        const query = this.friendshipRepository
            .createQueryBuilder('f')
            .innerJoinAndSelect('f.sender', 'sender')
            .innerJoinAndSelect('f.receiver', 'receiver')
            .where('f.status = :status', { status: FriendshipStatus.PENDING })
            .andWhere('f.senderId = :playerId', { playerId })
            .skip((page - 1) * limit)
            .take(limit);
    
        const friendships = await query.getMany();
    
        if (!friendships.length) throw new NotFoundException('No outgoing pending friend requests found.');
    
        return friendships;
    }
    
    /**
     * Get the list of outgoing friend requests for a given player.
     * @param {number} playerId Player id to fetch outgoing requests for.
     * @param {number} page Page number for pagination (default: 1).
     * @param {number} limit Number of requests per page (default: 10).
     * @returns {Promise<Friend[]>} List of outgoing friendships.
     */
    private async getFriendshipsByStatus(playerId: number, status: FriendshipStatus, page = 1, limit = 10): Promise<Friendship[]> {
        const query = this.friendshipRepository
            .createQueryBuilder('f')
            .innerJoinAndSelect('f.sender', 'sender')
            .innerJoinAndSelect('f.receiver', 'receiver')
            .where('f.status = :status', { status })
            .andWhere('(f.senderId = :playerId OR f.receiverId = :playerId)', { playerId })
            .skip((page - 1) * limit)
            .take(limit);
    
        const friendships = await query.getMany();
    
        if (!friendships.length) throw new NotFoundException(`No ${status} friendships found.`);
    
        return friendships;
    }
}
