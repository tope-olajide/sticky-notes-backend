

import { Schema, model, Document } from 'mongoose';

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
    userId: string;
}

const noteSchema = new Schema<INote>({

    content: {
        type: String,
        required: true
    },
    color: {
        type: String,
        enum: ['yellow', 'green', 'pink', 'purple', 'blue', 'gray', 'charcoal'],
        default: Theme.Yellow
    },
    userId: {
        type: String, required: true
    },
});

const Note = model<INote>('Note', noteSchema);
export default Note;