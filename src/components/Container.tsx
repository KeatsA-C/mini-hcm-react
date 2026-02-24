export const Container = ({ children }: { children?: React.ReactNode }): React.ReactElement => {
  return <div className="flex items-center justify-center min-h-screen">{children}</div>;
};
