import AuthCard from '../components/registration/AuthCard';
import Profile from '../components/profile/Profile';

export const Home = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      {/* <AuthCard /> */}

      <Profile name="John Doe" role="Senior HR Specialist" department="Human Resources" />
    </div>
  );
};
