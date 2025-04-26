import { Role } from "../enums/role.enum";

export type RolesMetadata = {
    roles: Role[];
    selfParam?: string;
};