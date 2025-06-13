'use client';

import { useState, useEffect } from 'react';
import { db, storage, auth } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUser } from '@/contexts/UserContext';
import { X, UploadCloud, Image as ImageIcon } from 'lucide-react';
import StarRating from './StarRating';
import { useTranslation } from 'next-i18next';
import { ReactSortable } from 'react-sortablejs';

const CATEGORY_KEYS = ['meal', 'snack', 'dessert', 'drink', 'experimental'];

export default function UploadModal({ isOpen, onClose, onUploaded }) {
  const { t } = useTranslation('common');
  const { user } = useUser();

  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [description, setDescription] = useState(''); // 조리과정 추가
  const [cookTime, setCookTime] = useState('');
  const [taste, setTaste] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [steps, setSteps] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setIngredients('');
      setDescription('');
      setCookTime('');
      setTaste(0);
      setDifficulty(0);
      setYoutubeUrl('');
      setSteps([]);
      setCategory('');
    }
  }, [isOpen]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newItems = files.map((file) => ({
      id: `${file.name}-${Date.now()}`,
      file,
      preview: URL.createObjectURL(file),
      description: '',
    }));
    setSteps((prev) => [...prev, ...newItems]);
  };

  const handleRemoveStep = (id) => {
    setSteps((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async () => {
    if (!title || !ingredients || !description) {
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

      const imageUrls = [];
      const descriptions = [];

      for (const step of steps) {
        const imageRef = ref(storage, `uploads/${step.file.name}-${Date.now()}`);
        const snap = await uploadBytes(imageRef, step.file);
        const url = await getDownloadURL(snap.ref);
        imageUrls.push(url);
        descriptions.push(step.description);
      }

      await addDoc(collection(db, 'recipes'), {
        title,
        ingredients,
        description, // ✅ 조리 과정 필드로 저장
        cookTime: cookTime ? Number(cookTime) : '',
        taste,
        difficulty,
        youtubeUrl: youtubeUrl.trim() || '',
        imageUrls,
        descriptions,
        category,
        createdAt: serverTimestamp(),
        authorName: user?.displayName || t('anonymous'),
        authorImage: user?.photoURL || '',
        uid: currentUser.uid,
      });

      alert(t('upload_success'));
      onUploaded?.();
      onClose();
    } catch (err) {
      console.error('🔥 Firebase Upload Error:', err);
      alert(`${t('upload_error')}\n\n${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-4">
      <div
        className="bg-[var(--background)] text-[var(--foreground)] rounded-lg shadow-xl w-full max-w-md p-6 relative transition overflow-y-auto scrollbar-hide"
        style={{ maxHeight: '90vh' }}
      >
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
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('placeholder_description')}
          rows={5}
          className="w-full p-2 mb-3 rounded border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--foreground)]"
        />

        <input
          type="number"
          value={cookTime}
          onChange={(e) => setCookTime(e.target.value)}
          placeholder={t('placeholder_cook_time')}
          className="w-full p-2 mb-3 rounded border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--foreground)]"
        />

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
          multiple
          onChange={handleImageChange}
          className="hidden"
        />
        <label
          htmlFor="upload"
          className="mb-2 inline-flex items-center gap-1 px-3 py-2 rounded cursor-pointer text-sm bg-[var(--input-bg)] hover:bg-zinc-200 text-[var(--foreground)]"
        >
          <ImageIcon size={16} /> {t('choose_file')}
        </label>

        {steps.length > 0 && (
          <ReactSortable
            list={steps}
            setList={setSteps}
            className="space-y-3 mb-4 max-h-60 overflow-y-auto"
          >
            {steps.map((item, index) => (
              <div key={item.id} className="relative bg-zinc-100 p-2 rounded">
                <img
                  src={item.preview}
                  alt={`preview-${index}`}
                  className="w-full h-32 object-cover rounded mb-2"
                />
                <textarea
                  placeholder={t('placeholder_step_description')}
                  value={item.description}
                  onChange={(e) => {
                    const newSteps = [...steps];
                    newSteps[index].description = e.target.value;
                    setSteps(newSteps);
                  }}
                  rows={2}
                  className="w-full p-1 rounded border border-zinc-300 text-sm"
                />
                <button
                  onClick={() => handleRemoveStep(item.id)}
                  className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full w-6 h-6 text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </ReactSortable>
        )}

        <div className="mb-3">
          <label className="block mb-1 text-sm text-zinc-500">{t('difficulty_rating')}</label>
          <StarRating rating={difficulty} onRatingChange={setDifficulty} />
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-sm text-zinc-500">{t('taste_rating')}</label>
          <StarRating rating={taste} onRatingChange={setTaste} />
        </div>

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
