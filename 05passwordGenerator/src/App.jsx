import { useState, useCallback, useEffect, useRef } from "react"


function App() {
  const [length, setLength] = useState(8);
  const [numberAllowed, setNumberAllowed] = useState(false);
  const [charAllowed, setCharAllowed] = useState(false);
  const [password, setPassword] = useState("");

  /**useRef is a hook that allows to directly create a reference to the DOM element in the functional component.
   * Here,
   * we use useRef to get reference of input field to select the text when we copy it
   * so that user can see that text is copied
   */
  const passwordRef = useRef(null);

  /* useCallback is use to avoid re rendering of function whenever any state changes
  it will only re render when any dependency changes.here dependencies are length, numberAllowed, charAllowed.
  setPassword is not a dependency because it is a function provided by useState and it will never change
  so it is safe to ignore it but is best practice to include it.
  if we don't use useCallback here, passwordGenerator function
  will be recreated on every render and useEffect will */
  const passwordGenerator = useCallback(() => {
    let pass = "";
    let str = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    if (numberAllowed) str += "0123456789";
    if (charAllowed) str += "!@#$%^&*()_+-?";

    for (let i = 1; i <= length; i++) {
      let char = Math.floor(Math.random() * str.length + 1);
      pass += str.charAt(char);
    }
    setPassword(pass);
  }, [length, numberAllowed, charAllowed, setPassword])

  /* copy password to clipboard
    we use useCallback here to avoid recreating function on every render
    it will only recreate when password changes
    we don't need to include passwordRef in dependency array because it is a ref and it will never change
    so it is safe to ignore it but is best practice to include it
    here we use optional chaining operator (?.) to avoid error if passwordRef.current is null
    it will only call select() and setSelectionRange() if passwordRef.current is not null
    navigator.clipboard.writeText() is a method that writes text to the system clipboard
    it is supported in most modern browsers but not in all browsers
    so we can use a fallback method to copy text to clipboard if it is not supported
    but for simplicity we are not using fallback method here
    also, clipboard API only works on secure contexts (https or localhost) */
  const copyPasswordToClipboard = useCallback(() => {
    window.navigator.clipboard.writeText(password);
    passwordRef.current?.select();
    passwordRef.current?.setSelectionRange(0, 999); // For mobile devices 
  }, [password])

  // useEffect is use to call passwordGenerator function whenever length, numberAllowed, charAllowed changes
  // we call it initially to generate password when component mounts
  // we include passwordGenerator in dependency array to avoid warning
  // but it will not cause infinite loop because passwordGenerator is memoized using useCallback
  useEffect(() => {
    passwordGenerator();
  }, [length, numberAllowed, charAllowed, passwordGenerator]);

  // JSX code
  return (
    <>
      <div className="w-full max-w-md mx-auto shadow-md rounded-lg px-4 my-8 text-orange-700 bg-gray-800">
        <h1 className="text-xl pt-4 text-center text-sky-600">Password Generator</h1>
        {/* This shows password & we copy it */}
        <div className="flex-shadow rounded-lg overflow-hidden mb-4 flex">
          <input
            type="text"
            value={password}
            className=" outline-none w-full py-1 px-3 bg-white m-5 rounded"
            placeholder="Random Password"
            readOnly
            ref={passwordRef}
          />
          <button
            onClick={copyPasswordToClipboard}
            className="cursor-pointer hover:bg-emerald-600 focus:outline-2 text-white bg-emerald-800 my-5 p-3 rounded shrink-0">Copy</button>
        </div>

        <div className="flex text-sm gap-x-2 pb-5">
          {/* Range of Passwrod */}
          <div className="flex items center gap-x-1">
            <input
              type="range"
              min={6}
              max={100}
              value={length}
              className="cursor-pointer"
              onChange={(e) => { setLength(e.target.value) }}
            />
            <label classNamme="text-2xl">Length: {length}</label>
          </div>
          {/* if it true numbers are include in password */}
          <div className="flex items-center gap-x-2">
            <input
              type="checkbox"
              defaultChecked={numberAllowed}
              id="numberInput"
              onChange={() => {
                setNumberAllowed((prev) => !prev);
              }} />
            <label htmlFor="numberInput" className="text-md">Numbers</label>
          </div>
          {/* if it true Characters are include in password */}
          <div className="flex items-center gap-x-2">
            <input
              type="checkbox"
              defaultChecked={charAllowed}
              id="charInput"
              onChange={() => {
                setCharAllowed((prev) => !prev);
              }} />
            <label htmlFor="charInput" className="text-md">Characters</label>
          </div>
        </div>
      </div>
    </>
  )
}

// exporting App component as default export
export default App
