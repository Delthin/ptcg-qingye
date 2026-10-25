import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CardImagesProvider } from './context/CardImagesContext';
import { LanguageProvider } from './context/LanguageContext';
import { SnackbarProvider } from './context/SnackbarContext';
import { SettingsProvider } from './context/SettingsContext';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DeckEditPage } from './pages/DeckEditPage';
import { TablePage } from './pages/TablePage';
import { DuoHomePage } from './duo/DuoHomePage';
import { DuoDecksPage } from './duo/DuoDecksPage';
import { DuoRecordsPage } from './duo/DuoRecordsPage';
import { DuoSettingsPage } from './duo/DuoSettingsPage';
import { TutorialPage } from './tutorial/TutorialPage';
import { CollectionPage } from './collection/CollectionPage';
import { ShopPage } from './collection/ShopPage';
import { AdminEconomyPage } from './admin/AdminEconomyPage';

// A data router supplies a real blocker for unsaved drafts, including browser Back.
const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { element: <ProtectedRoute />, children: [{ element: <AppLayout />, children: [
    { path: '/games', element: <DuoHomePage /> },
    { path: '/deck', element: <DuoDecksPage /> },
    { path: '/deck/:deckId', element: <DeckEditPage /> },
    { path: '/collection', element: <CollectionPage /> },
    { path: '/shop', element: <ShopPage /> },
    { path: '/admin', element: <AdminEconomyPage /> },
    { path: '/records', element: <DuoRecordsPage /> },
    { path: '/tutorial', element: <TutorialPage /> },
    { path: '/settings', element: <DuoSettingsPage /> },
    { path: '/table/replay/:matchId', element: <TablePage /> },
    { path: '/table/saved-replay/:replayId', element: <TablePage /> },
    { path: '/table/:gameId', element: <TablePage /> },
  ] }] },
  { path: '/replays', element: <Navigate to="/records" replace /> },
  { path: '*', element: <Navigate to="/games" replace /> },
]);
if (import.meta.hot) import.meta.hot.dispose(() => router.dispose());
export default function App() {
  return <LanguageProvider><SnackbarProvider><AuthProvider><SettingsProvider><CardImagesProvider>
    <RouterProvider router={router} />
  </CardImagesProvider></SettingsProvider></AuthProvider></SnackbarProvider></LanguageProvider>;
}
