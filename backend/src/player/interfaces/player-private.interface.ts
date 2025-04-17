import { Role } from "src/auth/enums/role.enum";

export interface PlayerPrivate {
    id: number;
    role: Role;
    username: string;
    email: string;
    photo?: string;
}