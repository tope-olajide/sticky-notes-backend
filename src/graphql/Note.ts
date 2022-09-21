import { extendType, objectType, inputObjectType, nonNull } from "nexus";
import noteModel from './../models/note';
import { AuthenticationError } from "apollo-server-express";

const Note = objectType({
    name: "Note",
    definition(t) {
        t.nonNull.id("id");
        t.nonNull.string("content");
        t.nonNull.string("color");
        t.boolean("isSaved")
        t.nonNull.id("userId");
    },
});
const NoteData = inputObjectType({
    name: "NoteData",
    definition(t) {
        t.nonNull.string("content");
        t.nonNull.string("color");
    },
});

export const AllNotes = extendType({
    type: 'Query',
    definition(t) {
        t.nonNull.list.field('allNotes', {
            type: Note,
            async resolve(_parent, _args, context, _info) {
                try {
                    const { user } = context;
                    if (!user) {
                        throw new AuthenticationError("You are not authenticated");
                    }
                    console.log({ user })
                    const notes = await noteModel.find(
                        {
                            userId: user.id,
                        }
                    );
                    console.log(notes)
                    return notes;
                }
                catch (error) {
                    throw error;
                }
            }
        })
    }
});

export const SingleNote = extendType({
    type: 'Query',
    definition(t) {
        t.nonNull.field('singleNote', {
            type: Note,
            args: {
                noteId: 'String',
            },
            async resolve(_parent, args, context, _info) {
                const { noteId } = args;
                const { user } = context;
                if (!user) {
                    throw new AuthenticationError("You are not authenticated");
                }
                try {
                    const noteDetails = await noteModel.findOne({ _id: noteId });
                    return noteDetails;
                } catch (error) {
                    throw error;
                }
            },
        })
    }
});


export const NewNote = extendType({
    type: 'Mutation',
    definition(t) {
        t.nonNull.field('newNote', {
            type: Note,
            args: {
                data: nonNull(NoteData)
            },
            async resolve(_parent, args, context, _info) {
                const { data } = args;
                const { user } = context;
                try {
                    if (!user) {
                        throw new AuthenticationError("Your session has expired. Please Login Again!")
                    }
                    const createdNoted = await noteModel.create({
                        content: data.content, color: data.color || 'yellow', userId: user.id, isSaved: true
                    });
                    return createdNoted;
                } catch (error) {
                    throw error;
                }
            }
        })
    }
});

export const ModifyNote = extendType({
    type: 'Mutation',
    definition(t) {
        t.nonNull.field('modifyNote', {
            type: Note,
            args: {
                noteId: nonNull('String'),
                data: nonNull(NoteData)
            },
            async resolve(_parent, args, context, _info) {
                const { noteId, data: { content, color } } = args;
                const { user } = context;
                if (!user) {
                    throw new AuthenticationError("You are not authenticated");
                }
                try {
                    const modifiedNote = await noteModel.findOneAndUpdate(
                        {
                            _id: noteId, userId: user.id,
                        },
                        { content, color: color || "blue" },
                        {
                            runValidators: true,
                            new: true,
                        }
                    );
                    console.log(modifiedNote)
                    return modifiedNote;
                } catch (error) {
                    throw error;
                }
            }
        })
    }
});

export const DeleteNote = extendType({
    type: 'Mutation',
    definition(t) {
        t.nonNull.field('deleteNote', {
            type: Note,
            args: {
                noteId: 'ID'
            },
            async resolve(_parent, args, context, _info) {
                const { noteId } = args;
                const { user } = context;
                if (!user) {
                    throw new AuthenticationError("You are not authenticated");
                }
                try {
                    const deletedNote = await noteModel.findOneAndDelete({
                        _id: noteId,
                        userId: user.id,
                    });
                    if (!deletedNote) {
                        throw new Error(" Note not found");
                    }
                    return deletedNote;
                } catch (error) {
                    throw error;
                }
            },
        })
    }
});
