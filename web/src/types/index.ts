export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  imageUrl: string;
  audioUrl: string;
  language: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  songIds: string[];
}
