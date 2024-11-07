// App.tsx
import React, { useState } from 'react';
//import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from './login';
import RecipeApp from './RecipeApp';

const App: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const handleLogin = () => {
        setIsLoggedIn(true);
    };

    return (
        <div className="container">
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
                <a className="navbar-brand" href="#"> -RecipeApp</a>
            </nav>
            {isLoggedIn ? <RecipeApp /> : <Login onLogin={handleLogin} />}
        </div>
                                
    );
};

export default App;
