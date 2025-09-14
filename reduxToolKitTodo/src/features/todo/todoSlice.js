import {createSlice , nanoid} from '@reduxjs/toolkit';

const initialState = {
    todos: [{id: 1 , text: "Hello WOrld"}]
}

// function sayHello(){
//     console.log("Hello REdux");
    
// }

export const todoSlice = createSlice({
    name: 'todo',
    initialState,
    reducers: {
        addTodo: (state , action) => {
            const todo = {
                id: nanoid(), // Use for generating random numbers
                text: action.payload
            }
            state.todos.push(todo)
        },
        removeTodo: () => {},
    }
})