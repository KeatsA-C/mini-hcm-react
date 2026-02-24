import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { Container } from '../components/Container';
import AuthCard from '../components/registration/AuthCard';
import { auth } from '../config/firebase';

export const Home = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        // User is already authenticated, redirect to panel
        navigate('/panel', { replace: true });
      } else {
        // User is not authenticated, show login page
        setChecking(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Show loading message while checking authentication
  if (checking) {
    return (
      <div>
        <Container>
          <div className="flex items-center justify-center">
            <p className="font-mono text-[13px] text-neutral-400 tracking-wide">
              Verifying Auth....
            </p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div>
      <Container>
        <AuthCard />
      </Container>
    </div>
  );
};
