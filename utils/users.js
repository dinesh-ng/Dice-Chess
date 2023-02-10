const users = [];

//add new user
const userJoin = (id, username, room) => {
  const user = { id, username, room };
  users.push(user);
  return user;
};

//get current user
const getCurrentUser = (id) => users.find((user) => user.id === id);

//user leaves chatroom
const userLeave = (id) => {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) return users.splice(index, 1)[0];
};

//Get room users
const getRoomUsers = (room) => {
  return users.filter((user) => user.room === room);
};

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
};
