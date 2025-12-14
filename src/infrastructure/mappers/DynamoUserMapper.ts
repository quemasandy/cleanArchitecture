import { User } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';
import { DynamoUserItem } from '../dtos/DynamoUserItem';

export class DynamoUserMapper {
  static toDomain(item: DynamoUserItem): User {
    return new User(
      item.pk,
      new Email(item.email),
      item.passwordHash,
      item.isActive,
      item.version
    );
  }

  static toPersistence(user: User): DynamoUserItem {
    return {
      pk: user.id,
      email: user.email.getValue(),
      passwordHash: user.passwordHash,
      isActive: user.isActive,
      version: user.version,
    };
  }
}
