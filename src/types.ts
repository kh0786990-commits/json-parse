export interface BookPage {
  pageNumber: number;
  content: string;
}

export interface BookMetadata {
  bookName: string;
  totalFiles: string;
}

export interface BookJson {
  metadata: BookMetadata;
  pages: BookPage[];
}

export interface SavedBook {
  id: string;
  name: string;
  timestamp: string;
  data: BookJson;
  fileName: string;
  fileSize: string;
}
