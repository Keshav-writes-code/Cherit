export type PageMetadata = {
  title: string;
  description: string;
  open_graph?: {
    title?: string;
    description?: string;
    images?: {
      url: string;
      alt: string;
    }[];
  };
  twitter?: {
    title?: string;
    description?: string;
    image?: string;
    imageAlt?: string;
  };
};
