import { Database } from '@/lib/schema'
import { Session, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect, useState, useRef } from 'react'

type Todos = Database['public']['Tables']['todos']['Row']

export default function TaskManager({ session }: { session: Session }) {
  const supabase = useSupabaseClient<Database>()
  const [todos, setTodos] = useState<Todos[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [errorText, setErrorText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const modalRef = useRef<HTMLDivElement | null>(null);

  const user = session.user

  useEffect(() => {
    const fetchTodos = async () => {
      setIsLoading(true);
      const { data: todos, error } = await supabase
        .from('todos')
        .select('*')
        .order('id', { ascending: true })

      if (error) {
        console.error('Error fetching todos', error);
      } else {
        setTodos(todos);
        setIsLoading(false);
      }
    }

    fetchTodos()
  }, [supabase]);

  const addTodo = async (titleText: string, description: string) => {
    let title = titleText.trim();
    if (title.length) {
      const { data: todo, error } = await supabase
        .from('todos')
        .insert({ title, description, user_id: user.id })
        .select()
        .single();

      if (error) {
        if (error.message === 'new row for relation "todos" violates check constraint "todos_title_check"') {
          setErrorText('Task title should be more than 3 characters');
        } else {
          setErrorText(error.message);
        }
      } else {
        setTodos([...todos, todo]);
        setNewTaskTitle('');
        setNewTaskDescription('');
        setIsCreating(false);
      }
    }
  }

  const deleteTodo = async (id: number) => {
    try {
      await supabase.from('todos').delete().eq('id', id).throwOnError();
      setTodos(todos.filter((x) => x.id !== id));
    } catch (error) {
      console.error('Error deleting todo', error);
    }
  }

  const closeModal = () => {
    setIsCreating(false);
  };

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeModal();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex justify-center h-full">
      <div className="flex flex-col w-full max-w-screen-lg mt-4">
        <h1 className="mb-6 text-4xl text-center">Task Manager</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-green-500 text-white px-4 py-2 rounded mx-auto mb-4 w-full sm:w-[150px]"
        >
          + Create Task
        </button>
        {isLoading ? (
          <div>Loading...</div>
        ) : todos.length > 0 ? (
          <div className="mb-3 bg-white w-full h-auto md:min-w-[400px] shadow rounded-md">
            <ul>
              {todos.map((todo) => (
                <Task key={todo.id} todo={todo} onDelete={() => deleteTodo(todo.id)} />
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center text-gray-500">No tasks to display.</div>
        )}
      </div>
      {isCreating && (
        <div className="fixed p-2 inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 w-full max-w-md rounded relative" ref={modalRef}>
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-500 cursor-pointer hover:text-red-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-x-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
              </svg>
            </button>
            <h2 className="text-lg mt-4 mb-2">Create Task</h2>
            <form onSubmit={(e) => { e.preventDefault(); addTodo(newTaskTitle, newTaskDescription) }}>
              <input
                className="rounded border p-2 mb-2 w-full focus:outline-none"
                type="text"
                placeholder="Task title"
                value={newTaskTitle}
                onChange={(e) => {
                  setErrorText('')
                  setNewTaskTitle(e.target.value)
                }}
              />
              <textarea
                className="rounded border p-2 mb-2 w-full focus:outline-none"
                rows={4}
                placeholder="Task description"
                value={newTaskDescription}
                onChange={(e) => {
                  setErrorText('')
                  setNewTaskDescription(e.target.value)
                }}
              />
              {errorText && <Alert text={errorText}/>}
              <button className="bg-green-500 text-white px-4 py-2 rounded w-full" type="submit">
                Add Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const Task = ({ todo, onDelete }: { todo: Todos; onDelete: () => void }) => {
  const supabase = useSupabaseClient<Database>();
  const [isCompleted, setIsCompleted] = useState(todo.is_complete);

  const toggle = async () => {
    try {
      const { data } = await supabase
        .from('todos')
        .update({ is_complete: !isCompleted })
        .eq('id', todo.id)
        .throwOnError()
        .select()
        .single();

      if (data) setIsCompleted(data.is_complete);
    } catch (error) {
      console.error('Error toggling todo', error);
    }
  };

  return (
    <li className="w-full block cursor-pointer transition duration-150 ease-in-out hover:bg-gray-200">
      <div className="flex items-center px-4 py-4 sm:px-6">
        <div className="w-[200px] line-clamp-1 flex-1 flex items-center">
          <div className={`text-lg font-medium ${isCompleted ? 'line-through' : ''}`}>
            {todo.title} {todo.description && <p className="text-xs font-light">{todo.description}</p>}
          </div>
        </div>
        <div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            className="px-2 py-1 w-[70px] text-xs rounded bg-red-500 text-white hover:bg-red-600 ml-2"
          >
            Remove
          </button>
          <button
            onClick={() => toggle()}
            className={`px-2 w-[70px] py-1 text-xs rounded ml-2 border-gray-500 text-gray-500 hover:border-black ${isCompleted ? 'border-none' : 'border'}`}
          >
            {isCompleted ? <span className="text-green-500">✓ Done</span> : 'Complete'}
          </button>
        </div>
      </div>
    </li>
  );
};

const Alert = ({ text }: { text: string }) => (
  <div className="rounded-md bg-red-100 p-4 mb-3">
    <div className="text-sm leading-5 text-red-700">{text}</div>
  </div>
);
