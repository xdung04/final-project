import * as reelCommentService from "../services/reelCommentService.js";

export const getComments = async (req, res) => {
  try {
    const idReel = req.params.id;
    const comments = await reelCommentService.getComments(idReel);
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không thể lấy comment" });
  }
};

export const addComment = async (req, res) => {
  try {
    const idReel = req.params.id;
    const idUser = req.user.idUser;
    const { content } = req.body;
    const comment = await reelCommentService.addComment(idReel, idUser, content);
    res.json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi tạo comment" });
  }
};

export const addReply = async (req, res) => {
  try {
    const parentCommentId = req.params.id;
    const idUser = req.user.idUser;
    const { content } = req.body;
    const reply = await reelCommentService.addReply(parentCommentId, idUser, content);
    res.json(reply);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi tạo reply" });
  }
};

export const updateComment = async (req, res) => {
  try {
    const idUser = req.user.idUser;
    const commentId = req.params.id;
    const { content } = req.body;
    const updated = await reelCommentService.updateComment(commentId, idUser, content);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi sửa comment" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const idUser = req.user.idUser;
    const commentId = req.params.id;
    await reelCommentService.deleteComment(commentId, idUser);
    res.json({ message: "Đã xoá comment/reply" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi xoá comment/reply" });
  }
};
