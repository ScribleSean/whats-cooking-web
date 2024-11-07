// Login.tsx
import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const Register: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock authentication check
        if (username === 'user' && password === 'password') {
            setError('');
        } else {
            setError('Invalid username or password');
        }
    };

    return (
        <div className="row pt-5 justify-content-center">
            <div className="col max-width">
                <div className="card">
                    <div className="card-body">
                        <h2 className="card-title text-center mb-4">Register</h2>
                        <form onSubmit={handleLogin}>
                            <div className="mb-3">
                                <label htmlFor="username" className="form-label">Username</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="password" className="form-label">Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {error && <p className="text-danger">{error}</p>}
                            <button type="submit" className="btn btn-primary w-100">Register</button>
                        </form>
                    </div>
                    <div className="card-footer">
                        <a href="#" className='card-link'>Login here</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
