import userRouter from './user.Routes.js';

const constructMethod = (app) => {
  app.use('/api/users', userRouter);
};

export default constructMethod;