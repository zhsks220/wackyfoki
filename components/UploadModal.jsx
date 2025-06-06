'use client';

import { useState, useEffect } from 'react';
import { db, storage, auth } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUser } from '@/contexts/UserContext';
import { X, UploadCloud, Image as ImageIcon } from 'lucide-react';
import StarRating from './StarRating';
import { useTranslation } from 'next-i18next';

const CATEGORY_KEYS = ['meal', 'snack', 'dessert', 'drink', 'experimental'];

export default function UploadModal({ isOpen, onClose, onUploaded }) {
  const { t } = useTranslation('common');
  const { user } = useUser();

  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [taste, setTaste] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setIngredients('');
      setInstructions('');
      setCookTime('');
      setTaste(0);
      setDifficulty(0);
      setYoutubeUrl('');
      setImage(null);
      setPreview('');
      setCategory('');
    }
  }, [isOpen]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!title || !ingredients || !instructions) {
      alert(t('alert_fill_required'));
      return;
    }

    if (
      youtubeUrl.trim() !== '' &&
      !youtubeUrl.includes('youtube.com') &&
      !youtubeUrl.includes('youtu.be')
    ) {
      alert(t('alert_invalid_youtube'));
      return;
    }

    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert(t('alert_no_user'));
        return;
      }

      let imageUrl = '';
      if (image) {
        const imageRef = ref(storage, `images/${image.name}-${Date.now()}`);
        const snap = await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(snap.ref);
      }

      await addDoc(collection(db, 'recipes'), {
        title,
        ingredients,
        instructions,
        cookTime: cookTime ? Number(cookTime) : '',
        taste,
        difficulty,
        youtubeUrl: youtubeUrl.trim() || '',
        imageUrl,
        category,
        createdAt: serverTimestamp(),
        authorName: currentUser.displayName || t('anonymous'),
        authorImage: user?.profileImage || currentUser.photoURL || '',
        uid: currentUser.uid,
      });

      alert(t('upload_success'));
      onUploaded?.();
      onClose();
    } catch (err) {
      console.error(err);
      alert(t('upload_error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-4">
      <div className="bg-[var(--background)] text-[var(--foreground)] rounded-lg shadow-xl w-full max-w-md p-6 relative transition">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white"
        >
          <X />
        </button>

        <h2 className="text-lg font-bold mb-4">{t('upload_title')}</h2>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('placeholder_title')}
          className="w-full p-2 mb-3 rounded border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--foreground)]"
        />

        <textarea
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder={t('placeholder_ingredients')}
          rows={3}
          className="w-full p-2 mb-3 rounded border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--foreground)]"
        />

        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder={t('placeholder_instructions')}
          rows={6}
          className="w-full p-2 mb-3 rounded border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--foreground)]"
        />

        <input
          type="number"
          value={cookTime}
          onChange={(e) => setCookTime(e.target.value)}
          placeholder={t('placeholder_cook_time')}
          className="w-full p-2 mb-3 rounded border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--foreground)]"
        />

        <div className="mb-3">
          <label className="block mb-1 text-sm text-zinc-500">
            {t('taste_rating')}
          </label>
          <StarRating rating={taste} onRatingChange={setTaste} />
        </div>

        <div className="mb-3">
          <label className="block mb-1 text-sm text-zinc-500">
            {t('difficulty_rating')}
          </label>
          <StarRating rating={difficulty} onRatingChange={setDifficulty} />
        </div>

        <input
          type="text"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder={t('placeholder_youtube')}
          className="w-full p-2 mb-3 rounded border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--foreground)]"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-2 mb-3 rounded border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--foreground)]"
        >
          <option value="">{t('select_category')}</option>
          {CATEGORY_KEYS.map((key) => (
            <option key={key} value={key}>
              {t(`category_${key}`)}
            </option>
          ))}
        </select>

        <input
          id="upload"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
        <label
          htmlFor="upload"
          className="mb-2 inline-flex items-center gap-1 px-3 py-2 rounded cursor-pointer text-sm bg-[var(--input-bg)] hover:bg-zinc-200 text-[var(--foreground)]"
        >
          <ImageIcon size={16} /> {t('choose_file')}
        </label>

        {preview && (
          <img
            src={preview}
            alt={t('preview')}
            className="w-full max-h-60 object-cover rounded mb-3"
          />
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex justify-center items-center gap-2"
        >
          {loading ? t('uploading') : (
            <>
              <UploadCloud size={18} /> {t('upload')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
