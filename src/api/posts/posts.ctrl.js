import Post from '../../models/post.js';
import mongoose from 'mongoose';
import Joi from 'joi';

const { ObjectId } = mongoose.Types;

export const getPostById = async (ctx, next) => {
  const { id } = ctx.params;
  if(!ObjectId.isValid(id)){
    ctx.status = 400; // bad request
    return;
  }
  
  try{
    const post = await Post.findById(id);
    if(!post) {
      ctx.status = 404; // not found;
      return next();
    }
    ctx.state.post = post;
    return next();
  } catch(e) {
    ctx.throw(500, e);
  }
}

/*
  POST /api/posts
 */
export const write = async ctx => {
  const schema = Joi.object().keys({
    title: Joi.string().required(),
    body: Joi.string().required(),
    tags: Joi.array()
      .items(Joi.string())
      .required(),
  });

  const result = schema.validate(ctx.request.body);
  if(result.error){
    ctx.status = 400;
    ctx.body = result.error;
    return;
  }

  const {title, body, tags} = ctx.request.body;
  const post = new Post({
    title,
    body,
    tags,
    user: ctx.state.user
  });
  
  console.log(ctx.state.user);
  console.log(post);
  
  try {
    await post.save();
    ctx.body = post;
  } catch(e) {
    ctx.throw(500, e);
  }
}

/*
  GET /api/posts
 */
export const list = async ctx => {
  const page = parseInt(ctx.query.page || '1', 10);
  
  if(page < 1){
    ctx.status = 400;
    return;
  }
  
  const { tag, username } = ctx.query;
  // tag, username 값이 유효하면 객체에 넣고 그렇지않으면 빈값을 줌
  const query = {
    ...(username ? { 'user.username': username } : {}),
    ...(tag ? { tags: tag } : {})
  }
  
  try {
    const posts = await Post.find(query)
      .sort({ _id: -1 })
      .limit(10)
      .skip((page - 1) * 10)
      .lean()
      .exec();
    const postCount = await Post.countDocuments(query).exec();
    ctx.set('Last-Page', Math.ceil(postCount/10));
    ctx.body = posts.map(post => ({
      ...post,
      body: post.body.length < 200 ? post.body : `${post.body.slice(0, 200)}...`
    }));
  } catch(e) {
    ctx.throw(500, e);
  }
}

/*
  GET /api/posts/:id
 */
export const read = async ctx => {
  ctx.body = ctx.state.post;
}

/*
  DELETE /api/posts/:id
 */
export const remove = async ctx => {
  const { id } = ctx.params;
  try{
    await Post.findByIdAndRemove(id).exec();
    ctx.status = 204; // No Content
  } catch(e) {
    ctx.throw(500, e);
  }
}

/*
  PATCH /api/posts/:id
 */
export const update = async ctx => {
  const schema = Joi.object().keys({
    title: Joi.string(),
    body: Joi.string(),
    tags: Joi.array()
      .items(Joi.string()),
  });

  const result = schema.validate(ctx.request.body);
  if(result.error){
    ctx.status = 400;
    ctx.body = result.error;
    return;
  }

  const { id } = ctx.params;
  try{
    const post = await Post.findByIdAndUpdate(id, ctx.request.body, { new: true } ).exec();
    if(!post){
      ctx.status = 404;
      return;
    }
    ctx.body = post;
  } catch(e) {
    ctx.throw(500, e);
  }
}

export const checkOwnPost = (ctx, next) => {
  const { user, post } = ctx.state;
  if(post.user._id.toString() !== user._id ){
    ctx.status = 403;
    return;
  }
  
  return next();
}

