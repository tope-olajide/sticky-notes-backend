

import mongoose, { Schema, Document, Types } from 'mongoose';

enum Theme {
    Yellow = "yellow",
    Green = "green",
    Pink = "pink",
    Purple = "purple",
    Blue = "blue",
    Gray = "gray",
    Charcoal = "charcoal"
}
interface INote {
    content: string;
    color: Theme;
    isSaved: boolean;
    userId: Schema.Types.ObjectId;
  }

const noteSchema: Schema = new Schema<INote>({
    content: {
        type: String,
        required: true
    },
    color: {
        type: String,
        enum: ['yellow', 'green', 'pink', 'purple', 'blue', 'gray', 'charcoal'],
        default: Theme.Yellow
    },
    isSaved:{
        type:Boolean
    },
    userId: {
        type: Schema.Types.ObjectId, required: true
    },
});
const note = mongoose.model('Note', noteSchema);
export default note;