export interface Content {
    name: string;
    identifier: string;
    primaryCategory: string;
    createdOn: string;
    creator: string;
  }

export interface GetContents {
    content: Content
}

export interface Facets {
  values: FacetsValues[];
  name: string;
} 

export interface FacetsValues {
  count: number;
  name: string;
} 