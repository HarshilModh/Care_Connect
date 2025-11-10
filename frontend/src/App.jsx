import { Routes, Route, useLocation } from 'react-router-dom';
import './App.css'
import NavbarTwo from './components/Navbar'
import Home from './pages/Home'
import Landing from './pages/Landing';
import SignUp from './pages/Signup';
import SignIn from './pages/SignIn';
import VerifySuccess from './pages/VerifySuccess';



function App() {

  const location = useLocation();
  const hideNavbarRoutes = ['/signin', '/signup'];
  const HideNavbar = hideNavbarRoutes.includes(location.pathname);

  return (

    <>
      {!HideNavbar && <NavbarTwo />}

      <Routes>
        <Route path='/' element={<Landing />} />
        <Route path='/verify-success' element={<VerifySuccess />} />
        <Route path='/home' element={<Home />} />

        {/* <Route path='/dashbaord' element={<PrivateRoute />}>
          <Route path='/dashboard' element={<Dashbaord />} />
        </Route> */}
        <Route path='/signin' element={<SignIn />} />
        <Route path='/signup' element={<SignUp />} />
      </Routes >
    </>




  )
}

export default App
