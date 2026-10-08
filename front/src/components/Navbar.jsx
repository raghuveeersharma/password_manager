import { FaGithubSquare } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { status, email, lock, logout } = useAuth();
  const loggedIn = status === "locked" || status === "unlocked";

  return (
    <nav className="bg-slate-800 p-1 px-5 text-white sticky top-0 z-50 shadow-md">
      <div className="flex justify-between items-center max-w-6xl mx-auto ">
        {/* Logo */}
        <div className="logo font-bold text-2xl md:text-3xl">
          <span className="text-purple-600 text-3xl md:text-4xl">&lt;</span>
          pass
          <span className="text-purple-600 text-2xl md:text-3xl">OP/&gt;</span>
        </div>

        {/* Session controls */}
        {loggedIn && (
          <div className="flex items-center gap-2 text-xs md:text-base">
            <span className="hidden sm:inline text-gray-300 truncate max-w-[14rem]">{email}</span>
            {status === "unlocked" && (
              <button
                onClick={lock}
                className="bg-slate-600 rounded-xl p-2 hover:bg-slate-700 transition-all duration-300"
              >
                Lock
              </button>
            )}
            <button
              onClick={logout}
              className="bg-slate-600 rounded-xl p-2 hover:bg-slate-700 transition-all duration-300"
            >
              Log out
            </button>
          </div>
        )}

        {/* GitHub Link */}
        <button className="flex flex-col items-center text-gray-200 hover:text-white text-2xl md:text-4xl transition-transform duration-200">
          <a
            href="https://github.com/raghuveeersharma/password_manager"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center"
          >
            <FaGithubSquare />
            <p className="text-xs md:text-sm mt-1">GitHub</p>
          </a>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
