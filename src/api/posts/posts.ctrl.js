import Post from '../../models/post.js';
import mongoose from 'mongoose';
import Joi from 'joi';

const { ObjectId } = mongoose.Types;

export const checkObjectId = (ctx, next) => {
  const { id } = ctx.params;
  if(!ObjectId.isValid(id)){
    ctx.status = 404;
    return;
  }
  next();
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
    title, body, tags
  });

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
  try {
    const posts = await Post.find()
      .limit(10)
      .sort({_id:-1})
      .skip((page - 1) * 10)
      .exec();

    const postCount = await Post.countDocuments().exec();

    ctx.set('Last-Page', Math.ceil(postCount/10));
    ctx.body = posts
      .map(post => post.toJSON())
      .map(post => ({
        ...post,
        body: post.body.length < 200 ? post.body : `${post.body.slice(0, 200)}...`,
      }));
  } catch(e) {
    ctx.throw(500, e);
  }
}

/*
  GET /api/posts/:id
 */
export const read = async ctx => {
  const { id } = ctx.params;
  try{
    const post = await Post.findById(id).exec();
    if(!post){
      ctx.status = 404;
      return;
    }
    ctx.body = post;
  } catch(e) {
    ctx.throw(500, e);
  }
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




