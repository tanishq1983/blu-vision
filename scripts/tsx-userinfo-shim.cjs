const os = require('node:os');

const originalUserInfo = os.userInfo;
os.userInfo = (...args) => {
  try {
    return originalUserInfo(...args);
  } catch {
    return { username: process.env.USERNAME || 'user' };
  }
};
