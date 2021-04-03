import authUtils from '../utils/auth';

const logout = () => {
  authUtils.set(null);
  console.log('Вы успешно разлогинились');
};

export default logout;
