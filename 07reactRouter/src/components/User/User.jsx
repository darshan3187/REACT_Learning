import React from 'react'
import { useParams } from 'react-router-dom'

function User() {
    const { userId } = useParams();
    return (
        <div className='text-3xl font-bold p-5 bg-gray-500 text-white text-center'>
            User: {userId}
        </div>
    )
}

export default User
