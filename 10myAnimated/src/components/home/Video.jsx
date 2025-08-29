import React from 'react'

function Video() {
    return (

        <div className='h-full w-full'>
            <video src="/src/assets/video.mp4" autoPlay loop muted className='w-full h-full object-cover'></video>
        </div>

    )
}

export default Video
