import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { FindOptionsWhere, Repository } from 'typeorm';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { Friendship } from './entities/friendship.entity';
import { Player } from './entities/player.entity';
import { FriendshipStatus } from './enums/friendship-status.enum';
import { FriendRequest } from './interfaces/friend-request.interface';
import { Friend } from './interfaces/friend.interface';
import { PlayerPublic } from './interfaces/player-public.interface';
import { PlayerPrivate } from './interfaces/player-private.interface';
import { PaginatedResult } from './interfaces/paginated-result.interface';

@Injectable()
export class PlayerService {
    constructor(
        @InjectRepository(Player)
        private readonly playerRepository: Repository<Player>,
        @InjectRepository(Friendship)
        private readonly friendshipRepository: Repository<Friendship>
    ) { }

    /**
     * Creates a new player and generates a unique tag.
     * @param {RegisterDto} registerDto The data transfer object containing username and password.
     * @returns {Promise<Player>} The created player entity with a unique tag.
     */
    async createUser(registerDto: RegisterDto): Promise<Player> {
        const player = this.playerRepository.create(registerDto);
        player.tag = await this.generateUniqueTag(registerDto.username);
        return await this.playerRepository.save(player);
    }

    /**
     * Retrieves a paginated list of players, excluding friends and the player themselves.
     * @param {number} playerId The ID of the player making the request.
     * @param {number} page The page number for pagination.
     * @param {number} limit The number of items per page.
     * @param {string} [search] Optional search term to filter players by username.
     * @returns {Promise<PaginatedResult<PlayerPublic>>} A paginated result containing public player information.
     */
    // #TODO Maybe reuse another function to avoid code duplication
    async findAll(
        playerId: number,
        page = 1,
        limit = 10,
        search?: string,
    ): Promise<PaginatedResult<PlayerPublic>> {
        const friendships = await this.friendshipRepository.find({
            where: [
                { senderId: playerId, status: FriendshipStatus.ACCEPTED },
                { receiverId: playerId, status: FriendshipStatus.ACCEPTED },

                { senderId: playerId, status: FriendshipStatus.PENDING },
                { receiverId: playerId, status: FriendshipStatus.PENDING }
            ]
        });

        const excludeIds = friendships.map(f => f.senderId === playerId ? f.receiverId : f.senderId);
        excludeIds.push(playerId);

        const query = this.playerRepository.createQueryBuilder('player')
            .select(['player.id', 'player.username', 'player.tag', 'player.photo'])
            .skip((page - 1) * limit)
            .take(limit + 1);

        if (search) {
            query.where('LOWER(player.username) LIKE :search', {
                search: `%${search.toLowerCase()}%`,
            });
        }

        if (excludeIds.length > 0) {
            const method = query.expressionMap.wheres.length > 0 ? 'andWhere' : 'where';
            query[method]('player.id NOT IN (:...excludeIds)', { excludeIds });
        }

        const results = await query.getMany();
        const more = results.length > limit;
        const players = more ? results.slice(0, limit) : results;

        return { data: players, more };
    }


    /**
     * Retrieves public data for a single player by ID.
     * @param {number} id The player's ID.
     * @returns {Promise<PlayerPublic>} The player's public information.
     * @throws {NotFoundException} If the player is not found.
     */
    async findOnePublic(id: number): Promise<PlayerPublic> {
        return await this.findOneBy({ id }, true, ['id', 'username', 'tag', 'photo']);
    }

    /**
     * Retrieves private data for a single player by ID.
     * @param {number} id The player's ID.
     * @returns {Promise<PlayerPrivate>} The player's private information.
     * @throws {NotFoundException} If the player is not found.
     */
    async findOnePrivate(id: number): Promise<PlayerPrivate> {
        return await this.findOneBy({ id }, true, ['id', 'username', 'tag', 'email', 'photo', 'role']);
    }

    /**
     * Updates a player's data.
     * @param {number} id The player's ID.
     * @param {UpdatePlayerDto} dto The data transfer object with updated fields.
     * @returns {Promise<PlayerPublic>} The updated player's public information.
     * @throws {NotFoundException} If the player is not found.
     */
    async update(id: number, dto: UpdatePlayerDto): Promise<PlayerPublic> {
        const result = await this.playerRepository.update(id, dto);
        if (!result.affected) throw new NotFoundException('Player not found.');
        return this.findOnePublic(id);
    }

    /**
     * Deletes a player by ID.
     * @param {number} id The player's ID.
     * @returns {Promise<void>} A void promise.
     * @throws {NotFoundException} If the player is not found.
     */
    async remove(id: number): Promise<void> {
        const result = await this.playerRepository.delete(id);
        if (!result.affected) throw new NotFoundException('Player not found.');
    }

    /**
     * Updates a player's refresh token.
     * @param {number} playerId The player's ID.
     * @param {string | null} refreshToken The new refresh token or null to clear.
     * @returns {Promise<string | null>} The updated refresh token.
     */
    async updateRefreshToken(playerId: number, refreshToken: string | null): Promise<string | null> {
        const player = await this.findOneBy({ id: playerId });
        player.refreshToken = refreshToken;
        await this.playerRepository.save(player);
        return player.refreshToken;
    }

    /**
     * Updates a player's last login time to the moment this function is called.
     * @param playerId The player's ID.
     * @returns {Promise<void>} A void promise.
     */
    async updateLastLogin(playerId: number): Promise<void> {
        const player = await this.findOneBy({ id: playerId });
        player.lastLogin = new Date();
        await this.playerRepository.save(player);
    }

    /**
     * Retrieves a player's stored refresh token hash.
     * @param {number} playerId The player's ID.
     * @returns {Promise<string | null>} The hashed refresh token or null.
     */
    async getRefreshTokenHash(playerId: number): Promise<string | null> {
        const player = await this.findOneBy({ id: playerId }, false, ['refreshToken']);
        return player?.refreshToken ?? null;
    }

    /**
     * Compares a given refresh token with the stored hash.
     * @param {number} playerId The player's ID.
     * @param {string} token The refresh token to validate.
     * @returns {Promise<boolean>} True if valid, false otherwise.
     */
    async validateRefreshToken(playerId: number, token: string): Promise<boolean> {
        const hash = await this.getRefreshTokenHash(playerId);
        return hash ? bcrypt.compare(token, hash) : false;
    }

    /**
     * Sends a friend request from one player to another.
     * @param {number} senderId The sender's player ID.
     * @param {number} receiverId The receiver's player ID.
     * @returns {Promise<void>} A void promise.
     * @throws {ConflictException} If a request already exists.
     */
    async sendFriendRequest(senderId: number, receiverId: number): Promise<void> {
        const existing = await this.findFriendship(senderId, receiverId);
        if (existing)
            throw new ConflictException(
                `Friend request already exists with status: ${existing.status}`
            );

        const request = this.friendshipRepository.create({
            senderId,
            receiverId,
            status: FriendshipStatus.PENDING,
        });

        await this.friendshipRepository.save(request);
    }

    /**
     * Accepts a friend request.
     * @param {number} senderId The sender's player ID.
     * @param {number} receiverId The receiver's player ID.
     * @returns {Promise<void>} A void promise.
     * @throws {NotFoundException} If the request is not found.
     */
    async acceptFriendRequest(senderId: number, receiverId: number): Promise<void> {
        const result = await this.friendshipRepository.update(
            { senderId, receiverId },
            { status: FriendshipStatus.ACCEPTED }
        );

        if (!result.affected) throw new NotFoundException('Friend request not found.');
    }

    /**
     * Declines and deletes a friend request.
     * @param {number} senderId The sender's player ID.
     * @param {number} receiverId The receiver's player ID.
     * @returns {Promise<void>} A void promise.
     * @throws {NotFoundException} If the request is not found.
     */
    async declineFriendRequest(senderId: number, receiverId: number): Promise<void> {
        const friendship = await this.findFriendship(senderId, receiverId);
        if (!friendship) throw new NotFoundException('Friend request not found.');

        await this.friendshipRepository.delete({
            senderId: friendship.senderId,
            receiverId: friendship.receiverId,
        });
    }

    /**
     * Retrieves a list of friends for a player with pagination.
     * @param {number} playerId The player's ID.
     * @param {number} page The page number.
     * @param {number} limit The number of items per page.
     * @returns {Promise<PaginatedResult<Friend>>} A paginated result containing friends' information.
     */
    async getFriends(playerId: number, page = 1, limit = 10): Promise<PaginatedResult<Friend>> {
        const friendships = await this.getFriendshipsByStatus(
            playerId,
            FriendshipStatus.ACCEPTED,
            page,
            limit + 1
        );

        const hasMore = friendships.length > limit;
        const trimmed = hasMore ? friendships.slice(0, limit) : friendships;

        const result = trimmed.map(({ sender, receiver, updatedAt }) => {
            const friend = sender.id === playerId ? receiver : sender;
            return {
                id: friend.id,
                username: friend.username,
                photo: friend.photo,
                friendsSince: updatedAt,
                lastLogin: friend.lastLogin ?? null,
            };
        });

        return { data: result, more: hasMore };
    }

    /**
     * Retrieves incoming friend requests for a player with pagination.
     * @param {number} playerId The player's ID.
     * @param {number} page The page number.
     * @param {number} limit The number of items per page.
     * @returns {Promise<PaginatedResult<FriendRequest>>} A paginated result containing incoming friend requests.
     */
    async getIncomingFriendRequests(
        playerId: number,
        page = 1,
        limit = 10
    ): Promise<PaginatedResult<FriendRequest>> {
        const friendships = await this.getFriendshipsByStatus(
            playerId,
            FriendshipStatus.PENDING,
            page,
            limit
        );

        const filtered = friendships.filter(f => f.receiverId === playerId);
        const hasMore = filtered.length > limit;
        const trimmed = hasMore ? filtered.slice(0, limit) : filtered;

        const result = trimmed.map(({ sender, updatedAt }) => ({
            id: sender.id,
            username: sender.username,
            photo: sender.photo,
            sentAt: updatedAt,
        }));

        return { data: result, more: hasMore };
    }

    /**
     * Retrieves outgoing friend requests for a player with pagination.
     * @param {number} playerId The player's ID.
     * @param {number} page The page number.
     * @param {number} limit The number of items per page.
     * @returns {Promise<PaginatedResult<FriendRequest>>} A paginated result containing outgoing friend requests.
     */
    async getPendingOutgoing(
        playerId: number,
        page = 1,
        limit = 10
    ): Promise<PaginatedResult<FriendRequest>> {
        const friendships = await this.getFriendshipsByStatus(
            playerId,
            FriendshipStatus.PENDING,
            page,
            limit
        );

        const filtered = friendships.filter(f => f.senderId === playerId);
        const hasMore = filtered.length > limit;
        const trimmed = hasMore ? filtered.slice(0, limit) : filtered;

        const result = trimmed.map(({ receiver, updatedAt }) => ({
            id: receiver.id,
            username: receiver.username,
            photo: receiver.photo,
            sentAt: updatedAt,
        }));

        return { data: result, more: hasMore };
    }

    /**
     * Retrieves friendships by status with pagination.
     * @param {number} playerId The player's ID.
     * @param {FriendshipStatus} status The friendship status to filter by.
     * @param {number} page The page number.
     * @param {number} limit The number of items per page.
     * @returns {Promise<Friendship[]>} A list of friendships with the specified status.
     */
    private async getFriendshipsByStatus(
        playerId: number,
        status: FriendshipStatus,
        page = 1,
        limit = 10
    ): Promise<Friendship[]> {
        return await this.friendshipRepository
            .createQueryBuilder('f')
            .innerJoinAndSelect('f.sender', 'sender')
            .innerJoinAndSelect('f.receiver', 'receiver')
            .where('f.status = :status', { status })
            .andWhere('(f.senderId = :playerId OR f.receiverId = :playerId)', { playerId })
            .skip((page - 1) * limit)
            .take(limit + 1)
            .getMany();
    }

    /**
     * Checks if a player exists based on given condition.
     * @param {FindOptionsWhere<Player>} where The filter criteria.
     * @returns {Promise<boolean>} True if a player exists, false otherwise.
     */
    async userExistsBy(where: FindOptionsWhere<Player>): Promise<boolean> {
        return !!(await this.findOneBy(where, false));
    }

    /**
     * Finds a player based on given condition.
     * @param {FindOptionsWhere<Player>} where The filter criteria.
     * @param {boolean} [throwIfNotFound=true] Whether to throw if not found.
     * @param {Array<keyof Player>} [select] Optional fields to select.
     * @returns {Promise<Player>} The found player entity.
     * @throws {NotFoundException} If not found and throwIfNotFound is true.
     */
    async findOneBy(
        where: FindOptionsWhere<Player>,
        throwIfNotFound = true,
        select?: (keyof Player)[]
    ): Promise<Player> {
        const player = await this.playerRepository.findOne({ where, select });
        if (!player && throwIfNotFound) throw new NotFoundException('Player not found.');
        return player!;
    }

    /**
     * Checks if two players are friends.
     * @param {number} id The first player's ID.
     * @param {number} id2 The second player's ID.
     * @returns {Promise<boolean>} True if they are friends, false otherwise.
     */
    async areFriends(id: number, id2: number): Promise<boolean> {
        const friendship = await this.friendshipRepository.findOne({
            where: [
                { senderId: id, receiverId: id2, status: FriendshipStatus.ACCEPTED },
                { senderId: id2, receiverId: id, status: FriendshipStatus.ACCEPTED },
            ],
        });
        return !!friendship;
    }

    /**
     * Retrieves an existing friendship between two players.
     * @param {number} playerId The ID of the first player.
     * @param {number} friendId The ID of the second player.
     * @returns {Promise<Friendship | null>} The friendship if it exists, otherwise null.
     */
    private async findFriendship(playerId: number, friendId: number): Promise<Friendship | null> {
        return await this.friendshipRepository.findOne({
            where: [
                { senderId: playerId, receiverId: friendId },
                { senderId: friendId, receiverId: playerId },
            ],
        });
    }

    /**
     * Generates a random tag string.
     * @param {number} length The maximum length of the tag.
     * @returns {string} A random tag.
     */
    private generateRandomTag(length = 5): string {
        const TAG_CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

        const chars = TAG_CHARSET;
        const tagLength = length;
        let tag = '';
        for (let i = 0; i < tagLength; i++) {
            tag += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return tag;
    }

    /**
     * Generates a unique tag for a player.
     * @param {string} username The player's username.
     * @param {number} maxRetries The maximum number of attempts to generate a unique tag.
     * @returns {Promise<string>} A unique tag.
     * @throws {ConflictException} If unable to generate a unique tag after max retries.
     */
    private async generateUniqueTag(username: string, maxRetries = 5): Promise<string> {
        for (let i = 0; i < maxRetries; i++) {
            const tag = this.generateRandomTag();
            const existing = await this.playerRepository.findOne({
                where: { username, tag },
            });
            if (!existing) return tag;
        }
        throw new ConflictException('Could not generate a unique tag. Please try again.');
    }
}
