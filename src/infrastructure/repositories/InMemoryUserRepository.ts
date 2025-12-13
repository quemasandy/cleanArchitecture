import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { User } from '../../domain/entities/User';

export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  async save(user: User): Promise<User> {
    console.log(`[InMemoryRepo] Saving user: ${user.email}`);
    // Simulate ID generation if not present (simple hack for mock)
    if (!user.id) {
        // In a real scenario, this would be handled differently, 
        // but for this mock we assume the entity might have it or we generate one.
        // For the sake of the example, let's just use email as key or assume generic id
        // But clean arch entities usually have IDs generated before persistence or by persistence.
        // Let's assume the entity passed in is complete for now.
    }
    this.users.set(user.email, user); // Indexing by email for findByEmail
    if (user.id) {
        this.users.set(user.id, user); // Indexing by ID as well
    }
    return Promise.resolve(user);
  }

  async update(user: User): Promise<void> {
    console.log(`[InMemoryRepo] Updating user: ${user.email}`);
    if (user.id) {
        this.users.set(user.id, user);
    }
    this.users.set(user.email, user);
    return Promise.resolve();
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = this.users.get(email);
    return Promise.resolve(user || null);
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.get(id);
    return Promise.resolve(user || null);
  }
}
