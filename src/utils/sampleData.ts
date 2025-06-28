/**
 * @file utils/sampleData.ts
 * @description 開発・テスト用のサンプルデータ
 * 
 * @see docs/design/sample-data.md
 * 
 * @related
 * - types/models.ts: データモデル定義
 * - services/db.service.ts: データベース操作
 */

import { Phrase } from '@/types/models';
import { addDays, subDays } from 'date-fns';

export const samplePhrases: Omit<Phrase, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // 日常会話
  {
    english: "How are you doing?",
    japanese: "元気ですか？",
    pronunciation: "haʊ ɑr ju ˈduɪŋ",
    tags: ["greeting", "basic"],
    categoryId: "daily",
    nextReviewDate: new Date(),
    reviewHistory: []
  },
  {
    english: "It's nice to meet you",
    japanese: "はじめまして",
    pronunciation: "ɪts naɪs tu mit ju",
    tags: ["greeting", "formal"],
    categoryId: "daily",
    nextReviewDate: new Date(),
    reviewHistory: []
  },
  {
    english: "Thank you for your help",
    japanese: "助けてくれてありがとう",
    pronunciation: "θæŋk ju fɔr jʊr hɛlp",
    tags: ["gratitude", "polite"],
    categoryId: "daily",
    nextReviewDate: addDays(new Date(), 1),
    reviewHistory: []
  },
  {
    english: "Could you repeat that, please?",
    japanese: "もう一度言っていただけますか？",
    pronunciation: "kʊd ju rɪˈpit ðæt, pliz",
    tags: ["request", "polite"],
    categoryId: "daily",
    nextReviewDate: addDays(new Date(), 2),
    reviewHistory: []
  },
  {
    english: "I'm sorry for the inconvenience",
    japanese: "ご不便をおかけして申し訳ありません",
    pronunciation: "aɪm ˈsɔri fɔr ði ˌɪnkənˈvinjəns",
    tags: ["apology", "formal"],
    categoryId: "daily",
    nextReviewDate: subDays(new Date(), 1),
    reviewHistory: []
  },

  // ビジネス
  {
    english: "Let me get back to you on that",
    japanese: "その件については後ほど連絡します",
    pronunciation: "lɛt mi gɛt bæk tu ju ɑn ðæt",
    tags: ["business", "promise"],
    categoryId: "business",
    nextReviewDate: new Date(),
    reviewHistory: []
  },
  {
    english: "I'd like to schedule a meeting",
    japanese: "会議の予定を組みたいのですが",
    pronunciation: "aɪd laɪk tu ˈskɛdʒul ə ˈmitɪŋ",
    tags: ["business", "meeting"],
    categoryId: "business",
    nextReviewDate: addDays(new Date(), 3),
    reviewHistory: []
  },
  {
    english: "Could we discuss this further?",
    japanese: "これについてもう少し話し合えますか？",
    pronunciation: "kʊd wi dɪˈskʌs ðɪs ˈfɜrðər",
    tags: ["business", "discussion"],
    categoryId: "business",
    nextReviewDate: new Date(),
    reviewHistory: []
  },
  {
    english: "I'll send you the details by email",
    japanese: "詳細はメールでお送りします",
    pronunciation: "aɪl sɛnd ju ðə ˈditaɪlz baɪ ˈimɛɪl",
    tags: ["business", "email"],
    categoryId: "business",
    nextReviewDate: addDays(new Date(), 7),
    reviewHistory: []
  },
  {
    english: "What's the deadline for this project?",
    japanese: "このプロジェクトの締切はいつですか？",
    pronunciation: "wʌts ðə ˈdɛdˌlaɪn fɔr ðɪs ˈprɑdʒɛkt",
    tags: ["business", "deadline"],
    categoryId: "business",
    nextReviewDate: subDays(new Date(), 2),
    reviewHistory: []
  },

  // 旅行
  {
    english: "Where is the nearest station?",
    japanese: "最寄り駅はどこですか？",
    pronunciation: "wɛr ɪz ðə ˈnɪrəst ˈsteɪʃən",
    tags: ["travel", "direction"],
    categoryId: "travel",
    nextReviewDate: new Date(),
    reviewHistory: []
  },
  {
    english: "How much does this cost?",
    japanese: "これはいくらですか？",
    pronunciation: "haʊ mʌtʃ dʌz ðɪs kɔst",
    tags: ["travel", "shopping"],
    categoryId: "travel",
    nextReviewDate: addDays(new Date(), 4),
    reviewHistory: []
  },
  {
    english: "Do you have a vegetarian menu?",
    japanese: "ベジタリアンメニューはありますか？",
    pronunciation: "du ju hæv ə ˌvɛdʒəˈtɛriən ˈmɛnju",
    tags: ["travel", "restaurant"],
    categoryId: "travel",
    nextReviewDate: new Date(),
    reviewHistory: []
  },
  {
    english: "I'd like to check in",
    japanese: "チェックインをお願いします",
    pronunciation: "aɪd laɪk tu tʃɛk ɪn",
    tags: ["travel", "hotel"],
    categoryId: "travel",
    nextReviewDate: addDays(new Date(), 14),
    reviewHistory: []
  },
  {
    english: "Is there Wi-Fi available?",
    japanese: "Wi-Fiは使えますか？",
    pronunciation: "ɪz ðɛr ˈwaɪˌfaɪ əˈveɪləbəl",
    tags: ["travel", "internet"],
    categoryId: "travel",
    nextReviewDate: new Date(),
    reviewHistory: []
  }
];

export async function loadSampleData() {
  const { db } = await import('@/services/db.service');
  
  // 既存のデータがあるかチェック
  const existingCount = await db.phrases.count();
  if (existingCount > 0) {
    console.log('Sample data already loaded');
    return;
  }

  // サンプルデータを追加
  const phrasesToAdd = samplePhrases.map(phrase => ({
    ...phrase,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  await db.phrases.bulkAdd(phrasesToAdd);
  
  // 統計を更新
  await db.stats.where('id').equals('main').modify({
    totalPhrases: phrasesToAdd.length
  });

  console.log(`Loaded ${phrasesToAdd.length} sample phrases`);
}