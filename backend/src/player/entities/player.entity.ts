import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/auth/enums/role.enum';
import { AuthProvider } from '../../auth/entities/auth-provider.entity';
import { BadRequestException } from '@nestjs/common';

@Entity()
@Unique(['username', 'tag'])
export class Player {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    username: string;

    @Column({ length: 5 })
    tag: string;

    @Column({ length: 255, unique: true })
    email: string;

    @Column({ name: 'password_hash', length: 255 })
    password: string;

    @Column({ name: 'refresh_token_hash', type: 'varchar', length: 255, nullable: true })
    refreshToken: string | null;

    @Column({ length: 255, nullable: true })
    photo: string;

    @Column({ name: 'last_login', type: 'timestamp', nullable: true })
    lastLogin: Date;

    @Column({ type: 'enum', enum: Role, default: Role.USER })
    role: Role;

    @OneToMany(() => AuthProvider, (authProvider) => authProvider.player, { cascade: true })
    authProviders: AuthProvider[];

    @BeforeInsert()
    @BeforeUpdate()
    async hashSensitiveData() {
        if (!this.tag || !/^[a-zA-Z0-9]+$/.test(this.tag)) {
            throw new BadRequestException('Tag must exist and contain only alphanumeric characters.');
        }

        if (this.password && !this.password.startsWith('$2b$')) {
            this.password = await bcrypt.hash(this.password, 12);
        }

        if (this.refreshToken && !this.refreshToken.startsWith('$2b$')) {
            this.refreshToken = await bcrypt.hash(this.refreshToken, 12);
        }
    }
}
