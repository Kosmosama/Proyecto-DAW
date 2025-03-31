import { ConflictException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Friendship, FriendshipStatus } from './entities/friendship.entity';
import { Repository } from 'typeorm';
import { Player } from './entities/player.entity';

@Injectable()
export class PlayerService {
    constructor(
        @InjectRepository(Friendship)
        private readonly friendshipRepository: Repository<Friendship>,
        @InjectRepository(Player)
        private readonly playerRepository: Repository<Player>,
    ) { }

    async findAll(): Promise<Player[]> {
        return await this.playerRepository.find();
    }

    async findOne(id: number): Promise<Player> {
        const player = await this.playerRepository.findOneBy({ id });
        if (!player) throw new NotFoundException("Player not found.");
        return player;
    }

    async update(id: number, updatePlayerDto: UpdatePlayerDto): Promise<Player> {
        const result = await this.playerRepository.update(id, updatePlayerDto);
        if (result.affected === 0) throw new NotFoundException("Player not found.");
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        const deleteResult = await this.playerRepository.delete(id);
        if (deleteResult.affected === 0) throw new NotFoundException("Player not found.");
    }

    private async findFriendship(playerId: number, friendId: number): Promise<Friendship | null> {
        return await this.friendshipRepository.findOne({
            where: [
                { senderId: playerId, receiverId: friendId },
                { senderId: friendId, receiverId: playerId }
            ],
        });
    }

    private async createFriendRequest(senderId: number, receiverId: number): Promise<void> {
        const friendship = this.friendshipRepository.create({
            senderId,
            receiverId,
            status: FriendshipStatus.PENDING,
        });
        await this.friendshipRepository.save(friendship);
    }

    async sendFriendRequest(senderId: number, receiverId: number): Promise<void> {
        const existingFriendship = await this.findFriendship(senderId, receiverId);
        if (existingFriendship) throw new ConflictException(`Friend request already exists with status: ${existingFriendship.status}`);

        await this.createFriendRequest(senderId, receiverId);
    }

    async acceptFriendRequest(playerId: number, friendId: number): Promise<void> {
        const friendship = await this.findFriendship(playerId, friendId);
        if (!friendship) throw new NotFoundException('Friend request not found.');

        friendship.status = FriendshipStatus.ACCEPTED;
        await this.friendshipRepository.save(friendship);
    }

    async declineFriendRequest(playerId: number, friendId: number): Promise<void> {
        const friendship = await this.findFriendship(playerId, friendId);
        if (!friendship) throw new NotFoundException('Friend request not found.');

        await this.friendshipRepository.delete({ senderId: friendship.senderId, receiverId: friendship.receiverId });
    }

    async getFriends(playerId: number): Promise<Player[]> {
        const friendships = await this.friendshipRepository.find({
            where: [
                { senderId: playerId, status: FriendshipStatus.ACCEPTED },
                { receiverId: playerId, status: FriendshipStatus.ACCEPTED },
            ],
            relations: ['player1', 'player2'],
        });

        const friends = friendships.map(friendship =>
            friendship.senderId === playerId ? friendship.receiver : friendship.sender
        );

        return friends;
    }
}
