import { Role } from "../enums/role.enum";

export interface JwtPayload {
    id: number;
    role: Role,
}