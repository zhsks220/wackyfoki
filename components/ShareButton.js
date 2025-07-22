import { useState, useEffect } from 'react';
import { 
  FaShare, 
  FaInstagram, 
  FaLink,
  FaTimes
} from 'react-icons/fa';
import { RiKakaoTalkFill } from 'react-icons/ri';
import { useTranslation } from 'next-i18next';
import { motion, AnimatePresence } from 'framer-motion';

export default function ShareButton({ recipe, url }) {
  const { t } = useTranslation('common');
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareTitle = recipe?.title || '';
  const shareText = recipe?.description || '';

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        setShowModal(false);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleInstagramShare = () => {
    // Instagram doesn't support direct URL sharing, show instructions
    if (isMobile) {
      // On mobile, copy link and open Instagram app if available
      handleCopyLink();
      setTimeout(() => {
        window.location.href = 'instagram://app';
      }, 1000);
    } else {
      // On desktop, show instructions
      alert(t('instagram_share_instruction', 'Copy the link and share it in your Instagram story or bio!'));
      handleCopyLink();
    }
  };

  const shareOptions = [
    {
      name: 'Instagram',
      icon: FaInstagram,
      color: '#E4405F',
      onClick: handleInstagramShare,
      primary: true
    },
    {
      name: 'KakaoTalk',
      icon: RiKakaoTalkFill,
      color: '#FEE500',
      onClick: () => {
        // KakaoTalk sharing requires SDK setup
        alert(t('kakaotalk_share_coming_soon', 'KakaoTalk sharing coming soon!'));
      }
    },
    {
      name: t('copy_link', 'Copy Link'),
      icon: FaLink,
      color: 'var(--card-text)',
      onClick: handleCopyLink
    }
  ];

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--card-text)',
          transform: 'translateY(1px)'
        }}
      >
        <FaShare style={{ fontSize: '1.1rem' }} />
        <span style={{ fontSize: '0.9rem' }}>{t('share', 'Share')}</span>
      </button>

      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1000,
              }}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'var(--recipe-card-bg)',
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                padding: '1.5rem',
                zIndex: 1001,
                maxHeight: '70vh',
                overflowY: 'auto',
                boxShadow: '0 -2px 20px rgba(0, 0, 0, 0.1)',
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{t('share_recipe', 'Share Recipe')}</h3>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--card-text)',
                    padding: '0.5rem'
                  }}
                >
                  <FaTimes size={20} />
                </button>
              </div>

              {/* Native Share Button (Mobile) */}
              {isMobile && navigator.share && (
                <button
                  onClick={handleNativeShare}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    marginBottom: '1rem',
                    backgroundColor: '#E4405F',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FaShare />
                  {t('share_with_apps', 'Share with Apps')}
                </button>
              )}

              {/* Instagram Story Preview */}
              {recipe?.imageUrls?.[0] && (
                <div style={{
                  position: 'relative',
                  marginBottom: '1.5rem',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: '#f0f0f0',
                  aspectRatio: '9/16',
                  maxHeight: '200px',
                  margin: '0 auto 1.5rem',
                  width: 'auto'
                }}>
                  <img 
                    src={recipe.imageUrls[0]} 
                    alt={recipe.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.8))',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '1rem',
                    color: 'white'
                  }}>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      textShadow: '0 1px 3px rgba(0,0,0,0.5)'
                    }}>
                      {recipe.title}
                    </p>
                    <p style={{ 
                      margin: '0.25rem 0 0', 
                      fontSize: '0.7rem',
                      opacity: 0.9,
                      textShadow: '0 1px 3px rgba(0,0,0,0.5)'
                    }}>
                      {t('tap_to_view_recipe', 'Tap to view recipe')}
                    </p>
                  </div>
                </div>
              )}

              {/* Share Options Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                {shareOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.name}
                      onClick={option.onClick}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '1rem',
                        border: option.primary ? '2px solid' : '1px solid',
                        borderColor: option.primary ? option.color : 'var(--border-color)',
                        borderRadius: '12px',
                        backgroundColor: option.primary ? `${option.color}10` : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        ...(option.primary && {
                          gridColumn: 'span 3',
                          flexDirection: 'row',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          fontSize: '1.1rem',
                          fontWeight: '500'
                        })
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <Icon 
                        size={option.primary ? 24 : 20} 
                        color={option.color === 'var(--card-text)' ? undefined : option.color} 
                      />
                      <span style={{ 
                        fontSize: option.primary ? '1rem' : '0.8rem',
                        marginTop: option.primary ? 0 : '0.5rem',
                        color: option.primary ? option.color : 'var(--card-text)'
                      }}>
                        {option.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Copy Success Message */}
              {copied && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: '#E4405F',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    zIndex: 1002
                  }}
                >
                  {t('link_copied', 'Link copied!')}
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}