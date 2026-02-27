import { getInitialWords } from '@/lib/supabase';
import GameBoard from '@/components/GameBoard';

export default async function HomePage() {
  const initialWords = await getInitialWords();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            무한 소녀 🌸
          </h1>
          <p className="text-slate-500 text-sm mt-1">단어를 조합해 새로운 세계를 발견하세요</p>
        </header>

        <GameBoard initialWords={initialWords} />
      </div>
    </main>
  );
}
