import "./App.css";
import Navbar from "./components/Navbar";
import Manager from "./components/Manager";
import Footer from "./components/Footer";

function App() {
  return (
    <>
      {" "}
      <Navbar />
      <div className=" bg-purple-200 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] min-h-[calc(100vh-40px)]">
        <Manager />
      </div>
      <Footer />
    </>
  );
}

export default App;
