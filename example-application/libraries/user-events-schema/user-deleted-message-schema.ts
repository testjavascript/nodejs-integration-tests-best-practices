export interface UserDeletedMessageSchema {
  userId: number;
  deletionReason: string
  deletionDate: Date;
}

export const UserDeletedMessageValidator = 
(message: UserDeletedMessageSchema): boolean => {
  if (!message.userId) {
    return false;
  }
  // more validations here

  return true;
};


