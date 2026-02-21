import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '../config/firebase.ts';
import { API_BASE_URL } from '../config/env.ts';

export interface RegisterPayload {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  department: string;
  role: string;
  timezone: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  field?: 'email' | 'password';
  message?: string;
}

interface FirebaseAuthResult {
  success: boolean;
  emailAlreadyExisted: boolean;
  token?: string;
  field?: 'email' | 'password';
  message?: string;
}

export async function registerEmail({
  firstname,
  lastname,
  email,
  password,
}: RegisterPayload): Promise<FirebaseAuthResult> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: `${firstname} ${lastname}` });
    const token = await cred.user.getIdToken();
    return { success: true, emailAlreadyExisted: false, token };
  } catch (err) {
    if (err instanceof FirebaseError && err.code === 'auth/email-already-in-use') {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const token = await cred.user.getIdToken();
        return { success: true, emailAlreadyExisted: true, token };
      } catch (signInErr) {
        if (signInErr instanceof FirebaseError) {
          return {
            success: false,
            emailAlreadyExisted: true,
            field: 'password',
            message: 'Incorrect password.',
          };
        }
        return {
          success: false,
          emailAlreadyExisted: true,
          message: 'Sign-in failed unexpectedly.',
        };
      }
    }

    if (err instanceof FirebaseError) {
      return { success: false, emailAlreadyExisted: false, message: err.message };
    }
    return { success: false, emailAlreadyExisted: false, message: 'An unexpected error occurred.' };
  }
}

export async function completeRegistration(payload: RegisterPayload): Promise<AuthResult> {
  const authResult = await registerEmail(payload);

  if (!authResult.success) {
    return { success: false, field: authResult.field, message: authResult.message };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/user/registration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authResult.token}`,
      },
      body: JSON.stringify({
        firstName: payload.firstname,
        lastName: payload.lastname,
        email: payload.email,
        department: payload.department,
        role: payload.role,
        timezone: payload.timezone,
      }),
    });

    console.log('Backend response status:', response);

    const data: { message?: string; error?: string } = await response.json();

    if (response.status === 201) {
      await signOut(auth).catch(() => {});
      return { success: true };
    }

    if (data.error === 'email already exists.') {
      await signOut(auth).catch(() => {});
      return {
        success: false,
        field: 'email',
        message: 'An account with this email is already fully registered.',
      };
    }

    await signOut(auth).catch(() => {});
    return { success: false, message: 'Unexpected response from server.' };
  } catch {
    await signOut(auth).catch(() => {});
    return { success: false, message: 'Failed to connect to the server.' };
  }
}

export async function login(payload: LoginPayload) {
  try {
    const cred = await signInWithEmailAndPassword(auth, payload.email, payload.password);
    const token = await cred.user.getIdToken();
    return { success: true, emailAlreadyExisted: true, token };
  } catch (signInErr) {
    if (signInErr instanceof FirebaseError) {
      return {
        success: false,
        emailAlreadyExisted: true,
        field: 'password',
        message: 'Incorrect password.',
      };
    }
    return {
      success: false,
      emailAlreadyExisted: true,
      message: 'Sign-in failed unexpectedly.',
    };
  }
}
