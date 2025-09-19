export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdAt: Date;
  totalVotes: number;
}

export interface CreatePollData {
  question: string;
  options: string[];
}