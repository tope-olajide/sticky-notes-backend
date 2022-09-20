import { Schema, model } from 'mongoose';


interface IUser {
  fullname: string;
  username: string;
  email: string;
  password: string;
}

const userSchema = new Schema<IUser>({
    email:{
        type: String,
        required: true,
        unique: true,
      },
      username:{
        type: String,
        unique: true,
        required:true,
        trim: true
      },
      password:{
        type: String,
        required: true
      },
      fullname:{
        type: String,
        required: true,
        trim: true
      },
});


const User = model<IUser>('User', userSchema);

export default User;