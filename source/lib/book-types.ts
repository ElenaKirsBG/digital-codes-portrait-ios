export type BookSource = {
  id: string;
  title: string;
  author: string;
  year: string;
  pageCount: number;
  coverage: string;
  notice?: string;
};

export type BookReading = {
  id: string;
  sourceId: string;
  title: string;
  text: string;
  pdfPages: number[];
  scope: 'arcana' | 'position' | 'reference';
  arcanaCode?: number;
  positions?: number[];
  note?: string;
};
