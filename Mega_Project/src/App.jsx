import { useEffect, useState } from 'react';
import './App.css'
import { useDispatch } from 'react-redux';
import authService from './appWritter/auth';
import { Header, Footer } from './components';
import {login , logout } from './store/authSlice';
import { Outlet } from 'react-router-dom';

function App() {

  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    authService.getCurrentUser()
      .then((user) => {
        if (user) {
          dispatch(login({user}));
        }
          dispatch(logout());
      })
      .finally(() => setLoading(false));
  }, []);

  return !loading ? (
    <div className="min-h-screen flex flex-wrap content-between">
      <div className='w-full block'>
        <Header />
        <main>
          {/* <Outlet /> */}
        </main>
        <Footer />
      </div>
    </div>
  ) : null
}

export default App
