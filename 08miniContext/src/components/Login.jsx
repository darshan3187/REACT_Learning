import React, { useState, useContext } from 'react'
import UserContext from '../context/UserContext'

function Login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    const { setUser } = useContext(UserContext)

    const handleSubmit = (e) => {
        e.preventDefault()
        setUser({ username, password })
    }
    return (
        <div>
            <h2 className='text-5xl m-5'>Login</h2>
            <input type='text'
                className='block w-82 border-2 border-black p-1 rounded-md text-center m-4'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder='Username' />
            {" "}
            <input type='text'
                className='block w-82 border-2 border-black p-1 rounded-md text-center m-4'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='Password' />
            <button onClick={handleSubmit}>Submit</button>
        </div>
    )
}

export default Login