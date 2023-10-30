import Head from 'next/head';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Auth, ThemeSupa } from '@supabase/auth-ui-react';
import TodoList from '@/components/TodoList';

export default function Home() {
  const session = useSession();
  const supabase = useSupabaseClient();

  return (
    <>
      <Head>
        <title>Tasks List App</title>
        <meta name="description" content="tasks list app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="w-full h-full bg-gray-100 overflow-auto">
        {!session ? (
          <div className="min-w-full min-h-screen flex items-center justify-center">
            <div className="w-full h-full flex justify-center items-center p-4">
              <div className="w-full h-full sm:h-auto sm:w-2/5 max-w-sm p-5 bg-white shadow flex flex-col text-base">
                <span className="font-sans text-4xl text-center pb-2 mb-1 border-b mx-4 align-center">
                  Login
                </span>
                <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} theme="dark" />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full p-4 flex flex-col items-center">
            <button
              className="btn-black text-xs w-auto mt-2 ml-auto"
              onClick={async () => {
                const { error } = await supabase.auth.signOut();
                if (error) console.log('Error logging out:', error.message);
              }}
            >
              Logout
            </button>
            <div
              className="w-full h-full flex flex-col justify-center"
            >
              <TodoList session={session} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
