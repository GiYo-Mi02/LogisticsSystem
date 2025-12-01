import { NextResponse } from 'next/server';
import { UserService } from '@/services/UserService';
import { UserRole } from '@/core/types';
import { validateRequestBody } from '@/lib/validate';
import { loginSchema } from '@/lib/validations';

const userService = new UserService();

export async function POST(request: Request) {
    try {
        // Validate request body with Zod
        const validation = await validateRequestBody(request, loginSchema);
        
        if ('error' in validation) {
            return validation.error;
        }
        
        const { email, role, name } = validation.data;

        // Simple "login" that actually creates a user if not exists for demo purposes
        // In production, this would verify password hash
        const user = await userService.createUser(name, email, role as UserRole);

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Login failed' },
            { status: 500 }
        );
    }
}
