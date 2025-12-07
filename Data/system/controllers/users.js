const UsersModel = require('../database/models/users');

class UsersController {
  constructor(api) {
    this.api = api;
  }

  async getNameUser(userID) {
    try {
      const cached = UsersModel.getName(userID);
      if (cached && cached !== 'Unknown' && cached !== 'Facebook User' && !cached.toLowerCase().includes('facebook user')) {
        return cached;
      }
      
      const info = await this.api.getUserInfo(userID);
      if (info && info[userID]) {
        let name = info[userID].name;
        if (name && name !== 'Facebook User' && !name.toLowerCase().includes('facebook user')) {
          UsersModel.setName(userID, name);
          return name;
        }
        const firstName = info[userID].firstName;
        const alternateName = info[userID].alternateName;
        if (firstName && firstName !== 'Facebook User') {
          UsersModel.setName(userID, firstName);
          return firstName;
        }
        if (alternateName && alternateName !== 'Facebook User') {
          UsersModel.setName(userID, alternateName);
          return alternateName;
        }
      }
      if (cached && cached !== 'Unknown') return cached;
      return 'User';
    } catch (error) {
      const cached = UsersModel.getName(userID);
      if (cached && cached !== 'Unknown' && cached !== 'Facebook User') return cached;
      return 'User';
    }
  }

  async refreshUserName(userID) {
    try {
      const info = await this.api.getUserInfo(userID);
      if (info && info[userID]) {
        let name = info[userID].name;
        if (name && name !== 'Facebook User' && !name.toLowerCase().includes('facebook user')) {
          UsersModel.setName(userID, name);
          return name;
        }
        const firstName = info[userID].firstName;
        if (firstName && firstName !== 'Facebook User') {
          UsersModel.setName(userID, firstName);
          return firstName;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  get(userID) {
    return UsersModel.get(userID);
  }

  create(userID, name = '') {
    return UsersModel.create(userID, name);
  }

  update(userID, data) {
    return UsersModel.update(userID, data);
  }

  ban(userID, reason = '') {
    return UsersModel.ban(userID, reason);
  }

  unban(userID) {
    return UsersModel.unban(userID);
  }

  isBanned(userID) {
    return UsersModel.isBanned(userID);
  }

  getAll() {
    return UsersModel.getAll();
  }

  getBanned() {
    return UsersModel.getAll().filter(u => u.banned === 1);
  }

  getData(userID) {
    return UsersModel.getData(userID);
  }

  setData(userID, data) {
    return UsersModel.setData(userID, data);
  }
}

module.exports = UsersController;
