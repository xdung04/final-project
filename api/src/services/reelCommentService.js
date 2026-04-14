import db from "../models/index.js";
const { ReelComment } = db;

export const getComments = async (idReel) => {
  return await ReelComment.findAll({
    where: { idReel },
    include: [{ model: db.User, attributes: ["idUser", "fullName", "image"] }],
    order: [["createdAt", "ASC"]],
  });
};

export const addComment = async (idReel, idUser, content) => {
  const created = await ReelComment.create({
    idReel,
    idUser,
    content,
    parentCommentId: null
  });

  // Query lại để lấy full thông tin user
  return await ReelComment.findByPk(created.idComment, {
    include: [{ model: db.User, attributes: ["idUser", "fullName", "image"] }]
  });
};


export const addReply = async (parentCommentId, idUser, content) => {
  const parent = await ReelComment.findByPk(parentCommentId);
  if (!parent) throw new Error("Comment không tồn tại");

  const createdReply = await ReelComment.create({
    idReel: parent.idReel,
    idUser,
    content,
    parentCommentId,
  });

  // Query lại để trả về full User
  return await ReelComment.findByPk(createdReply.idComment, {
    include: [{ model: db.User, attributes: ["idUser", "fullName", "image"] }]
  });
};


export const updateComment = async (commentId, idUser, content) => {
  const comment = await ReelComment.findByPk(commentId);
  if (!comment) throw new Error("Comment không tồn tại");
  if (comment.idUser !== idUser) throw new Error("Không có quyền sửa comment này");
  comment.content = content;
  await comment.save();
  return comment;
};

export const deleteComment = async (commentId, idUser) => {
  const comment = await ReelComment.findByPk(commentId);
  if (!comment) throw new Error("Comment không tồn tại");
  if (comment.idUser !== idUser) throw new Error("Không có quyền xoá comment này");
  await comment.destroy();
};
