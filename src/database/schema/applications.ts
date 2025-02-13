import mongoose, { Schema, Document } from 'mongoose';

interface OrderDetail {
  server: 'BR' | 'NA' | 'EUW' | 'EUNE';
  queue: 'Solo' | 'Duo';
  maxRank: string;
}

export interface IApplication extends Document {
  discordId: string;
  appliedRole: 'coach' | 'booster';
  displayName: string;
  email: string;
  discord: string;
  region: 'na' | 'br' | 'eu';
  availability: '10-20' | '20-30' | '30-40' | '40+';
  legalName: string;
  birthLocation: string;
  street: string;
  city: string;
  postcode: string;
  country: string;
  game: 'league_of_legends' | 'valorant' | 'teamfight_tactics';
  peakRank: string;
  proof: string;
  experience: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  orderDetails: OrderDetail[];
  hrReview: string;
}

const ApplicationSchema = new Schema({
  discordId: {
    type: String,
    required: true,
    unique: true
  },
  appliedRole: {
    type: String,
    enum: ['coach', 'booster'],
    required: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  discord: {
    type: String,
    required: true,
    unique: true
  },
  region: {
    type: String,
    enum: ['na', 'br', 'eu'],
    required: true
  },
  availability: {
    type: String,
    enum: ['10-20', '20-30', '30-40', '40+'],
    required: true
  },
  legalName: {
    type: String,
    required: true,
    trim: true
  },
  birthLocation: {
    type: String,
    required: true,
    enum: ['af', 'al', 'dz', 'ar', 'au', 'at', 'be', 'br', 'ca', 'cl', 'cn', 'co', 'dk',
           'eg', 'fi', 'fr', 'de', 'gr', 'hk', 'in', 'id', 'ie', 'il', 'it', 'jp', 'kr',
           'my', 'mx', 'nl', 'nz', 'no', 'pk', 'pe', 'ph', 'pl', 'pt', 'ru', 'sa', 'sg',
           'za', 'es', 'se', 'ch', 'tw', 'th', 'tr', 'ae', 'uk', 'us', 'vn']
  },
  street: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  postcode: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    enum: ['af', 'al', 'dz', 'ar', 'au', 'at', 'be', 'br', 'ca', 'cl', 'cn', 'co', 'dk',
           'eg', 'fi', 'fr', 'de', 'gr', 'hk', 'in', 'id', 'ie', 'il', 'it', 'jp', 'kr',
           'my', 'mx', 'nl', 'nz', 'no', 'pk', 'pe', 'ph', 'pl', 'pt', 'ru', 'sa', 'sg',
           'za', 'es', 'se', 'ch', 'tw', 'th', 'tr', 'ae', 'uk', 'us', 'vn']
  },
  game: {
    type: String,
    enum: ['league_of_legends', 'valorant', 'teamfight_tactics'],
    required: true
  },
  peakRank: {
    type: String,
    required: true,
    validate: {
      validator: function(this: { game: string }, rank: string) {
        const validRanks = {
          valorant: ['radiant', 'immortal3', 'imortal2'],
          league_of_legends: ['challenger', 'grandmaster', 'master'],
          teamfight_tactics: ['challenger', 'grandmaster', 'master']
        };
        const game = this.game as keyof typeof validRanks;
        return validRanks[game].includes(rank.toLowerCase());
      },
      message: 'Invalid rank for the selected game'
    }
  },
  proof: {
    type: String,
    required: true,
    validate: {
      validator: (v: string) => /^https?:\/\/.+/.test(v),
      message: 'Proof must be a valid URL'
    }
  },
  experience: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  orderDetails: [{
    server: {
      type: String,
      trim: true
    },
    queue: {
      type: String,
    },
    maxRank: {
      type: String,
      trim: true
    }
  }],

  hrReview: {
    type: String,
    default: '',
    maxlength: 2000
  }
}, {
  timestamps: true
});

// Remove discordId index and keep only the necessary ones
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ game: 1 });
ApplicationSchema.index({ region: 1 });

export const Application = mongoose.model<IApplication>('Application', ApplicationSchema);