'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter }      from 'next/router';
import Link               from 'next/link';
import Image              from 'next/image';

import { useUser } from '@/contexts/UserContext';
import { db }      from '@/firebase/config';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

export default function MyPage() {
  const { t }   = useTranslation('common');
  const router  = useRouter();
  const { user } = useUser();

  /* ---------------- state ---------------- */
  const [tab,        setTab]        = useState('my');     // 'my' | 'liked' | 'comments'
  const [sortOrder,  setSortOrder]  = useState('new');    // 'new' | 'old'
  const [userData,   setUserData]   = useState(null);
  const [myRecipes,  setMyRecipes]  = useState([]);
  const [liked,      setLiked]      = useState([]);
  const [comments,   setComments]   = useState([]);

  /* ------------- firestore fetch ------------- */
  useEffect(() => {
    if (!user) return;

    /** 기본 프로필 */
    const fetchUser = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) setUserData(snap.data());
    };

    /** 내가 올린 */
    const fetchMyRecipes = async () => {
      const q    = query(collection(db, 'recipes'), where('uid', '==', user.uid));
      const snap = await getDocs(q);
      setMyRecipes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };

    /** 좋아요 */
    const fetchLiked = async () => {
      const q    = query(collection(db, 'recipes'), where('likedBy', 'array-contains', user.uid));
      const snap = await getDocs(q);
      setLiked(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };

    /** 내가 쓴 댓글 */
    const fetchComments = async () => {
      const recipeSnap = await getDocs(collection(db, 'recipes'));
      const list = [];

      for (const r of recipeSnap.docs) {
        const cSnap = await getDocs(collection(db, `recipes/${r.id}/comments`));
        cSnap.forEach((c) => {
          const data = c.data();
          if (data.uid === user.uid) {
            list.push({
              recipeId:    r.id,
              recipeTitle: r.data().title,
              ...data,
            });
          }
        });
      }
      setComments(list);
    };

    fetchUser();
    fetchMyRecipes();
    fetchLiked();
    fetchComments();
  }, [user]);

  /* ------------- sort helper ------------- */
  const sortByTime = (arr) =>
    [...arr].sort((a, b) => {
      const aT = a.createdAt?.seconds ?? 0;
      const bT = b.createdAt?.seconds ?? 0;
      return sortOrder === 'new' ? bT - aT : aT - bT;
    });

  /* ------------- loading ------------- */
  if (!userData) return <div className="p-4">{t('loading')}</div>;

  /* ------------- UI ------------- */
  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* ------ Profile ------ */}
      <div className="flex items-center gap-4 mb-6">
        <Image
          src={userData.profileImage || '/default-profile.png'}
          alt={t('profile_image_alt')}
          width={80}
          height={80}
          className="rounded-full object-cover"
        />
        <div>
          <h2 className="text-2xl font-bold">
            {userData.displayName || t('no_nickname')}
          </h2>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>

        <button
          onClick={() => router.push('/profile/edit')}
          className="ml-auto text-sm text-blue-500 hover:underline"
        >
          ✏️ {t('edit_profile')}
        </button>
      </div>

      {/* ------ Tabs ------ */}
      <div className="flex gap-4 mb-2">
        {['my', 'liked', 'comments'].map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={tab === key ? 'font-bold underline' : 'text-gray-500'}
          >
            {t(key === 'my' ? 'my_feed' : key === 'liked' ? 'liked_feed' : 'my_comments')}
          </button>
        ))}
      </div>

      {/* ------ Sort ------ */}
      <div className="flex justify-end mb-4">
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="border px-2 py-1 rounded text-sm"
        >
          <option value="new">{t('newest')}</option>
          <option value="old">{t('oldest')}</option>
        </select>
      </div>

      {/* ------ My recipes ------ */}
      {tab === 'my' && (
        <div className="grid gap-4">
          {sortByTime(myRecipes).map((r) => (
            <div key={r.id} className="border p-3 rounded shadow">
              <Link href={`/recipe/${r.id}`} className="font-semibold hover:underline">
                {r.title}
              </Link>

              {r.imageUrl && (
                <Image
                  src={r.imageUrl}
                  alt={r.title}
                  width={300}
                  height={200}
                  className="rounded mt-2 object-cover"
                />
              )}

              <div className="flex justify-end mt-2">
                <button
                  onClick={() => router.push(`/edit/${r.id}`)}
                  className="text-sm text-blue-500 underline"
                >
                  ✏️ {t('edit')}
                </button>
              </div>
            </div>
          ))}

          {myRecipes.length === 0 && (
            <p className="text-gray-500">{t('no_my_feed')}</p>
          )}
        </div>
      )}

      {/* ------ Liked ------ */}
      {tab === 'liked' && (
        <div className="grid gap-4">
          {sortByTime(liked).map((r) => (
            <Link key={r.id} href={`/recipe/${r.id}`} className="border p-3 rounded shadow block">
              <div className="font-semibold">{r.title}</div>
              {r.imageUrl && (
                <Image
                  src={r.imageUrl}
                  alt={r.title}
                  width={300}
                  height={200}
                  className="rounded mt-2 object-cover"
                />
              )}
            </Link>
          ))}

          {liked.length === 0 && (
            <p className="text-gray-500">{t('no_liked_feed')}</p>
          )}
        </div>
      )}

      {/* ------ Comments ------ */}
      {tab === 'comments' && (
        <div className="space-y-4">
          {sortByTime(comments).map((c, i) => (
            <div key={i} className="border p-3 rounded shadow">
              <Link href={`/recipe/${c.recipeId}`} className="font-semibold hover:underline">
                {c.recipeTitle}
              </Link>
              <p className="text-sm text-gray-600 mt-1">{c.content}</p>
            </div>
          ))}

          {comments.length === 0 && (
            <p className="text-gray-500">{t('no_my_comments')}</p>
          )}
        </div>
      )}
    </div>
  );
}
