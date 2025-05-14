import { Toaster, toast } from "react-hot-toast";
import { FaRegSadCry } from "react-icons/fa";
import CryptoJS from "crypto-js";

const TableComponent = ({ passwordArray, deletePassword, handelEdit }) => {
  const secretKey = import.meta.env.VITE_SECRET_KEY;

  // Decrypt the password using AES
  const decryptedPassword = (encryptedPassword) => {
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  };

  // Handle copy securely
  const handleCopy = (encryptedText) => {
    const userInput = prompt(
      "Enter your master password to copy the password securely:"
    );
    const storedEncrypted = localStorage.getItem("PassManager");

    if (!storedEncrypted) {
      toast.error("No stored master password.");
      return;
    }

    const decryptedStoredPassword = decryptedPassword(storedEncrypted);

    console.log("Entered:", userInput);
    console.log("Decrypted from storage:", decryptedStoredPassword);

    if (userInput.trim() !== decryptedStoredPassword.trim()) {
      toast.error("Incorrect password!");
      return;
    }

    const decrypted = decryptedPassword(encryptedText);
    navigator.clipboard.writeText(decrypted);
    toast.success("Password copied to clipboard!");
  };

  return (
    <div className=" px-3  ">
      <Toaster position="top-center" reverseOrder={false} />

      {passwordArray.length === 0 ? (
        <div className="flex flex-col items-center mt-3 text-center">
          <p className="text-lg text-gray-600 mt-2">No passwords saved</p>
          <FaRegSadCry className="text-3xl text-gray-500 mt-2" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg mb-10">
          <div className="max-h-96  overflow-y-scroll">
            <table className=" w-full bg-white shadow-md table-auto ">
              <thead className="bg-purple-600 text-white sticky top-0 z-10 ">
                <tr>
                  <th className="p-3 text-left text-xs sm:text-sm md:text-base">
                    Site
                  </th>
                  <th className="p-3 text-left text-xs sm:text-sm md:text-base">
                    Username
                  </th>
                  <th className="p-3 text-left text-xs sm:text-sm md:text-base">
                    Password
                  </th>
                  <th className="p-3 text-left text-xs sm:text-sm md:text-base">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y  divide-purple-100 ">
                {passwordArray.map((item, index) => (
                  <tr
                    key={index}
                    className="hover:bg-purple-100 transition-colors"
                  >
                    <td className="p-3 text-xs sm:text-sm md:text-base truncate">
                      <a
                        href={item.site}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 underline"
                      >
                        {item.site}
                      </a>
                    </td>
                    <td className="p-3 text-xs sm:text-sm md:text-base truncate">
                      {item.username}
                      <span
                        className="ml-2 inline-block sm:ml-3 cursor-pointer"
                        onClick={() => {
                          navigator.clipboard.writeText(item.username);
                          toast.success("Username copied to clipboard!");
                        }}
                      >
                        <lord-icon
                          src="https://cdn.lordicon.com/iykgtsbt.json"
                          trigger="hover"
                          className="w-5 h-5 sm:w-6 sm:h-6"
                        ></lord-icon>
                      </span>
                    </td>
                    <td className="p-3 text-xs sm:text-sm md:text-base truncate">
                      *********
                      <span
                        className="ml-2 inline-block sm:ml-3 cursor-pointer"
                        onClick={() => handleCopy(item.password)}
                      >
                        <lord-icon
                          src="https://cdn.lordicon.com/iykgtsbt.json"
                          trigger="hover"
                          className="w-5 h-5 sm:w-6 sm:h-6"
                        ></lord-icon>
                      </span>
                    </td>
                    <td className="p-3 flex flex-wrap gap-2 sm:gap-3 items-center">
                      <button
                        className="flex items-center justify-center p-2 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10"
                        onClick={() => handelEdit(item.id)}
                      >
                        <lord-icon
                          src="https://cdn.lordicon.com/gwlusjdu.json"
                          trigger="hover"
                          className="w-4 h-4 sm:w-5 sm:h-5"
                        ></lord-icon>
                      </button>
                      <button
                        className="flex items-center justify-center p-2  text-white rounded-full w-8 h-8 sm:w-10 sm:h-10"
                        onClick={() => deletePassword(item.id)}
                      >
                        <lord-icon
                          src="https://cdn.lordicon.com/skkahier.json"
                          trigger="hover"
                          className="w-4 h-4 sm:w-5 sm:h-5"
                        ></lord-icon>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableComponent;
