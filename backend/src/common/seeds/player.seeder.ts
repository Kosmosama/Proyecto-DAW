import { DataSource } from 'typeorm';
import { Player } from 'src/player/entities/player.entity';
import { Role } from 'src/auth/enums/role.enum';

export async function seedPlayers(dataSource: DataSource) {
    const playerRepo = dataSource.getRepository(Player);

    const existing = await playerRepo.count();
    if (existing > 0) {
        console.log('[Seed] Players already exist, skipping...');
        return;
    }
    const players = [
        { username: 'PixelNinja', tag: '1000', email: 'pixelninja@example.com', password: '1234', role: Role.USER, photo: 'avatar1.png' },
        { username: 'MysticFang', tag: '1001', email: 'mysticfang@example.com', password: '1234', role: Role.USER, photo: 'avatar2.png' },
        { username: 'CrimsonVolt', tag: '1002', email: 'crimsonvolt@example.com', password: '1234', role: Role.USER, photo: 'avatar3.png' },
        { username: 'ShadowKoi', tag: '1003', email: 'shadowkoi@example.com', password: '1234', role: Role.USER, photo: 'avatar4.png' },
        { username: 'EchoWisp', tag: '1004', email: 'echowisp@example.com', password: '1234', role: Role.USER, photo: 'avatar5.png' },
        { username: 'Frostbyte', tag: '1005', email: 'frostbyte@example.com', password: '1234', role: Role.USER, photo: 'avatar1.png' },
        { username: 'NovaStrike', tag: '1006', email: 'novastrike@example.com', password: '1234', role: Role.USER, photo: 'avatar2.png' },
        { username: 'IronTide', tag: '1007', email: 'irontide@example.com', password: '1234', role: Role.USER, photo: 'avatar3.png' },
        { username: 'ZenoFlare', tag: '1008', email: 'zenoflare@example.com', password: '1234', role: Role.USER, photo: 'avatar4.png' },
        { username: 'WraithSpark', tag: '1009', email: 'wraithspark@example.com', password: '1234', role: Role.USER, photo: 'avatar5.png' },
        { username: 'GlitchRaven', tag: '1010', email: 'glitchraven@example.com', password: '1234', role: Role.USER, photo: 'avatar1.png' },
        { username: 'SolarDrift', tag: '1011', email: 'solardrift@example.com', password: '1234', role: Role.USER, photo: 'avatar2.png' },
        { username: 'VenomTalon', tag: '1012', email: 'venomtalon@example.com', password: '1234', role: Role.USER, photo: 'avatar3.png' },
        { username: 'ArcticShade', tag: '1013', email: 'arcticshade@example.com', password: '1234', role: Role.USER, photo: 'avatar4.png' },
        { username: 'ObsidianSoul', tag: '1014', email: 'obsidiansoul@example.com', password: '1234', role: Role.USER, photo: 'avatar5.png' },
        { username: 'QuantumHex', tag: '1015', email: 'quantumhex@example.com', password: '1234', role: Role.USER, photo: 'avatar1.png' },
        { username: 'NeonSpire', tag: '1016', email: 'neonspire@example.com', password: '1234', role: Role.USER, photo: 'avatar2.png' },
        { username: 'VoidRider', tag: '1017', email: 'voidrider@example.com', password: '1234', role: Role.USER, photo: 'avatar3.png' },
        { username: 'StormWhale', tag: '1018', email: 'stormwhale@example.com', password: '1234', role: Role.USER, photo: 'avatar4.png' },
        { username: 'LunarMoth', tag: '1019', email: 'lunarmoth@example.com', password: '1234', role: Role.USER, photo: 'avatar5.png' },
    ];


    await playerRepo.save(players.map(p => playerRepo.create(p)));
    console.log('[Seed] Players seeded.');
}
