import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Entity()
export class Player {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    username: string;

    @Column({ name: 'password_hash', length: 255 })
    password: string;

    @Column({ length: 255, nullable: true })
    photo: string;

    @Column({ name: 'last_login', type: 'timestamp', nullable: true })
    lastLogin: Date;

    @Column({ default: false })
    online: boolean;

    @BeforeInsert()
    async hashPassword() {
        if (this.password) {
            this.password = await bcrypt.hash(this.password, 12);
        }
    }
}
