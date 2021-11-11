export interface UserDeletedMessageSchema {
    userId: number;
    deletionReason: string;
    /**
     * @deprecated About to be removed soon
     */
    deletionDate: Date;
}
export declare const UserDeletedMessageValidator: (message: UserDeletedMessageSchema) => boolean;
