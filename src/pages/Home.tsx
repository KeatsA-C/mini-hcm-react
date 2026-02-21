import Profile from '../components/profile/Profile';
import AuthCard from '../components/registration/AuthCard';

export const Home = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <AuthCard />

      {/* <Profile
        name="John Doe"
        role="Senior HR Specialist"
        department="Human Resources"
        timezone="Manila, PH"
      /> */}
    </div>
  );
};
