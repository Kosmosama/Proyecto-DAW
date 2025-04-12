import { Role } from "src/auth/enums/role.enum";

export interface PlayerPublic {
    id: number;
    role?: Role;
    username?: string;
    email?: string;
    photo?: string;
    online?: boolean;
    lastLogin?: Date;
}