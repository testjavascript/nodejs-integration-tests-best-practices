import {
  UserDeletedMessageValidator,
  UserDeletedMessageSchema,
} from './user-deleted-message-schema';

const message: UserDeletedMessageSchema = {
  userId: 1,
  deletionReason: 'opt-out',
  deletionDate: new Date(),
};

message.deletionDate = new Date();
