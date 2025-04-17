export interface Friend {
    id: number;
    username: string;
    photo: string;
    friendsSince: Date;
    lastLogin?: Date | null;
}