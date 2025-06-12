import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useUser } from '@/contexts/UserContext';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function AgreePage() {
  const [agree, setAgree] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const router = useRouter();
  const auth = getAuth();
  const { refreshUser } = useUser();
  const { t } = useTranslation('common');

  useEffect(() => {
    if (!auth.currentUser) {
      alert(t('alert_login_required'));
      router.replace('/login');
    }
  }, []);

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) return alert(t('alert_no_user'));
    if (!agree || !privacy) return alert(t('alert_agree_required'));

    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        agreed: true,
        agreedAt: new Date(),
      }, { merge: true });

      await refreshUser();
      router.push('/profile/edit');
    } catch (err) {
      console.error(err);
      alert(t('alert_error'));
    }
  };

  return (
    <div className="max-w-lg mx-auto py-12 px-6">
      <h1 className="text-2xl font-bold mb-6">{t('agree_title')}</h1>

      <div className="space-y-4">
        <label className="block">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mr-2"
          />
          <span>
            <a href="/terms" target="_blank" className="underline text-blue-600">
              {t('terms')}
            </a>
            {t('agree_terms')}
          </span>
        </label>

        <label className="block">
          <input
            type="checkbox"
            checked={privacy}
            onChange={(e) => setPrivacy(e.target.checked)}
            className="mr-2"
          />
          <span>
            <a href="/privacy" target="_blank" className="underline text-blue-600">
              {t('privacy')}
            </a>
            {t('agree_privacy')}
          </span>
        </label>

        <button
          onClick={handleSubmit}
          className="mt-6 bg-black text-white py-2 px-6 rounded hover:bg-gray-800"
        >
          {t('agree_button')}
        </button>
      </div>
    </div>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common']))
    }
  };
}
