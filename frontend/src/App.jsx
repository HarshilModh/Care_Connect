import { Routes, Route, useLocation } from "react-router-dom";
import NavbarTwo from "./components/Navbar";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import SignUp from "./pages/Signup";
import SignIn from "./pages/SignIn";
import VerifySuccess from "./pages/VerifySuccess";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CreateGroup from "./components/familyGroups/CreateGroup";
import AddMembers from "./components/familyGroups/AddMembers";
import "./App.css"; // import your css

function App() {
  const location = useLocation();

  const hideNavbarRoutes = ["/signin", "/signup"];
  const hideNavbar = hideNavbarRoutes.includes(location.pathname);

  return (
    <div className="app-wrapper">
      {!hideNavbar && <NavbarTwo />}

      <div className="page-center">
        <div className="page-container">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/verify-success" element={<VerifySuccess />} />
            <Route path="/home" element={<Home />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/createGroup" element={<CreateGroup />} />
            <Route path="/addMember" element={<AddMembers />} />

            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
