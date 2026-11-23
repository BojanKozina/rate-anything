import { createHashRouter } from 'react-router';
import AppLayout from './layout/AppLayout';
import HomePage from '@/features/home/HomePage';

export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
    ],
  },
]);
