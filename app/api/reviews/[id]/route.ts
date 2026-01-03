import getClientPromise from '../../../../lib/mongodb';
import { NextResponse } from 'next/server';

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    try {
      const client = await getClientPromise();
      const db = client.db(process.env.MONGODB_DB ?? 'morai');
      const coll = db.collection('reviews');
      const { ObjectId } = await import('mongodb');
      const result = await coll.deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 0) return NextResponse.json({ error: 'not found' }, { status: 404 });
      return NextResponse.json({ ok: true });
    } catch (e) {
      // fallback to in-memory
      // @ts-ignore
      if (!globalThis.__REVIEWS) return NextResponse.json({ error: 'not found' }, { status: 404 });
      // @ts-ignore
      globalThis.__REVIEWS = globalThis.__REVIEWS.filter((r: any) => r.id !== id);
      return NextResponse.json({ ok: true });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
