import { createHashRouter } from 'react-router';
import AppLayout from './layout/AppLayout';
import HomePage from '@/features/home/HomePage';
import GamesPage from '@/features/games/GamesPage';
import MoviesPage from '@/features/movies/MoviesPage';
import BooksPage from '@/features/books/BooksPage';

export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },    
      { path: 'games', element: <GamesPage /> },
      {path:'movies', element:<MoviesPage/>},
      {path:'books', element:<BooksPage/>}
    ],
  },
]);