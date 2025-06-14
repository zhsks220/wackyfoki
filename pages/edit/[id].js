'use client';

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../../firebase/config';
import { useUser } from '@/contexts/UserContext';
import StarRating from '@/components/StarRating';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useTranslation } from 'next-i18next';

export default function EditRecipePage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [difficulty, setDifficulty] = useState(0);
  const [taste, setTaste] = useState(0);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [imageItems, setImageItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const snap = await getDoc(doc(db, 'recipes', id));
      if (!snap.exists()) return;

      const data = snap.data();
      if (data.uid !== user?.uid) {
        alert(t('alert_not_owner'));
        router.push('/');
        return;
      }

      setTitle(data.title || '');
      setDescription(data.description || '');
      setIngredients(data.ingredients || '');
      setCookTime(data.cookTime || '');
      setDifficulty(data.difficulty || 0);
      setTaste(data.taste || 0);
      setYoutubeUrl(data.youtubeUrl || '');

      const urls = data.imageUrls || [];
      const descs = data.descriptions || [];
      setImageItems(urls.map((url, i) => ({ url, desc: descs[i] || '' })));

      setLoading(false);
    };

    fetchData();
  }, [id, user, router, t]);

  const handleAddImages = (e) => {
    const files = Array.from(e.target.files);
    const newItems = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      desc: '',
    }));
    setImageItems(prev => [...prev, ...newItems]);
  };

  const handleDeleteImage = (index) => {
    setImageItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdate = async () => {
    if (!title.trim() || !description.trim()) {
      alert(t('alert_required_title_desc'));
      return;
    }

    const uploadedUrls = [];
    for (const item of imageItems) {
      if (item.url) {
        uploadedUrls.push(item.url);
      } else if (item.file) {
        const imageRef = ref(storage, `uploads/${item.file.name}-${Date.now()}`);
        const snap = await uploadBytes(imageRef, item.file);
        const url = await getDownloadURL(snap.ref);
        uploadedUrls.push(url);
      }
    }

    const descriptions = imageItems.map(i => i.desc);

    await updateDoc(doc(db, 'recipes', id), {
      title,
      description,
      ingredients,
      cookTime: Number(cookTime),
      difficulty,
      taste,
      youtubeUrl: youtubeUrl.trim(),
      imageUrls: uploadedUrls,
      descriptions,
      updatedAt: new Date(),
    });

    alert(t('alert_recipe_updated'));
    router.push(`/recipe/${id}`);
  };

  if (loading) return <p style={{ padding: '2rem' }}>{t('loading')}</p>;

  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>{t('edit_recipe_title')}</h1>

      <label>{t('label_title')}</label>
      <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} />

      <label>{t('label_ingredients')}</label>
      <textarea style={inputStyle} rows={2} value={ingredients} onChange={e => setIngredients(e.target.value)} />

      <label>{t('label_description')}</label>
      <textarea style={inputStyle} rows={6} value={description} onChange={e => setDescription(e.target.value)} />

      <label>{t('label_cook_time')}</label>
      <input style={inputStyle} type="number" value={cookTime} onChange={e => setCookTime(e.target.value)} />

      <label>{t('label_youtube')}</label>
      <input style={inputStyle} value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} />

      <label>{t('label_images')}</label>
      {imageItems.map((item, i) => (
        <div key={i} style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <img
            src={item.preview || item.url}
            alt="preview"
            style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 8 }}
          />
          <button
            onClick={() => handleDeleteImage(i)}
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: 'rgba(0,0,0,0.6)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: 28,
              height: 28,
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >✕</button>
          <textarea
            placeholder={t('placeholder_step_description')}
            rows={2}
            value={item.desc}
            onChange={e => {
              const newItems = [...imageItems];
              newItems[i].desc = e.target.value;
              setImageItems(newItems);
            }}
            style={{ ...inputStyle, marginTop: '0.5rem' }}
          />
        </div>
      ))}

      <input type="file" accept="image/*" multiple onChange={handleAddImages} style={{ marginBottom: '1.5rem' }} />

      <label style={{ display: 'block', marginBottom: 8 }}>{t('label_difficulty')}</label>
      <StarRating rating={difficulty} onRatingChange={setDifficulty} />
      <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '1.5rem' }}>
        {t('score_difficulty', { score: difficulty.toFixed(1) })}
      </p>

      <label style={{ display: 'block', marginBottom: 8 }}>{t('label_taste')}</label>
      <StarRating rating={taste} onRatingChange={setTaste} />
      <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '2rem' }}>
        {t('score_taste', { score: taste.toFixed(1) })}
      </p>

      <button onClick={handleUpdate} style={buttonStyle}>{t('button_save')}</button>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '0.5rem',
  fontSize: '1rem',
  marginBottom: '1.5rem',
};

const buttonStyle = {
  backgroundColor: '#3399ff',
  color: 'white',
  padding: '0.75rem 1.5rem',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: '1rem',
};
