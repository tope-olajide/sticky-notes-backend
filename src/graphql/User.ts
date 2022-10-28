import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";
import {GraphQLError }  from "graphql"
import validator from 'validator';
import { extendType, objectType, inputObjectType, nonNull } from "nexus";
import userModel from "../models/user";

 const User = objectType({
    name: "User", 
    definition(t) {
      t.nonNull.string("id");
      t.nonNull.string("email");
      t.nonNull.string("username");
      t.nonNull.string("password");
      t.nonNull.string("fullname");
    },
  });

   const AuthPayLoad = objectType({
    name: "AuthPayLoad",
    definition(t) {
      t.nonNull.string("token");
      t.nonNull.field("user", { type: User });
    },
  });

   const SignupUserInput = inputObjectType({
    name: "SignupUserInput",
    definition(t) {
      t.nonNull.string("email");
      t.nonNull.string("username");
      t.nonNull.string("password");
      t.nonNull.string("fullname");
    },
  });

   const SignInUserInput = inputObjectType({
    name: "SignInUserInput",
    definition(t) {
      t.nonNull.string("usernameOrEmail");
      t.nonNull.string("password");
    },
  });

  export const SignupUser = extendType({
    type: 'Mutation',
    definition(t) {
      t.nonNull.field('signupUser', {
        type: AuthPayLoad,
        args: {
          data: nonNull(SignupUserInput)
        },
        async resolve(_parent, args, { res }, _info) {
          const { data: { email, username, password, fullname } } = args;
  
          if (!validator.isEmail(email)) {
            throw new GraphQLError('Please enter a valid E-mail!', {
              extensions: {
                code: 'UNAUTHENTICATED',
                http: { status: 401 },
              }
            });
          }
          if (!validator.isLength(password, { min: 5 })) {
            
            throw new GraphQLError('Password must have atleast 5 characters', {
              extensions: {
                code: 'UNAUTHENTICATED',
                http: { status: 401 },
              }
            });
          }
          if (!validator.isLength(username, { min: 3 })) {
            throw new GraphQLError('username must have at least 3 characters', {
              extensions: {
                code: 'UNAUTHENTICATED',
                http: { status: 401 },
              }
            });
          }
          if (!validator.isLength(fullname, { min: 4 })) {
            throw new GraphQLError('fullname have atleast 4 characters', {
              extensions: {
                code: 'UNAUTHENTICATED',
                http: { status: 401 },
              }
            });
          }
  
          const encryptedPassword = bcrypt.hashSync(password, 10);
          const userData = {
            email: email.toLowerCase(),
            username: username.toLowerCase(),
            fullname,
            password: encryptedPassword,
          };
          try {
            const usernameExist = await userModel.findOne({ username: username.toLowerCase() });
            if (usernameExist) {
              throw new GraphQLError('Username is already in use!', {
                extensions: {
                  code: 'UNAUTHENTICATED',
                  http: { status: 401 },
                }
              });
            }
            const emailExist = await userModel.findOne({ email: email.toLowerCase() });
            if (emailExist) {
              throw new GraphQLError('Email is already in use!', {
                extensions: {
                  code: 'UNAUTHENTICATED',
                  http: { status: 401 },
                }
              });
            }
            const createdUser = await userModel.create(userData);
            console.log(createdUser)
            const token = jsonwebtoken.sign(
              {
                id: createdUser._id,
                username: createdUser.username,
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
              },
              process.env.JWT_SECRET!
            );
            res
               .cookie("access_token", token, {
                httpOnly: true,
                secure:  true,
                maxAge: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
                sameSite: 'none'
               })
            return {
              user: createdUser,
              token,
            };
          } catch (error) {
            throw error
          }
        },
      })
    }
  });

  export const SigninUser = extendType({
    type: 'Mutation',
    definition(t) {
      t.nonNull.field('signinUser', {
        type: AuthPayLoad,
        args: {
         data: nonNull(
          SignInUserInput
         ),
        },
        async resolve(_parent, args, { res }, _info) {
         try {
           const { data: { usernameOrEmail, password } } = args
  
           const userFound = await userModel.findOne({
             $or: [{ email: usernameOrEmail.toLowerCase() },
             { username: usernameOrEmail.toLowerCase() }],
           }).exec();
           if (!userFound) {
             throw new GraphQLError('You are not authenticatedUser does not exist', {
              extensions: {
                code: 'UNAUTHENTICATED',
                http: { status: 401 },
              }
            });
           }
           if (bcrypt.compareSync(password, userFound.password)) {
             const username = userFound.username;
             const id = userFound._id;
             const token = jsonwebtoken.sign({
               id,
               username,
               exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
             }, process.env.JWT_SECRET!);
             res
               .cookie("access_token", token, {
                 httpOnly: true,
                 secure:  true,
                 maxAge: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
                 sameSite: 'none'
                 
               })
             return {
               user: userFound,
               token,
             };
           }
           throw new GraphQLError('Incorrect password', {
            extensions: {
              code: 'UNAUTHENTICATED',
              http: { status: 401 },
            }
          });
         }
         catch (error: any) {
           throw new GraphQLError(error, {
            extensions: {
              code: 'UNAUTHENTICATED',
              http: { status: 401 },
            }
          });
         }
       }
     })
    }
  });

  export const LogoutUser = extendType({
    type: "Mutation",
    definition(t) {
      t.nonNull.field("signoutUser", {
        type: "Boolean",
        async resolve (_parent, _args, { res }, _info) {
         res.clearCookie("access_token")
          return true
        },
      });
    },
  });