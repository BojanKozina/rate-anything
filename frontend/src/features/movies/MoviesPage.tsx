import { useNavigate } from 'react-router';

/** Games library. Placeholder for now. */
export default function MoviesPage() {
  const navigate = useNavigate();

  return (
    <div className="p-8 text-white">
      <button
        type="button"
        className="cursor-target mb-6 rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm hover:bg-white/20"
        onClick={() => navigate('/')}
      >
        ← Back
      </button>

      <h1 className="text-4xl font-bold">Movies</h1>

    </div>
  );
}