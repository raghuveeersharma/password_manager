// Shared layout for the Login / Register / Unlock screens.
const AuthCard = ({ title, subtitle, children }) => (
  <div className="container mx-auto max-w-md p-4 pt-10">
    <div className="bg-white rounded-xl shadow-md p-6 text-black">
      <h1 className="text-2xl font-bold text-center">{title}</h1>
      {subtitle && <p className="text-sm text-gray-600 text-center mt-1">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  </div>
);

export default AuthCard;
