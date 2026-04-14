import reelApi from "~/apis/reelAPI";

export const fetchReelsPaged = async (page = 1, limit = 10, token) => {
  const res = await reelApi.getPaged(page, limit, token);
  return res.data;
};

export const fetchReelsByBarberId = async (idBarber, page = 1, limit = 10, token) => {
  const res = await reelApi.getByBarberId(idBarber, page, limit, token);
  return res.data;
};

export const fetchReelById = async (id, token) => {
  const res = await reelApi.getById(id, token);
  return res.data;
};

export const uploadReel = async (formData, token) => {
  const res = await reelApi.upload(formData, token);
  return res.data;
};

export const likeReel = async (idReel, token) => {
  const res = await reelApi.like(idReel, token);
  return res.data;
};

export const getComments = async (idReel) => {
  const res = await reelApi.getComments(idReel);
  return res.data;
};

export const addComment = async (idReel, content, token) => {
  const res = await reelApi.addComment(idReel, content, token);
  return res.data;
};

export const addReply = async (idComment, content, token) => {
  const res = await reelApi.addReply(idComment, content, token);
  return res.data;
};


export const updateComment = async (idComment, content, token) => {
  const res = await reelApi.updateComment(idComment, content, token);
  return res.data;
};

export const deleteComment = async (idComment, token) => {
  const res = await reelApi.deleteComment(idComment, token);
  return res.data;
};

export const trackReelView = async (idReel, token) => {
  if (!token) return; 
  const res = await reelApi.trackView(idReel, token);
  return res.data;
};

export const searchReels = async (keyword, token) => {
  const res = await reelApi.search(keyword, token);
  return res.data;
};
