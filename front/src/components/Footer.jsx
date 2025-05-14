import { FaLinkedin, FaInstagram, FaGithub } from "react-icons/fa";
import { TbBrandLeetcode } from "react-icons/tb";

const Footer = () => {
  return (
    <footer className="bg-slate-800 p-2 text-white w-full">
      <div className="flex flex-col items-center max-w-5xl mx-auto space-y-3">
        {/* Logo */}
        <div className="logo font-bold text-2xl md:text-3xl flex justify-center md:justify-start">
          <span className="text-purple-600">&lt;</span>
          pass
          <span className="text-purple-600">OP/&gt;</span>
        </div>

        {/* Social Media Icons - Responsive */}
        <div className="flex flex-wrap justify-center space-x-4 mt-6">
          {[
            {
              icon: <FaLinkedin />,
              link: "https://www.linkedin.com/in/raghuveer-sharma-810124252/",
            },
            {
              icon: <FaInstagram />,
              link: "https://www.instagram.com/__raghusharma__?igsh=MjkwYTRxb3ljaXBx",
            },
            {
              icon: <FaGithub />,
              link: "https://github.com/raghuveeersharma",
            },
            {
              icon: <TbBrandLeetcode />,
              link: "https://leetcode.com/u/RaghuSharma48/",
            },
          ].map((item, index) => (
            <a
              key={index}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl hover:text-purple-500 transition-transform transform hover:scale-110"
            >
              {item.icon}
            </a>
          ))}
        </div>
        {/* Name / Logo */}
        <h2 className="text-lg font-semibold text-purple-400">
          Raghuveer Sharma
        </h2>
      </div>
    </footer>
  );
};

export default Footer;
