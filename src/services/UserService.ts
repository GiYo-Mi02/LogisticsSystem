import { prisma } from '@/lib/prisma';
import { User, Customer, Driver, Admin } from '@/core/User';
import { UserRole } from '@/core/types';

export class UserService {

    /**
     * Retrieves a user by ID and returns the appropriate OOP class instance.
     */
    async getUserById(id: string): Promise<User | null> {
        const userRecord = await prisma.user.findUnique({
            where: { id },
        });

        if (!userRecord) return null;

        switch (userRecord.role) {
            case 'CUSTOMER':
                return new Customer(userRecord.id, userRecord.name, userRecord.email);
            case 'DRIVER':
                return new Driver(userRecord.id, userRecord.name, userRecord.email);
            case 'ADMIN':
                return new Admin(userRecord.id, userRecord.name, userRecord.email);
            default:
                throw new Error(`Unknown role: ${userRecord.role}`);
        }
    }

    /**
     * Creates a new user and persists to DB.
     */
    async createUser(name: string, email: string, role: UserRole, password: string = 'defaultPassword123'): Promise<User> {
        const userRecord = await prisma.user.create({
            data: {
                name,
                email,
                role,
                password: password, // In real app, hash this!
            },
        });

        switch (role) {
            case UserRole.CUSTOMER:
                return new Customer(userRecord.id, userRecord.name, userRecord.email);
            case UserRole.DRIVER:
                return new Driver(userRecord.id, userRecord.name, userRecord.email);
            case UserRole.ADMIN:
                return new Admin(userRecord.id, userRecord.name, userRecord.email);
            default:
                throw new Error('Invalid role');
        }
    }
}
