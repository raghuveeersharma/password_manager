import React from "react";
import { Toaster, toast } from "react-hot-toast";
import { FaRegSadCry } from "react-icons/fa";

const TableComponent = ({ passwordArray, deletePassword, id, handelEdit }) => {
  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      {passwordArray.length === 0 ? (
        <div className="flex items-center flex-col mt-3">
          <p className="text-center mt-2">No passwords saved </p>
          <span>
            <FaRegSadCry />
          </span>
        </div>
      ) : (
        <table className="w-full mt-1 rounded overflow-hidden table-auto">
          <thead className="bg-purple-600 text-white">
            <tr>
              <th className="p-1">Site</th>
              <th className="p-1">Username</th>
              <th className="p-1">Password</th>
              <th className="p-1">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-purple-100 ">
            {passwordArray.map((item, index) => {
              return (
                <tr key={index} className="hover:bg-purple-200 ">
                  <td className="text-center min-w-40 cursor-pointer ">
                    <a href="item.site" target="_blank">
                      {item.site}
                    </a>
                  </td>
                  <td className="text-center w-40 relative ">
                    {item.username}{" "}
                    <span className="absolute top-1 -right-5 cursor-pointer">
                      <lord-icon
                        src="https://cdn.lordicon.com/iykgtsbt.json"
                        trigger="hover"
                        style={{ width: "23px", height: "23px" }}
                        onClick={() => {
                          navigator.clipboard.writeText(item.username);
                          toast.success("Copied to clipboard!");
                        }}
                      ></lord-icon>
                    </span>{" "}
                  </td>
                  <td className="text-center w-40 relative">
                    {item.password}{" "}
                    <span className="absolute top-1 right-3 cursor-pointer text-sm">
                      <lord-icon
                        src="https://cdn.lordicon.com/iykgtsbt.json"
                        trigger="hover"
                        style={{ width: "23px", height: "23px" }}
                        onClick={() => {
                          navigator.clipboard.writeText(item.password);
                          toast.success("Copied to clipboard!");
                        }}
                      ></lord-icon>
                    </span>
                  </td>
                  <td className="text-center w-40 relative">
                    <span
                      className="absolute top-1  cursor-pointer text-sm"
                      onClick={() => handelEdit(item.id)}
                    >
                      <lord-icon
                        src="https://cdn.lordicon.com/gwlusjdu.json"
                        trigger="hover"
                        style={{ width: "23px", height: "23px" }}
                      ></lord-icon>
                    </span>
                    <span
                      className="absolute top-1 right-5 cursor-pointer text-sm"
                      onClick={() => deletePassword(item.id)}
                    >
                      <lord-icon
                        src="https://cdn.lordicon.com/skkahier.json"
                        trigger="hover"
                        style={{ width: "23px", height: "23px" }}
                      ></lord-icon>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TableComponent;
