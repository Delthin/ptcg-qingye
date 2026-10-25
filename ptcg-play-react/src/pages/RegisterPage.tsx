import { Navigate } from 'react-router-dom';

/** Registration lives in the invitation-aware LoginPage; no legacy email flow. */
export function RegisterPage() {
  return <Navigate to="/login" replace />;
}
