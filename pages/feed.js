// pages/feed.js
import Head from 'next/head';

const dummyPosts = [
  {
    id: '1',
    title: '괴식 리뷰 1탄 - 라면에 초코소스',
    user: '괴식러1호',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  },
  {
    id: '2',
    title: '김치 아이스크림 후기',
    user: '오리진',
    thumbnail: 'https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg',
  },
];

export default function Feed() {
  return (
    <>
      <Head>
        <title>피드 | WackyFoki</title>
      </Head>
      <h1 className="text-2xl font-bold mb-4">🔥 최신 괴식 피드</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {dummyPosts.map((post) => (
          <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <img src={post.thumbnail} alt={post.title} className="w-full object-cover" />
            <div className="p-4">
              <h2 className="text-lg font-semibold">{post.title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">👤 {post.user}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
