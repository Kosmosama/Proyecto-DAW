export interface Friend {
    id: number;
    username: string;
    photo: string;
    since: Date;
    lastLogin?: Date | null;
}