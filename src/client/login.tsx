// Login.tsx
import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

interface LoginProps {
    onLogin: (userData: UserData) => void;
}

interface UserData {
	email: string;
}

interface LoginResponse {
	success: boolean;
	message: string;
	user?: { email: string };
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
	
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
	setError('');
	setIsLoading(true);
	
	try {
		const response = await fetch('/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				username,
				password,
			}),
		});
		// console.log(username);

		const data: LoginResponse = await response.json();
        console.log("Received login response:", data);
		if (data.success && data.user) {
			console.log("Login successful, setting user email:", username);
            onLogin({ email: username });
		}
		else {
			setError(data.message || 'Invalid username or password');	
		}	
	} catch (error) {
		setError('An error occured while logging in');
		console.error('Login error: ', error);
	} finally {
		setIsLoading(false);
	}
    };

    return (
        <div className="row pt-5 justify-content-center">
            <div className="col max-width">
                <div className="card">
                    <div className="card-body">
                        <h2 className="card-title text-center mb-4">Login</h2>
                        <form onSubmit={handleLogin}>
                            <div className="mb-3">
                                <label htmlFor="username" className="form-label">Email</label>
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
                            <button type="submit" className="btn btn-primary w-100">Login</button>
                        </form>
                    </div>
                    <div className="card-footer">
                        <a href="/register" className='card-link'>Register Here</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
