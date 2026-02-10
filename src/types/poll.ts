export interface PollOption {
  id: string;
  text: string;
  vote_count: number;
  poll_id: string;
}

export interface Poll {
  id: string;
  question: string;
  created_at: string;
  deadline?: string; // optional until migration is run
  poll_options: PollOption[];
}

export interface CreatePollData {
  question: string;
  options: string[];
  deadline?: Date; // optional, defaults to 3 days from now
}