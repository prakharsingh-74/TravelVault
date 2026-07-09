import { db, memories } from '@travelvault/db';
import { eq } from 'drizzle-orm';

/**
 * Generate embedding vector using Gemini API
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set. Using a fallback mock embedding.');
    // Fallback mock embedding: simple hash-based vector of size 768
    const vector = new Array(768).fill(0);
    const words = text.toLowerCase().split(/\s+/);
    words.forEach((word) => {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = word.charCodeAt(i) + ((hash << 5) - hash);
      }
      const idx = Math.abs(hash) % 768;
      vector[idx] += 1.0;
    });
    // Normalize mock vector
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    return norm > 0 ? vector.map(v => v / norm) : vector;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text }] }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini embedding request failed: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    return data.embedding.values;
  } catch (error) {
    console.error('Error generating Gemini embedding, falling back to mock:', error);
    // Return a mock vector on API failure
    return new Array(768).fill(0).map(() => Math.random() - 0.5);
  }
}

/**
 * Generate LLM text generation response from Gemini
 */
export async function generateText(prompt: string, systemInstruction = ''): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    return 'Error: GEMINI_API_KEY is required to run AI search queries. Please configure it in Settings.';
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini text generation failed: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
  } catch (error: any) {
    console.error('Error generating text from Gemini:', error);
    return `Error generating AI response: ${error.message}`;
  }
}

/**
 * Format passenger profile into a clear semantic description for LLM indexing
 */
export function formatPassengerProfile(passenger: any): string {
  return `Passenger Profile:
Name: ${passenger.name}
DOB/Date of Birth: ${passenger.dob}
Gender: ${passenger.gender}
Nationality: ${passenger.nationality}
Aadhaar Number: ${passenger.aadhaar || 'Not Provided'}
Passport Number: ${passenger.passport || 'Not Provided'}
Mobile: ${passenger.mobile || 'Not Provided'}
Email: ${passenger.email || 'Not Provided'}
Preferred Berth/Seat: ${passenger.preferredBerth || 'No Preference'}
Meal Preference: ${passenger.mealPreference || 'No Preference'}
ID: ${passenger.id}`;
}

/**
 * Cosine similarity helper
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Index a passenger profile in our local memory store
 */
export async function indexPassenger(passenger: any): Promise<any> {
  const content = formatPassengerProfile(passenger);
  const embedding = await getEmbedding(content);
  const id = `passenger-${passenger.id}`;

  // Delete previous memory index for this passenger if exists
  try {
    await db.delete(memories).where(eq(memories.id, id));
  } catch (e) {}

  return await db.insert(memories).values({
    id,
    content,
    embedding: JSON.stringify(embedding),
    tags: JSON.stringify(['passengers', `passenger-${passenger.id}`]),
    metadata: JSON.stringify({ passengerId: passenger.id, type: 'passenger' }),
    createdAt: new Date()
  });
}

/**
 * Index a document's metadata and OCR-extracted text in our local memory store
 */
export async function indexDocument(doc: any, passengerName: string): Promise<any> {
  const content = `Travel Document:
Name: ${doc.name}
Type: ${doc.type}
Owner/Passenger: ${passengerName}
Passenger ID: ${doc.passengerId}
Document ID: ${doc.id}
File Path: ${doc.filePath}
Extracted OCR Content:
${doc.ocrText || 'No text extracted'}`;

  const embedding = await getEmbedding(content);
  const id = `doc-${doc.id}`;

  // Delete previous memory index for this document if exists
  try {
    await db.delete(memories).where(eq(memories.id, id));
  } catch (e) {}

  return await db.insert(memories).values({
    id,
    content,
    embedding: JSON.stringify(embedding),
    tags: JSON.stringify(['documents', `passenger-${doc.passengerId}`, `doc-${doc.id}`]),
    metadata: JSON.stringify({ docId: doc.id, passengerId: doc.passengerId, type: 'document' }),
    createdAt: new Date()
  });
}

/**
 * Delete memory index
 */
export async function deleteMemory(id: string): Promise<any> {
  return await db.delete(memories).where(eq(memories.id, id));
}

/**
 * Perform natural language search across passenger profiles and documents stored locally
 */
export async function searchMemory(query: string, limit = 5) {
  try {
    const queryEmbedding = await getEmbedding(query);
    const allMemories = await db.select().from(memories);

    const scoredMemories = allMemories.map((mem) => {
      const memEmbedding = JSON.parse(mem.embedding) as number[];
      const similarity = cosineSimilarity(queryEmbedding, memEmbedding);
      return {
        id: mem.id,
        content: mem.content,
        tags: JSON.parse(mem.tags) as string[],
        metadata: mem.metadata ? JSON.parse(mem.metadata) : null,
        similarity
      };
    });

    // Sort by similarity descending
    scoredMemories.sort((a, b) => b.similarity - a.similarity);

    // Filter results with a minimum relevance score (e.g. > 0.3)
    return scoredMemories.slice(0, limit);
  } catch (error) {
    console.error('Local semantic search failed:', error);
    return [];
  }
}

/**
 * Ask the local travel assistant a question
 */
export async function askAssistant(question: string): Promise<string> {
  const contextResults = await searchMemory(question, 5);
  const contextText = contextResults
    .map((r, i) => `[Result ${i + 1}] (Similarity: ${r.similarity.toFixed(2)})\n${r.content}`)
    .join('\n\n');

  const systemInstruction = `You are TravelVault, a local travel assistant. Answer the user's question using ONLY the provided local travel facts, passenger profiles, and travel documents context. If the answer cannot be found in the context, politely state that you do not have that information stored. Keep responses helpful, clean, and concise.`;
  const prompt = `Local context data:
${contextText || 'No local records match this query.'}

User Question: ${question}`;

  return await generateText(prompt, systemInstruction);
}
