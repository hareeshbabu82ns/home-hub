export type ArchiveOrgFieldType =
  | "avg_rating"
  | "backup_location"
  | "btih"
  | "call_number"
  | "collection"
  | "contributor"
  | "coverage"
  | "creator"
  | "date"
  | "description"
  | "downloads"
  | "external-identifier"
  | "foldoutcount"
  | "format"
  | "genre"
  | "identifier"
  | "imagecount"
  | "indexflag"
  | "item_size"
  | "language"
  | "licenseurl"
  | "mediatype"
  | "members"
  | "month"
  | "name"
  | "noindex"
  | "num_reviews"
  | "oai_updatedate"
  | "publicdate"
  | "publisher"
  | "related-external-id"
  | "reviewdate"
  | "rights"
  | "scanningcentre"
  | "source"
  | "stripped_tags"
  | "subject"
  | "title"
  | "type"
  | "volume"
  | "week"
  | "year";

export type ArchiveOrgSearchItem = {
  identifier: string;
  language?: string;
  title: string;
  collection?: string[];
  contributor?: string;
  creator?: string;
  subject?: string | string[];
  downloads?: number;
  format?: string[];
  date?: string;
  // avg_rating?: string;
  // backup_location?: string;
  // btih?: string;
  // call_number?: string;
  // coverage?: string;
  // date?: string;
  // description?: string;
  // external_identifier?: string;
  // foldoutcount?: string;
  // genre?: string;
  // imagecount?: string;
  // indexflag?: string;
  // item_size?: string;
  // licenseurl?: string;
  // mediatype?: string;
  // members?: string;
  // month?: string;
  // name?: string;
  // noindex?: string;
  // num_reviews?: string;
  // oai_updatedate?: string;
  // publicdate?: string;
  // publisher?: string;
  // related_external_id?: string;
  // reviewdate?: string;
  // rights?: string;
  // scanningcentre?: string;
  // source?: string;
  // stripped_tags?: string;

  // type?: string;
  // volume?: string;
  // week?: string;
  // year?: string;
};

export type ArchiveOrgSearchResult = {
  items: ArchiveOrgSearchItem[];
  count: number;
  cursor: string;
  total: number;
};
