import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
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

    // async create(createPlayerDto: CreatePlayerDto): Promise<Player> {
    //     try {
    //         const player = this.playerRepository.create(createPlayerDto);
    //         return await this.playerRepository.save(player);
    //     } catch (error) {
    //         console.error("Error creating player:", error);
    //         throw new HttpException("Error creating player.", 500);
    //     }
    // }

    async findAll(): Promise<Player[]> {
        try {
            return await this.playerRepository.find();
        } catch (error) {
            console.error("Error retrieving players:", error);
            throw new HttpException("Error retrieving players.", 500);
        }
    }

    async findOne(id: number): Promise<Player> {
        try {
            const player = await this.playerRepository.findOneBy({ id });
            if (!player) throw new NotFoundException("Player not found.");
            return player;
        } catch (error) {
            console.error("Error finding player:", error);
            throw new HttpException("Error finding player.", 500);
        }
    }

    async update(id: number, updatePlayerDto: UpdatePlayerDto): Promise<Player> {
        try {
            const result = await this.playerRepository.update(id, updatePlayerDto);
            if (result.affected === 0) throw new NotFoundException("Player not found.");
            return this.findOne(id);
        } catch (error) {
            console.error("Error updating player:", error);
            throw new HttpException("Error updating player.", 500);
        }
    }

    async remove(id: number): Promise<void> {
        try {
            const deleteResult = await this.playerRepository.delete(id);
            if (deleteResult.affected === 0) throw new NotFoundException("Player not found.");
        } catch (error) {
            console.error("Error deleting player:", error);
            throw new HttpException("Error deleting player.", 500);
        }
    }

    async sendFriendRequest(idPlayer1: number, idPlayer2: number): Promise<Friendship> {
        try {
            const friendship = this.friendshipRepository.create({
                idPlayer1,
                idPlayer2,
                status: FriendshipStatus.PENDING,
            });
            return await this.friendshipRepository.save(friendship);
        } catch (error) {
            console.error('Error sending friend request:', error);
            throw new HttpException('Error sending friend request.', 500);
        }
    }

    async acceptFriendRequest(idPlayer1: number, idPlayer2: number): Promise<Friendship> {
        try {
            const friendship = await this.friendshipRepository.findOneBy({ idPlayer1, idPlayer2 });
            if (!friendship) throw new NotFoundException('Friend request not found.');
            friendship.status = FriendshipStatus.ACCEPTED;
            return await this.friendshipRepository.save(friendship);
        } catch (error) {
            console.error('Error accepting friend request:', error);
            throw new HttpException('Error accepting friend request.', 500);
        }
    }

    async declineFriendRequest(idPlayer1: number, idPlayer2: number): Promise<void> {
        try {
            const friendship = await this.friendshipRepository.findOneBy({ idPlayer1, idPlayer2 });
            if (!friendship) throw new NotFoundException('Friend request not found.');
            await this.friendshipRepository.delete({ idPlayer1, idPlayer2 });
        } catch (error) {
            console.error('Error declining friend request:', error);
            throw new HttpException('Error declining friend request.', 500);
        }
    }
}
