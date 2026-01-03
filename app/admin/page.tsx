"use client";
import React, { useEffect, useState } from 'react';

interface Review { id: string; name: string; comment: string; audio?: string | null }

export default function AdminPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reviews');
      const items = await res.json();
      setReviews(items);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    const old = reviews;
    setReviews(prev => prev.filter(r => r.id !== id));
    try {
      const res = await fetch('/api/reviews/' + id, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
    } catch (e) {
      setReviews(old);
      alert('Delete failed');
    }
  };

  return (
    <div className="min-h-screen p-8 bg-[#010816] text-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Admin — Reviews</h2>
        {loading ? <p>Loading...</p> : (
          <div className="space-y-4">
            {reviews.map(r => (
              <div key={r.id} className="p-4 bg-white/5 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold">{r.name}</div>
                    <div className="text-sm text-gray-300">{r.comment}</div>
                    {r.audio ? <audio src={r.audio} controls className="w-full mt-2" /> : null}
                  </div>
                  <div>
                    <button onClick={() => remove(r.id)} className="bg-red-600 px-3 py-2 rounded">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
