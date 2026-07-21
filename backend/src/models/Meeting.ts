import { Schema, model } from 'mongoose';

export interface IMeeting {
  id: string;
  title: string;
  description: string;
  host: string;
  date: string;
  time: string;
  duration: number;
  participants: string[];
  link: string;
  isRecurring?: boolean;
  timeZone: string;
  createdAt: string;
}

const MeetingSchema = new Schema<IMeeting>({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  host: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  duration: { type: Number, required: true },
  participants: { type: [String], default: [] },
  link: { type: String, required: true },
  isRecurring: { type: Boolean, default: false },
  timeZone: { type: String, default: 'EST (UTC-5)' },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

export const MeetingModel = model<IMeeting>('Meeting', MeetingSchema);
