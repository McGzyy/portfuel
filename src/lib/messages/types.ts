export type DmThreadSummary = {
  id: string;
  updated_at: string;
  other_user: {
    id: string;
    username: string;
    display_name: string | null;
  };
  last_message: {
    body: string;
    sender_id: string;
    created_at: string;
  } | null;
  unread: boolean;
};

export type DmMessage = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  is_mine: boolean;
};

export type DmThreadDetail = {
  id: string;
  other_user: {
    id: string;
    username: string;
    display_name: string | null;
  };
  /** When the other participant last read this thread (for read receipts on your messages). */
  other_last_read_at: string | null;
  messages: DmMessage[];
};
