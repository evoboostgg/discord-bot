import mongoose from 'mongoose';

export interface ITicket {
	ticketId: string;
	channelId: string;
	userId: string;
	type: 'order' | 'doubt' | 'report';
	subject: string;
	description: string;
	orderId?: string;
	reportedUser?: string;
	status: 'open' | 'closed';
	createdAt: Date;
	updatedAt: Date;
}

const ticketSchema = new mongoose.Schema<ITicket>({
	ticketId: { type: String, required: true, unique: true },
	channelId: { type: String  },
	userId: { type: String, required: true },
	type: { type: String, required: true, enum: ['order', 'doubt', 'report'] },
	subject: { type: String, required: true },
	description: { type: String, required: true },
	orderId: { type: String },
	reportedUser: { type: String },
	status: { type: String, required: true, default: 'open', enum: ['open', 'closed'] },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
});

export const Ticket = mongoose.model<ITicket>('Ticket', ticketSchema);