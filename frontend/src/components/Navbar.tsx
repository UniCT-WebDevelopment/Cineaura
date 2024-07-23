import ThemeSwitcher from "./ThemeSwitcher";
import { Link } from "react-router-dom";
import { authStore } from "../zustand/AuthStore";
import { useStore } from "zustand";

const Navbar = () => {
  const auth = useStore(authStore);

  return (
    <>
      <div className="navbar bg-neutral">
        <div className="flex-1">
          <Link to="/" className="btn btn-primary text-xl">
            CineAura
          </Link>
        </div>
        <div className="flex-none gap-2">
          <div className="form-control">
            <input
              type="text"
              placeholder="Search"
              className="input input-bordered w-24 md:w-auto"
            />
          </div>
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle avatar"
            >
              <div className="w-10 rounded-full">
                <img
                  alt="Tailwind CSS Navbar component"
                  src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg"
                />
              </div>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
            >
              <li>
                <a className="justify-between font-bold text-md">
                  {auth.username ? auth.username : "Guest"}
                  {/* <span className="badge">New</span> */}
                </a>
              </li>
              <li>
                {!auth.username && (
                  <Link to={"/login"} className="justify-between">
                    Login
                  </Link>
                )}
              </li>

              <li>
                {auth.username && (
                  <Link to={"/"}>
                    <span
                      className="justify-between"
                      onClick={() => auth.logout()}
                    >
                      Logout
                    </span>
                  </Link>
                )}
              </li>
            </ul>
          </div>
        </div>
        <ThemeSwitcher />
      </div>
    </>
  );
};

export default Navbar;
