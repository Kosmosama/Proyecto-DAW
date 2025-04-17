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

@Injectable()
export class PlayerService {
    constructor(
        @InjectRepository(Player)
        private readonly playerRepository: Repository<Player>,
        @InjectRepository(Friendship)
        private readonly friendshipRepository: Repository<Friendship>
    ) {}

    /**
     * Creates a new player in the database.
     * @param {RegisterDto} dto The registration data transfer object.
     * @returns {Promise<Player>} The created player entity.
     */
    async createUser(dto: RegisterDto): Promise<Player> {
        const player = this.playerRepository.create(dto);
        return await this.playerRepository.save(player);
    }

    /**
     * Retrieves a paginated list of public player data with optional search.
     * @param {number} page The page number.
     * @param {number} limit The number of items per page.
     * @param {string} [search] Optional search keyword for filtering by username.
     * @returns {Promise<PlayerPublic[]>} A list of public player data.
     */
    async findAll(page = 1, limit = 10, search?: string): Promise<PlayerPublic[]> {
        const query = this.playerRepository.createQueryBuilder('player')
            .select(['player.id', 'player.username', 'player.photo'])
            .skip((page - 1) * limit)
            .take(limit);

        if (search) {
            query.where('LOWER(player.username) LIKE :search', {
                search: `%${search.toLowerCase()}%`,
            });
        }

        return await query.getMany();
    }

    /**
     * Retrieves public data for a single player by ID.
     * @param {number} id The player's ID.
     * @returns {Promise<PlayerPublic>} The player's public information.
     * @throws {NotFoundException} If the player is not found.
     */
    async findOne(id: number): Promise<PlayerPublic> {
        return await this.findOneBy({ id }, true, ['id', 'username', 'photo']);
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
        return this.findOne(id);
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
     * Checks if a player exists based on given condition.
     * @param {FindOptionsWhere<Player>} where The filter criteria.
     * @returns {Promise<boolean>} True if a player exists, false otherwise.
     */
    async userExistsBy(where: FindOptionsWhere<Player>): Promise<boolean> {
        return !!(await this.findOneBy(where, false));
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
     * Gets a paginated list of a player's friends.
     * @param {number} playerId The player's ID.
     * @param {number} page The page number.
     * @param {number} limit The number of items per page.
     * @returns {Promise<Friend[]>} A list of friends.
     */
    async getFriends(playerId: number, page = 1, limit = 10): Promise<Friend[]> {
        const friendships = await this.getFriendshipsByStatus(
            playerId,
            FriendshipStatus.ACCEPTED,
            page,
            limit
        );

        return friendships.map(({ sender, receiver, updatedAt }) => {
            const friend = sender.id === playerId ? receiver : sender;
            return {
                id: friend.id,
                username: friend.username,
                photo: friend.photo,
                friendsSince: updatedAt,
                lastLogin: friend.lastLogin ?? null,
            };
        });
    }

    /**
     * Retrieves incoming pending friend requests.
     * @param {number} playerId The player's ID.
     * @param {number} page The page number.
     * @param {number} limit The number of items per page.
     * @returns {Promise<FriendRequest[]>} A list of incoming friend requests.
     */
    async getIncomingFriendRequests(playerId: number, page = 1, limit = 10): Promise<FriendRequest[]> {
        const friendships = await this.getFriendshipsByStatus(
            playerId,
            FriendshipStatus.PENDING,
            page,
            limit
        );

        return friendships
            .filter((f) => f.receiverId === playerId)
            .map(({ sender, updatedAt }) => ({
                id: sender.id,
                username: sender.username,
                photo: sender.photo,
                sentAt: updatedAt,
            }));
    }

    /**
     * Retrieves outgoing pending friend requests.
     * @param {number} playerId The player's ID.
     * @param {number} page The page number.
     * @param {number} limit The number of items per page.
     * @returns {Promise<FriendRequest[]>} A list of sent friend requests.
     */
    async getPendingOutgoing(playerId: number, page = 1, limit = 10): Promise<FriendRequest[]> {
        const friendships = await this.getFriendshipsByStatus(
            playerId,
            FriendshipStatus.PENDING,
            page,
            limit
        );

        return friendships
            .filter((f) => f.senderId === playerId)
            .map(({ receiver, updatedAt }) => ({
                id: receiver.id,
                username: receiver.username,
                photo: receiver.photo,
                sentAt: updatedAt,
            }));
    }

    /**
     * Retrieves friendships by status with pagination.
     * @param {number} playerId The player's ID.
     * @param {FriendshipStatus} status The friendship status to filter by.
     * @param {number} page The page number.
     * @param {number} limit The number of items per page.
     * @returns {Promise<Friendship[]>} A list of friendships.
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
            .take(limit)
            .getMany();
    }
}