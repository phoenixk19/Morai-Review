import getClientPromise from '../../../lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const client = await getClientPromise();
    const db = client.db(process.env.MONGODB_DB ?? 'morai');
    const coll = db.collection('reviews');

    const items = await coll.find().sort({ createdAt: -1 }).toArray();
    return NextResponse.json(items.map(i => ({ id: i._id.toString(), name: i.name, comment: i.comment, audio: i.audio ?? null })));
  } catch (err: any) {
    // Fallback to in-memory reviews for local development when MONGODB_URI not set
    // @ts-ignore
    globalThis.__REVIEWS = globalThis.__REVIEWS || [
      { id: '1', name: 'Alex Rivera', comment: 'The API latency is incredibly low. MORAI is the future!', audio: null },
      { id: '2', name: 'Sarah Chen', comment: 'Amazing design and very easy to integrate.', audio: null },
    ];
    // @ts-ignore
    return NextResponse.json(globalThis.__REVIEWS);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, comment, audio } = body;
    if (!name || !comment) return NextResponse.json({ error: 'name and comment required' }, { status: 400 });
    try {
      const client = await getClientPromise();
      const db = client.db(process.env.MONGODB_DB ?? 'morai');
      const coll = db.collection('reviews');

      const doc = { name, comment, audio: audio ?? null, createdAt: new Date() };
      const result = await coll.insertOne(doc);

      return NextResponse.json({ id: result.insertedId.toString(), ...doc }, { status: 201 });
    } catch (e) {
      // fallback to in-memory store
      // @ts-ignore
      globalThis.__REVIEWS = globalThis.__REVIEWS || [];
      // @ts-ignore
      const id = String(Date.now());
      const doc = { id, name, comment, audio: audio ?? null };
      // @ts-ignore
      globalThis.__REVIEWS.unshift(doc);
      return NextResponse.json(doc, { status: 201 });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
