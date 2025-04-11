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