import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Role } from "src/auth/enums/role.enum";
import { Friendship } from "src/player/entities/friendship.entity";
import { Player } from "src/player/entities/player.entity";
import { FriendshipStatus } from "src/player/enums/friendship-status.enum";
import { TeamService } from "src/teams/teams.service";
import { Repository } from "typeorm";


const names = ['Ash', 'Misty', 'Brock', 'Gary', 'May', 'Dawn', 'Iris', 'Serena', 'Lillie', 'Go'];

@Injectable()
export class PlayerSeeder {
    constructor(
        @InjectRepository(Player)
        private readonly playerRepo: Repository<Player>,

        @InjectRepository(Friendship)
        private readonly friendshipRepo: Repository<Friendship>,

        private readonly teamService: TeamService,
    ) { }

    async seed() {
        const players: Player[] = [];

        // 1. Create Players
        for (let i = 0; i < 10; i++) {
            const existing = await this.playerRepo.findOneBy({ email: `${names[i].toLowerCase()}@poke.com` });
            if (existing) {
                players.push(existing);
                continue;
            }

            const player = this.playerRepo.create({
                username: names[i],
                tag: `T${i + 100}`,
                email: `${names[i].toLowerCase()}@poke.com`,
                password: 'password123', // Will be hashed
                role: Role.USER,
            });

            const saved = await this.playerRepo.save(player);
            players.push(saved);
        }

        console.log(`✅ Seeded ${players.length} players`);

        // 2. Create Teams
        const teamTemplate = `
            Pikachu @ Light Ball  
            Ability: Static  
            EVs: 252 Atk / 4 SpD / 252 Spe  
            Jolly Nature  
            - Volt Tackle  
            - Iron Tail  
            - Quick Attack  
            - Thunderbolt
            `.trim();

        for (const player of players) {
            const existingTeams = await this.teamService.findAllByPlayer(player.id);
            if (existingTeams.length >= 2) continue;

            const teamsToCreate = Math.floor(Math.random() * 3); // 0 to 2 teams

            for (let j = 0; j < teamsToCreate; j++) {
                await this.teamService.create(player.id, {
                    name: `Team ${j + 1} - ${player.username}`,
                    data: {
                        team: teamTemplate,
                        format: 'gen9ou',
                        strict: true,
                    },
                });
            }
        }

        console.log(`✅ Seeded teams`);

        // 3. Create Friendships
        const friendshipPairs = new Set<string>();

        for (let i = 0; i < players.length; i++) {
            for (let j = 0; j < players.length; j++) {
                if (i === j) continue;

                const sender = players[i];
                const receiver = players[j];
                const key = `${sender.id}_${receiver.id}`;
                const reverseKey = `${receiver.id}_${sender.id}`;

                if (friendshipPairs.has(key) || friendshipPairs.has(reverseKey)) continue;

                // 50% chance to create a friendship
                if (Math.random() < 0.3) {
                    const status =
                        Math.random() < 0.5 ? FriendshipStatus.ACCEPTED : FriendshipStatus.PENDING;

                    const friendship = this.friendshipRepo.create({
                        senderId: sender.id,
                        receiverId: receiver.id,
                        status,
                    });

                    await this.friendshipRepo.save(friendship);
                    friendshipPairs.add(key);
                }
            }
        }

        console.log(`✅ Seeded friendships`);
    }
}
