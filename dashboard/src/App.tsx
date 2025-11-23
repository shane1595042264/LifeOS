import { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import './App.css';

type Space = {
  id: string;
  name: string;
  slug: string;
  createdAt?: { seconds: number; nanoseconds: number };
  createdBy?: string;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [spaceName, setSpaceName] = useState('');
  const [spaceSlug, setSpaceSlug] = useState('');
  const [spaceError, setSpaceError] = useState<string | null>(null);
  const [loadingSpaces, setLoadingSpaces] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setSpaces([]);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoadingSpaces(true);
    const q = query(
      collection(db, 'spaces'),
      orderBy('createdAt', 'desc'),
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items: Space[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: doc.id,
            name: data.name,
            slug: data.slug,
            createdAt: data.createdAt,
            createdBy: data.createdBy,
          });
        });
        setSpaces(items);
        setLoadingSpaces(false);
      },
      (err) => {
        setSpaceError(err.message);
        setLoadingSpaces(false);
      },
    );
    return () => unsub();
  }, [user]);

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setAuthError((err as Error).message);
    }
  };

  const handleSignUp = async () => {
    setAuthError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setAuthError((err as Error).message);
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    await signOut(auth);
  };

  const createSpace = async () => {
    setSpaceError(null);
    if (!spaceName || !spaceSlug) {
      setSpaceError('Name and slug are required.');
      return;
    }
    try {
      await addDoc(collection(db, 'spaces'), {
        name: spaceName,
        slug: spaceSlug,
        createdAt: serverTimestamp(),
        createdBy: user?.uid ?? null,
      });
      setSpaceName('');
      setSpaceSlug('');
    } catch (err) {
      setSpaceError((err as Error).message);
    }
  };

  const sortedSpaces = useMemo(() => spaces, [spaces]);

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <p className="eyebrow">LifeOS Documentation Dashboard</p>
          <h1>Docs Control Panel</h1>
          <p className="muted">
            Firebase-backed dashboard for spaces/pages. Sign in, create a space,
            and we will expand into pages/editing next.
          </p>
        </div>
        <div className="pill">
          <span className="dot" />
          <span>Connected to Firestore</span>
        </div>
      </header>

      {!user && (
        <section className="card auth-card">
          <h2>Authenticate</h2>
          <p className="muted">
            Use email/password for now (enable in Firebase console). We can swap
            to OIDC/passwordless later.
          </p>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {authError && <p className="error">{authError}</p>}
          <div className="actions">
            <button onClick={handleSignIn}>Sign In</button>
            <button className="secondary" onClick={handleSignUp}>
              Create Account
            </button>
          </div>
        </section>
      )}

      {user && (
        <section className="grid">
          <div className="card">
            <div className="card__header">
              <div>
                <h2>Spaces</h2>
                <p className="muted">Collections for pages and rules.</p>
              </div>
              <div className="user">
                <span className="muted">Signed in as</span>
                <strong>{user.email}</strong>
                <button className="link" onClick={handleSignOut}>
                  Sign out
                </button>
              </div>
            </div>

            <div className="field inline">
              <div className="field">
                <label>Name</label>
                <input
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  placeholder="Product Docs"
                />
              </div>
              <div className="field">
                <label>Slug</label>
                <input
                  value={spaceSlug}
                  onChange={(e) => setSpaceSlug(e.target.value)}
                  placeholder="product-docs"
                />
              </div>
              <button onClick={createSpace}>Create Space</button>
            </div>
            {spaceError && <p className="error">{spaceError}</p>}

            <div className="list">
              {loadingSpaces && <p className="muted">Loading spaces…</p>}
              {!loadingSpaces && sortedSpaces.length === 0 && (
                <p className="muted">No spaces yet. Create one above.</p>
              )}
              {sortedSpaces.map((space) => (
                <div key={space.id} className="list__item">
                  <div>
                    <p className="label">{space.name}</p>
                    <p className="muted">/{space.slug}</p>
                  </div>
                  <div className="muted small">
                    {space.createdAt
                      ? new Date(
                          space.createdAt.seconds * 1000,
                        ).toLocaleString()
                      : 'pending'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2>Next Steps</h2>
            <ul className="bullets">
              <li>Hook rules/approvals via Cloud Functions on publish.</li>
              <li>Add pages/blocks editor (TipTap + Yjs Firestore provider).</li>
              <li>Role-based Firestore/Storage security rules.</li>
              <li>Algolia search indexing or Firestore queries.</li>
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
