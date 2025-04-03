export interface Friend {
    id: number;
    username: string;
    photo: string;
    online: boolean;
    friendsSince: Date | null; // #TODO Is it friendsSince? do we update date when petition is accepted?
    lastLogin: Date | null;
}