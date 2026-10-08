import { useState } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import Manager from "./components/Manager";
import Footer from "./components/Footer";
import Login from "./components/Login";
import Register from "./components/Register";
import Unlock from "./components/Unlock";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";

const Screen = () => {
  const { status } = useAuth();
  const [mode, setMode] = useState("login");

  if (status === "loading") {
    return <p className="text-center pt-10 text-gray-600">Loading…</p>;
  }
  if (status === "unlocked") return <Manager />;
  if (status === "locked") return <Unlock />;
  return mode === "login" ? (
    <Login onSwitch={() => setMode("register")} />
  ) : (
    <Register onSwitch={() => setMode("login")} />
  );
};

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <div className=" bg-purple-200 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] min-h-[calc(100vh-40px)]">
        <Screen />
      </div>
      <Footer />
      <Toaster position="top-center" reverseOrder={false} />
    </AuthProvider>
  );
}

export default App;
