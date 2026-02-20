import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '../firebase/config';

export interface RegisterPayload {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;

  field?: 'email' | 'password';

  message?: string;
}

export async function registerUser({
  firstname,
  lastname,
  email,
  password,
}: RegisterPayload): Promise<AuthResult> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, {
      displayName: `${firstname.trim()} ${lastname.trim()}`,
    });
    return { success: true };
  } catch (err) {
    if (err instanceof FirebaseError) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          return { success: false, field: 'email', message: 'Email is already in use' };
        case 'auth/invalid-email':
          return { success: false, field: 'email', message: 'Invalid email address' };
        case 'auth/weak-password':
          return { success: false, field: 'password', message: 'Password is too weak' };
        default:
          return { success: false, message: err.message };
      }
    }
    return { success: false, message: 'An unexpected error occurred' };
  }
}
