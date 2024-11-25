// App.tsx
import React, { useState } from 'react';
//import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from './login';
import RecipeApp from './RecipeApp';
import Register from './register';
import { BrowserRouter as Router, Routes, Navigate, Route, Link } from 'react-router-dom';
import RecipeBuilder from './RecipeBuilder';

const App: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const handleLogin = () => {
        setIsLoggedIn(true);
    };

    return (
        <Router>

            <div className="container">
                <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
                    <Link className='navbar-brand' to='/'>RecipeApp</Link>
                    <Link className='navbar-nav' to='/recipebuilder'>Recipe Builder</Link>
                </nav>
                
                <Routes>
                    <Route path="/" element={isLoggedIn ? <Navigate to="/recipe" /> : <Login onLogin={handleLogin} />} />
                    <Route path="/recipe" element={isLoggedIn ? <RecipeApp /> : <Navigate to="/" />} />
                    <Route path="/register" element={<Register />} />
                    <Route path ="/recipebuilder" element={isLoggedIn ? <RecipeBuilder /> : <Navigate to="/" />} />
                </Routes>
            </div>            
        </Router>     
    );
};

export default App;
