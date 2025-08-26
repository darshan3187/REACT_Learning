import React, { useEffect, useState } from 'react'
import { useLoaderData } from 'react-router-dom'

function Github() {
    const data = useLoaderData();
    // const [data, setData] = useState([]);
    // useEffect(() => {
    //     fetch('https://api.github.com/users/darshan3187')
    //         .then((res) => res.json())
    //         .then((data) => setData(data))
    // }, [])
    return (
        <div className='text-3xl font-bold p-5 bg-gray-500 text-white text-center'>
            Github Followers: {data.followers}
            <div className='flex justify-center items-center '>
                <img className="w-80 mt-4 rounded-[50%]" src={data.avatar_url} alt="Git picture" />
            </div>

        </div>
    )
}

export default Github

export const githubInfoLoader = async () => {
    const res = await fetch('https://api.github.com/users/darshan3187');
    return res.json();
}