import React from 'react'
import { useState } from 'react'


function App() {
  let [color, setColor] = useState("black");

  return (
    <div className='h-screen w-full text-white text-weight-bold text-xl' style={{ backgroundColor: color }}>
      <div className="fixed flex flex-wrap justify-center bottom-12 inset-x-0 px-2">
        <div className='flex flex-wrap justify-center gap-2 shadow-lg bg-white px-3 py-2 rounded-3xl'>
          <button
            onClick={() => setColor("red")}
            className='outline-none px-4 py-1 rounded-full shadow-lg'
            style={{ backgroundColor: "red" }}
            >Red</button>
          <button
            onClick={() => setColor("green")}
            className='outline-none px-4 py-1 rounded-full shadow-lg'
            style={{ backgroundColor: "green" }}
          >Green</button>
          <button
            onClick={() => setColor("blue")}
            className='outline-none px-4 py-1 rounded-full shadow-lg'
            style={{ backgroundColor: "blue" }}
          >Blue</button>
          <button
            onClick={() => setColor("oklch(55.3% 0.195 38.402)")}
            className='outline-none px-4 py-1 rounded-full shadow-lg'
            style={{ backgroundColor: "oklch(55.3% 0.195 38.402)" }}
          >Orange</button>
          <button
            onClick={() => setColor("pink")}
            className='outline-none px-4 py-1 rounded-full shadow-lg'
            style={{ backgroundColor: "pink" }}
          >Pink</button>
          <button
            onClick={() => setColor("oklch(71.4% 0.203 305.504)")}
            className='outline-none px-4 py-1 rounded-full shadow-lg'
            style={{ backgroundColor: "oklch(71.4% 0.203 305.504)" }}
          >Purpel</button>
          <button
            onClick={() => setColor("oklch(45% 0.085 224.283)")}
            className='outline-none px-4 py-1 rounded-full shadow-lg'
            style={{ backgroundColor: "oklch(45% 0.085 224.283)" }}
          >Cyan</button>
          <button
            onClick={() => setColor("oklch(20.8% 0.042 265.755)")}
            className='outline-none px-4 py-1 rounded-full shadow-lg'
            style={{ backgroundColor: "oklch(20.8% 0.042 265.755)" }}
          >Slate</button>
          <button
            onClick={() => setColor(color)}
            className='outline-none px-4 py-1 rounded-full shadow-lg'
            style={{ backgroundColor: color }}
          >
            Defalut Color
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
